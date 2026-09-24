import { getExperienciaBySlug, getExperiencias } from '@/lib/api/experiencias'
import Button from '@/components/ui/Button'
import PortadaExperiencia from '@/components/booking/PortadaExperiencia'
import DatosPracticos from '@/components/booking/DatosPracticos'
import ListaFicha from '@/components/booking/ListaFicha'
import BarraReserva from '@/components/booking/BarraReserva'
import AvisoAviturismo, { tieneAvistamiento } from '@/components/booking/AvisoAviturismo'
import { getSiteConfig } from '@/lib/api/site-config'
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
import type { Metadata } from 'next'
import { jsonLdHtml } from '@/lib/json-ld-html'
import AvisoEscnna from '@/components/legal/AvisoEscnna'

// El segmento caduca siempre, haya respondido el backend o no. Sin esto Next
// deriva el revalidate solo de los fetch que completaron: un detalle renderizado
// durante una caída se guardaba como 404 permanente e ni revalidateTag lo tocaba.
export const revalidate = 60
export const dynamicParams = true

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

  return {
    // Sin la marca: el layout de idioma ya la añade con title.template
    // («%s · Vuelo Carmesí»). Escribirla también aquí la duplicaba —«CACAO
    // EXPERIENCE · Vuelo Carmesí · Vuelo Carmesí»— y los nombres de las
    // experiencias vienen en mayúsculas del panel, así que el título ya era
    // largo antes de repetirla.
    title: exp.nombre,
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
      title: exp.nombre,
      description: descripcion,
      type: 'website',
      ...(portada ? { images: [portada] } : {}),
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
    const destino = destinoLegado(SLUGS_EXPERIENCIAS_LEGADOS, slug)
    if (destino) permanentRedirect(`/experiencias/${destino}`)
    notFound()
  }

  // Cada ficha vive en una sola URL por idioma.
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
  const incluye = exp.incluye ?? []
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

  // El primer párrafo abre el relato en cursiva grande y el resto va en cuerpo.
  // Un relato de un solo párrafo se muestra entero arriba y no lleva cuerpo
  // debajo: ese caso también tiene que verse terminado.
  const [entradilla, ...cuerpo] = parrafosRelato(descripcion)

  // El cuerpo se reparte en dos bloques, no en dos columnas de texto: con
  // columnas CSS el ojo tiene que subir al principio de la segunda columna al
  // acabar la primera, y en un relato corto ese salto se nota. Dos tarjetas se
  // leen una detrás de otra. Con un solo párrafo queda una sola tarjeta, que
  // ocupa el ancho entero y se ve igual de deliberada.
  const corte = Math.ceil(cuerpo.length / 2)
  const bloques = cuerpo.length > 0 ? [cuerpo.slice(0, corte), cuerpo.slice(corte)] : []

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
      {/* En marco propio: la portada va a sangre y sin contenedor la miga se
          pegaría al borde de la pantalla. */}
      <div className="miga-marco">
        <MigaSuperior href="/experiencias" etiqueta={tNav('experiencias')} actual={exp.nombre} />
      </div>
      <PortadaExperiencia
        nombre={exp.nombre}
        imagenes={imagenes}
        duracion={exp.duracion}
        capacidad={exp.capacidad}
        precio={exp.precio}
        slug={exp.slug}
        bajada={bajada}
        incluye={incluye}
        avisoCancelacion={config.resumen_cancelacion || ''}
        whatsapp={config.whatsapp || ''}
      />

      {entradilla && (
        <section className="ficha-exp-relato">
          <div className="ficha-exp-relato-grid">
            {/* El rótulo no se pinta: colgado a la izquierda dejaba media
                pantalla de banda vacía. Sigue en el documento porque sin él
                la sección se queda sin nombre para lectores de pantalla y sin
                encabezado en el esquema que lee Google. */}
            <h2 className="solo-lectores">{t('laExperiencia')}</h2>
            <div className="ficha-exp-relato-texto">
              <p className="ficha-exp-entradilla">{entradilla}</p>
              {/* El cuerpo va en dos columnas para que ocupar el ancho de la
                  página no signifique líneas de 130 caracteres. La entradilla
                  queda fuera: es la apertura y va a una sola medida. */}
              {bloques.length > 0 && (
                <div className="ficha-exp-cuerpo">
                  {bloques.filter(b => b.length > 0).map((bloque, i) => (
                    <div key={i} className="ficha-exp-bloque">
                      {bloque.map((parrafo, j) => (
                        <p key={j} className="ficha-exp-parrafo">{parrafo}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Cierra el relato y abre los datos. Sin él, el texto y la primera
          tarjeta de "Antes de reservar" se tocan sin que nada diga que ahí
          cambia lo que se está leyendo. */}
      {entradilla && <hr className="ficha-exp-separador" />}

      <DatosPracticos
        horarios={exp.horarios}
        puntoEncuentro={puntoEncuentro}
        recomendaciones={exp.recomendaciones}
      />

      {/* Los tres bloques comparten forma y solo aparecen los que tienen datos.
          Si únicamente hay "Incluye", ocupa la sección entera y se ve
          deliberado, no incompleto. */}
      {(incluye.length > 0 || queTraer.length > 0 || noIncluye.length > 0) && (
        <div className="ficha-exp-listas">
          <ListaFicha titulo={t('incluidoEnTuCupo')} items={incluye} variante="incluye" />
          <ListaFicha titulo={t('queTraer')} items={queTraer} variante="traer" />
          <ListaFicha titulo={t('noIncluye')} items={noIncluye} variante="noIncluye" />
        </div>
      )}

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

      {/* El precio sale dos veces y es a propósito: la tarjeta lo presenta en
          el momento del antojo y la barra lo mantiene a mano durante el scroll.
          En escritorio la barra no se pinta —igual que en la ficha de producto—. */}
      <BarraReserva precio={exp.precio} duracion={exp.duracion} slug={exp.slug} />
    </div>
  )
}
