/**
 * Completa las fichas del catálogo con los datos prácticos del portafolio 2026.
 *
 * OJO con lo que este script NO hace, porque la primera versión sí lo hacía y
 * estaba mal: no crea fichas. Las cuatro experiencias del portafolio YA están
 * cargadas desde el panel, con sus fotos y su relato, y dos de ellas con un
 * slug distinto del que se deduciría del portafolio —`experiencia-aves-cacao`
 * y `mascarilla-de-cacao-refrigerio`—. Un script que las diera por ausentes
 * habría creado dos duplicados con fotos vacías. Aquí se buscan por su slug
 * real y, si alguna no aparece, se avisa y se salta: crear catálogo a ciegas
 * es trabajo del panel, no de un script.
 *
 * Tampoco toca lo que alguien escribió con intención: `nombre`, `slug`,
 * `descripcion`, `descripcionLarga`, `precio`, `capacidad`, `destacada` y las
 * fotos se quedan exactamente como están. Lo que sí reescribe son los campos
 * prácticos, que hoy están en genérico y el portafolio tiene concretos:
 *
 *   horarios ......... "Todos los días con previa reserva" -> el itinerario real
 *   queTraer ......... 2 ítems -> los 8 de la hoja 18
 *   noIncluye ........ 1 o 2 ítems -> los 5 de la hoja 19
 *   recomendaciones .. solo la edad -> edad, terreno, clima y temporada
 *   incluye .......... se le suma lo que faltaba (guianza y póliza)
 *
 * Y `ruta-cafe-y-cacao` no se toca en absoluto: es la alianza con Morena Roja
 * y no está en el portafolio, así que no hay de dónde sacarle datos.
 *
 * Todo lo que escribe aterriza en campos que el panel edita (Experiencias →
 * editar, y Configuración para el punto de encuentro). Nada queda fijo en el
 * código del front: este archivo es solo el vehículo para no teclear cuatro
 * formularios a mano, y a partir de ahí manda el panel.
 *
 * De dónde sale cada dato (hojas de portafolio/src/portafolio.html):
 *   - itinerarios ................... hojas 11 y 13 (líneas de tiempo)
 *   - franja del recorrido de cacao . hojas 10 y 18
 *   - incluye, por plan ............. hoja 19
 *   - no incluye, común a todos ..... hoja 19
 *   - qué traer ..................... hoja 18
 *   - terreno, clima y exigencia .... hoja 18
 *   - punto de encuentro ............ hoja 18
 *
 * Uso:
 *   npx ts-node prisma/cargar-experiencias.ts            # simula
 *   npx ts-node prisma/cargar-experiencias.ts --aplicar  # escribe
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { toSlug } from '../src/common/slug'

const APLICAR = process.argv.includes('--aplicar')

/**
 * Lo que no incluye ningún plan (hoja 19). Va aparte porque es literalmente la
 * misma lista en las cuatro fichas, y repetirla cuatro veces es garantizar que
 * dentro de un año digan cosas distintas.
 */
const NO_INCLUYE = [
  'Transporte hasta la finca y peajes',
  'Almuerzo',
  'Alojamiento: todos los planes son de un día, sin pernocte',
  'Gastos personales y compras en la finca',
  'Servicios médicos no cubiertos por la póliza de asistencia',
]

/** Qué traer (hoja 18). Igual que arriba: idéntico en las cuatro. */
const QUE_TRAER = [
  'Ropa de manga larga',
  'Calzado cerrado',
  'Repelente',
  'Protector solar',
  'Sombrero o gorra',
  'Impermeable o poncho',
  'Hidratación',
  'Documento de identidad',
]

/**
 * Terreno y clima (hoja 18). Es el mismo sitio para todas las experiencias, así
 * que cada ficha lo repite y solo le añade delante lo suyo —la edad mínima, el
 * nivel de observación—, que es lo que de verdad cambia entre una y otra.
 */
const TERRENO = [
  'Exigencia física baja a media, por senderos de tierra.',
  'Entre 600 y 850 msnm; clima cálido húmedo de 24 a 30 °C, con temporada seca de diciembre a marzo.',
].join('\n')

