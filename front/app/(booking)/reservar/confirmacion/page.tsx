import Button from '@/components/ui/Button'

export default function ConfirmacionPage() {
  return (
    <section style={{ maxWidth: '600px', margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
      <h1 style={{ color: 'var(--color-brown)', marginBottom: '1rem' }}>¡Reserva confirmada!</h1>
      <p style={{ opacity: 0.8, marginBottom: '2rem', lineHeight: 1.7 }}>
        Te enviamos un email con los detalles. ¡Nos vemos pronto!
      </p>
      <Button href="/experiencias">Ver más experiencias</Button>
    </section>
  )
}
