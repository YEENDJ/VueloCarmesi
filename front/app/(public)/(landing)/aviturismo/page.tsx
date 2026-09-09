import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  Binoculars,
  CalendarRange,
  Check,
  ExternalLink,
  Feather,
  Globe,
  ListChecks,
  MapPin,
  Mountain,
  Sunrise,
  Telescope,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { CONTACTO, MAPA, MENSAJE_WHATSAPP, whatsappCon } from '@/lib/contacto'

/**
 * Página propia de aviturismo. La fuente es la hoja 12 del portafolio 2026
 * —«180 especies registradas en el hotspot»—, en portafolio/src/portafolio.html.
 *
 * Por qué es página y no un párrafo más de la ficha de `avistamiento-de-aves`:
 * una ficha de experiencia vende UNA salida y se lee de arriba abajo en dos
 * minutos; no aguanta una lista de especies con nombre científico y en inglés,
 * ni una ventana de migratorias, ni el perfil del guía. Y es justo eso lo que
 * busca el birder internacional, que según la hoja 6 del portafolio es el
 * perfil que «paga más por especialización». Los nombres en inglés
 * —Chestnut-eared Aracari, Sunbittern— son literalmente lo que ese visitante
 * escribe en Google, y sin una URL propia no hay dónde posicionarlos.
 *
 * La ficha comercial sigue siendo la de /experiencias/avistamiento-de-aves:
 * esta página informa y remata allá, no duplica el precio ni el botón de pago
 * (el precio lo administra el panel y aquí se quedaría desactualizado).
 */

/**
 * Identificador del hotspot en eBird, el que va en `ebird.org/hotspot/L…`.
 *
 * Es el dato que más pesa de toda la página: el birder contrasta la lista con
 * un tercero antes de escribirnos, y eso vale más que cualquier fotografía.
 * Si algún día cambia, se cambia acá y no en los tres sitios donde se enlaza.
 */
const EBIRD_HOTSPOT_ID = 'L7999083'

const EBIRD_URL = `https://ebird.org/hotspot/${EBIRD_HOTSPOT_ID}`

const TITULO = 'Aviturismo en Cubarral, Meta · 180 especies registradas'
const DESCRIPCION =
  'Birdwatching en el piedemonte llanero: 180 especies en un hotspot público de eBird, entre 600 y 850 m s. n. m., con cacao en sombrío y corredores biológicos. Salidas guiadas de 5:30 a 8:00 a. m.'

/**
 * Dominio público del sitio.
 *
 * Va con el dominio real por defecto y no con un respaldo a localhost, que es
 * lo que hace Next si no se le dice nada: un `<link rel="canonical"
 * href="http://localhost:3000/aviturismo">` servido en producción le está
 * diciendo al buscador que la versión buena de esta página vive en una máquina
 * a la que no puede entrar, y con eso la saca del índice.
 *
 * La variable de entorno queda como escape para un despliegue de prueba en
 * otro dominio: ahí sí conviene que el canonical apunte a sí mismo y no a
 * producción, para no competir consigo mismo en el índice.
 */
// Con `||` y no con `??`: en .env.example la variable va declarada pero vacía,
// y una cadena vacía no es nullish. Con `??` pasaría el '' a new URL(), que
// lanza, y el build se caería con un error que no señala a este archivo.
const SITIO = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://vuelocarmesi.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
  alternates: { canonical: '/aviturismo' },
  title: `${TITULO} | Vuelo Carmesí`,
  description: DESCRIPCION,
  keywords: [
    'aviturismo Meta',
    'avistamiento de aves Cubarral',
    'birdwatching Colombia',
    'birding Meta Colombia',
    'Llanos foothills birding',
    'eBird hotspot Cubarral',
    'Chestnut-eared Aracari',
    'Sunbittern Colombia',
    'shade-grown cacao birding',
  ],
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    type: 'website',
    locale: 'es_CO',
    siteName: 'Vuelo Carmesí',
    // Se resuelve contra metadataBase, así que sale absoluta: WhatsApp y
    // Facebook no descargan una og:image relativa y la tarjeta saldría vacía.
    images: [
      {
        url: '/images/aves/aracari.jpg',
        width: 1152,
        height: 864,
        alt: 'Pichí de collar (Pteroglossus castanotis) posado en una rama en la finca',
      },
    ],
  },
}

