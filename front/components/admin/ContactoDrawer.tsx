'use client'
import { useState } from 'react'
import type { AdminContacto } from '@/lib/admin/types'
import { updateEstadoContacto, deleteContacto } from '@/lib/admin/api'
import { whatsappCon, numeroWhatsapp } from '@/lib/contacto'
import StatusBadge from './StatusBadge'
import ConfirmModal, { TrashIcon } from './ConfirmModal'
import { haceCuanto } from './solicitudes-grupo'

export default function ContactoDrawer({
  contacto, onClose, onUpdated, onDeleted,
}: {
  contacto: AdminContacto
  onClose: () => void
  onUpdated: (c: AdminContacto) => void
  onDeleted: (id: string) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)

  // Dos estados y nada más: un botón que lo cambia al otro es más corto que
  // un desplegable con dos opciones y un «Aplicar».
  const siguiente = contacto.estado === 'nuevo' ? 'respondido' : 'nuevo'

  async function cambiarEstado() {
    setSaving(true)
    setError('')
    try {
      onUpdated(await updateEstadoContacto(contacto.id, siguiente))
    } catch {
      setError('No se pudo guardar el estado. Revisa la conexión e inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const telefono = contacto.telefono?.trim()
  const mensajeWhatsapp = `Hola ${contacto.nombre}, te escribimos de Vuelo Carmesí por el mensaje que nos dejaste en la web.`

  // El mensaje original citado debajo: quien lo recibe sabe a qué se le
  // contesta sin tener que buscarlo.
  const cuerpoCorreo = `\n\n\n—— Tu mensaje ——\n${contacto.mensaje}`
  const mailto =
    `mailto:${contacto.email}?subject=${encodeURIComponent('Tu mensaje a Vuelo Carmesí')}` +
    `&body=${encodeURIComponent(cuerpoCorreo)}`

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Mensaje de ${contacto.nombre}`}>
        <div className="admin-drawer-header">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-gold)', marginBottom: 4 }}>
              Mensaje de contacto
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-cream)', overflowWrap: 'anywhere' }}>
              {contacto.nombre}
            </div>
            <div style={{ marginTop: 6 }}><StatusBadge estado={contacto.estado} /></div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ background: 'none', border: 'none', color: 'rgba(255,234,202,.7)', fontSize: 20, cursor: 'pointer', minWidth: 44, minHeight: 44, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        <div className="admin-drawer-body">
          <Field label="Recibido">
            {new Date(contacto.createdAt).toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            <span style={{ color: 'var(--admin-text-muted)' }}> · {haceCuanto(contacto.createdAt)}</span>
          </Field>

          <Field label="Mensaje">
            <span style={{ whiteSpace: 'pre-wrap', fontWeight: 400, overflowWrap: 'anywhere' }}>{contacto.mensaje}</span>
          </Field>

          {/* El teléfono es opcional en el formulario: sin él, el correo es el
              único canal y va solo. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            <a className="btn-primary" href={mailto} style={accion}>Responder por correo</a>
            {telefono && (
              <>
                <a
                  className="btn-secondary"
                  href={whatsappCon(mensajeWhatsapp, numeroWhatsapp(telefono))}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={accion}
                >
                  WhatsApp
                </a>
                <a className="btn-secondary" href={`tel:${telefono.replace(/[^\d+]/g, '')}`} style={accion}>
                  Llamar
                </a>
              </>
            )}
          </div>

          <Field label="Correo"><span style={{ overflowWrap: 'anywhere' }}>{contacto.email}</span></Field>
          {telefono && <Field label="Teléfono">{telefono}</Field>}

          <button
            className="btn-ghost btn-sm"
            onClick={() => setConfirmarBorrado(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, minHeight: 44 }}
          >
            <TrashIcon /> Borrar mensaje
          </button>
        </div>

        <div className="admin-drawer-footer" style={{ flexWrap: 'wrap' }}>
          {error && <p role="alert" style={{ width: '100%', margin: 0, color: 'var(--color-crimson)', fontSize: 13 }}>{error}</p>}
          <button
            className={siguiente === 'respondido' ? 'btn-primary' : 'btn-secondary'}
            onClick={cambiarEstado}
            disabled={saving}
            style={{ flex: 1, minHeight: 44 }}
          >
            {saving ? '…' : siguiente === 'respondido' ? 'Marcar como respondido' : 'Volver a marcar como nuevo'}
          </button>
        </div>
      </div>

      {confirmarBorrado && (
        <div onClick={e => e.stopPropagation()}>
          <ConfirmModal
            title="Borrar mensaje"
            message={`Se borra para siempre el mensaje de ${contacto.nombre}. Úsalo para spam o pruebas: si ya lo contestaste, basta con marcarlo como respondido.`}
            onConfirm={async () => {
              await deleteContacto(contacto.id)
              onDeleted(contacto.id)
            }}
            onCancel={() => setConfirmarBorrado(false)}
          />
        </div>
      )}
    </div>
  )
}

const accion: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minHeight: 44, flex: '1 1 90px', textDecoration: 'none',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="admin-field-label">{label}</div>
      <div className="admin-field-value">{children}</div>
    </div>
  )
}
