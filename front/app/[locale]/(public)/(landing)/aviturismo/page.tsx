import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import { SITIO } from '@/lib/sitio'
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'aviturismo.meta' })

  return {
    metadataBase: new URL(SITIO),
    // hreflang recíproco: /aviturismo y /en/birding son la misma página.
    alternates: alternatesDeIdioma('/aviturismo', locale),
    // Sin la marca: el layout ya la añade con title.template («%s · Vuelo
    // Carmesí»). Escribirla también aquí la duplicaba —«… | Vuelo Carmesí ·
    // Vuelo Carmesí»— y empujaba el título a 90 caracteres, que la SERP trunca.
    title: t('titulo'),
    description: t('descripcion'),
    // Las claves NO se traducen a la ligera: media lista ya está en inglés a
    // propósito, porque son los términos con los que busca un birder
    // extranjero y los buscaba igual cuando la página solo existía en español.
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
      title: t('titulo'),
      description: t('descripcion'),
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_CO',
      siteName: 'Vuelo Carmesí',
      // Se resuelve contra metadataBase, así que sale absoluta: WhatsApp y
      // Facebook no descargan una og:image relativa y la tarjeta saldría vacía.
      images: [
        {
          url: '/images/aves/aracari.jpg',
          width: 1152,
          height: 864,
          alt: t('ogAlt'),
        },
      ],
    },
  }
}

/** Los cuatro datos que un birder mira antes de leer nada más. */
const RESUMEN: { Icono: LucideIcon; clave: string }[] = [
  { Icono: ListChecks, clave: 'especies' },
  { Icono: Mountain, clave: 'altura' },
  { Icono: Sunrise, clave: 'franja' },
  { Icono: CalendarRange, clave: 'ventana' },
]

