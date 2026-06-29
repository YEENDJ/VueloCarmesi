'use client'
import { useState } from 'react'
import type { AdminReserva, EstadoReserva } from '@/lib/admin/types'
import StatusBadge from './StatusBadge'
import { updateEstadoReserva } from '@/lib/admin/api'

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
  const [saving, setSaving] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [motivo, setMotivo] = useState('')

  async function cambiarEstado(estado: EstadoReserva, motivoTexto?: string) {
    setSaving(true)
    try {
      const updated = await updateEstadoReserva(reserva.id, estado, motivoTexto)
      onUpdated(updated)
    } finally {
      setSaving(false)
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
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-gold)', marginBottom: 4 }}>
              Detalle de Reserva
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-cream)' }}>
              {reserva.nombre}
            </div>
            <div style={{ marginTop: 6 }}>
              <StatusBadge estado={reserva.estado} />
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,234,202,.7)', fontSize: 20, cursor: 'pointer', padding: 4 }}
          >✕</button>
        </div>

        {/* Body */}
        <div className="admin-drawer-body">
          <Field label="Experiencia">{experienciaNombre}</Field>
          <Field label="Fecha">{new Date(reserva.fecha).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Field>
          <Field label="Personas">{reserva.cantidadPersonas}</Field>
          <div style={{ height: 1, background: 'var(--admin-border)', margin: '16px 0' }} />
          <Field label="Teléfono">{reserva.telefono}</Field>
          <Field label="Email">{reserva.email}</Field>
          {reserva.notas && <Field label="Notas">{reserva.notas}</Field>}
        </div>

        {/* Footer */}
        {reserva.estado !== 'cancelada' && (
          <div className="admin-drawer-footer">
            {reserva.estado !== 'confirmada' && (
              <button
                className="btn-primary"
                disabled={saving}
                onClick={() => cambiarEstado('confirmada')}
              >
                {saving ? '…' : 'Confirmar'}
              </button>
            )}
            <button
              className="btn-ghost"
              disabled={saving}
              onClick={() => setShowCancelModal(true)}
            >
              Cancelar reserva
            </button>
          </div>
        )}
      </div>

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 12, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}
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
              <button className="btn-ghost" onClick={confirmarCancelacion} disabled={saving}>
                {saving ? '…' : 'Confirmar cancelación'}
              </button>
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
