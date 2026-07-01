'use client'
import { useState } from 'react'

export const TrashIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Eliminar',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setBusy(true)
    setError('')
    try {
      await onConfirm()
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.')
      setBusy(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={busy ? undefined : onCancel}>
      <div
        className="admin-modal"
        style={{ maxWidth: 400 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, padding: '24px 24px 0' }}>{title}</div>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, margin: '12px 24px 0' }}>{message}</p>

        {error && (
          <p style={{ color: 'var(--color-crimson)', fontSize: 13, margin: '10px 24px 0' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '24px' }}>
          <button className="btn-ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            style={danger ? { background: 'var(--color-crimson)' } : undefined}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Eliminando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
