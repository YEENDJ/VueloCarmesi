import type { AdminPago } from '@/lib/admin/types'
import { nombreMetodo } from '@/lib/admin/pagos'
import { formatPrecio } from '@/lib/format'
import StatusBadge from './StatusBadge'

/**
 * Los intentos de cobro en línea de un pedido o una reserva, del más reciente
 * al más viejo. Es lo que se mira para responder un reclamo: cuánto, con qué
 * medio, si la pasarela lo rechazó y por qué, y la referencia para buscarlo
 * en el panel de la pasarela.
 *
 * Sin intentos no se pinta nada: es un pedido del flujo manual.
 */
export default function PagosLista({ pagos }: { pagos?: AdminPago[] }) {
  if (!pagos?.length) return null

  return (
    <>
      <div style={{ height: 1, background: 'var(--admin-border)', margin: '16px 0' }} />
      <div className="admin-field-label" style={{ marginBottom: 10 }}>
        Pagos en línea ({pagos.length} {pagos.length === 1 ? 'intento' : 'intentos'})
      </div>
      {pagos.map(p => (
        <div
          key={p.id}
          style={{ padding: '10px 0', borderBottom: '1px solid var(--admin-border-row)' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', minWidth: 0 }}>
              <StatusBadge estado={p.estado} />
              {p.modo === 'prueba' && <StatusBadge estado="prueba" />}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-amber)' }}>
              {formatPrecio(p.monto)}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 6, overflowWrap: 'anywhere' }}>
            {nombreMetodo(p.metodo)} ·{' '}
            {new Date(p.createdAt).toLocaleString('es-CO', {
              day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota',
            })}{' '}
            · <span style={{ fontFamily: 'monospace' }}>{p.referencia}</span>
          </div>
          {p.motivo && (
            <div style={{ fontSize: 12, marginTop: 4, overflowWrap: 'anywhere' }}>
              Motivo: {p.motivo}
            </div>
          )}
        </div>
      ))}
    </>
  )
}
