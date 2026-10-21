'use client'
import { useState } from 'react'
import type { AdminReserva, EstadoReserva } from '@/lib/admin/types'
import StatusBadge from './StatusBadge'
import PagosLista from './PagosLista'
import AvisoRevision from './AvisoRevision'
import ConfirmModal from './ConfirmModal'
import { updateEstadoReserva, getReserva, ErrorConMotivo } from '@/lib/admin/api'
import { useAvisar, Cargando } from './Avisos'
import { BloqueosEstado } from './BloqueosEstado'
import { esDePrueba, tienePagoAprobado } from '@/lib/admin/pagos'
import { formatPrecio } from '@/lib/format'
import { opcionesEstado, contextoReserva, estadoVisible, estaRealizada } from '@/lib/admin/transiciones'

export default function ReservaDrawer({
  reserva,
  onClose,
  onUpdated,
  experienciaNombre,
}: {
  reserva: AdminReserva
  onClose: () => void
  onUpdated: (r: AdminReserva) => void
  experienciaNombre: string
}) {
  // A qué estado se está pasando: el botón de esa acción es el que muestra la carga.
  const [saving, setSaving] = useState<EstadoReserva | null>(null)
  const avisar = useAvisar()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [confirmarAbono, setConfirmarAbono] = useState(false)
  const [motivo, setMotivo] = useState('')

  // Solo lo que el backend va a aceptar (lib/admin/transiciones); lo bloqueado
  // por la situación del momento sale desactivado y con su motivo.
  const opciones = opcionesEstado('reserva', reserva.estado, contextoReserva(reserva))
  const confirmar = opciones.find(o => o.destino === 'confirmada')
  const cancelar = opciones.find(o => o.destino === 'cancelada')
  const realizada = estaRealizada(reserva)

  function pedirConfirmar() {
    // Esperando pago y confirmada a mano = pagó el abono por fuera. Se pregunta.
    if (reserva.estado === 'pendiente_pago') setConfirmarAbono(true)
    else cambiarEstado('confirmada')
  }

  async function cambiarEstado(estado: EstadoReserva, motivoTexto?: string) {
    setSaving(estado)
    try {
      const updated = await updateEstadoReserva(reserva.id, estado, motivoTexto)
      onUpdated(updated)
      avisar('exito', estado === 'cancelada'
        ? `Reserva de ${reserva.nombre} cancelada`
        : `Reserva de ${reserva.nombre} confirmada`)
    } catch (err) {
      // Lo más común: la pasarela la cambió mientras el panel estaba abierto.
      avisar('error', err instanceof ErrorConMotivo
        ? `Reserva de ${reserva.nombre}: ${err.message}. Se actualizó con su estado actual.`
        : `No se pudo cambiar la reserva de ${reserva.nombre}. Recarga la página e intenta de nuevo.`)
      getReserva(reserva.id).then(onUpdated).catch(() => {})
    } finally {
      setSaving(null)
    }
  }

  async function confirmarCancelacion() {
    setShowCancelModal(false)
    await cambiarEstado('cancelada', motivo || undefined)
    setMotivo('')
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-drawer" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-drawer-header">
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-gold)', marginBottom: 4 }}>
              Detalle de Reserva
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-cream)' }}>
              {reserva.nombre}
            </div>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <StatusBadge estado={estadoVisible(reserva)} />
              {tienePagoAprobado(reserva) && <StatusBadge estado="abono_pagado" />}
              {esDePrueba(reserva) && <StatusBadge estado="prueba" />}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,234,202,.7)', fontSize: 20, cursor: 'pointer', padding: 4 }}
          >✕</button>
        </div>

        {/* Body */}
        <div className="admin-drawer-body">
          {reserva.estado === 'requiere_revision' && <AvisoRevision tipo="reserva" />}
          <Field label="Experiencia">{experienciaNombre}</Field>
          <Field label="Fecha">{new Date(reserva.fecha).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Field>
          <Field label="Personas">{reserva.cantidadPersonas}</Field>
          <div style={{ height: 1, background: 'var(--admin-border)', margin: '16px 0' }} />
          <Field label="Teléfono">{reserva.telefono}</Field>
          <Field label="Email">{reserva.email}</Field>
          {reserva.notas && <Field label="Notas">{reserva.notas}</Field>}

          {/* Las cifras congeladas al crearla. Las de antes de la pasarela no
              las tienen, y no se inventan con el precio de hoy. */}
          {reserva.total != null && (
            <>
              <div style={{ height: 1, background: 'var(--admin-border)', margin: '16px 0' }} />
              <Field label="Total">{formatPrecio(reserva.total)}</Field>
              {reserva.montoAbono != null && (
                <>
                  <Field label={`Abono en línea${reserva.porcentajeAbono != null ? ` (${reserva.porcentajeAbono} %)` : ''}`}>
                    {formatPrecio(reserva.montoAbono)}
                    {tienePagoAprobado(reserva) ? ' · pagado' : ' · sin pagar'}
                  </Field>
                  <Field label="Saldo el día de la actividad">
                    {formatPrecio(Math.max(reserva.total - reserva.montoAbono, 0))}
                  </Field>
                </>
              )}
            </>
          )}

          <PagosLista pagos={reserva.pagos} />
        </div>

        {/* Footer */}
        {realizada ? (
          // Ya pasó: no hay nada que hacerle, y cancelarla sería un error.
          <div className="admin-drawer-footer">
            <p role="note" style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)' }}>
              Ya se realizó el {new Date(reserva.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' })}: no se puede cancelar ni cambiar.
            </p>
          </div>
        ) : (confirmar || cancelar) && (
          <div className="admin-drawer-footer" style={{ flexWrap: 'wrap' }}>
            <BloqueosEstado opciones={opciones} />
            {confirmar && (
              <button
                className="btn-primary"
                disabled={saving !== null || !!confirmar.bloqueo}
                aria-busy={saving === 'confirmada'}
                onClick={pedirConfirmar}
              >
                {saving === 'confirmada' ? <Cargando texto="Confirmando…" /> : 'Confirmar'}
              </button>
            )}
            {cancelar && (
              <button
                className="btn-ghost"
                disabled={saving !== null || !!cancelar.bloqueo}
                aria-busy={saving === 'cancelada'}
                onClick={() => setShowCancelModal(true)}
              >
                {saving === 'cancelada' ? <Cargando texto="Cancelando…" /> : 'Cancelar reserva'}
              </button>
            )}
          </div>
        )}
      </div>

      {confirmarAbono && (
        <ConfirmModal
          title="¿Confirmar sin el pago en línea?"
          message="¿Recibiste el abono por fuera de la pasarela (transferencia, Nequi…)? Al confirmar, el cliente recibe el correo de confirmación."
          confirmLabel="Sí, confirmar"
          busyLabel="Confirmando…"
          danger={false}
          cancelLabel="Volver"
          sobrePanel
          onConfirm={async () => { setConfirmarAbono(false); await cambiarEstado('confirmada') }}
          onCancel={() => setConfirmarAbono(false)}
        />
      )}

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div
          className="admin-modal-overlay admin-modal-overlay--panel"
          onClick={e => { e.stopPropagation(); setShowCancelModal(false) }}
        >
          <div className="admin-modal-carril">
          <div
            role="dialog"
            aria-modal="true"
            style={{ background: '#fff', borderRadius: 12, padding: 28, width: 400, maxWidth: '100%', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>
              Cancelar reserva de {reserva.nombre}
            </div>
            <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
              Se enviará un email al cliente notificando la cancelación.
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
              Motivo (opcional — se incluirá en el email)
            </label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Sin disponibilidad para esa fecha…"
              rows={3}
              style={{ width: '100%', borderRadius: 8, border: '1px solid var(--admin-border)', padding: '10px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>Volver</button>
              <button className="btn-ghost" onClick={confirmarCancelacion} disabled={saving !== null}>
                Confirmar cancelación
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
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
