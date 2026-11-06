import { getExperienciaBySlug, getExperiencias } from '@/lib/api/experiencias'
import Button from '@/components/ui/Button'
import GaleriaExperiencia from '@/components/booking/GaleriaExperiencia'
import TarjetaReserva from '@/components/booking/TarjetaReserva'
import ProgramaExperiencia from '@/components/booking/ProgramaExperiencia'
import DatosPracticos from '@/components/booking/DatosPracticos'
import ListaFicha from '@/components/booking/ListaFicha'
import BarraReserva from '@/components/booking/BarraReserva'
import AvisoAviturismo, { tieneAvistamiento } from '@/components/booking/AvisoAviturismo'
import { getSiteConfig } from '@/lib/api/site-config'
import { separarPrograma } from '@/lib/programa'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import PublicarSlugs from '@/components/layout/PublicarSlugs'
import MigaSuperior from '@/components/layout/MigaSuperior'
import { permanentRedirect as permanentRedirectIdioma, getPathname } from '@/lib/i18n/navigation'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import { SLUGS_EXPERIENCIAS_LEGADOS, destinoLegado } from '@/lib/slugs-legados'
import { formatPrecio } from '@/lib/format'
import { metaDescription, parrafosRelato } from '@/lib/seo'
import { nodoExperiencia } from '@/lib/jsonld'
import { SITIO } from '@/lib/sitio'
import { portadaOg, tarjetaOg } from '@/lib/og'
import type { Metadata } from 'next'
import { jsonLdHtml } from '@/lib/json-ld-html'
import AvisoEscnna from '@/components/legal/AvisoEscnna'

// El segmento caduca siempre, haya respondido el backend o no. Sin esto Next
// deriva el revalidate solo de los fetch que completaron: un detalle renderizado
// durante una caída se guardaba como 404 permanente e ni revalidateTag lo tocaba.
export const revalidate = 60
export const dynamicParams = true

/** Más largo que esto, la apertura se lee mejor en cuerpo que en letra grande. */
const MAX_ENTRADILLA = 240

/**
 * Hasta ahora ninguna ruta definía metadata propia, así que las cinco fichas
 * compartían el título y la descripción del layout: en Google se veían iguales
 * y competían entre sí. Cada una pasa a tener los suyos, con la foto de portada
 * como imagen para cuando el enlace se comparte por WhatsApp.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; locale: string }> },
): Promise<Metadata> {
  const { slug, locale } = await params
  const exp = await getExperienciaBySlug(slug, locale).catch(() => null)
  if (!exp) return {}

  const descripcion = metaDescription(exp.descripcion, exp.descripcionLarga)
  const portada = exp.imagenes?.[0] ?? exp.imagen
  const [ts, tr] = await Promise.all([
    getTranslations({ locale, namespace: 'sitio' }),
    getTranslations({ locale, namespace: 'reserva' }),
  ])
  // Solo el título del buscador lleva el lugar: todas las salidas son en
  // Cubarral y el nombre solo («Birdwatching») compite con búsquedas genéricas.
  // El H1, la miga y las tarjetas siguen mostrando el nombre tal cual.
  const titulo = tr('tituloFicha', { nombre: exp.nombre })

  return {
    // Sin la marca: el layout de idioma ya la añade con title.template
    // («%s · Vuelo Carmesí»). Escribirla también aquí la duplicaba —«CACAO
    // EXPERIENCE · Vuelo Carmesí · Vuelo Carmesí»— y los nombres de las
    // experiencias vienen en mayúsculas del panel, así que el título ya era
    // largo antes de repetirla.
    title: titulo,
    description: descripcion,
    // El slug de cada idioma sale de exp.slugs, que trae el backend: sin él,
    // el alternativo inglés apuntaría al slug español y sería una URL que
    // redirige, no la canónica.
    alternates: alternatesDeIdioma(
      // El slug de CADA idioma sale de exp.slugs, que trae el backend.
      idioma => ({
        pathname: '/experiencias/[slug]',
        params: { slug: exp.slugs?.[idioma] ?? exp.slug },
      }),
      locale,
    ),
    openGraph: {
      title: titulo,
      description: descripcion,
      type: 'website',
      // Este `openGraph` reemplaza entero el del layout: el nombre del sitio,
      // el idioma y la imagen de respaldo hay que repetirlos aquí.
      locale: locale === 'en' ? 'en_US' : 'es_CO',
      siteName: ts('titulo'),
      images: [portada ? portadaOg(portada, exp.nombre) : tarjetaOg(locale, ts('ogAlt'))],
    },
  }
}

/** Ver la ficha de producto: los slugs cambian con el idioma. */
export async function generateStaticParams({
  params,
}: {
  params: { locale: string }
}) {
  try {
    const experiencias = await getExperiencias(params.locale)
    return experiencias.map(e => ({ slug: e.slug }))
  } catch {
    // Prerenderizar es solo una optimización: si la API no está disponible en el
    // build, cada detalle se genera bajo demanda en vez de romper el despliegue.
    return []
  }
}