/**
 * Edad mínima. El portafolio dice 5 años en la hoja 10 y el panel dice 6 en las
 * cuatro fichas; manda el panel, que es lo que hoy ve el visitante y lo escribió
 * la finca. La hoja 10 se corrigió para que digan lo mismo.
 */
const EDAD_MINIMA = 'Edad mínima: 6 años.'

type Ajuste = {
  /** Slug REAL en la base. No se deduce del nombre: se leyó de la base. */
  slug: string
  horarios: string
  recomendaciones: string
  incluye: string[]
  queTraer: string[]
  noIncluye: string[]
}

const AJUSTES: Ajuste[] = [
  {
    slug: 'experiencia-cacaotera',
    // Conserva el horario de atención que ya estaba escrito (9 a. m. a 5 p. m.)
    // y le añade la franja del recorrido de las hojas 10 y 18. No se contradicen:
    // uno es cuándo abre la finca y el otro cuándo se hace la actividad.
    horarios: [
      'Todos los días con reserva previa, de 9:00 a. m. a 5:00 p. m.',
      'La franja recomendada para el recorrido es de 9:00 a. m. a 1:00 p. m.',
      'La visita dura 3 horas.',
    ].join('\n'),
    recomendaciones: [EDAD_MINIMA, TERRENO].join('\n'),
    // Los cuatro primeros son los que ya tenía, con su redacción intacta
    // —"Chocoterapia o mascarilla", con la o—: lo único que faltaba era la
    // guianza y la póliza, que la hoja 19 sí le pone a este plan.
    incluye: [
      'Recorrido guiado por cultivos de cacao',
      'Proceso artesanal de transformación del cacao',
      'Chocoterapia o mascarilla natural de cacao',
      'Refrigerio tradicional',
      'Guianza y póliza de asistencia y riesgos',
    ],
    queTraer: QUE_TRAER,
    noIncluye: NO_INCLUYE,
  },
  {
    slug: 'avistamiento-de-aves',
    // El itinerario de la hoja 11, en orden cronológico. El portafolio lo pinta
    // con el desayuno al final por cómo cae la maqueta, pero son las 8:00 a. m.
    // y va antes de la media mañana.
    horarios: [
      '5:30 a. m. — salida con binoculares desde el punto de encuentro.',
      'Amanecer — recorrido por corredores biológicos y cacao en sombrío.',
      '8:00 a. m. — desayuno campesino en la finca.',
      'Media mañana — observación en el sistema agroforestal.',
      '',
      'De lunes a domingo con reserva previa.',
    ].join('\n'),
    recomendaciones: [
      EDAD_MINIMA,
      'Nivel de observación: básico a intermedio.',
      'Mejor franja de avistamiento: de 5:30 a 8:00 a. m.',
      TERRENO,
    ].join('\n'),
    // Los cinco que ya tenía. Solo se corrige "Guia ... Aviturismo", que estaba
    // sin tilde y con mayúscula a mitad de frase.
    incluye: [
      'Binoculares para la actividad',
      'Guía especializado en aviturismo',
      'Desayuno campesino',
      'Acompañamiento durante todo el recorrido',
      'Póliza de asistencia y riesgos',
    ],
    queTraer: QUE_TRAER,
    noIncluye: NO_INCLUYE,
  },
  {
    slug: 'experiencia-aves-cacao',
    // Itinerario de la hoja 13. El cupo se queda en el que tiene la base (12);
    // el portafolio dice 2 a 8 y esa diferencia queda anotada en el informe,
    // pero no se toca desde aquí.
    horarios: [
      '5:30 a. m. — avistamiento de aves con guía y binoculares.',
      '8:00 a. m. — desayuno campesino en la finca.',
      '9:00 a. m. — cultivo, cosecha y proceso artesanal del cacao.',
      'Cierre — chocoterapia, mascarilla y refrigerio.',
      '',
      'Todos los días con reserva previa.',
    ].join('\n'),
    recomendaciones: [
      EDAD_MINIMA,
      'Nivel de observación: básico a intermedio.',
      TERRENO,
    ].join('\n'),
    // Los ocho que ya tenía, en el orden en que ocurren durante la jornada:
    // la ficha se lee de arriba abajo y el visitante la usa para imaginarse el
    // día. Ningún ítem se quita ni se añade.
    incluye: [
      'Guía especializado',
      'Binoculares para la actividad',
      'Desayuno campesino',
      'Recorrido guiado por cultivos de cacao',
      'Proceso artesanal de transformación del cacao',
      'Chocoterapia o mascarilla natural de cacao',
      'Refrigerio tradicional',
      'Póliza de asistencia y riesgos',
    ],
    queTraer: QUE_TRAER,
    noIncluye: NO_INCLUYE,
  },
  {
    slug: 'mascarilla-de-cacao-refrigerio',
    horarios: [
      'Todos los días con reserva previa.',
      'La hora se acuerda con la finca. Dura 1 hora.',
    ].join('\n'),
    recomendaciones: [
      EDAD_MINIMA,
      'No incluye recorrido por el cultivo: es el servicio corto.',
      TERRENO,
    ].join('\n'),
    // Es la única cuyo "incluye" estaba de verdad incompleto: tenía un solo
    // ítem, "Refrigerio tradicional", y no mencionaba ni la mascarilla —que da
    // nombre al servicio— ni la póliza que la hoja 20 le pone a todos.
    incluye: [
      'Chocoterapia con mascarilla natural de cacao',
      'Refrigerio tradicional',
      'Guianza y póliza de asistencia y riesgos',
    ],
    queTraer: QUE_TRAER,
    noIncluye: NO_INCLUYE,
  },
]

