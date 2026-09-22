import type { ComponentProps } from 'react'
import { Link } from '@/lib/i18n/navigation'

/**
 * La ruta que acepta el botón. Es el tipo del `href` del Link de next-intl, no
 * un string: se escribe la ruta *interna* —la española, la de las carpetas— y
 * el enlace sale con el prefijo y el segmento del idioma activo. Las rutas con
 * [slug] van en forma de objeto, porque next-intl traduce el segmento y el
 * slug lo pone quien llama: href={{ pathname: '/tienda/[slug]', params: { slug } }}.
 */
export type Href = ComponentProps<typeof Link>['href']

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  href?: Href
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: React.CSSProperties
  /* Los colores viven en `style` inline, que le gana a cualquier regla CSS.
     className es para efectos que el inline no declara —transform, sombra,
     filtro, pseudo-elementos— como el hover de .btn-card. */
  className?: string
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    display: 'inline-block',
    padding: '0.5rem 1.5rem',
    borderRadius: '4px',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    textDecoration: 'none',
    border: 'none',
    transition: 'opacity 0.2s',
  },
  primary: {
    backgroundColor: 'var(--color-crimson)',
    color: 'var(--color-cream)',
  },
  secondary: {
    backgroundColor: 'var(--color-orange)',
    color: 'var(--color-cream)',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--color-crimson)',
    border: '2px solid var(--color-crimson)',
  },
}

export default function Button({
  children, variant = 'primary', href, onClick, disabled, type = 'button', style: styleProp,
  className,
}: ButtonProps) {
  const style = { ...styles.base, ...styles[variant], opacity: disabled ? 0.5 : 1, ...styleProp }
  if (href) return <Link href={href} className={className} style={style}>{children}</Link>
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className} style={style}>
      {children}
    </button>
  )
}
