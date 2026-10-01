'use client'
import { useState } from 'react'
import type { AdminPedido, EstadoPedido } from '@/lib/admin/types'
import StatusBadge from './StatusBadge'
import PagosLista from './PagosLista'
import AvisoRevision from './AvisoRevision'
import { updateEstadoPedido } from '@/lib/admin/api'
import { esDePrueba } from '@/lib/admin/pagos'
import { formatPrecio } from '@/lib/format'

/**
 * Los que se eligen a mano. `pagado` es para un pago que llegó por fuera
 * (transferencia). Los de la pasarela —esperando pago, vencido, revisar— no
 * se eligen: los pone el cobro en línea.
 */
const ESTADOS: EstadoPedido[] = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']

/** Ya devolvieron sus unidades: el backend no deja sacarlos de ahí. */
const FINALES: EstadoPedido[] = ['cancelado', 'expirado']

export default function PedidoDrawer({
  pedido, onClose, onUpdated,
}: {
  pedido: AdminPedido
  onClose: () => void
  onUpdated: (p: AdminPedido) => void
}) {
  const [estado, setEstado] = useState<EstadoPedido>(pedido.estado)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function aplicar() {
    if (estado === pedido.estado) return
    setSaving(true)
    setError('')
    try {
      onUpdated(await updateEstadoPedido(pedido.id, estado))
    } catch {
      setError('No se pudo cambiar el estado. Recarga la página e intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-drawer" onClick={e => e.stopPropagation()}>
        <div className="admin-drawer-header">
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-gold)', marginBottom: 4 }}>
              Pedido #{pedido.id.slice(-6).toUpperCase()}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-cream)' }}>{pedido.nombre}</div>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <StatusBadge estado={pedido.estado} />
              {esDePrueba(pedido) && <StatusBadge estado="prueba" />}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,234,202,.7)', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div className="admin-drawer-body">
          {pedido.estado === 'requiere_revision' && <AvisoRevision tipo="pedido" />}
          {pedido.estado === 'pendiente_pago' && pedido.venceEn && (
            <Field label="Esperando pago hasta">
              {new Date(pedido.venceEn).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' })}
            </Field>
          )}
          <Field label="Fecha">{new Date(pedido.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</Field>
          <Field label="Dirección de envío">{pedido.direccion}, {pedido.ciudad}{pedido.codigoPostal && ` (CP ${pedido.codigoPostal})`}</Field>
          <Field label="Teléfono">{pedido.telefono}</Field>
          <div style={{ height: 1, background: 'var(--admin-border)', margin: '16px 0' }} />

          <div className="admin-field-label" style={{ marginBottom: 10 }}>Items</div>
          {pedido.items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--admin-border-row)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{item.producto.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>× {item.cantidad}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-amber)' }}>
                {formatPrecio(item.precio * item.cantidad)}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '2px solid var(--admin-border)' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-amber)' }}>
              {formatPrecio(pedido.total)}
            </span>
          </div>

          <PagosLista pagos={pedido.pagos} />
        </div>

        {!FINALES.includes(pedido.estado) && (
          <div className="admin-drawer-footer" style={{ flexWrap: 'wrap' }}>
            {error && <div role="alert" style={{ width: '100%', fontSize: 13, color: 'var(--status-revision-txt)' }}>{error}</div>}
            <select
              className="admin-select"
              value={estado}
              onChange={e => setEstado(e.target.value as EstadoPedido)}
              style={{ flex: 1, minWidth: 0, minHeight: 44 }}
            >
              {/* El estado actual, aunque no se pueda elegir a mano: sin él, el
                  select mostraría «Pendiente» para un pedido que espera pago. */}
              {!ESTADOS.includes(pedido.estado) && (
                <option value={pedido.estado} disabled>{ETIQUETAS[pedido.estado]}</option>
              )}
              {ESTADOS.map(e => <option key={e} value={e}>{ETIQUETAS[e]}</option>)}
            </select>
            <button className="btn-primary" onClick={aplicar} disabled={saving || estado === pedido.estado} style={{ minHeight: 44 }}>
              {saving ? '…' : 'Aplicar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const ETIQUETAS: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente', pagado: 'Pagado', enviado: 'Enviado', entregado: 'Entregado',
  cancelado: 'Cancelado', pendiente_pago: 'Esperando pago', expirado: 'Vencido',
  requiere_revision: 'Revisar',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="admin-field-label">{label}</div>
      <div className="admin-field-value">{children}</div>
    </div>
  )
}
