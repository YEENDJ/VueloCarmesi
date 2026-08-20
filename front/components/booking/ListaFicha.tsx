type Variante = 'incluye' | 'traer' | 'noIncluye'

const ICONOS: Record<Variante, { color: string; path: React.ReactNode }> = {
  incluye: {
    color: 'var(--color-orange)',
    path: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></>,
  },
  traer: {
    color: 'var(--color-brown)',
    path: (
      <>
        <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        <path d="M9 6V4.5A2.5 2.5 0 0 1 11.5 2h1A2.5 2.5 0 0 1 15 4.5V6" />
        <path d="M9 14h6" />
      </>
    ),
  },
  // Un aspa, no una cruz roja de error: no incluir algo no es un fallo, es un
  // dato. Va en el mismo marrón apagado que "qué traer" para que no alarme.
  noIncluye: {
    color: 'rgba(135,43,19,0.55)',
    path: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  },
}

interface Props {
  titulo: string
  items: string[]
  variante: Variante
}

/**
 * Uno de los tres bloques de lista de la ficha: incluye, qué traer y qué no
 * incluye. Los tres comparten forma —tarjeta, ícono arriba, texto debajo— para
 * que la ficha se lea como una sola pieza y no como tres inventos distintos.
 *
 * Devuelve null si la lista viene vacía: son campos opcionales y la ficha debe
 * verse intencional sin ellos, no incompleta.
 */
export default function ListaFicha({ titulo, items, variante }: Props) {
  if (items.length === 0) return null

  const { color, path } = ICONOS[variante]

  return (
    <section style={{ minWidth: 0 }}>
      <h2
        className="ficha-eyebrow"
        style={{
          color: 'var(--color-crimson)',
          fontFamily: 'var(--font-body)',
          display: 'block',
          marginBottom: 'clamp(20px, 4vw, 36px)',
        }}
      >
        {titulo}
      </h2>
      <ul className="ficha-exp-tarjetas" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map(item => (
          <li
            key={item}
            style={{
              minWidth: 0,
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid rgba(135,43,19,0.12)',
              borderRadius: '10px',
              padding: 'clamp(18px, 3vw, 24px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <svg
              width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color}
              strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true" style={{ flexShrink: 0 }}
            >
              {path}
            </svg>
            <span
              style={{
                fontSize: 'clamp(0.95rem, 2.5vw, 1.03rem)',
                lineHeight: 1.5,
                color: 'var(--color-brown)',
                minWidth: 0,
                overflowWrap: 'anywhere',
              }}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