/** Los cuatro datos que un birder mira antes de leer nada más. */
const RESUMEN: { Icono: LucideIcon; cifra: string; texto: string }[] = [
  { Icono: ListChecks, cifra: '180 especies', texto: 'registradas en el hotspot, con lista pública en eBird' },
  { Icono: Mountain, cifra: '600–850 m', texto: 's. n. m., piedemonte entre los Llanos y el Sumapaz' },
  { Icono: Sunrise, cifra: '5:30–8:00 a. m.', texto: 'la franja de mayor actividad, todos los días del año' },
  { Icono: CalendarRange, cifra: 'Oct – abril', texto: 'ventana de las migratorias boreales' },
]

type Especie = {
  /** El nombre por el que se busca en cualquier idioma. */
  cientifico: string
  /** El que escribe en Google el birder internacional. Es la razón de la página. */
  ingles: string
  local: string
  foto: string
  alt: string
  /** Encuadre: las fotos son 4:3 y el marco recorta; esto evita cortar el pico. */
  foco: string
}

/**
 * Las siete residentes que están fotografiadas EN la finca.
 *
 * La lista se armó sobre el archivo propio y no al revés: una foto tomada en el
 * hotspot prueba el avistamiento y una de banco de imágenes no prueba nada. Por
 * eso no son las siete «mejores» ni las más raras —ninguna es endémica de
 * Colombia y un birder lo nota de inmediato—: lo que vende acá es la
 * fiabilidad, se ven todo el año. Las 180 completas están en eBird, que es
 * donde se verifican.
 *
 * Las que faltan del catálogo de fotos (los tres colibríes y la tangara azul)
 * están marcadas «especie por confirmar» en docs/catalogo-fotos.md: publicar un
 * nombre científico equivocado ante este público cuesta más que no publicarlo.
 */
const RESIDENTES: Especie[] = [
  {
    cientifico: 'Pteroglossus castanotis',
    ingles: 'Chestnut-eared Aracari',
    local: 'Pichí de collar',
    foto: '/images/aves/aracari.jpg',
    alt: 'Pichí de collar posado en una rama, con el pecho amarillo y la banda roja',
    foco: 'center 45%',
  },
  {
    cientifico: 'Campephilus melanoleucos',
    ingles: 'Crimson-crested Woodpecker',
    local: 'Carpintero real',
    foto: '/images/aves/carpintero.jpg',
    alt: 'Carpintero real de cresta carmesí trepado en el tronco de un árbol',
    foco: 'center 33%',
  },
  {
    cientifico: 'Glaucidium brasilianum',
    ingles: 'Ferruginous Pygmy-Owl',
    local: 'Currucutú común',
    foto: '/images/aves/currucutu.jpg',
    alt: 'Currucutú de ojos amarillos mirando de frente a la cámara',
    foco: 'center 34%',
  },
  {
    cientifico: 'Eurypyga helias',
    ingles: 'Sunbittern',
    local: 'Tigana',
    foto: '/images/aves/tigana.jpg',
    alt: 'Tigana caminando entre la hierba a la orilla del agua',
    foco: 'center 40%',
  },
  {
    cientifico: 'Cyanocorax violaceus',
    ingles: 'Violaceous Jay',
    local: 'Carriquí violáceo',
    foto: '/images/aves/carriqui.jpg',
    alt: 'Carriquí violáceo posado en una rama frente a hojas de plátano',
    foco: 'center 88%',
  },
  {
    cientifico: 'Thraupis palmarum',
    ingles: 'Palm Tanager',
    local: 'Azulejo palmero',
    foto: '/images/aves/azulejo-palmero.jpg',
    alt: 'Azulejo palmero posado bajo la lluvia sobre una piedra',
    foco: 'center 88%',
  },
  {
    cientifico: 'Cissopis leverianus',
    ingles: 'Magpie Tanager',
    local: 'Tangara urraca',
    foto: '/images/aves/tangara-urraca.jpg',
    alt: 'Tangara urraca blanca y negra, de cola larga, posada entre el follaje',
    foco: 'center 30%',
  },
]

