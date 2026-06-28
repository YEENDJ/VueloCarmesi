'use client'
import { useState } from 'react'
import type { AdminPedido, EstadoPedido } from '@/lib/admin/types'
import StatusBadge from './StatusBadge'
import { updateEstadoPedido } from '@/lib/admin/api'

const ESTADOS: EstadoPedido[] = ['pendiente', 'enviado', 'entregado', 'cancelado']

export default function PedidoDrawer({
  pedido, onClose, onUpdated,
}: {
  pedido: AdminPedido
  onClose: () => void
  onUpdated: (p: AdminPedido) => void
}) {
  const [estado, setEstado] = useState<EstadoPedido>(pedido.estado)
  const [saving, setSaving] = useState(false)

  async function aplicar() {
    if (estado === pedido.estado) return
    setSaving(true)
    const updated = await updateEstadoPedido(pedido.id, estado)
    onUpdated(updated)
    setSaving(false)
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-drawer" onClick={e => e.stopPropagation()}>
        <div className="admin-drawer-header">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-gold)', marginBottom: 4 }}>
              Pedido #{pedido.id.slice(-6).toUpperCase()}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-cream)' }}>{pedido.nombre}</div>
            <div style={{ marginTop: 6 }}><StatusBadge estado={pedido.estado} /></div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,234,202,.7)', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div className="admin-drawer-body">
          <Field label="Fecha">{new Date(pedido.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</Field>
          <Field label="Dirección de envío">{pedido.direccion}</Field>
          <div style={{ height: 1, background: 'var(--admin-border)', margin: '16px 0' }} />

          <div className="admin-field-label" style={{ marginBottom: 10 }}>Items</div>
          {pedido.items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--admin-border-row)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{item.producto.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>× {item.cantidad}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-amber)' }}>
                ${(item.precio * item.cantidad).toLocaleString('es-CO')}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '2px solid var(--admin-border)' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-amber)' }}>
              ${pedido.total.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        <div className="admin-drawer-footer">
          <select
            className="admin-select"
            value={estado}
            onChange={e => setEstado(e.target.value as EstadoPedido)}
            style={{ flex: 1 }}
          >
            {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
          </select>
          <button className="btn-primary" onClick={aplicar} disabled={saving || estado === pedido.estado}>
            {saving ? '…' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="admin-field-label">{label}</div>
      <div className="admin-field-value">{children}</div>
    </div>
  )
}
