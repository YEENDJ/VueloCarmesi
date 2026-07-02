'use client'
import { useToast } from '@/lib/cart/store'

export default function Toast() {
  const message = useToast()
  if (!message) return null

  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: '32px', transform: 'translateX(-50%)',
      zIndex: 90, background: 'var(--color-brown)', color: 'var(--color-cream)',
      fontWeight: 700, fontSize: '0.9rem', padding: '14px 22px', borderRadius: '999px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <span style={{ color: 'var(--color-gold)' }}>✓</span>{message}
    </div>
  )
}