/**
 * Punto de encuentro común (hoja 18). Se escribe una vez en SiteConfig y de ahí
 * lo heredan las fichas que no traigan el suyo.
 *
 * Las coordenadas son las de `front/lib/contacto.ts`, no las que traía la hoja
 * 18: aquellas caían unos 240 m al oeste y la hoja se corrigió para que el PDF,
 * el mapa embebido y este texto apunten los tres al mismo sitio.
 */
const PUNTO_ENCUENTRO = [
  'Finca La Fortuna, vereda Brisas del Tonoa, Cubarral (Meta).',
  'Coordenadas: 3.7537786, -73.8743938',
  'Parqueadero para 4 automóviles y 1 bus.',
  'Llega 15 minutos antes de la hora acordada.',
].join('\n')

/**
 * Los puntos de encuentro que hay hoy escritos a mano y que sobra repetir:
 * o son "A convenir" —que además contradice a la hoja 18, donde el punto es
 * fijo— o son la dirección de la finca a medias, sin coordenadas ni parqueadero.
 * Se vacían para que la ficha herede el de SiteConfig, que sí está completo.
 *
 * La comparación es contra esta lista y no "vacía siempre": si algún día una
 * experiencia sale de verdad de otro sitio y alguien lo escribe en su ficha,
 * este script no puede borrárselo.
 */
const PUNTOS_A_HEREDAR = [
  'A convenir',
  'Finca la Fortuna, Cubarral Meta',
  'Finca la Fortuna, Vereda Brisas del Tonoa',
  'Finca la Fortuna, Vereda Brisas del Tonoa, Cubarral Meta',
  'Finca La Fortuna, Vereda Brisas del Tonoa, Cubarral, Meta',
]

/**
 * Compara sentido y no tecleo: `toSlug` ya quita tildes, mayúsculas y
 * puntuación, que es exactamente la diferencia entre "Finca la Fortuna,
 * Cubarral Meta" y "Finca La Fortuna, Cubarral, Meta". Se reutiliza en vez de
 * escribir otra normalización porque dos normalizaciones parecidas y distintas
 * en el mismo repo son un error esperando a pasar.
 */
const normalizar = (v: string) => toSlug(v)

const HEREDABLES = new Set(PUNTOS_A_HEREDAR.map(normalizar))

