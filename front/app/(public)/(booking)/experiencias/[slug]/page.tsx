import { getExperienciaBySlug, getExperiencias } from '@/lib/api/experiencias'
import Button from '@/components/ui/Button'
import PortadaExperiencia from '@/components/booking/PortadaExperiencia'
import DatosPracticos from '@/components/booking/DatosPracticos'
import ListaFicha from '@/components/booking/ListaFicha'
import { getSiteConfig } from '@/lib/api/site-config'
import { notFound, permanentRedirect } from 'next/navigation'
import { SLUGS_EXPERIENCIAS_LEGADOS, destinoLegado } from '@/lib/slugs-legados'
import { formatPrecio } from '@/lib/format'
import { metaDescription, parrafosRelato } from '@/lib/seo'
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

  return (
    <div className="ficha-exp">
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
            <h2 className="solo-lectores">La experiencia</h2>
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
          <ListaFicha titulo="Incluido en tu cupo" items={incluye} variante="incluye" />
          <ListaFicha titulo="Qué traer" items={queTraer} variante="traer" />
          <ListaFicha titulo="No incluye" items={noIncluye} variante="noIncluye" />
        </div>
      )}

      {/* El precio sale dos veces y es a propósito: la tarjeta lo presenta en
          el momento del antojo y la barra lo mantiene a mano durante el scroll.
          En escritorio la barra no se pinta —igual que en la ficha de producto—
          y ahí el que cierra es el bloque de abajo. */}
      <div className="ficha-exp-barra">
        <div className="ficha-exp-barra-contenido">
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 8px', minWidth: 0 }}>
            <span className="ficha-exp-barra-precio">{formatPrecio(exp.precio)}</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,234,202,0.8)', minWidth: 0 }}>
              por persona · {exp.duracion}
            </span>
          </div>
          <Button
            href={`/reservar/${exp.slug}`}
            style={{
              flexShrink: 0, borderRadius: '8px', padding: '14px 24px',
              fontSize: '16px', minHeight: '44px', whiteSpace: 'nowrap',
            }}
          >
            Reservar ahora
          </Button>
        </div>
      </div>

      {/* Se mete entre la barra y el pie del sitio a propósito: los dos son del
          mismo marrón y al final del scroll se tocaban, así que la barra dejaba
          de leerse como una acción y parecía el principio del footer. Con un
          bloque claro en medio, la barra aparca sobre algo que no es el pie.

          Y no es solo un separador: en escritorio la barra no existe, y sin
          esto la ficha terminaría en una lista de viñetas y nada que pulsar. */}
      <section className="ficha-exp-cierre">
        <div className="ficha-exp-cierre-caja">
          <h2 className="ficha-exp-cierre-titulo">Reserva tu cupo</h2>
          <p className="ficha-exp-cierre-precio">
            No pierdas la oportunidad de vivir una experiencia agroecológica
            inolvidable. Desde {formatPrecio(exp.precio)} por persona · {exp.duracion}
          </p>
          <Button
            href={`/reservar/${exp.slug}`}
            style={{
              borderRadius: '8px', padding: '15px 32px',
              fontSize: '17px', minHeight: '44px',
            }}
          >
            Reservar ahora
          </Button>
        </div>
      </section>
    </div>
  )
}
