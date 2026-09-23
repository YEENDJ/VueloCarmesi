'use client'
import { useState } from 'react'
import type { AdminSolicitudGrupo, EstadoSolicitud } from '@/lib/admin/types'
import { ESTADOS_SOLICITUD } from '@/lib/admin/types'
import { updateEstadoSolicitud, deleteSolicitudGrupo } from '@/lib/admin/api'
import { whatsappCon } from '@/lib/contacto'
import StatusBadge from './StatusBadge'
import ConfirmModal, { TrashIcon } from './ConfirmModal'
import { nombreExperiencia, nombreTipo, fechaDia, haceCuanto } from './solicitudes-grupo'

/**
 * Qué significa cada estado, en el desplegable. El valor solo no alcanza:
 * «cerrada» se lee igual como «ganada» que como «descartada».
 */
const DESCRIPCION: Record<EstadoSolicitud, string> = {
  nueva: 'Nueva — nadie la ha atendido',
  contactada: 'Contactada — ya le escribimos o llamamos',
  cotizada: 'Cotizada — enviamos precio, esperamos respuesta',
  cerrada: 'Cerrada — el grupo confirmó la visita',
  perdida: 'Perdida — no se dio',
}

/**
 * El número tal como lo escribió el coordinador, listo para wa.me.
 *
 * El formulario acepta «311 000 0000» sin indicativo, y wa.me sin indicativo
 * abre un chat con un número de otro país. Diez dígitos que empiezan por 3 son
 * un celular colombiano: se les antepone el 57. Cualquier otra cosa se deja
 * como vino, porque adivinar el país de un número extranjero es peor.
 */
function numeroWhatsapp(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '')
  return digitos.length === 10 && digitos.startsWith('3') ? `57${digitos}` : digitos
}

export default function SolicitudGrupoDrawer({
  solicitud, onClose, onUpdated, onDeleted,
}: {
  solicitud: AdminSolicitudGrupo
  onClose: () => void
  onUpdated: (s: AdminSolicitudGrupo) => void
  onDeleted: (id: string) => void
}) {
  const [estado, setEstado] = useState<EstadoSolicitud>(solicitud.estado)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)

  async function aplicar() {
    if (estado === solicitud.estado) return
    setSaving(true)
    setError('')
    try {
      onUpdated(await updateEstadoSolicitud(solicitud.id, estado))
    } catch {
      setError('No se pudo guardar el estado. Revisa la conexión e inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const mensajeWhatsapp =
    `Hola ${solicitud.contacto}, te escribimos de Vuelo Carmesí por la solicitud de cotización de ${solicitud.institucion}.`

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Solicitud de ${solicitud.institucion}`}>
        <div className="admin-drawer-header">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-gold)', marginBottom: 4 }}>
              {nombreTipo(solicitud.tipo)} · {solicitud.personas} personas
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-cream)', overflowWrap: 'anywhere' }}>
              {solicitud.institucion}
            </div>
            <div style={{ marginTop: 6 }}><StatusBadge estado={solicitud.estado} /></div>
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
          <Field label="Recibida">
            {new Date(solicitud.createdAt).toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            <span style={{ color: 'var(--admin-text-muted)' }}> · {haceCuanto(solicitud.createdAt)}</span>
          </Field>

          <Field label="Contacto">
            {solicitud.contacto}
            {solicitud.cargo && <span style={{ color: 'var(--admin-text-muted)' }}> · {solicitud.cargo}</span>}
          </Field>

          {/* Responder es lo primero que se hace con una solicitud nueva, así
              que los tres canales van a la vista y con el mensaje ya escrito. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            <a
              className="btn-primary"
              href={whatsappCon(mensajeWhatsapp, numeroWhatsapp(solicitud.telefono))}
              target="_blank"
              rel="noopener noreferrer"
              style={accion}
            >
              WhatsApp
            </a>
            <a className="btn-secondary" href={`tel:${solicitud.telefono.replace(/[^\d+]/g, '')}`} style={accion}>
              Llamar
            </a>
            <a
              className="btn-secondary"
              href={`mailto:${solicitud.email}?subject=${encodeURIComponent(`Cotización para ${solicitud.institucion} — Vuelo Carmesí`)}`}
              style={accion}
            >
              Correo
            </a>
          </div>

          <Field label="Teléfono">{solicitud.telefono}</Field>
          <Field label="Correo"><span style={{ overflowWrap: 'anywhere' }}>{solicitud.email}</span></Field>

          <div style={{ height: 1, background: 'var(--admin-border)', margin: '16px 0' }} />

          <Field label="Personas">{solicitud.personas}</Field>
          {solicitud.edades && <Field label="Edades">{solicitud.edades}</Field>}
          <Field label="Fecha tentativa">
            {solicitud.fechaTentativa ? fechaDia(solicitud.fechaTentativa) : 'Sin definir'}
          </Field>
          <Field label="Experiencias">
            {solicitud.experiencias.length
              ? solicitud.experiencias.map(nombreExperiencia).join(', ')
              : 'A definir'}
          </Field>
          <Field label="Factura">
            {solicitud.requiereFactura ? `Sí${solicitud.nit ? ` · NIT ${solicitud.nit}` : ' · sin NIT'}` : 'No'}
          </Field>
          {solicitud.mensaje && (
            <Field label="Mensaje">
              <span style={{ whiteSpace: 'pre-wrap', fontWeight: 400, overflowWrap: 'anywhere' }}>{solicitud.mensaje}</span>
            </Field>
          )}

          <button
            className="btn-ghost btn-sm"
            onClick={() => setConfirmarBorrado(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, minHeight: 44 }}
          >
            <TrashIcon /> Borrar solicitud
          </button>
        </div>

        <div className="admin-drawer-footer" style={{ flexWrap: 'wrap' }}>
          {error && <p role="alert" style={{ width: '100%', margin: 0, color: 'var(--color-crimson)', fontSize: 13 }}>{error}</p>}
          <select
            className="admin-select"
            aria-label="Estado de la solicitud"
            value={estado}
            onChange={e => setEstado(e.target.value as EstadoSolicitud)}
            style={{ flex: '1 1 200px', minWidth: 0, minHeight: 44 }}
          >
            {ESTADOS_SOLICITUD.map(e => <option key={e} value={e}>{DESCRIPCION[e]}</option>)}
          </select>
          <button className="btn-primary" onClick={aplicar} disabled={saving || estado === solicitud.estado} style={{ minHeight: 44 }}>
            {saving ? '…' : 'Aplicar'}
          </button>
        </div>
      </div>

      {confirmarBorrado && (
        <div onClick={e => e.stopPropagation()}>
          <ConfirmModal
            title="Borrar solicitud"
            message={`Se borra para siempre la solicitud de ${solicitud.institucion}. Úsalo para spam o pruebas: si la cotización no se dio, márcala como «Perdida» para que cuente.`}
            onConfirm={async () => {
              await deleteSolicitudGrupo(solicitud.id)
              onDeleted(solicitud.id)
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
