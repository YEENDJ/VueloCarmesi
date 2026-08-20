import { getExperienciaBySlug, getExperiencias } from '@/lib/api/experiencias'
import Button from '@/components/ui/Button'
import HeroExperiencia from '@/components/booking/HeroExperiencia'
import DatosPracticos from '@/components/booking/DatosPracticos'
import ListaFicha from '@/components/booking/ListaFicha'
import { getSiteConfig } from '@/lib/api/site-config'
import { notFound, permanentRedirect } from 'next/navigation'
import { SLUGS_EXPERIENCIAS_LEGADOS, destinoLegado } from '@/lib/slugs-legados'
import { formatPrecio } from '@/lib/format'
import { metaDescription, partirRelato } from '@/lib/seo'
import type { Metadata } from 'next'

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
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const exp = await getExperienciaBySlug(slug).catch(() => null)
  if (!exp) return {}

  const descripcion = metaDescription(exp.descripcion, exp.descripcionLarga)
  const portada = exp.imagenes?.[0] ?? exp.imagen

  return {
    title: `${exp.nombre} · Vuelo Carmesí`,
    description: descripcion,
    openGraph: {
      title: exp.nombre,
      description: descripcion,
      type: 'website',
      ...(portada ? { images: [portada] } : {}),
    },
  }
}

export async function generateStaticParams() {
  try {
    const experiencias = await getExperiencias()
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
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const exp = await getExperienciaBySlug(slug)
  if (!exp) {
    const destino = destinoLegado(SLUGS_EXPERIENCIAS_LEGADOS, slug)
    if (destino) permanentRedirect(`/experiencias/${destino}`)
    notFound()
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
  const config = await getSiteConfig()
  const puntoEncuentro = exp.puntoEncuentro?.trim() || config.punto_encuentro || ''

  // El primer párrafo abre el relato en grande; el resto va en cuerpo normal.
  // Se parte por párrafo y no por el primer punto: cortar por punto se rompía
  // con "Cra. 5" o "$1.500", y un texto sin puntos terminaba entero en display.
  const { entradilla, resto } = partirRelato(descripcion)

  return (
    <>
      <HeroExperiencia
        nombre={exp.nombre}
        imagenes={imagenes}
        duracion={exp.duracion}
        capacidad={exp.capacidad}
        precio={exp.precio}
        slug={exp.slug}
        avisoCancelacion={config.resumen_cancelacion || ''}
      />

      <section className="ficha-exp-relato">
        <div className="ficha-exp-relato-grid">
          <h2 className="ficha-eyebrow" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-body)', minWidth: 0 }}>
            La experiencia
          </h2>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 3vw, 26px)' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(20px, 4vw, 30px)',
                fontWeight: 500,
                fontStyle: 'italic',
                lineHeight: 1.45,
                color: 'var(--color-cream)',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                minWidth: 0,
              }}
            >
              {entradilla}
            </p>
            {resto && (
              <p
                style={{
                  fontSize: 'clamp(0.95rem, 2.5vw, 1.09rem)',
                  lineHeight: 1.85,
                  color: 'rgba(255,234,202,0.78)',
                  maxWidth: '62ch',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                  minWidth: 0,
                }}
              >
                {resto}
              </p>
            )}
          </div>
        </div>
      </section>

      <DatosPracticos
        horarios={exp.horarios}
        puntoEncuentro={puntoEncuentro}
        recomendaciones={exp.recomendaciones}
      />

      {/* Los tres bloques comparten forma y solo aparecen los que tienen datos.
          Si únicamente hay "Incluye", ocupa la sección entera y se ve
          deliberado, no incompleto. */}
      {(incluye.length > 0 || queTraer.length > 0 || noIncluye.length > 0) && (
        <div className="ficha-exp-claro">
          <div style={{
            maxWidth: 'var(--contenido-ancho)', margin: '0 auto', minWidth: 0,
            display: 'flex', flexDirection: 'column', gap: 'clamp(36px, 6vw, 56px)',
          }}>
            <ListaFicha titulo="Incluido en tu cupo" items={incluye} variante="incluye" />
            <ListaFicha titulo="Qué traer" items={queTraer} variante="traer" />
            <ListaFicha titulo="No incluye" items={noIncluye} variante="noIncluye" />
          </div>
        </div>
      )}

      <div className="ficha-exp-barra">
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px 14px', minWidth: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 4vw, 30px)',
              fontWeight: 700,
              color: 'var(--color-gold)',
              minWidth: 0,
              overflowWrap: 'anywhere',
            }}
          >
            {formatPrecio(exp.precio)}
          </span>
          <span style={{ fontSize: 'clamp(0.8rem, 2.2vw, 0.875rem)', color: 'rgba(255,234,202,0.7)', minWidth: 0 }}>
            por persona · {exp.duracion}
          </span>
        </div>
        <Button href={`/reservar/${exp.slug}`} style={{ flexShrink: 0 }}>
          Reservar ahora
        </Button>
      </div>
    </>
  )
}
