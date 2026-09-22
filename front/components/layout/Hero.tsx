import Button, { type Href } from '@/components/ui/Button'
import { useTranslations } from 'next-intl'

interface HeroProps {
  titulo: string
  subtitulo: string
  ctaTexto: string
  ctaHref: Href
  imagen?: string
}

export default function Hero({ titulo, subtitulo, ctaTexto, ctaHref, imagen }: HeroProps) {
  const t = useTranslations('portada')

  return (
    <section className="hero">
      <div className="contenido">
      {/* pre-line para que el salto de línea del título se vea. El eslogan de
          marca se lee en dos renglones —«Experiencias agroecológicas / con
          sabor a cacao.»— y así va en el portafolio, con un <br> explícito.
          Sin esto el navegador colapsa el salto en un espacio y el título
          rompe donde caiga, que a según qué ancho parte el eslogan por la
          mitad. El salto se respeta pero no se fuerza: `maxWidth` en ch sigue
          partiendo los renglones largos si no caben. */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(32px, 5.5vw, 68px)',
        lineHeight: 1.05,
        letterSpacing: '-0.01em',
        color: 'var(--color-crimson)',
        margin: 0,
        maxWidth: '20ch',
        whiteSpace: 'pre-line',
      }}>
        {titulo}
      </h1>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap' as const,
        alignItems: 'flex-end',
        gap: '24px',
        marginTop: '24px',
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
          <div style={{ marginTop: '20px' }}>
            <Button href={ctaHref}>{ctaTexto}</Button>
          </div>
        </div>

        {imagen ? (
          <div className="hero-media">
            {/* Es el elemento de LCP de la portada: la foto que el visitante
                espera antes de ver la página hecha. Se sirve el original tal
                como lo subió el panel, sin transformar: la recompresión de
                Cloudinary se retiró porque se notaba en pantalla.
                `fetchPriority` y no `loading="lazy"`: el navegador debe pedirla
                cuanto antes, no cuando se acerque. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagen}
              alt="Vuelo Carmesí"
              width={1600}
              height={900}
              fetchPriority="high"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div className="hero-media" style={{
            background: 'repeating-linear-gradient(135deg, #F0D6A8 0 14px, #E9CB97 14px 28px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'monospace', fontSize: '12px', letterSpacing: '1px',
              color: 'rgba(135, 43, 19, 0.5)', textTransform: 'uppercase' as const,
            }}>
              {t('heroPlaceholder')}
            </span>
          </div>
        )}
      </div>
      </div>
    </section>
  )
}
