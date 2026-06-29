import Button from '@/components/ui/Button'

interface HeroProps {
  titulo: string
  subtitulo: string
  ctaTexto: string
  ctaHref: string
  imagen?: string
}

export default function Hero({ titulo, subtitulo, ctaTexto, ctaHref, imagen }: HeroProps) {
  return (
    <section style={{
      minHeight: '86vh',
      backgroundColor: 'var(--color-cream)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: 'clamp(40px, 7vw, 90px) clamp(16px, 5vw, 64px)',
    }}>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: '14px',
        letterSpacing: '3px',
        textTransform: 'uppercase' as const,
        color: 'var(--color-orange)',
        marginBottom: '16px',
      }}>
        Experiencias agroecológicas
      </div>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(44px, 8vw, 96px)',
        lineHeight: 1,
        color: 'var(--color-crimson)',
        margin: 0,
        maxWidth: '18ch',
      }}>
        {titulo}
      </h1>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap' as const,
        alignItems: 'flex-end',
        gap: '32px',
        marginTop: '40px',
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 'clamp(16px, 1.7vw, 20px)',
            lineHeight: 1.7,
            color: 'var(--color-brown)',
            maxWidth: '46ch',
            margin: 0,
          }}>
            {subtitulo}
          </p>
          <div style={{ marginTop: '28px' }}>
            <Button href={ctaHref}>{ctaTexto}</Button>
          </div>
        </div>

        {imagen ? (
          <div style={{
            flex: '1 1 300px', height: '280px', borderRadius: '12px',
            overflow: 'hidden', boxShadow: '0 4px 16px rgba(135, 43, 19, 0.16)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagen} alt="Vuelo Carmesí" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{
            flex: '1 1 300px', height: '280px', borderRadius: '12px',
            overflow: 'hidden', boxShadow: '0 4px 16px rgba(135, 43, 19, 0.16)',
            background: 'repeating-linear-gradient(135deg, #F0D6A8 0 14px, #E9CB97 14px 28px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'monospace', fontSize: '12px', letterSpacing: '1px',
              color: 'rgba(135, 43, 19, 0.5)', textTransform: 'uppercase' as const,
            }}>
              FOTO · MAZORCA ABIERTA
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
