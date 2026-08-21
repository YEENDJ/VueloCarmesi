import { Clock, MapPin, TriangleAlert } from 'lucide-react'

interface Props {
  horarios?: string
  puntoEncuentro?: string
  recomendaciones?: string
}

/**
 * Las respuestas a "¿cuándo?", "¿dónde llego?" y "¿esto es para mí?" — las tres
 * dudas que aparecen justo antes de reservar.
 *
 * Cada dato es una tarjeta con el icono en un disco de color. Antes eran tres
 * columnas colgadas de un filete ámbar: sobre el crema de la ficha se leían
 * como texto suelto, y lo que se busca aquí es justo lo contrario — que las
 * tres respuestas se localicen de un vistazo sin tener que leerlas.
 *
 * Los tres campos son opcionales y el bloque entero desaparece si no hay
 * ninguno: la ficha tiene que verse intencional sin ellos, no a medio llenar.
 * Con uno o dos, la rejilla los reparte y sigue viéndose deliberada.
 */
export default function DatosPracticos({ horarios, puntoEncuentro, recomendaciones }: Props) {
  const datos = [
    { Icono: Clock, titulo: 'Cuándo', texto: horarios?.trim() },
    { Icono: MapPin, titulo: 'Punto de encuentro', texto: puntoEncuentro?.trim() },
    { Icono: TriangleAlert, titulo: 'Ten en cuenta', texto: recomendaciones?.trim() },
  ].filter(d => d.texto)

  if (datos.length === 0) return null

  return (
    <section className="ficha-exp-practicos">
      {/* El rótulo va centrado entre dos filetes. Colgado a la izquierda con
          una regla larguísima al lado, el bloque se leía como el principio de
          algo; centrado cierra la sección y la separa del relato de arriba. */}
      <div className="ficha-exp-practicos-cabecera">
        <span className="ficha-exp-regla" aria-hidden="true" />
        <h2 className="ficha-eyebrow" style={{ color: 'var(--color-crimson)', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
          Antes de reservar
        </h2>
        <span className="ficha-exp-regla" aria-hidden="true" />
      </div>

      <dl className="ficha-exp-practicos-grid">
        {datos.map(({ Icono, titulo, texto }) => (
          <div key={titulo} className="ficha-exp-practico">
            {/* El icono va en un disco de color y no suelto junto al rótulo:
                dentro de una tarjeta, un icono a pelo se lee como decoración,
                y en disco se lee como la marca del dato. */}
            <span className="ficha-exp-practico-icono" aria-hidden="true">
              <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <div style={{ minWidth: 0 }}>
              <dt
                className="ficha-eyebrow"
                style={{ fontSize: '12px', letterSpacing: '2px', color: 'rgba(135,43,19,0.6)', minWidth: 0 }}
              >
                {titulo}
              </dt>
              <dd className="ficha-exp-practico-valor">{texto}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}