/**
 * Migratorias boreales. Van sin foto a propósito: las dos están registradas en
 * el hotspot pero no hay archivo propio, y aquí una foto prestada rompería la
 * regla que sostiene toda la lista de arriba.
 */
const MIGRATORIAS: Pick<Especie, 'cientifico' | 'ingles' | 'local'>[] = [
  { cientifico: 'Piranga rubra', ingles: 'Summer Tanager', local: 'Piranga roja' },
  { cientifico: 'Setophaga ruticilla', ingles: 'American Redstart', local: 'Candelita norteña' },
]

/**
 * La ventana de visita, como escala y no como párrafo: la pregunta que trae a
 * alguien a este apartado es «¿cuándo me conviene ir?», y en prosa hay que
 * leerse los tres casos para contestarla.
 */
const VENTANAS: { cuando: string; que: string; nota: string; tono: 'alto' | 'medio' }[] = [
  {
    cuando: 'Octubre a abril',
    que: 'Temporada alta',
    nota: 'Las residentes más las migratorias boreales que bajan del norte. Es la ventana que buscan los birders internacionales.',
    tono: 'alto',
  },
  {
    cuando: 'Mayo a septiembre',
    que: 'Solo residentes',
    nota: 'Las especies de la lista de arriba se observan igual: están todo el año y no dependen de la temporada.',
    tono: 'medio',
  },
  {
    cuando: 'Cada día, 5:30–8:00 a. m.',
    que: 'Mejor franja',
    nota: 'La actividad cae con el sol alto. La salida arranca antes del amanecer para aprovecharla completa.',
    tono: 'alto',
  },
]

/** Itinerario de la hoja 11 del portafolio, en orden cronológico. */
const RECORRIDO: [string, string][] = [
  ['5:30 a. m.', 'Salida con binoculares desde el punto de encuentro'],
  ['Amanecer', 'Recorrido por corredores biológicos y cacao en sombrío'],
  ['Media mañana', 'Observación en el sistema agroforestal'],
  ['8:00 a. m.', 'Desayuno campesino en la finca'],
]

const INCLUYE = [
  'Binoculares para la actividad',
  'Guía local especializado en aviturismo',
  'Desayuno campesino',
  'Acompañamiento durante todo el recorrido',
  'Póliza de asistencia y riesgos',
]

/** Rótulos del índice. El título largo no cabe en un chip. */
const APARTADOS: { id: string; indice: string }[] = [
  { id: 'especies', indice: 'Especies residentes' },
  { id: 'migratorias', indice: 'Migratorias' },
  { id: 'cuando', indice: 'Cuándo venir' },
  { id: 'recorrido', indice: 'El recorrido' },
  { id: 'guia', indice: 'El guía' },
  { id: 'international', indice: 'For birders' },
  { id: 'donde', indice: 'Dónde queda' },
]

/**
 * Datos estructurados. La geolocalización es lo que hace que la página pueda
 * salir en una búsqueda de aviturismo «cerca de» y no solo por nombre, y el
 * `sameAs` al hotspot es lo que le dice al buscador que esto que afirmamos lo
 * respalda un tercero.
 */
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'TouristAttraction',
  '@id': `${SITIO}/aviturismo`,
  url: `${SITIO}/aviturismo`,
  name: 'Aviturismo en Vuelo Carmesí',
  alternateName: 'Birdwatching at Vuelo Carmesí',
  description: DESCRIPCION,
  touristType: ['Birdwatchers', 'Aviturismo', 'Ecotourism'],
  isAccessibleForFree: false,
  address: {
    '@type': 'PostalAddress',
    streetAddress: CONTACTO.direccion,
    addressLocality: 'Cubarral',
    addressRegion: 'Meta',
    addressCountry: 'CO',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 3.7537786,
    longitude: -73.8743938,
    elevation: '600-850 m',
  },
  telephone: CONTACTO.telefonoE164,
  email: CONTACTO.email,
  sameAs: [EBIRD_URL],
}

