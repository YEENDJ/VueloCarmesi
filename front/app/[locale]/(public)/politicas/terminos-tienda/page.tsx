import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import { Link } from '@/lib/i18n/navigation'
import { CONTACTO } from '@/lib/contacto'
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  CreditCard,
  Lock,
  PackageCheck,
  Receipt,
  RotateCcw,
  Scale,
  ShoppingBag,
  Store,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import MigaSuperior from '@/components/layout/MigaSuperior'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'politicas.tienda' })
  return {
    title: t('metaTitulo'),
    description: t('metaDescripcion'),
    alternates: alternatesDeIdioma('/politicas/terminos-tienda', locale),
  }
}

/**
 * Condiciones de venta de la tienda. Vender a distancia activa el Estatuto del
 * Consumidor (Ley 1480 de 2011), y con él tres cosas que el comprador puede
 * exigir aunque no las digamos: el derecho de retracto, la reversión del pago
 * y la garantía legal. Publicarlas no las crea —ya existen—: lo que hace es
 * que el comprador sepa cómo ejercerlas y que nosotros sepamos qué responder.
 *
 * El texto describe la tienda que existe hoy, no una genérica: aquí NO se
 * cobra en línea. Confirmar el pedido crea una solicitud, y el pago y el envío
 * se acuerdan después por fuera del sitio —así lo dicen ya el checkout y la
 * ficha de producto—. De ahí que el aviso de arriba sea lo primero que se lee:
 * un comprador que cree que ya pagó reclama otra cosa muy distinta.
 *
 * Los tres plazos van como escala y no como párrafo por lo mismo que en la
 * política de cancelación: la pregunta real no es «qué dice la ley», es «en
 * cuál de los tres casos caigo yo».
 *
 * La excepción de los perecederos no es letra chica que nos convenga esconder:
 * casi todo el catálogo es alimento y un comprador que pide retracto de un
 * chocolate ya despachado tiene que encontrar ese límite ANTES de comprar, no
 * al reclamar. Por eso está en la escala, en rojo, y no enterrada en un
 * párrafo.
 *
 * Los datos de contacto se interpolan desde `lib/contacto.ts`, fuente única
 * del proyecto; no se escriben en el catálogo.
 *
 * PENDIENTE: el negocio no ha definido transportadora, cobertura, costo ni
 * plazo de entrega —hoy la tienda dice «a coordinar» y este texto dice lo
 * mismo, que es lo cierto—. Cuando los defina, el apartado de envío deja de
 * ser una promesa de acuerdo y pasa a ser una condición concreta.
 *
 * PENDIENTE: falta la razón social y el NIT del vendedor. El RNT 179868 y la
 * dirección sí están; los datos del registro mercantil hay que pedirlos.
 */

/** Los tres datos de la banda de resumen, en el orden en que se consultan. */
// Las cadenas son CLAVES del catálogo, no texto: se traducen al pintarlas.
const RESUMEN: { Icono: LucideIcon; cifra: string; texto: string }[] = [
  { Icono: RotateCcw, cifra: 'cifraRetracto', texto: 'retracto' },
  { Icono: CreditCard, cifra: 'cifraPago', texto: 'pago' },
  { Icono: Receipt, cifra: 'cifraIva', texto: 'iva' },
]

/**
 * Los tres casos del apartado de retracto: cuándo recuperas todo, cuándo la
 * reversión la pide tu banco y cuándo el retracto simplemente no aplica. El
 * semáforo va de lo que más recupera el comprador a lo que no recupera nada.
 */
const ESCALA: { clave: string; tono: 'bien' | 'medio' | 'alto'; Icono: LucideIcon }[] = [
  { clave: 'retracto', tono: 'bien', Icono: CircleCheck },
  { clave: 'reversion', tono: 'medio', Icono: CircleAlert },
  { clave: 'excepcion', tono: 'alto', Icono: CircleX },
]

