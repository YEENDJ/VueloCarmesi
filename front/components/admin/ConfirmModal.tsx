'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ErrorConMotivo, type BloqueoBorrado } from '@/lib/admin/api'

export const TrashIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

interface AvisoModalProps {
  title: string
  bloqueo: BloqueoBorrado
  /** «Ver pedido», «Ver reserva». */
  verLabel: string
  /** A dónde lleva cada fila. Si se da `onVer` en su lugar, abre en la misma página. */
  hrefDe?: (id: string) => string
  onVer?: (id: string) => void
  onClose: () => void
}

/**
 * Aviso de que algo no se puede eliminar todavía. No hay nada que confirmar: lo
 * que sirve es llegar a cada pedido o reserva que lo impide y resolverlo.
 */
export function AvisoModal({ title, bloqueo, verLabel, hrefDe, onVer, onClose }: AvisoModalProps) {
  // 44px de alto: se toca con el dedo en el celular.
  const enlace = {
    display: 'inline-flex', alignItems: 'center', minHeight: 44,
    fontSize: 13, fontWeight: 700, color: 'var(--color-crimson)', whiteSpace: 'nowrap',
  } as const
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" role="alertdialog" aria-labelledby="aviso-titulo" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div id="aviso-titulo" style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, padding: '24px 24px 0' }}>{title}</div>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, margin: '12px 24px 0' }}>{bloqueo.resumen}</p>

        {bloqueo.pendientes.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '16px 24px 0', padding: 0 }}>
            {bloqueo.pendientes.map(p => (
              <li key={p.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--admin-border-row)' }}>
                <span style={{ fontSize: 14, minWidth: 0 }}>
                  <strong>{p.etiqueta}</strong>
                  <span style={{ color: 'var(--admin-text-muted)' }}> · {p.estado}</span>
                </span>
                {hrefDe ? (
                  <Link href={hrefDe(p.id)} style={enlace}>{verLabel} →</Link>
                ) : onVer ? (
                  <button type="button" className="btn-ghost btn-sm" style={enlace} onClick={() => onVer(p.id)}>{verLabel} →</button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {bloqueo.restantes > 0 && (
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: '10px 24px 0' }}>
            y {bloqueo.restantes} más
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '24px' }}>
          <button className="btn-primary" onClick={onClose} autoFocus>Entendido</button>
        </div>
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  /** Lo que dice el botón mientras trabaja. */
  busyLabel?: string
  danger?: boolean
  /** El botón de salir. «Volver» cuando la acción misma es cancelar algo. */
  cancelLabel?: string
  /**
   * Se abre desde un detalle (el panel lateral): se centra sobre ese panel y
   * no sobre la página, que es donde está mirando quien lo abrió.
   */
  sobrePanel?: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Eliminar',
  busyLabel = 'Eliminando…',
  danger = true,
  cancelLabel = 'Cancelar',
  sobrePanel = false,
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
    } catch (err) {
      // El motivo del backend («tiene 2 pedidos sin despachar…») dice qué hacer;
      // un fallo sin motivo se queda en el mensaje genérico.
      setError(err instanceof ErrorConMotivo ? err.message : 'Ocurrió un error. Inténtalo de nuevo.')
      setBusy(false)
    }
  }

  return (
    // stopPropagation en el fondo: dentro de un detalle, el clic para cerrar el
    // modal seguía hasta el fondo del detalle y lo cerraba también.
    <div
      className={`admin-modal-overlay${sobrePanel ? ' admin-modal-overlay--panel' : ''}`}
      onClick={e => { e.stopPropagation(); if (!busy) onCancel() }}
    >
      <div className={sobrePanel ? 'admin-modal-carril' : undefined} style={sobrePanel ? undefined : { display: 'contents' }}>
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
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
            {cancelLabel}
          </button>
          <button
            className="btn-primary"
            style={danger ? { background: 'var(--color-crimson)' } : undefined}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
