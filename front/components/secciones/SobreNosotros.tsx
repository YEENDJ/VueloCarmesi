interface Props {
  imagen?: string
}

export default function SobreNosotros({ imagen }: Props) {
  return (
    <section
      id="sobre-nosotros"
      style={{
        backgroundColor: 'var(--color-brown)',
        padding: 'clamp(64px, 8vw, 100px) 24px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="sobre-nosotros-grid">

          {/* Columna izquierda — imagen */}
          <div
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(135,43,19,.16)',
              minHeight: '420px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: imagen
                ? undefined
                : 'repeating-linear-gradient(135deg, #9A3417 0 14px, #8A2E14 14px 28px)',
            }}
          >
            {imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagen}
                alt="Finca agroecológica Vuelo Carmesí"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  color: 'rgba(255,234,202,.35)',
                  textTransform: 'uppercase',
                }}
              >
                FOTO · FINCA AGROECOLÓGICA
              </span>
            )}
          </div>

          {/* Columna derecha — texto */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            {/* Eyebrow */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: 'var(--color-gold)',
                marginBottom: '16px',
              }}
            >
              Quiénes somos
            </p>

            {/* H2 */}
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 40px)',
                color: 'var(--color-cream)',
                lineHeight: 1.2,
                marginBottom: '20px',
              }}
            >
              Un proyecto que nació de la tierra
            </h2>

            {/* Body */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 'clamp(16px, 1.6vw, 18px)',
                color: 'rgba(255,234,202,.85)',
                lineHeight: 1.7,
                marginBottom: '16px',
              }}
            >
              Somos un proyecto agroecológico ubicado en el corazón cacaotero de
              Colombia. Rescatamos variedades nativas, cultivamos sin agroquímicos y
              convertimos cada cosecha en una experiencia que conecta a las personas
              con la tierra.
            </p>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 'clamp(16px, 1.6vw, 18px)',
                color: 'rgba(255,234,202,.85)',
                lineHeight: 1.7,
                marginBottom: '32px',
              }}
            >
              Cada visita es un vuelo a los sentidos: el olor del cacao maduro, el
              sonido de la finca al amanecer y el sabor de un chocolate hecho
              exactamente donde nació el cacao.
            </p>

            {/* CTA ghost */}
            <div>
              <a href="/sobre-nosotros" className="btn-ghost-cream">
                Conocé más
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
