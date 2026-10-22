'use client'
import { useState, useEffect, useMemo } from 'react'
import type { AdminPedido, EstadoPedido } from '@/lib/admin/types'
import { getPedidos, getPedido, deletePedido, getBloqueoBorrado, type BloqueoBorrado } from '@/lib/admin/api'
import StatusBadge from '@/components/admin/StatusBadge'
import PedidoDrawer from '@/components/admin/PedidoDrawer'
import ConfirmModal, { AvisoModal, TrashIcon } from '@/components/admin/ConfirmModal'
import { formatPrecio } from '@/lib/format'
import { esDePrueba, requiereRevision } from '@/lib/admin/pagos'
import { tomarVerDeLaUrl } from '@/lib/admin/ver-en-url'
import { codigoCorto } from '@/lib/admin/codigo'

const FILTROS = ['todos', 'pendientes', 'pagados', 'enviados', 'entregados', 'cancelados', 'revisar'] as const
type Filtro = typeof FILTROS[number]

const FILTRO_ESTADO: Record<Filtro, EstadoPedido | null> = {
  todos: null, pendientes: 'pendiente', pagados: 'pagado', enviados: 'enviado',
  entregados: 'entregado', cancelados: 'cancelado', revisar: 'requiere_revision',
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<AdminPedido[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [selected, setSelected] = useState<AdminPedido | null>(null)
  const [pedidoAEliminar, setPedidoAEliminar] = useState<AdminPedido | null>(null)
  const [bloqueo, setBloqueo] = useState<{ titulo: string; detalle: BloqueoBorrado } | null>(null)

  // Primero se pregunta si algo lo impide, para no pedir confirmación de un
  // borrado que no va a pasar. Si la consulta falla, se sigue a la confirmación:
  // el DELETE vuelve a comprobarlo y el modal muestra el motivo.
  async function pedirEliminar(p: AdminPedido) {
    const detalle = await getBloqueoBorrado('pedidos', p.id).catch(() => null)
    if (detalle) setBloqueo({ titulo: `No se puede eliminar el pedido ${codigoCorto(p.id)}`, detalle })
    else setPedidoAEliminar(p)
  }

  useEffect(() => {
    getPedidos().then(async data => {
      setPedidos(data)
      setLoading(false)
      const ver = tomarVerDeLaUrl()
      if (!ver) return
      const pedido = data.find(p => p.id === ver) ?? await getPedido(ver).catch(() => null)
      if (pedido) setSelected(pedido)
    })
  }, [])

  const lista = useMemo(() => {
    const estado = FILTRO_ESTADO[filtro]
    return estado ? pedidos.filter(p => p.estado === estado) : pedidos
  }, [pedidos, filtro])
  const porRevisar = useMemo(() => pedidos.filter(requiereRevision).length, [pedidos])

  function handleUpdated(updated: AdminPedido) {
    setPedidos(prev => prev.map(p => p.id === updated.id ? updated : p))
    // Solo si sigue abierto: un «Deshacer» pulsado con el detalle cerrado no lo reabre.
    setSelected(prev => prev?.id === updated.id ? updated : prev)
  }

  async function confirmarEliminar() {
    if (!pedidoAEliminar) return
    // Si el backend lo rechaza (tiene pagos), lanza y el modal muestra el motivo.
    await deletePedido(pedidoAEliminar.id)
    setPedidos(prev => prev.filter(p => p.id !== pedidoAEliminar.id))
    setPedidoAEliminar(null)
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Pedidos</div>
          <div className="admin-page-subtitle">{pedidos.length} pedidos en total</div>
        </div>
      </div>

      <div className="admin-pills" style={{ marginBottom: 20 }}>
        {FILTROS.map(f => (
          <button
            key={f}
            className={`admin-pill${filtro === f ? ' active' : ''}`}
            onClick={() => setFiltro(f)}
            style={f === 'revisar' && porRevisar > 0 && filtro !== f ? { color: 'var(--status-revision-txt)', fontWeight: 700 } : undefined}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'revisar' && porRevisar > 0 && ` (${porRevisar})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>
      ) : lista.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 14 }}>
          Sin pedidos {filtro !== 'todos' ? `con estado "${filtro}"` : ''}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th># Pedido</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th style={{ textAlign: 'center' }}>Items</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    {codigoCorto(p.id)}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(p.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{p.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{p.email}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{p.items.length}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-amber)', fontWeight: 700 }}>
                    {formatPrecio(p.total)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      <StatusBadge estado={p.estado} />
                      {esDePrueba(p) && <StatusBadge estado="prueba" />}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button className="btn-secondary btn-sm" onClick={() => setSelected(p)}>Ver detalle</button>
                      <button
                        className="btn-ghost btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                        onClick={() => pedirEliminar(p)}
                      >
                        <TrashIcon /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <PedidoDrawer pedido={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}

      {pedidoAEliminar && (
        <ConfirmModal
          title={`¿Eliminar el pedido ${codigoCorto(pedidoAEliminar.id)}?`}
          message="Esta acción es permanente y no se puede deshacer. Si no se ha enviado, sus unidades vuelven al inventario. Los pedidos con pagos no se eliminan: cámbialos a cancelado."
          onConfirm={confirmarEliminar}
          onCancel={() => setPedidoAEliminar(null)}
        />
      )}

      {bloqueo && (
        <AvisoModal
          title={bloqueo.titulo}
          bloqueo={bloqueo.detalle}
          verLabel="Ver detalle"
          onVer={id => { setBloqueo(null); setSelected(pedidos.find(p => p.id === id) ?? null) }}
          onClose={() => setBloqueo(null)}
        />
      )}
    </>
  )
}
