'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import type { AdminReserva, EstadoReserva } from '@/lib/admin/types'
import {
  getReservas, getReserva, updateEstadoReserva, deleteReserva, getBloqueoBorrado, ErrorConMotivo,
  type BloqueoBorrado,
} from '@/lib/admin/api'
import StatusBadge from '@/components/admin/StatusBadge'
import ReservaDrawer from '@/components/admin/ReservaDrawer'
import ConfirmModal, { AvisoModal, TrashIcon } from '@/components/admin/ConfirmModal'
import {
  opcionesEstado, contextoReserva, estadoVisible, estaRealizada, ETIQUETA_ESTADO,
} from '@/lib/admin/transiciones'
import { esDePrueba, requiereRevision, tienePagoAprobado } from '@/lib/admin/pagos'
import { tomarVerDeLaUrl } from '@/lib/admin/ver-en-url'
import { useAvisar, Cargando } from '@/components/admin/Avisos'

const FILTROS = ['todas', 'pendientes', 'confirmadas', 'realizadas', 'canceladas', 'revisar'] as const
type Filtro = typeof FILTROS[number]

/**
 * Lo que muestra cada filtro, sobre el estado visible: «confirmadas» son las
 * que están por venir y «realizadas» las confirmadas cuya fecha ya pasó.
 */
const FILTRO_ESTADO: Record<Filtro, string | null> = {
  todas: null, pendientes: 'pendiente', confirmadas: 'confirmada', realizadas: 'realizada',
  canceladas: 'cancelada', revisar: 'requiere_revision',
}

