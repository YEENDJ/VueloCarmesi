interface Props {
  horarios?: string
  puntoEncuentro?: string
  recomendaciones?: string
}

const RELOJ = <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>
const PIN = <><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>
const AVISO = <><path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" /><path d="M12 10v4M12 17h.01" /></>

/**
 * Las respuestas a "¿cuándo?", "¿dónde llego?" y "¿esto es para mí?" — las tres
 * dudas que aparecen justo antes de reservar y que hasta ahora la ficha no
 * respondía en ningún lado.
 *
 * Los tres campos son opcionales y el bloque entero desaparece si no hay
 * ninguno: la ficha tiene que verse intencional sin ellos, no a medio llenar.
 * Con uno o dos, la rejilla los reparte y sigue viéndose deliberada.
 */
export default function DatosPracticos({ horarios, puntoEncuentro, recomendaciones }: Props) {
  const datos = [
    { icono: RELOJ, titulo: 'Cuándo', texto: horarios?.trim() },
    { icono: PIN, titulo: 'Punto de encuentro', texto: puntoEncuentro?.trim() },
    { icono: AVISO, titulo: 'Ten en cuenta', texto: recomendaciones?.trim() },
  ].filter(d => d.texto)

  if (datos.length === 0) return null

  return (
    <section className="ficha-exp-practicos">
      <div style={{ maxWidth: 'var(--contenido-ancho)', margin: '0 auto', minWidth: 0 }}>
        <dl className="ficha-exp-practicos-grid">
          {datos.map(d => (
            <div key={d.titulo} style={{ minWidth: 0, display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <svg
                width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="var(--color-gold)" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }}
              >
                {d.icono}
              </svg>
              <div style={{ minWidth: 0 }}>
                <dt
                  className="ficha-eyebrow"
                  style={{ color: 'var(--color-gold)', display: 'block', marginBottom: '6px' }}
                >
                  {d.titulo}
                </dt>
                <dd
                  style={{
                    margin: 0,
                    fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
                    lineHeight: 1.65,
                    color: 'rgba(255,234,202,0.85)',
                    minWidth: 0,
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {d.texto}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
