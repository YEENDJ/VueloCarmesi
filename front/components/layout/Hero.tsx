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
      minHeight: '80vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: imagen ? `linear-gradient(rgba(135,43,19,0.5), rgba(135,43,19,0.5)), url(${imagen})` : 'none',
      backgroundColor: imagen ? undefined : 'var(--color-brown)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      padding: '4rem 2rem', textAlign: 'center',
    }}>
      <div style={{ maxWidth: '800px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 8vw, 6rem)',
          color: 'var(--color-cream)', lineHeight: 1.1, marginBottom: '1rem',
        }}>
          {titulo}
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
          color: 'var(--color-gold)', marginBottom: '2rem',
        }}>
          {subtitulo}
        </p>
        <Button href={ctaHref} variant="secondary">{ctaTexto}</Button>
      </div>
    </section>
  )
}