type Especie = {
  /** El nombre por el que se busca en cualquier idioma. */
  cientifico: string
  /** El que escribe en Google el birder internacional. Es la razón de la página. */
  ingles: string
  local: string
  foto: string
  altKey: string
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
    altKey: 'aracari',
    foco: 'center 45%',
  },
  {
    cientifico: 'Campephilus melanoleucos',
    ingles: 'Crimson-crested Woodpecker',
    local: 'Carpintero real',
    foto: '/images/aves/carpintero.jpg',
    altKey: 'carpintero',
    foco: 'center 33%',
  },
  {
    cientifico: 'Glaucidium brasilianum',
    ingles: 'Ferruginous Pygmy-Owl',
    local: 'Currucutú común',
    foto: '/images/aves/currucutu.jpg',
    altKey: 'currucutu',
    foco: 'center 34%',
  },
  {
    cientifico: 'Eurypyga helias',
    ingles: 'Sunbittern',
    local: 'Tigana',
    foto: '/images/aves/tigana.jpg',
    altKey: 'tigana',
    foco: 'center 40%',
  },
  {
    cientifico: 'Cyanocorax violaceus',
    ingles: 'Violaceous Jay',
    local: 'Carriquí violáceo',
    foto: '/images/aves/carriqui.jpg',
    altKey: 'carriqui',
    foco: 'center 88%',
  },
  {
    cientifico: 'Thraupis palmarum',
    ingles: 'Palm Tanager',
    local: 'Azulejo palmero',
    foto: '/images/aves/azulejo-palmero.jpg',
    altKey: 'azulejo',
    foco: 'center 88%',
  },
  {
    cientifico: 'Cissopis leverianus',
    ingles: 'Magpie Tanager',
    local: 'Tangara urraca',
    foto: '/images/aves/tangara-urraca.jpg',
    altKey: 'tangara',
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
const VENTANAS: { clave: string; tono: string }[] = [
  { clave: 'alta', tono: 'alto' },
  { clave: 'baja', tono: 'medio' },
  { clave: 'franja', tono: 'alto' },
]

/** Itinerario de la hoja 11 del portafolio, en orden cronológico. */
const RECORRIDO = ['salida', 'amanecer', 'manana', 'desayuno'] as const

const INCLUYE = ['binoculares', 'guia', 'desayuno', 'acompanamiento', 'poliza'] as const

/** Rótulos del índice. El título largo no cabe en un chip. */
const APARTADOS = [
  'especies', 'migratorias', 'cuando', 'recorrido', 'guia', 'international', 'donde',
] as const

/**
 * Datos estructurados. La geolocalización es lo que hace que la página pueda
 * salir en una búsqueda de aviturismo «cerca de» y no solo por nombre, y el
 * `sameAs` al hotspot es lo que le dice al buscador que esto que afirmamos lo
 * respalda un tercero.
 */
const jsonLd = (t: (k: string) => string, locale: string) => ({
  '@context': 'https://schema.org',
  '@type': 'TouristAttraction',
  '@id': `${SITIO}${locale === 'en' ? '/en/birding' : '/aviturismo'}`,
  url: `${SITIO}${locale === 'en' ? '/en/birding' : '/aviturismo'}`,
  name: t('jsonld.nombre'),
  alternateName: 'Birdwatching at Vuelo Carmesí',
  description: t('meta.descripcion'),
  touristType: ['Birdwatchers', 'Aviturismo', 'Ecotourism'],
  isAccessibleForFree: false,
  address: {
    '@type': 'PostalAddress',
    streetAddress: CONTACTO.direccion,
    addressLocality: CONTACTO.localidad,
    addressRegion: CONTACTO.region,
    addressCountry: CONTACTO.pais,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: MAPA.latitud,
    longitude: MAPA.longitud,
    // La altitud sí se queda escrita aquí: es la franja del hotspot, un dato de
    // esta página y no de la sede, y no tiene sitio en lib/contacto.
    elevation: '600-850 m',
  },
  telephone: CONTACTO.telefonoE164,
  email: CONTACTO.email,
  sameAs: [EBIRD_URL],
})

export default async function AviturismoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('aviturismo')

  // Etiquetas para el texto con marcado dentro. next-intl pide que el
  // componente diga cómo se pinta cada etiqueta; así el traductor mueve el
  // <b> dentro de la frase sin tocar el JSX.
  const negrita = (trozos: React.ReactNode) => <b>{trozos}</b>
  return (
    <section className="page-shell avi">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(t, locale)) }}
      />

      <p className="avi-kicker">
        <Feather size={15} strokeWidth={1.9} aria-hidden="true" style={{ flexShrink: 0 }} />
        {t('kicker')}
      </p>
      {/* El h1 carga el municipio y la cifra a propósito. «Aviturismo entre
          cacao en sombrío» se leía mejor, pero nadie escribe eso en un buscador:
          se busca por dónde queda y por cuántas especies hay. */}
      <h1 className="avi-titulo">{t('h1')}</h1>
      <p className="avi-lead">{t.rich('lead', { b: negrita })}</p>

      <div className="avi-resumen">
        {RESUMEN.map(({ Icono, clave }) => (
          <div key={clave} className="avi-resumen-dato">
            <span className="avi-icono" aria-hidden="true">
              <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <p style={{ minWidth: 0 }}>
              <strong className="avi-cifra">{t(`resumen.cifra${clave[0].toUpperCase()}${clave.slice(1)}`)}</strong>{' '}
              {t(`resumen.${clave}`)}
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
          <p>{t.rich('ebirdTexto', { b: negrita })}</p>
          <a
            className="avi-ebird-enlace"
            href={EBIRD_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('ebirdEnlace')}
            <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
          </a>
        </div>
      </div>

      <nav className="avi-indice" aria-label={t('indiceAria')}>
        {APARTADOS.filter(id => id !== 'international' || locale === 'es').map(id => (
          <a key={id} href={`#${id}`} className="avi-chip">
            {t(`apartados.${id}`)}
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
            <h2 className="avi-card-titulo">{t('residentes.titulo')}</h2>
          </div>
          <p className="avi-card-texto">
            {t('residentes.texto')}
          </p>

          <ul className="avi-especies">
            {RESIDENTES.map(({ cientifico, ingles, local, foto, altKey, foco }) => (
              <li key={cientifico} className="avi-especie">
                <div className="avi-especie-foto">
                  <Image
                    src={foto}
                    alt={t(`alts.${altKey}`)}
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
            <h2 className="avi-card-titulo">{t('migratoriasCard.titulo')}</h2>
          </div>
          <p className="avi-card-texto">
            {t('migratoriasCard.texto')}
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
            <h2 className="avi-card-titulo">{t('cuando.titulo')}</h2>
          </div>
          <ul className="avi-ventana">
            {VENTANAS.map(({ clave, tono }) => (
              <li key={clave} className={`avi-ventana-fila avi-ventana-fila--${tono}`}>
                <div className="avi-ventana-cabeza">
                  <span className="avi-ventana-cuando">{t(`cuando.${clave}.cuando`)}</span>
                  <span className="avi-ventana-que">{t(`cuando.${clave}.que`)}</span>
                </div>
                <p className="avi-ventana-nota">{t(`cuando.${clave}.nota`)}</p>
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
            <h2 className="avi-card-titulo">{t('recorrido.titulo')}</h2>
          </div>
          <ol className="avi-timeline">
            {RECORRIDO.map(clave => (
              <li key={clave} className="avi-paso">
                <span className="avi-paso-hora">{t(`recorrido.${clave}.hora`)}</span>
                <span className="avi-paso-texto">{t(`recorrido.${clave}.que`)}</span>
              </li>
            ))}
          </ol>
          <p className="avi-subtitulo">{t('recorrido.incluyeRotulo')}</p>
          <ul className="avi-incluye">
            {INCLUYE.map(clave => (
              <li key={clave}>
                <Check size={16} strokeWidth={2.4} aria-hidden="true" />
                <span style={{ minWidth: 0 }}>{t(`recorrido.incluye.${clave}`)}</span>
              </li>
            ))}
          </ul>
          <p className="avi-card-nota">
            {t.rich('recorrido.nota', {
              ficha: trozos => (
                <Link
                  // Se enlaza con el slug español y la ficha redirige (308) al
                  // inglés. Meter el slug inglés a mano lo rompería el día que
                  // alguien renombre la experiencia en el panel.
                  href={{ pathname: '/experiencias/[slug]', params: { slug: 'avistamiento-de-aves' } }}
                >
                  {trozos}
                </Link>
              ),
            })}
          </p>
        </article>

        {/* ── El guía ── */}
        <article id="guia" className="avi-card">
          <div className="avi-card-cabecera">
            <span className="avi-icono" aria-hidden="true">
              <Users size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="avi-card-titulo">{t('guia.titulo')}</h2>
          </div>
          <div className="avi-guia">
            <div className="avi-guia-foto">
              <Image
                src="/images/personas/cristian-enciso.jpg"
                alt={t('guia.fotoAlt')}
                fill
                sizes="72px"
                style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="avi-guia-nombre">{t('guia.nombre')}</p>
              <p className="avi-guia-cargo">
                {t('guia.cargo')}
              </p>
            </div>
          </div>
          <p className="avi-card-texto">
            {t('guia.texto')}
          </p>
          <p className="avi-card-nota">
            {t.rich('guia.nota', {
              b: negrita,
              equipo: trozos => <Link href={{ pathname: '/sobre-nosotros', hash: 'equipo' }}>{trozos}</Link>,
            })}
          </p>
        </article>

        {/* ── Bloque en inglés ──
            Va en inglés de verdad y con lang="en": es el idioma en el que este
            visitante busca y lee, y traducirlo a medias no captura ninguna de
            las dos búsquedas. Es corto a propósito — resuelve las cinco cosas
            que un birder extranjero necesita saber antes de escribir. */}
        {/* Este resumen en inglés existía porque la página solo estaba en
            español: era la única forma de que un birder extranjero entendiera
            lo básico. Ahora que /en/birding es la página entera traducida,
            dentro del inglés sería el mismo contenido dos veces, así que solo
            se pinta en español. */}
        {locale === 'es' && (
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
        )}

        {/* ── Dónde queda ── */}
        <article id="donde" className="avi-card avi-card--ancha">
          <div className="avi-card-cabecera">
            <span className="avi-icono" aria-hidden="true">
              <MapPin size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="avi-card-titulo">{t('donde.titulo')}</h2>
          </div>
          <p className="avi-card-texto">
            {t('donde.texto', {
              direccion: CONTACTO.direccionCompleta,
              coordenadas: MAPA.coordenadas,
            })}
          </p>
          <div className="avi-acciones">
            <a className="avi-boton" href={MAPA.rutas} target="_blank" rel="noopener noreferrer">
              {t('donde.comoLlegar')}
              <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
            </a>
            {/* Al ancla y no a la raíz de la página: el botón promete el mapa, y
                sin el #dondeestamos aterrizaba en la historia de la finca con el
                mapa a cuatro secciones de distancia. */}
            <Link className="avi-boton avi-boton--fantasma" href={{ pathname: '/sobre-nosotros', hash: 'dondeestamos' }}>
              {t('donde.verMapa')}
            </Link>
          </div>
        </article>
      </div>

      {/* ── Cierre ── */}
      <div className="avi-cta">
        <h2 className="avi-cta-titulo">{t('cta.titulo')}</h2>
        <p className="avi-cta-texto">
          {t('cta.texto')}
        </p>
        <div className="avi-acciones avi-acciones--centrada">
          <Link
            className="avi-boton"
            href={{ pathname: '/experiencias/[slug]', params: { slug: 'avistamiento-de-aves' } }}
          >
            {t('cta.reservar')}
          </Link>
          <a
            className="avi-boton avi-boton--fantasma"
            href={whatsappCon(MENSAJE_WHATSAPP.contacto)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('cta.whatsapp')}
          </a>
        </div>
      </div>
    </section>
  )
}