export default async function ExperienciaDetallePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations('nav')

  const exp = await getExperienciaBySlug(slug, locale)
  if (!exp) {
    // Respaldo: los slugs viejos ya los resuelve el backend con su historial
    // (llegan aquí como una ficha con otro slug y caen en el 308 de abajo).
    // La lista fija solo cubre la ventana en que el backend aún no lo tenga.
    const destino = destinoLegado(SLUGS_EXPERIENCIAS_LEGADOS, slug)
    if (destino) permanentRedirect(`/experiencias/${destino}`)
    notFound()
  }

  // Cada ficha vive en una sola URL por idioma.
  //
  // Esto también cubre las URLs viejas, las de cuando renombrar cambiaba el
  // slug: el backend encuentra la ficha por su historial y la devuelve con el
  // slug de hoy, que no coincide con el de la URL. Así la dirección anterior
  // hace 308 a la vigente —en español y en inglés— y no pierde lo que ya
  // posicionaba.
  //
  // El backend resuelve el slug en cualquiera de los dos —hace falta, para que
  // un enlace compartido antes de existir el inglés siga funcionando—, pero eso
  // deja la misma ficha accesible en /en/experiences/experiencia-cacaotera y en
  // /en/experiences/cacao-experience. Dos URLs con el mismo contenido reparten
  // el posicionamiento entre ambas en vez de sumarlo, así que la no canónica
  // manda a la buena con un redirect permanente (308), no temporal: un 307
  // le dice al buscador «vuelve a probar aquí mañana» y no consolida nada.
  if (exp.slug && exp.slug !== slug) {
    permanentRedirectIdioma({
      href: { pathname: '/experiencias/[slug]', params: { slug: exp.slug } },
      locale,
    })
  }

  const imagenes = exp.imagenes?.length
    ? exp.imagenes
    : exp.imagen ? [exp.imagen] : []
  const descripcion = exp.descripcionLarga?.trim() || exp.descripcion
  const queTraer = exp.queTraer ?? []
  const noIncluye = exp.noIncluye ?? []

  // El punto de encuentro casi siempre es el mismo, así que vive en la
  // configuración del sitio y se escribe una vez. La experiencia solo lo trae
  // cuando sale de otro lado, y entonces manda el suyo.
  const [config, t] = await Promise.all([getSiteConfig(locale), getTranslations('reserva')])
  const puntoEncuentro = exp.puntoEncuentro?.trim() || config.punto_encuentro || ''

  // La descripción corta solo hace de bajada cuando hay relato largo. Sin él
  // el relato ES la descripción corta, y la misma frase saldría dos veces
  // seguidas: bajo el título y otra vez como entradilla en cursiva.
  const bajada = exp.descripcionLarga?.trim() ? exp.descripcion.trim() : ''

  // El programa paso a paso sale del mismo campo que el relato. Si el texto no
  // sigue el formato, `pasos` llega vacío y todo se pinta como relato corrido.
  const { apertura, pasos, despues } = separarPrograma(parrafosRelato(descripcion))
  const [entradilla, ...cuerpo] = apertura

  // Ver la ficha de producto: el identificador sale de la canónica del idioma,
  // no de la URL por la que se entró. La oferta apunta a /reservar, que es
  // donde se cierra: una oferta cuyo enlace lleva otra vez a la ficha manda al
  // visitante al sitio en el que ya está.
  const ruta = (href: Parameters<typeof getPathname>[0]['href']) =>
    `${SITIO}${getPathname({ href, locale })}`
  const datosExperiencia = nodoExperiencia({
    experiencia: exp,
    url: ruta({ pathname: '/experiencias/[slug]', params: { slug: exp.slug } }),
    urlReserva: ruta({ pathname: '/reservar/[slug]', params: { slug: exp.slug } }),
    descripcion: metaDescription(exp.descripcion, exp.descripcionLarga),
    imagenes,
  })

  return (
    <div className="ficha-exp">
      {/* La salida, su precio y quién la opera, en la forma que lee un
          buscador. Va como TouristTrip y no como Event: no hay fechas fijas
          —ver lib/jsonld.ts—. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(datosExperiencia) }}
      />
      {/* No pinta nada: le da al selector de idioma el slug de esta ficha en
          cada lengua, para que cambiar de idioma no pierda la ficha. */}
      <PublicarSlugs slugs={exp.slugs} />
      {/* En marco propio: sin contenedor la miga se pegaría al borde de la
          pantalla. */}
      <div className="miga-marco">
        <MigaSuperior href="/experiencias" etiqueta={tNav('experiencias')} actual={exp.nombre} />
      </div>

      {/* En escritorio, la lectura a la izquierda y la reserva fija a la derecha.
          En móvil se apila, con la foto primero (ver globals.css). */}
      <div className="ficha-exp-layout">
        <header className="ficha-exp-cabecera">
          <h1 className="ficha-exp-titulo">{exp.nombre}</h1>
          {bajada && <p className="ficha-exp-bajada">{bajada}</p>}
        </header>

        <GaleriaExperiencia nombre={exp.nombre} imagenes={imagenes} />

        <div className="ficha-exp-lateral">
          <TarjetaReserva
            nombre={exp.nombre}
            duracion={exp.duracion}
            capacidad={exp.capacidad}
            precio={exp.precio}
            slug={exp.slug}
            incluye={exp.incluye ?? []}
            avisoCancelacion={config.resumen_cancelacion || ''}
            whatsapp={config.whatsapp || ''}
          />
        </div>

        <div className="ficha-exp-contenido">
          {entradilla && (
            <section>
              {/* El rótulo no se pinta: la apertura va justo debajo de la galería
                  y se explica sola. Sigue en el documento para lectores de
                  pantalla y para el esquema que lee Google. */}
              <h2 className="solo-lectores">{t('laExperiencia')}</h2>
              <p className={entradilla.length > MAX_ENTRADILLA ? 'ficha-exp-parrafo' : 'ficha-exp-entradilla'}>
                {entradilla}
              </p>
              {cuerpo.map((parrafo, i) => (
                <p key={i} className="ficha-exp-parrafo">{parrafo}</p>
              ))}
            </section>
          )}

          <DatosPracticos
            horarios={exp.horarios}
            puntoEncuentro={puntoEncuentro}
            recomendaciones={exp.recomendaciones}
          />

          <ProgramaExperiencia pasos={pasos} />

          {despues.map((parrafo, i) => (
            <p key={i} className="ficha-exp-parrafo">{parrafo}</p>
          ))}

          {(queTraer.length > 0 || noIncluye.length > 0) && (
            <div className="ficha-exp-listas">
              <ListaFicha titulo={t('queTraer')} items={queTraer} variante="traer" />
              <ListaFicha titulo={t('noIncluye')} items={noIncluye} variante="noIncluye" />
            </div>
          )}
        </div>
      </div>

      {/* Sólo en las dos fichas que llevan avistamiento, y aquí abajo a
          propósito: el visitante ya leyó el relato, los horarios y lo que
          incluye, y si a estas alturas sigue dudando es por lo que la ficha no
          cuenta —qué especies hay, cuándo pasan las migratorias, quién guía—.
          Eso vive en /aviturismo. Más arriba habría interrumpido la lectura de
          la ficha, que es la que cierra la reserva. */}
      {tieneAvistamiento(exp.slug) && <AvisoAviturismo variante="ficha" />}

      {/* Cierra la ficha con algo que pulsar. En escritorio es el único botón
          del final; en móvil es además donde la barra fija se retira, así que
          nunca se ven los dos a la vez (lleva `data-cta-reserva` por eso). */}
      <section className="ficha-exp-cierre" data-cta-reserva>
        <div className="ficha-exp-cierre-caja">
          <h2 className="ficha-exp-cierre-titulo">{t('reservaTuCupo')}</h2>
          <p className="ficha-exp-cierre-precio">
            {t('cierreTexto', {
              precio: formatPrecio(exp.precio, locale),
              duracion: exp.duracion,
            })}
          </p>
          <Button
            href={{ pathname: '/reservar/[slug]', params: { slug: exp.slug } }}
            style={{
              borderRadius: '8px', padding: '15px 32px',
              fontSize: '17px', minHeight: '44px',
            }}
          >
            {t('reservarAhora')}
          </Button>
        </div>
      </section>

      {/* Tras el cierre de la ficha, que es donde se ofrece el servicio. */}
      <div className="contenido" style={{ paddingBottom: '32px' }}>
        <AvisoEscnna />
      </div>

      {/* El equivalente móvil de la tarjeta fija: mantiene el precio a mano
          durante el scroll. En escritorio no se pinta. */}
      <BarraReserva precio={exp.precio} duracion={exp.duracion} slug={exp.slug} />
    </div>
  )
}
