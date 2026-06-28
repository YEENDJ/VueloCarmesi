'use client'
import { useEffect, useState } from 'react'
import type { AdminReserva, AdminPedido, AdminProducto } from '@/lib/admin/types'
import { getReservas, getPedidos, getProductosAdmin } from '@/lib/admin/api'
import StatCard from '@/components/admin/StatCard'
import StatusBadge from '@/components/admin/StatusBadge'
import ReservasChart from '@/components/admin/ReservasChart'
import Link from 'next/link'

export default function AdminOverviewPage() {
  const [reservas, setReservas] = useState<AdminReserva[]>([])
  const [pedidos, setPedidos] = useState<AdminPedido[]>([])
  const [productos, setProductos] = useState<AdminProducto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getReservas(), getPedidos(), getProductosAdmin()]).then(([r, p, pr]) => {
      setReservas(r); setPedidos(p); setProductos(pr); setLoading(false)
    })
  }, [])

  const now = new Date()
  const mesActual = now.getMonth()
  const anioActual = now.getFullYear()

  const reservasMes = reservas.filter(r => {
    const d = new Date(r.fecha)
    return d.getMonth() === mesActual && d.getFullYear() === anioActual
  })
  const pedidosMes = pedidos.filter(p => {
    const d = new Date(p.createdAt)
    return d.getMonth() === mesActual && d.getFullYear() === anioActual
  })
  const ingresosMes = pedidosMes.reduce((s, p) => s + p.total, 0)
  const stockBajo = productos.filter(p => p.stock > 0 && p.stock < 5).length

  const reservasPorSemana = [1, 2, 3, 4].map(sem => ({
    semana: `Sem ${sem}`,
    cantidad: reservasMes.filter(r => Math.ceil(new Date(r.fecha).getDate() / 7) === sem).length,
  }))

  const ultimasReservas = [...reservas].slice(0, 5)
  const ultimosPedidos = [...pedidos].slice(0, 5)

  if (loading) return <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Overview</div>
          <div className="admin-page-subtitle">{now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* StatCards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label="Reservas del mes" value={reservasMes.length} icon="📅" />
        <StatCard label="Pedidos del mes" value={pedidosMes.length} icon="📦" />
        <StatCard label="Ingresos estimados" value={`$${ingresosMes.toLocaleString('es-CO')}`} icon="💰" />
        <StatCard label="Stock bajo" value={stockBajo} icon="⚠️" alerta={stockBajo > 0} />
      </div>

      {/* Gráfica */}
      <div style={{ marginBottom: 24 }}>
        <ReservasChart data={reservasPorSemana} />
      </div>

      {/* Listas recientes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Últimas reservas */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(135,43,19,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Últimas reservas</div>
            <Link href="/admin/reservas" style={{ fontSize: 12, color: 'var(--color-orange)', fontWeight: 700, textDecoration: 'none' }}>Ver todas →</Link>
          </div>
          {ultimasReservas.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--admin-border-row)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{r.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{new Date(r.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</div>
              </div>
              <StatusBadge estado={r.estado} />
            </div>
          ))}
        </div>

        {/* Últimos pedidos */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(135,43,19,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Últimos pedidos</div>
            <Link href="/admin/pedidos" style={{ fontSize: 12, color: 'var(--color-orange)', fontWeight: 700, textDecoration: 'none' }}>Ver todos →</Link>
          </div>
          {ultimosPedidos.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--admin-border-row)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>${p.total.toLocaleString('es-CO')}</div>
              </div>
              <StatusBadge estado={p.estado} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