export default function AviturismoPage() {
  return (
    <section className="page-shell avi">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <p className="avi-kicker">
        <Feather size={15} strokeWidth={1.9} aria-hidden="true" style={{ flexShrink: 0 }} />
        Cubarral, Meta · Piedemonte llanero
      </p>
      {/* El h1 carga el municipio y la cifra a propósito. «Aviturismo entre
          cacao en sombrío» se leía mejor, pero nadie escribe eso en un buscador:
          se busca por dónde queda y por cuántas especies hay. */}
      <h1 className="avi-titulo">
        Aviturismo en Cubarral, Meta: 180 especies entre cacao en sombrío
      </h1>
      <p className="avi-lead">
        180 especies registradas en un hotspot público de <b>eBird</b>, en 1,2 hectáreas de cultivo
        agroecológico entre los 600 y los 850 m s. n. m. La lista no hay que creérnosla: está
        publicada y cualquiera puede contrastarla antes de escribirnos.
      </p>

      <div className="avi-resumen">
        {RESUMEN.map(({ Icono, cifra, texto }) => (
          <div key={cifra} className="avi-resumen-dato">
            <span className="avi-icono" aria-hidden="true">
              <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <p style={{ minWidth: 0 }}>
              <strong className="avi-cifra">{cifra}</strong> {texto}
            </p>
          </div>
        ))}
      </div>

      {/* El dato de eBird es el que más pesa de la página: es verificable por un
          tercero antes de que nos llamen, y eso vale más que cualquier foto. Por
          eso abre, en recuadro y con el enlace a la vista. */}
      <div className="avi-ebird">
        <span className="avi-ebird-icono" aria-hidden="true">
          <ListChecks size={24} strokeWidth={1.8} color="var(--color-gold)" />
        </span>
        <div style={{ minWidth: 0 }}>
          <p>
            El hotspot está publicado en eBird como <b>Vuelo Carmesí</b>. Es la lista completa,
            mantenida por la plataforma del Cornell Lab of Ornithology, y se puede consultar y
            contrastar sin pedirnos permiso.
          </p>
          <a
            className="avi-ebird-enlace"
            href={EBIRD_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver la lista en eBird
            <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
          </a>
        </div>
      </div>

      <nav className="avi-indice" aria-label="Apartados de la página">
        {APARTADOS.map(({ id, indice }) => (
          <a key={id} href={`#${id}`} className="avi-chip">
            {indice}
          </a>
        ))}
      </nav>

      <div className="avi-grid">
        {/* ── Residentes ── */}
        <article id="especies" className="avi-card avi-card--ancha">
          <div className="avi-card-cabecera">
            <span className="avi-icono" aria-hidden="true">
              <Binoculars size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="avi-card-titulo">Residentes · se observan todo el año</h2>
          </div>
          <p className="avi-card-texto">
            Las siete que están fotografiadas en la finca. Ninguna es endémica de Colombia: lo que
            ofrecen es fiabilidad, no rareza. El resto de las 180 está en la lista de eBird.
          </p>

          <ul className="avi-especies">
            {RESIDENTES.map(({ cientifico, ingles, local, foto, alt, foco }) => (
              <li key={cientifico} className="avi-especie">
                <div className="avi-especie-foto">
                  <Image
                    src={foto}
                    alt={alt}
                    fill
                    sizes="(min-width: 1100px) 260px, (min-width: 700px) 45vw, 90vw"
                    style={{ objectFit: 'cover', objectPosition: foco }}
                  />
                </div>
                {/* El científico manda y el inglés va justo debajo: son los dos
                    nombres por los que llega buscando este visitante. */}
                <b className="avi-especie-cientifico">
                  <i>{cientifico}</i>
                </b>
                <span className="avi-especie-ingles">{ingles}</span>
                <span className="avi-especie-local">{local}</span>
              </li>
            ))}
          </ul>
        </article>

        {/* ── Migratorias ── */}
        <article id="migratorias" className="avi-card">
          <div className="avi-card-cabecera">
            <span className="avi-icono" aria-hidden="true">
              <CalendarRange size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="avi-card-titulo">Migratorias boreales · octubre a abril</h2>
          </div>
          <p className="avi-card-texto">
            Bajan del hemisferio norte a pasar el invierno y se suman a la lista durante esos siete
            meses. Es la razón por la que la fecha de la visita no da igual.
          </p>
          <ul className="avi-pills">
            {MIGRATORIAS.map(({ cientifico, ingles, local }) => (
              <li key={cientifico} className="avi-pill">
                <b>
                  <i>{cientifico}</i>
                </b>
                <span className="avi-pill-ingles">{ingles}</span>
                <span className="avi-pill-local">{local}</span>
              </li>
            ))}
          </ul>
        </article>

        {/* ── Cuándo venir ── */}
        <article id="cuando" className="avi-card">
          <div className="avi-card-cabecera">
            <span className="avi-icono" aria-hidden="true">
              <Sunrise size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="avi-card-titulo">Cuándo venir</h2>
          </div>
          <ul className="avi-ventana">
            {VENTANAS.map(({ cuando, que, nota, tono }) => (
              <li key={cuando} className={`avi-ventana-fila avi-ventana-fila--${tono}`}>
                <div className="avi-ventana-cabeza">
                  <span className="avi-ventana-cuando">{cuando}</span>
                  <span className="avi-ventana-que">{que}</span>
                </div>
                <p className="avi-ventana-nota">{nota}</p>
              </li>
            ))}
          </ul>
        </article>

        {/* ── El recorrido ── */}
        <article id="recorrido" className="avi-card">
          <div className="avi-card-cabecera">
            <span className="avi-icono" aria-hidden="true">
              <Telescope size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="avi-card-titulo">El recorrido</h2>
          </div>
          <ol className="avi-timeline">
            {RECORRIDO.map(([hora, que]) => (
              <li key={hora} className="avi-paso">
                <span className="avi-paso-hora">{hora}</span>
                <span className="avi-paso-texto">{que}</span>
              </li>
            ))}
          </ol>
          <p className="avi-subtitulo">Incluye</p>
          <ul className="avi-incluye">
            {INCLUYE.map((item) => (
              <li key={item}>
                <Check size={16} strokeWidth={2.4} aria-hidden="true" />
                <span style={{ minWidth: 0 }}>{item}</span>
              </li>
            ))}
          </ul>
          <p className="avi-card-nota">
            Grupos de 2 a 8 personas, nivel de observación básico a intermedio. La reserva y la
            tarifa vigente están en la{' '}
            <Link href="/experiencias/avistamiento-de-aves">ficha de la experiencia</Link>.
          </p>
        </article>

        {/* ── El guía ── */}
        <article id="guia" className="avi-card">
          <div className="avi-card-cabecera">
            <span className="avi-icono" aria-hidden="true">
              <Users size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="avi-card-titulo">Quién guía la salida</h2>
          </div>
          <div className="avi-guia">
            <div className="avi-guia-foto">
              <Image
                src="/images/personas/cristian-enciso.jpg"
                alt="Cristian Enciso con binoculares durante una salida de avistamiento de aves"
                fill
                sizes="72px"
                style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="avi-guia-nombre">Cristian Enciso</p>
              <p className="avi-guia-cargo">
                Guía Profesional de Turismo · 14 años en turismo de naturaleza
              </p>
            </div>
          </div>
          <p className="avi-card-texto">
            Especializado en avistamiento de aves, Administrador Ambiental y especialista en
            Agroecología y Desarrollo Agroecoturístico. María Umaña acompaña a quienes se están
            iniciando en el aviturismo.
          </p>
          <p className="avi-card-nota">
            Prestador inscrito en el Registro Nacional de Turismo, <b>RNT 179868</b>. Más sobre el
            equipo en <Link href="/sobre-nosotros#equipo">sobre nosotros</Link>.
          </p>
        </article>

        {/* ── Bloque en inglés ──
            Va en inglés de verdad y con lang="en": es el idioma en el que este
            visitante busca y lee, y traducirlo a medias no captura ninguna de
            las dos búsquedas. Es corto a propósito — resuelve las cinco cosas
            que un birder extranjero necesita saber antes de escribir. */}
        <article id="international" className="avi-card avi-card--ancha avi-en" lang="en">
          <div className="avi-card-cabecera">
            <span className="avi-icono" aria-hidden="true">
              <Globe size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="avi-card-titulo">For international birders</h2>
          </div>
          <div className="avi-en-grid">
            <p className="avi-card-texto">
              <b>Vuelo Carmesí</b> is a 1.2-hectare agroecological cacao farm in Cubarral, Meta, on
              the Andean foothills where the Colombian Llanos meet the Sumapaz range. The property
              sits between <b>600 and 850 m</b> and mixes shade-grown cacao, forest corridors and
              riparian habitat in the Ariari basin.
            </p>
            <p className="avi-card-texto">
              <b>180 species</b> are recorded at the farm&rsquo;s public eBird hotspot. Reliable
              year-round residents include <i>Pteroglossus castanotis</i> (Chestnut-eared Aracari),{' '}
              <i>Eurypyga helias</i> (Sunbittern), <i>Campephilus melanoleucos</i> (Crimson-crested
              Woodpecker) and <i>Cissopis leverianus</i> (Magpie Tanager). Boreal migrants such as{' '}
              <i>Piranga rubra</i> (Summer Tanager) and <i>Setophaga ruticilla</i> (American
              Redstart) are present from <b>October through April</b>.
            </p>
            <p className="avi-card-texto">
              Walks start at <b>5:30 a.m.</b> and run until breakfast at 8:00 a.m., in groups of{' '}
              <b>2 to 8</b>. Binoculars, a local bird guide, a farm breakfast and accident insurance
              are included. Terrain is uneven farm trail — bring boots and a rain layer.
            </p>
            <p className="avi-card-nota">
              To arrange a visit, write to{' '}
              <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a> or message{' '}
              <a href={CONTACTO.whatsapp} target="_blank" rel="noopener noreferrer">
                {CONTACTO.telefono}
              </a>{' '}
              on WhatsApp. Registered tourism operator, RNT 179868.
            </p>
          </div>
        </article>

        {/* ── Dónde queda ── */}
        <article id="donde" className="avi-card avi-card--ancha">
          <div className="avi-card-cabecera">
            <span className="avi-icono" aria-hidden="true">
              <MapPin size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="avi-card-titulo">Dónde queda el hotspot</h2>
          </div>
          <p className="avi-card-texto">
            {CONTACTO.direccionCompleta}. Coordenadas {MAPA.coordenadas}. Se llega por la vía a
            Cubarral y el punto de encuentro se confirma al reservar; conviene llegar 15 minutos
            antes de la hora de salida.
          </p>
          <div className="avi-acciones">
            <a className="avi-boton" href={MAPA.rutas} target="_blank" rel="noopener noreferrer">
              Cómo llegar
              <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
            </a>
            {/* Al ancla y no a la raíz de la página: el botón promete el mapa, y
                sin el #dondeestamos aterrizaba en la historia de la finca con el
                mapa a cuatro secciones de distancia. */}
            <Link className="avi-boton avi-boton--fantasma" href="/sobre-nosotros#dondeestamos">
              Ver el mapa y la ruta
            </Link>
          </div>
        </article>
      </div>

      {/* ── Cierre ── */}
      <div className="avi-cta">
        <h2 className="avi-cta-titulo">¿Armamos tu salida?</h2>
        <p className="avi-cta-texto">
          Escríbenos con las fechas y el tamaño del grupo. Si vienes por las migratorias, la ventana
          es de octubre a abril.
        </p>
        <div className="avi-acciones avi-acciones--centrada">
          <Link className="avi-boton" href="/experiencias/avistamiento-de-aves">
            Reservar la experiencia
          </Link>
          <a
            className="avi-boton avi-boton--fantasma"
            href={whatsappCon(MENSAJE_WHATSAPP.contacto)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
