import Button from '@/components/ui/Button'

export default function ConfirmacionPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-cream)', minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        {/* Ícono de éxito */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#872B13"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 7vw, 48px)',
            color: 'var(--color-crimson)',
            marginBottom: '16px',
            lineHeight: 1.15,
          }}
        >
          ¡Reserva recibida!
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
            color: 'var(--color-brown)',
            lineHeight: 1.7,
            maxWidth: '440px',
            margin: '0 auto 40px',
            opacity: 0.85,
          }}
        >
          Recibimos tu solicitud. En breve nos comunicamos para confirmar
          disponibilidad y los detalles de tu experiencia.
        </p>

        {/* Card de resumen */}
        <div
          style={{
            backgroundColor: '#FFF6E4',
            border: '2px solid var(--color-amber)',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '40px',
            textAlign: 'left',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '20px',
              color: 'var(--color-amber)',
              marginBottom: '16px',
            }}
          >
            Reserva en proceso
          </p>

          <div style={{ borderTop: '1px solid rgba(135,43,19,.15)', paddingTop: '16px' }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--color-brown)',
                opacity: 0.6,
                lineHeight: 1.6,
              }}
            >
              Te enviaremos un email con el código de reserva una vez que
              confirmemos tu lugar. Sin compromiso de pago hasta la confirmación.
            </p>
          </div>
        </div>

        {/* Botones */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button href="/" variant="outline">
            Volver al inicio
          </Button>
          <Button href="/tienda" variant="primary">
            Ver tienda
          </Button>
        </div>
      </div>
    </div>
  )
}
