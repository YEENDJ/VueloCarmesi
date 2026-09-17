import { Injectable, Logger } from '@nestjs/common'
import { DeepLClient, GlossaryEntries, type GlossaryInfo } from 'deepl-node'
import { createHash } from 'crypto'
import { ENTRADAS_GLOSARIO, CONTEXTO, INSTRUCCIONES } from './glosario'
import {
  camposACambiar,
  huellasDe,
  type MapaHuellas,
  type MapaRevisados,
} from './campos'

/**
 * Techo duro de espera. El admin está mirando un spinner mientras esto corre,
 * así que la traducción tiene un presupuesto de tiempo y no una promesa abierta.
 * Pasado el plazo se guarda el español solo: publicar nunca puede depender de
 * que un servicio externo esté de buen humor.
 */
const TOPE_MS = 8_000

/**
 * Prefijo de los glosarios de este proyecto en la cuenta de DeepL.
 *
 * Sirve para reconocer los propios y borrarlos al regenerar, sin tocar
 * glosarios de otros proyectos que compartan la misma cuenta.
 */
const PREFIJO_GLOSARIO = 'vuelo-carmesi-es-en-'

type Valor = string | string[]

export interface ResultadoTraduccion {
  /** Solo los campos que se tradujeron en esta pasada. */
  campos: Record<string, Valor>
  /** Huellas de TODOS los campos traducibles, para guardar en `origenHash`. */
  huellas: MapaHuellas
}

@Injectable()
export class TraduccionService {
  private readonly logger = new Logger(TraduccionService.name)
  private readonly cliente: DeepLClient | null
  /** Se resuelve una vez y se guarda: listar glosarios en cada guardado sobra. */
  private glosarioPendiente: Promise<GlossaryInfo | null> | null = null

  constructor() {
    const clave = process.env.DEEPL_API_KEY?.trim()
    if (!clave) {
      this.logger.warn('DEEPL_API_KEY ausente — las fichas se guardarán solo en español')
      this.cliente = null
      return
    }
    this.cliente = new DeepLClient(clave, {
      // Por defecto son 5 reintentos de 10 s: hasta 50 segundos colgado dentro
      // de la petición de guardado. Con uno solo y 4 s basta para absorber un
      // hipo de red sin que el admin note que algo pasó.
      maxRetries: 1,
      minTimeout: 4_000,
    })
  }

  get disponible(): boolean {
    return this.cliente !== null
  }

  /**
   * Traduce los campos de una ficha que lo necesiten.
   *
   * Devuelve `null` cuando algo falla: quien llama guarda el español igual.
   * Esta función no lanza nunca — un fallo de DeepL no puede impedir que se
   * publique una experiencia.
   */
  async traducir(
    origen: Record<string, unknown>,
    camposTexto: readonly string[],
    camposLista: readonly string[],
    opciones: {
      huellaGuardada?: MapaHuellas
      destino?: Record<string, unknown> | null
      revisados?: MapaRevisados
    } = {},
  ): Promise<ResultadoTraduccion | null> {
    const todos = [...camposTexto, ...camposLista]
    const huellas = huellasDe(origen, todos)

    if (!this.cliente) return null

    const { huellaGuardada = {}, destino = null, revisados = {} } = opciones
    const pendientes = camposACambiar(origen, todos, huellaGuardada, destino, revisados)
    if (pendientes.length === 0) {
      // Nada cambió: el admin solo tocó el precio o marcó «destacada». El
      // guardado sigue siendo instantáneo, como hoy.
      return { campos: {}, huellas }
    }

    try {
      const campos = await this.conTope(this.pedirTraduccion(origen, pendientes, camposLista))
      return { campos, huellas }
    } catch (err) {
      this.logger.error(
        `No se pudo traducir (${pendientes.join(', ')}): ${(err as Error).message}`,
      )
      return null
    }
  }

  /**
   * Una sola llamada para toda la ficha, no una por campo.
   *
   * Sale más barato en peticiones y, sobre todo, DeepL ve los textos juntos:
   * el nombre, el relato y las viñetas salen con la misma terminología en vez
   * de con tres elecciones de palabra distintas.
   */
  private async pedirTraduccion(
    origen: Record<string, unknown>,
    pendientes: string[],
    camposLista: readonly string[],
  ): Promise<Record<string, Valor>> {
    const esLista = new Set(camposLista)

    // Se aplana todo a un array de textos, recordando de dónde salió cada uno
    // para poder devolverlos a su sitio después.
    //
    // `union` dice cómo se rearma el campo: 'lista' vuelve a ser String[], y
    // una cadena cualquiera es el separador con el que se reúnen los trozos.
    const origenDe: Array<{ campo: string; union: string | 'lista' }> = []
    const textos: string[] = []

    for (const campo of pendientes) {
      if (esLista.has(campo)) {
        for (const item of (origen[campo] as string[]) ?? []) {
          textos.push(item)
          origenDe.push({ campo, union: 'lista' })
        }
        continue
      }

      // Los párrafos se mandan sueltos, uno por texto, y se reúnen después.
      //
      // No es una optimización: `preserveFormatting` no conserva las líneas en
      // blanco —medido— y el relato volvía fusionado en un solo bloque. El
      // front parte la ficha con parrafosRelato(), que corta justo por esas
      // líneas, así que la versión inglesa salía como un ladrillo de texto.
      // Partiéndolos acá el resultado no depende de cómo trate DeepL los
      // saltos de línea.
      const parrafos = String(origen[campo] ?? '')
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean)

      for (const parrafo of parrafos) {
        textos.push(parrafo)
        origenDe.push({ campo, union: '\n\n' })
      }
    }

