'use client'
import { usePathname } from 'next/navigation'

const STEPS = ['Tienda', 'Carrito', 'Checkout', 'Confirmación'] as const

function stepForPath(pathname: string): number {
  if (pathname.startsWith('/checkout/confirmacion')) return 3
  if (pathname.startsWith('/checkout')) return 2
  if (pathname.startsWith('/carrito')) return 1
  return 0
}

export default function StepIndicator() {
  const pathname = usePathname()
  const current = stepForPath(pathname)

  return (
    <div className="step-indicator">
      {STEPS.map((step, index) => {
        const color = index < current
          ? '#1F8A5B'
          : index === current
            ? 'var(--color-crimson)'
            : 'rgba(135,43,19,0.4)'
        return (
          <span key={step} style={{ fontWeight: 700, fontSize: '0.85rem', color }}>
            {index + 1}. {step}
          </span>
        )
      })}
    </div>
  )
}
