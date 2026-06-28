'use client'
import { useState, useEffect, useMemo } from 'react'
import type { AdminReserva, EstadoReserva } from '@/lib/admin/types'
import { getReservas, updateEstadoReserva } from '@/lib/admin/api'
import StatusBadge from '@/components/admin/StatusBadge'
import ReservaDrawer from '@/components/admin/ReservaDrawer'

const FILTROS = ['todas', 'pendientes', 'confirmadas', 'canceladas'] as const
type Filtro = typeof FILTROS[number]

const FILTRO_ESTADO: Record<Filtro, EstadoReserva | null> = {
  todas: null, pendientes: 'pendiente', confirmadas: 'confirmada', canceladas: 'cancelada',
}

export default function ReservasPage() {
  const [reservas, setReservas] = useState<AdminReserva[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [selected, setSelected] = useState<AdminReserva | null>(null)
  const [changing, setChanging] = useState<string | null>(null)

  useEffect(() => {
    getReservas().then(data => { setReservas(data); setLoading(false) })
  }, [])

  const lista = useMemo(() => {
    const estado = FILTRO_ESTADO[filtro]
    return estado ? reservas.filter(r => r.estado === estado) : reservas
  }, [reservas, filtro])

  function handleUpdated(updated: AdminReserva) {
    setReservas(prev => prev.map(r => r.id === updated.id ? updated : r))
    setSelected(updated)
  }

  async function cambiarEstadoInline(id: string, estado: EstadoReserva) {
    setChanging(id)
    const updated = await updateEstadoReserva(id, estado)
    handleUpdated(updated)
    setChanging(null)
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Reservas</div>
          <div className="admin-page-subtitle">{reservas.length} reservas en total</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="admin-pills" style={{ marginBottom: 20 }}>
        {FILTROS.map(f => (
          <button key={f} className={`admin-pill${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>
      ) : lista.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 14 }}>
          Sin reservas {filtro !== 'todas' ? `con estado "${filtro}"` : ''}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Visitante</th>
                <th>Experiencia</th>
                <th style={{ textAlign: 'center' }}>Personas</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(r => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{r.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{r.telefono}</div>
                  </td>
                  <td style={{ minWidth: 140, maxWidth: 200 }}>{r.experiencia?.nombre ?? r.experienciaId}</td>
                  <td style={{ textAlign: 'center' }}>{r.cantidadPersonas}</td>
                  <td><StatusBadge estado={r.estado} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <select
                        className="admin-select"
                        style={{ fontSize: 12, padding: '5px 8px', width: 'auto' }}
                        value={r.estado}
                        disabled={changing === r.id}
                        onChange={e => cambiarEstadoInline(r.id, e.target.value as EstadoReserva)}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                      <button className="btn-secondary btn-sm" onClick={() => setSelected(r)}>Detalle</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ReservaDrawer
          reserva={selected}
          experienciaNombre={selected.experiencia?.nombre ?? selected.experienciaId}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  )
}