    if (textos.length === 0) return {}

    const glosario = await this.glosario()

    const resultados = await this.cliente!.translateText(textos, 'es', 'en-US', {
      ...(glosario ? { glossary: glosario.glossaryId } : {}),
      // Contexto: DeepL lo lee para elegir mejor la palabra y no lo factura.
      context: CONTEXTO,
      customInstructions: INSTRUCCIONES,
      // El relato viene en párrafos separados por líneas en blanco y esa
      // separación es el formato de la ficha: sin esto DeepL la reacomoda.
      preserveFormatting: true,
      // `formality` no se pasa: DeepL no lo admite con inglés como destino y
      // mandarlo devuelve un 400.
    })

    // Se reagrupan los trozos por campo, en el mismo orden en que se mandaron:
    // translateText devuelve los resultados alineados con la entrada.
    const trozos = new Map<string, string[]>()
    resultados.forEach((res, i) => {
      const { campo } = origenDe[i]
      const acumulado = trozos.get(campo) ?? []
      acumulado.push(res.text)
      trozos.set(campo, acumulado)
    })

    const salida: Record<string, Valor> = {}
    for (const [campo, partes] of trozos) {
      const { union } = origenDe.find(o => o.campo === campo)!
      salida[campo] = union === 'lista' ? partes : partes.join(union)
    }
    return salida
  }

  /**
   * El glosario, creado la primera vez que hace falta.
   *
   * El nombre lleva la huella de los términos: si alguien edita glosario.ts, el
   * nombre cambia, no se encuentra el viejo y se crea uno nuevo solo. Sin eso
   * habría que acordarse de borrarlo a mano en DeepL cada vez que se añade un
   * ave, y nadie se acuerda.
   */
  private glosario(): Promise<GlossaryInfo | null> {
    this.glosarioPendiente ??= this.resolverGlosario().catch((err: Error) => {
      // Un glosario que no se pudo crear no justifica quedarse sin traducir:
      // se sigue sin él y se reintenta en el próximo guardado.
      this.logger.warn(`Glosario no disponible, se traduce sin él: ${err.message}`)
      this.glosarioPendiente = null
      return null
    })
    return this.glosarioPendiente
  }

  private async resolverGlosario(): Promise<GlossaryInfo | null> {
    const huella = createHash('sha1')
      .update(JSON.stringify(ENTRADAS_GLOSARIO))
      .digest('hex')
      .slice(0, 8)
    const nombre = `${PREFIJO_GLOSARIO}${huella}`

    const existentes = await this.cliente!.listGlossaries()
    const ya = existentes.find(g => g.name === nombre)
    if (ya) return ya

    // Se borran las versiones anteriores ANTES de crear la nueva.
    //
    // Sin esto cada edición de glosario.ts deja un glosario huérfano en la
    // cuenta, y DeepL tiene un tope: al tercer cambio de términos empieza a
    // responder «Too many glossaries» y se traduce sin glosario —en silencio,
    // porque el fallo está capturado—. Es decir, los nombres de aves dejarían
    // de aplicarse justo después de haberlos mejorado.
    const viejos = existentes.filter(g => g.name.startsWith(PREFIJO_GLOSARIO))
    for (const viejo of viejos) {
      try {
        await this.cliente!.deleteGlossary(viejo)
        this.logger.log(`Glosario obsoleto eliminado: ${viejo.name}`)
      } catch (err) {
        this.logger.warn(`No se pudo borrar ${viejo.name}: ${(err as Error).message}`)
      }
    }

    const total = Object.keys(ENTRADAS_GLOSARIO).length
    this.logger.log(`Creando glosario ${nombre} (${total} términos)`)
    return this.cliente!.createGlossary(
      nombre,
      'es',
      'en',
      new GlossaryEntries({ entries: ENTRADAS_GLOSARIO }),
    )
  }

  private conTope<T>(promesa: Promise<T>): Promise<T> {
    return Promise.race([
      promesa,
      new Promise<never>((_, rechazar) =>
        setTimeout(() => rechazar(new Error(`superó el tope de ${TOPE_MS} ms`)), TOPE_MS),
      ),
    ])
  }
}
