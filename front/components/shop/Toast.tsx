'use client'
import { useTranslations } from 'next-intl'
import { useToast } from '@/lib/cart/store'

/**
 * El aviso de «agregado al carrito».
 *
 * El store guarda la clave y los datos; la traducción se hace aquí, que es
 * donde hay proveedor de i18n. Si el texto se armara en el store saldría
 * siempre en español, porque un módulo plano no puede leer el idioma activo.
 */
export default function Toast() {
  const t = useTranslations('tienda.toast')
  const aviso = useToast()
  if (!aviso) return null

  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: '32px', transform: 'translateX(-50%)',
      zIndex: 90, background: 'var(--color-brown)', color: 'var(--color-cream)',
      fontWeight: 700, fontSize: '0.9rem', padding: '14px 22px', borderRadius: '999px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px',
      // El nombre del producto puede ser largo: que ceda ancho en vez de
      // empujar la píldora fuera de la pantalla en un móvil de 320px.
      maxWidth: 'calc(100vw - 32px)', minWidth: 0,
    }}>
      <span style={{ color: 'var(--color-gold)', flexShrink: 0 }}>✓</span>
      <span style={{ minWidth: 0 }}>{t(aviso.clave, { nombre: aviso.nombre, n: aviso.n })}</span>
    </div>
  )
}