type Seccion = {
  id: string
  titulo: string
  /** Rótulo corto para el índice de arriba, donde el título largo no cabe. */
  indice: string
  Icono: LucideIcon
  /** Lista numerada: pasos que ocurren en ese orden. */
  lista?: string[]
  /** Lista con viñetas: condiciones sueltas, sin orden entre ellas. */
  vinetas?: string[]
  /** Prosa: lo que es explicación y no inventario. */
  parrafos?: string[]
  /** Nota destacada al pie de la tarjeta, con su propio rótulo. */
  nota?: { etiqueta: string; texto: string }
  /** Enlace a otra política, cuando el apartado remite a ella. */
  enlace?: {
    href: '/politicas/cancelacion' | '/politicas/datos-personales'
    clave: string
  }
  /** Ocupa la fila entera de la rejilla. Solo la escala lo necesita. */
  ancha?: boolean
}

const SECCIONES: Seccion[] = [
  {
    id: 'vendedor',
    titulo: 'vendedorTitulo',
    indice: 'vendedor',
    Icono: Store,
    parrafos: ['v1', 'v2', 'v3'],
    enlace: { href: '/politicas/cancelacion', clave: 'vendedorEnlace' },
  },
  {
    id: 'pedido',
    titulo: 'pedidoTitulo',
    indice: 'pedido',
    Icono: ShoppingBag,
    lista: ['p1', 'p2', 'p3', 'p4'],
    nota: { etiqueta: 'pedidoEtiqueta', texto: 'pedidoNota' },
  },
  {
    id: 'precios',
    titulo: 'preciosTitulo',
    indice: 'precios',
    Icono: Receipt,
    vinetas: ['pr1', 'pr2', 'pr3', 'pr4', 'pr5'],
  },
  {
    id: 'pago',
    titulo: 'pagoTitulo',
    indice: 'pago',
    Icono: CreditCard,
    parrafos: ['pa1', 'pa2', 'pa3'],
  },
  {
    id: 'envio',
    titulo: 'envioTitulo',
    indice: 'envio',
    Icono: Truck,
    parrafos: ['e1', 'e2', 'e3', 'e4'],
  },
  {
    id: 'retracto',
    titulo: 'retractoTitulo',
    indice: 'retracto',
    Icono: RotateCcw,
    parrafos: ['re1', 're2', 're3', 're4'],
    ancha: true,
  },
  {
    id: 'reclamos',
    titulo: 'reclamosTitulo',
    indice: 'reclamos',
    Icono: Scale,
    parrafos: ['rc1', 'rc2', 'rc3'],
  },
  {
    id: 'datos',
    titulo: 'datosTitulo',
    indice: 'datos',
    Icono: Lock,
    parrafos: ['da1'],
    enlace: { href: '/politicas/datos-personales', clave: 'datosEnlace' },
  },
]

export default async function PoliticaTerminosTiendaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations('nav')
  const t = await getTranslations('politicas.tienda')
  const tp = await getTranslations('politicas')

  return (
    <section className="page-shell politica">
      {/* El índice de políticas no está en el navbar, así que sin esto la única
          salida desde una política es el botón del navegador. */}
      <MigaSuperior href="/politicas" etiqueta={tNav('politicas')} actual={t('titulo')} />
      <h1 style={{ color: 'var(--color-brown)', marginBottom: '12px', minWidth: 0 }}>
        {t('titulo')}
      </h1>
      <p className="politica-fecha">
        <Receipt size={15} strokeWidth={1.9} aria-hidden="true" style={{ flexShrink: 0 }} />
        {tp('actualizado', { fecha: t('fecha') })}
      </p>

      {/* En inglés la política es una traducción informativa: Vuelo Carmesí
          opera bajo ley colombiana y el texto que rige es el español. La clave
          está vacía en español, donde el aviso no tiene sentido. */}
      {tp('avisoTraduccion') && (
        <p className="politica-aviso-traduccion">{tp('avisoTraduccion')}</p>
      )}

      <div className="politica-resumen">
        {RESUMEN.map(({ Icono, cifra, texto }) => (
          <div key={cifra} className="politica-resumen-dato">
            <span className="politica-icono" aria-hidden="true">
              <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <p style={{ minWidth: 0 }}>
              <strong className="politica-cifra">{tp(`tiendaResumen.${cifra}`)}</strong>{' '}
              {tp(`tiendaResumen.${texto}`)}
            </p>
          </div>
        ))}
      </div>

      {/* Lo único que no puede malentenderse: confirmar no es pagar. Va antes
          que el índice porque cambia lo que el comprador cree que tiene. */}
      <div className="politica-callout">
        <span className="politica-callout-icono" aria-hidden="true">
          <PackageCheck size={24} strokeWidth={1.8} color="var(--color-gold)" />
        </span>
        <p>{t('aviso')}</p>
      </div>

      <nav className="politica-indice" aria-label={tp('indiceAria')}>
        {SECCIONES.map(({ id, indice }) => (
          <a key={id} href={`#${id}`} className="politica-chip">
            {tp(`tiendaIndice.${indice}`)}
          </a>
        ))}
      </nav>

      <div className="politica-grid">
        {SECCIONES.map(
          ({ id, titulo, Icono, lista, vinetas, parrafos, nota, enlace, ancha }) => (
            <article
              key={id}
              id={id}
              className={`politica-card${ancha ? ' politica-card--ancha' : ''}`}
            >
              <div className="politica-card-cabecera">
                <span className="politica-icono" aria-hidden="true">
                  <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
                </span>
                <h2 className="politica-card-titulo">{t(titulo)}</h2>
              </div>

              {/* La escala vive dentro de su apartado y por delante de los
                  párrafos: es el cuerpo de la cláusula, no un resumen aparte. */}
              {id === 'retracto' && (
                <ol className="politica-escala">
                  {ESCALA.map(({ clave, tono, Icono: IconoTono }) => (
                    <li
                      key={clave}
                      className={`politica-escala-fila politica-escala-fila--${tono}`}
                    >
                      <IconoTono
                        size={20}
                        strokeWidth={2}
                        aria-hidden="true"
                        style={{ flexShrink: 0 }}
                      />
                      <span className="politica-escala-plazo">
                        {t(`escala.${clave}.cuando`)}
                      </span>
                      <span className="politica-escala-efecto">
                        {t(`escala.${clave}.que`)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {lista && (
                <ol className="politica-lista">
                  {lista.map(clave => (
                    <li key={clave}>{t(clave)}</li>
                  ))}
                </ol>
              )}

              {vinetas && (
                <ul className="politica-lista politica-lista--vinetas">
                  {vinetas.map(clave => (
                    <li key={clave}>{t(clave)}</li>
                  ))}
                </ul>
              )}

              {parrafos && (
                <div className="politica-parrafos">
                  {parrafos.map(clave => (
                    <p key={clave}>
                      {t(clave, {
                        direccion: CONTACTO.direccionCompleta,
                        email: CONTACTO.email,
                        telefono: CONTACTO.telefono,
                      })}
                    </p>
                  ))}
                </div>
              )}

              {nota && (
                <p className="politica-nota">
                  <strong className="politica-nota-etiqueta">{t(nota.etiqueta)}</strong>{' '}
                  {t(nota.texto)}
                </p>
              )}

              {enlace && (
                <div className="politica-parrafos" style={{ marginTop: '14px' }}>
                  <p>
                    <Link
                      href={enlace.href}
                      style={{ color: 'var(--color-crimson)', fontWeight: 700 }}
                    >
                      {t(enlace.clave)}
                    </Link>
                  </p>
                </div>
              )}
            </article>
          ),
        )}
      </div>

      <p className="politica-cierre">
        {t('dudas')}{' '}
        <Link href="/contacto" style={{ color: 'var(--color-crimson)', fontWeight: 700 }}>
          {t('escribenos')}
        </Link>
        .
      </p>
    </section>
  )
}