const mismasListas = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i])

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const acciones: string[] = []
  const avisos: string[] = []

  for (const ajuste of AJUSTES) {
    const exp = await prisma.experiencia.findUnique({ where: { slug: ajuste.slug } })

    if (!exp) {
      avisos.push(`  FALTA  no hay ninguna experiencia con slug '${ajuste.slug}'; se salta`)
      continue
    }

    const data: Record<string, unknown> = {}
    if (exp.horarios !== ajuste.horarios) data.horarios = ajuste.horarios
    if (exp.recomendaciones !== ajuste.recomendaciones) data.recomendaciones = ajuste.recomendaciones
    if (!mismasListas(exp.incluye, ajuste.incluye)) data.incluye = ajuste.incluye
    if (!mismasListas(exp.queTraer, ajuste.queTraer)) data.queTraer = ajuste.queTraer
    if (!mismasListas(exp.noIncluye, ajuste.noIncluye)) data.noIncluye = ajuste.noIncluye

    // El punto de encuentro por ficha solo se vacía si lo que hay es uno de los
    // genéricos conocidos; cualquier otro texto se respeta.
    const punto = exp.puntoEncuentro.trim()
    if (punto && HEREDABLES.has(normalizar(punto))) {
      data.puntoEncuentro = ''
    } else if (punto) {
      avisos.push(`  OJO    ${exp.nombre}: punto de encuentro propio ${JSON.stringify(punto)}; se respeta`)
    }

    const campos = Object.keys(data)
    if (campos.length === 0) {
      acciones.push(`  IGUAL      ${exp.nombre} — ya coincide con el portafolio`)
    } else {
      acciones.push(`  ACTUALIZA  ${exp.nombre} — ${campos.join(', ')}`)
      if (APLICAR) await prisma.experiencia.update({ where: { id: exp.id }, data })
    }
  }

  // El punto de encuentro por defecto. Mismo criterio que arriba: se completa si
  // está vacío o si lo que hay es uno de los genéricos; un texto propio se avisa
  // y se deja, porque el panel manda sobre este archivo.
  const clave = await prisma.siteConfig.findUnique({ where: { key: 'punto_encuentro' } })
  const valor = clave?.value.trim() ?? ''
  if (!clave) {
    acciones.push('  CREA       SiteConfig.punto_encuentro')
    if (APLICAR) await prisma.siteConfig.create({ data: { key: 'punto_encuentro', value: PUNTO_ENCUENTRO } })
  } else if (valor === PUNTO_ENCUENTRO) {
    acciones.push('  IGUAL      SiteConfig.punto_encuentro')
  } else if (!valor || HEREDABLES.has(normalizar(valor))) {
    acciones.push(`  ACTUALIZA  SiteConfig.punto_encuentro — era ${JSON.stringify(valor)}`)
    if (APLICAR) await prisma.siteConfig.update({ where: { key: 'punto_encuentro' }, data: { value: PUNTO_ENCUENTRO } })
  } else {
    avisos.push(`  OJO    SiteConfig.punto_encuentro tiene texto propio; se respeta:\n         ${JSON.stringify(valor)}`)
  }

  // Diferencias que este script no arregla porque no le corresponde decidirlas:
  // el cupo del plan combinado. La base dice 12 y el portafolio 2 a 8.
  const combinado = await prisma.experiencia.findUnique({
    where: { slug: 'experiencia-aves-cacao' },
    select: { capacidad: true },
  })
  if (combinado && combinado.capacidad !== 8) {
    avisos.push(
      `  OJO    aves + cacao: cupo ${combinado.capacidad} en la base y "2 a 8" en las hojas 13 y 20\n` +
      '         del portafolio. Se deja el de la base; hay que corregir el PDF o el panel.',
    )
  }

  console.log(APLICAR ? '=== APLICADO ===' : '=== SIMULACIÓN (usa --aplicar para escribir) ===')
  console.log(acciones.join('\n'))
  if (avisos.length) {
    console.log('\n--- para revisar a mano ---')
    console.log(avisos.join('\n'))
  }
  console.log('\nNo se tocan nombre, descripciones, precio, cupo, fotos ni destacada.')
  console.log("Tampoco 'ruta-cafe-y-cacao': no está en el portafolio.")

  await prisma.$disconnect()
  await pool.end()
}

main().catch((err) => {
  console.error('Falló la carga de experiencias:', err)
  process.exit(1)
})
