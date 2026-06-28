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

  async function cambiarEstado(estado: EstadoReserva) {
    setSaving(true)
    const updated = await updateEstadoReserva(reserva.id, estado)
    onUpdated(updated)
    setSaving(false)
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
          {reserva.estado !== 'cancelada' && (
            <button
              className="btn-ghost"
              disabled={saving}
              onClick={() => cambiarEstado('cancelada')}
            >
              Cancelar reserva
            </button>
          )}
        </div>
      </div>
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