/** Sin la ficha (se eliminó) queda el nombre copiado al reservar. */
function nombreExperiencia(r: AdminReserva) {
  return r.experiencia?.nombre || r.experienciaNombre || 'Experiencia eliminada'
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
  // Confirmar a mano una que espera pago: pagó el abono por fuera. Se pregunta.
  const [confirmarAbono, setConfirmarAbono] = useState<AdminReserva | null>(null)
  const [reservaAEliminar, setReservaAEliminar] = useState<AdminReserva | null>(null)
  const [bloqueo, setBloqueo] = useState<{ titulo: string; detalle: BloqueoBorrado } | null>(null)

  // Primero se pregunta si algo lo impide, para no pedir confirmación de un
  // borrado que no va a pasar. Si la consulta falla, se sigue a la confirmación:
  // el DELETE vuelve a comprobarlo y el modal muestra el motivo.
  async function pedirEliminar(r: AdminReserva) {
    const detalle = await getBloqueoBorrado('reservas', r.id).catch(() => null)
    if (detalle) setBloqueo({ titulo: `No se puede eliminar la reserva de ${r.nombre}`, detalle })
    else setReservaAEliminar(r)
  }

  async function confirmarEliminar() {
    if (!reservaAEliminar) return
    // Si el backend lo rechaza (tiene pagos), lanza y el modal muestra el motivo.
    await deleteReserva(reservaAEliminar.id)
    setReservas(prev => prev.filter(r => r.id !== reservaAEliminar.id))
    avisar('exito', `Reserva de ${reservaAEliminar.nombre} eliminada`)
    setReservaAEliminar(null)
  }
  const avisar = useAvisar()
  const [cancelModal, setCancelModal] = useState<{ id: string; nombre: string } | null>(null)
  const [cancelMotivo, setCancelMotivo] = useState('')

  useEffect(() => {
    getReservas().then(async data => {
      setReservas(data)
      setLoading(false)
      const ver = tomarVerDeLaUrl()
      if (!ver) return
      const reserva = data.find(r => r.id === ver) ?? await getReserva(ver).catch(() => null)
      if (reserva) setSelected(reserva)
    })
  }, [])

  const lista = useMemo(() => {
    const estado = FILTRO_ESTADO[filtro]
    return reservas.filter(r => {
      if (estado && estadoVisible(r) !== estado) return false
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
  const porRevisar = useMemo(() => reservas.filter(requiereRevision).length, [reservas])

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
    const nombre = reservas.find(r => r.id === id)?.nombre ?? ''
    try {
      const updated = await updateEstadoReserva(id, estado, motivo)
      handleUpdated(updated)
      avisar('exito', `Reserva de ${nombre}: ahora ${ETIQUETA_ESTADO[estado]}`)
    } catch (err) {
      // Lo más común: la pasarela la cambió mientras la lista estaba abierta.
      avisar('error', err instanceof ErrorConMotivo
        ? `Reserva de ${nombre}: ${err.message}. Se actualizó con su estado actual.`
        : `No se pudo cambiar la reserva de ${nombre}. Recarga la página e intenta de nuevo.`)
      getReserva(id).then(handleUpdated).catch(() => {})
    } finally {
      setChanging(null)
    }
  }

  function handleSelectChange(reserva: AdminReserva, nuevoEstado: EstadoReserva) {
    if (nuevoEstado === 'cancelada') {
      setCancelModal({ id: reserva.id, nombre: reserva.nombre })
    } else if (nuevoEstado === 'confirmada' && reserva.estado === 'pendiente_pago') {
      setConfirmarAbono(reserva)
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
                  <td style={{ minWidth: 140, maxWidth: 200 }}>{nombreExperiencia(r)}</td>
                  <td style={{ textAlign: 'center' }}>{r.cantidadPersonas}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      <StatusBadge estado={estadoVisible(r)} />
                      {tienePagoAprobado(r) && <StatusBadge estado="abono_pagado" />}
                      {esDePrueba(r) && <StatusBadge estado="prueba" />}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {/* Sin selector si no hay a dónde ir: cancelada, vencida o ya realizada. */}
                      {!estaRealizada(r) && opcionesEstado('reserva', r.estado, contextoReserva(r)).length > 0 && (
                        <select
                          aria-label={`Estado de la reserva de ${r.nombre}`}
                          className="admin-select"
                          style={{ fontSize: 12, padding: '5px 8px', width: 'auto' }}
                          value={r.estado}
                          disabled={changing === r.id}
                          onChange={e => handleSelectChange(r, e.target.value as EstadoReserva)}
                        >
                          <option value={r.estado} disabled>{ETIQUETA_ESTADO[r.estado]}</option>
                          {/* Lo bloqueado sale desactivado; el motivo está en el detalle. */}
                          {opcionesEstado('reserva', r.estado, contextoReserva(r)).map(o => (
                            <option key={o.destino} value={o.destino} disabled={!!o.bloqueo}>
                              {ETIQUETA_ESTADO[o.destino]}{o.bloqueo ? ' (no disponible)' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      {changing === r.id && (
                        <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                          <Cargando texto="Guardando…" />
                        </span>
                      )}
                      <button className="btn-secondary btn-sm" onClick={() => setSelected(r)}>Detalle</button>
                      <button
                        className="btn-ghost btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                        onClick={() => pedirEliminar(r)}
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
        <ReservaDrawer
          reserva={selected}
          experienciaNombre={nombreExperiencia(selected)}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Modal de cancelación desde la tabla */}
      {reservaAEliminar && (
        <ConfirmModal
          title={`¿Eliminar la reserva de ${reservaAEliminar.nombre}?`}
          message="Esta acción es permanente y no se puede deshacer. No se le avisa al cliente: si la reserva sigue en pie, cancélala en vez de eliminarla, así le llega el correo. Las reservas con pagos no se eliminan."
          onConfirm={confirmarEliminar}
          onCancel={() => setReservaAEliminar(null)}
        />
      )}

      {bloqueo && (
        <AvisoModal
          title={bloqueo.titulo}
          bloqueo={bloqueo.detalle}
          verLabel="Ver detalle"
          onVer={id => { setBloqueo(null); setSelected(reservas.find(r => r.id === id) ?? null) }}
          onClose={() => setBloqueo(null)}
        />
      )}

      {confirmarAbono && (
        <ConfirmModal
          title="¿Confirmar sin el pago en línea?"
          message={`¿Recibiste el abono de ${confirmarAbono.nombre} por fuera de la pasarela (transferencia, Nequi…)? Al confirmar, el cliente recibe el correo de confirmación.`}
          confirmLabel="Sí, confirmar"
          busyLabel="Confirmando…"
          danger={false}
          onConfirm={async () => {
            const r = confirmarAbono
            setConfirmarAbono(null)
            await cambiarEstadoInline(r.id, 'confirmada')
          }}
          onCancel={() => setConfirmarAbono(null)}
        />
      )}

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
