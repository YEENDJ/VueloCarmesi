'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
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
  const mesInputRef = useRef<HTMLInputElement>(null)
  const [modoFecha, setModoFecha] = useState<'mes' | 'rango'>('mes')
  const [mes, setMes] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [selected, setSelected] = useState<AdminReserva | null>(null)
  const [changing, setChanging] = useState<string | null>(null)
  const [cancelModal, setCancelModal] = useState<{ id: string; nombre: string } | null>(null)
  const [cancelMotivo, setCancelMotivo] = useState('')

  useEffect(() => {
    getReservas().then(data => { setReservas(data); setLoading(false) })
  }, [])

  const lista = useMemo(() => {
    const estado = FILTRO_ESTADO[filtro]
    return reservas.filter(r => {
      if (estado && r.estado !== estado) return false
      const fecha = new Date(r.fecha)
      fecha.setHours(0, 0, 0, 0)
      if (modoFecha === 'mes' && mes) {
        const ym = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
        if (ym !== mes) return false
      }
      if (modoFecha === 'rango') {
        if (fechaDesde && fecha < new Date(fechaDesde)) return false
        if (fechaHasta) {
          const hasta = new Date(fechaHasta)
          hasta.setHours(23, 59, 59, 999)
          if (fecha > hasta) return false
        }
      }
      return true
    })
  }, [reservas, filtro, modoFecha, mes, fechaDesde, fechaHasta])

  const hayFiltroFecha = modoFecha === 'mes' ? !!mes : !!(fechaDesde || fechaHasta)

  function limpiarFecha() {
    setMes(''); setFechaDesde(''); setFechaHasta('')
  }

  function chipLabel() {
    if (modoFecha === 'mes') {
      const [y, m] = mes.split('-')
      return new Date(Number(y), Number(m) - 1, 1)
        .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    }
    const fmt = (iso: string) =>
      new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
    if (fechaDesde && fechaHasta) return `${fmt(fechaDesde)} — ${fmt(fechaHasta)}`
    if (fechaDesde) return `Desde ${fmt(fechaDesde)}`
    return `Hasta ${fmt(fechaHasta)}`
  }

  function handleUpdated(updated: AdminReserva) {
    setReservas(prev => prev.map(r => r.id === updated.id ? updated : r))
    setSelected(prev => prev?.id === updated.id ? updated : prev)
  }

  async function cambiarEstadoInline(id: string, estado: EstadoReserva, motivo?: string) {
    setChanging(id)
    try {
      const updated = await updateEstadoReserva(id, estado, motivo)
      handleUpdated(updated)
    } finally {
      setChanging(null)
    }
  }

  function handleSelectChange(reserva: AdminReserva, nuevoEstado: EstadoReserva) {
    if (nuevoEstado === 'cancelada') {
      setCancelModal({ id: reserva.id, nombre: reserva.nombre })
    } else {
      cambiarEstadoInline(reserva.id, nuevoEstado)
    }
  }

  async function confirmarCancelacionModal() {
    if (!cancelModal) return
    const motivo = cancelMotivo || undefined
    setCancelModal(null)
    setCancelMotivo('')
    await cambiarEstadoInline(cancelModal.id, 'cancelada', motivo)
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Reservas</div>
          <div className="admin-page-subtitle">
            {lista.length} de {reservas.length} reservas
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div className="admin-pills" style={{ margin: 0 }}>
          {FILTROS.map(f => (
            <button key={f} className={`admin-pill${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>

          {/* Toggle siempre visible */}
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
            <button
              className={modoFecha === 'mes' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
              style={{ borderRadius: 0, border: 'none' }}
              onClick={() => { setModoFecha('mes'); setFechaDesde(''); setFechaHasta(''); limpiarFecha() }}
            >
              Por mes
            </button>
            <button
              className={modoFecha === 'rango' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}
              style={{ borderRadius: 0, border: 'none', borderLeft: '1px solid var(--admin-border)' }}
              onClick={() => { setModoFecha('rango'); setMes('') }}
            >
              Por rango
            </button>
          </div>

          {/* Por mes: chip + ícono calendario */}
          {modoFecha === 'mes' && <>
            {hayFiltroFecha && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                fontWeight: 600, color: 'var(--color-brown)',
                background: '#fdf0e8', border: '1px solid #f0d8c0',
                padding: '4px 10px', borderRadius: 20,
              }}>
                {chipLabel()}
                <button
                  type="button"
                  onClick={limpiarFecha}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-crimson)', padding: 0, fontSize: 14, lineHeight: 1 }}
                >✕</button>
              </div>
            )}
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                type="button"
                className="btn-ghost btn-sm"
                title="Seleccionar mes"
                style={{ display: 'flex', alignItems: 'center', color: hayFiltroFecha ? 'var(--color-orange)' : undefined }}
                onClick={() => mesInputRef.current?.showPicker()}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </button>
              <input
                ref={mesInputRef}
                type="month"
                value={mes}
                onChange={e => setMes(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none', width: '100%', height: '100%', border: 'none', padding: 0 }}
              />
            </div>
          </>}

          {/* Por rango: inputs de fecha visibles y compactos */}
          {modoFecha === 'rango' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>Desde</span>
              <input
                type="date"
                className="admin-input"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                style={{ padding: '4px 8px', fontSize: 13, width: 'auto', cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--admin-text-muted)' }}>—</span>
              <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>Hasta</span>
              <input
                type="date"
                className="admin-input"
                value={fechaHasta}
                min={fechaDesde}
                onChange={e => setFechaHasta(e.target.value)}
                style={{ padding: '4px 8px', fontSize: 13, width: 'auto', cursor: 'pointer' }}
              />
              {hayFiltroFecha && (
                <button
                  type="button"
                  onClick={limpiarFecha}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-crimson)', padding: '0 4px', fontSize: 14, lineHeight: 1 }}
                >✕</button>
              )}
            </div>
          )}
        </div>
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
                      {r.estado !== 'cancelada' && (
                        <select
                          className="admin-select"
                          style={{ fontSize: 12, padding: '5px 8px', width: 'auto' }}
                          value={r.estado}
                          disabled={changing === r.id}
                          onChange={e => handleSelectChange(r, e.target.value as EstadoReserva)}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      )}
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

      {/* Modal de cancelación desde la tabla */}
      {cancelModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => { setCancelModal(null); setCancelMotivo('') }}
        >
          <div
            style={{ background: '#fff', borderRadius: 12, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>
              Cancelar reserva de {cancelModal.nombre}
            </div>
            <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
              Se enviará un email al cliente notificando la cancelación.
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
              Motivo (opcional — se incluirá en el email)
            </label>
            <textarea
              value={cancelMotivo}
              onChange={e => setCancelMotivo(e.target.value)}
              placeholder="Ej: Sin disponibilidad para esa fecha…"
              rows={3}
              style={{ width: '100%', borderRadius: 8, border: '1px solid var(--admin-border)', padding: '10px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => { setCancelModal(null); setCancelMotivo('') }}>Volver</button>
              <button className="btn-ghost" onClick={confirmarCancelacionModal}>
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
