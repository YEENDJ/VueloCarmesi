'use client'
import { useState, useEffect, useMemo } from 'react'
import type { AdminPedido, EstadoPedido } from '@/lib/admin/types'
import { getPedidos } from '@/lib/admin/api'
import StatusBadge from '@/components/admin/StatusBadge'
import PedidoDrawer from '@/components/admin/PedidoDrawer'

const FILTROS = ['todos', 'pendientes', 'enviados', 'entregados', 'cancelados'] as const
type Filtro = typeof FILTROS[number]

const FILTRO_ESTADO: Record<Filtro, EstadoPedido | null> = {
  todos: null, pendientes: 'pendiente', enviados: 'enviado', entregados: 'entregado', cancelados: 'cancelado',
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<AdminPedido[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [selected, setSelected] = useState<AdminPedido | null>(null)

  useEffect(() => {
    getPedidos().then(data => { setPedidos(data); setLoading(false) })
  }, [])

  const lista = useMemo(() => {
    const estado = FILTRO_ESTADO[filtro]
    return estado ? pedidos.filter(p => p.estado === estado) : pedidos
  }, [pedidos, filtro])

  function handleUpdated(updated: AdminPedido) {
    setPedidos(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelected(updated)
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
          <button key={f} className={`admin-pill${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
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
                    #{p.id.slice(-6).toUpperCase()}
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
                    ${p.total.toLocaleString('es-CO')}
                  </td>
                  <td><StatusBadge estado={p.estado} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-secondary btn-sm" onClick={() => setSelected(p)}>Ver detalle</button>
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
    </>
  )
}
