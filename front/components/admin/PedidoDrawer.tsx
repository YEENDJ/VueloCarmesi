'use client'
import { useState } from 'react'
import type { AdminPedido, EstadoPedido } from '@/lib/admin/types'
import StatusBadge from './StatusBadge'
import PagosLista from './PagosLista'
import AvisoRevision from './AvisoRevision'
import ConfirmModal from './ConfirmModal'
import { updateEstadoPedido, getPedido, ErrorConMotivo } from '@/lib/admin/api'
import { useAvisar, Cargando } from './Avisos'
import { BloqueosEstado } from './BloqueosEstado'
import { codigoCorto } from '@/lib/admin/codigo'
import { esDePrueba } from '@/lib/admin/pagos'
import { formatPrecio } from '@/lib/format'
import {
  opcionesEstado, contextoPedido, confirmacionPedido, sePuedeDeshacer, ETIQUETA_ESTADO,
} from '@/lib/admin/transiciones'

export default function PedidoDrawer({
  pedido, onClose, onUpdated,
}: {
  pedido: AdminPedido
  onClose: () => void
  onUpdated: (p: AdminPedido) => void
}) {
  // '' = todavía no eligió: el select arranca en «Cambiar a…», no en el estado actual.
  const [estado, setEstado] = useState<EstadoPedido | ''>('')
  const [saving, setSaving] = useState(false)
  const [confirmar, setConfirmar] = useState<ReturnType<typeof confirmacionPedido>>(null)
  const avisar = useAvisar()
  const codigo = codigoCorto(pedido.id)

  // Solo lo que el backend va a aceptar (lib/admin/transiciones). Lo bloqueado
  // por la situación del momento se muestra desactivado, con su motivo.
  const opciones = opcionesEstado('pedido', pedido.estado, contextoPedido(pedido))
  const avances = opciones.filter(o => o.tipo === 'avance')
  const correcciones = opciones.filter(o => o.tipo === 'correccion')

  function aplicar() {
    if (!estado) return
    const pregunta = confirmacionPedido(pedido.estado, estado)
    if (pregunta) setConfirmar(pregunta)
    else cambiar(estado, pedido.estado)
  }

  async function cambiar(destino: EstadoPedido, desde: EstadoPedido) {
    setSaving(true)
    try {
      onUpdated(await updateEstadoPedido(pedido.id, destino))
      setEstado('')
      // «Deshacer» solo si el regreso es una corrección de la tabla: un
      // cancelado ya devolvió el stock y no tiene vuelta.
      avisar('exito', `Pedido ${codigo}: ahora ${ETIQUETA_ESTADO[destino]}`,
        sePuedeDeshacer('pedido', desde, destino)
          ? { etiqueta: 'Deshacer', alPulsar: () => cambiar(desde, destino) }
          : undefined)
    } catch (err) {
      // Lo más común: la pasarela lo cambió mientras el panel estaba abierto.
      // Se trae el estado real para que lo que se ve deje de estar viejo.
      avisar('error', err instanceof ErrorConMotivo
        ? `Pedido ${codigo}: ${err.message}. Se actualizó con su estado actual.`
        : `No se pudo cambiar el estado del pedido ${codigo}. Recarga la página e intenta de nuevo.`)
      getPedido(pedido.id).then(onUpdated).catch(() => {})
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-drawer" onClick={e => e.stopPropagation()}>
        <div className="admin-drawer-header">
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-gold)', marginBottom: 4 }}>
              Pedido {codigo}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-cream)' }}>{pedido.nombre}</div>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <StatusBadge estado={pedido.estado} />
              {esDePrueba(pedido) && <StatusBadge estado="prueba" />}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,234,202,.7)', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div className="admin-drawer-body">
          {pedido.estado === 'requiere_revision' && <AvisoRevision tipo="pedido" />}
          {pedido.estado === 'pendiente_pago' && pedido.venceEn && (
            <Field label="Esperando pago hasta">
              {new Date(pedido.venceEn).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' })}
            </Field>
          )}
          <Field label="Fecha">{new Date(pedido.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</Field>
          <Field label="Dirección de envío">{pedido.direccion}, {pedido.ciudad}{pedido.codigoPostal && ` (CP ${pedido.codigoPostal})`}</Field>
          <Field label="Teléfono">{pedido.telefono}</Field>
          <div style={{ height: 1, background: 'var(--admin-border)', margin: '16px 0' }} />

          <div className="admin-field-label" style={{ marginBottom: 10 }}>Items</div>
          {pedido.items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--admin-border-row)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{item.producto?.nombre ?? item.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>× {item.cantidad}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-amber)' }}>
                {formatPrecio(item.precio * item.cantidad)}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '2px solid var(--admin-border)' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-amber)' }}>
              {formatPrecio(pedido.total)}
            </span>
          </div>

          <PagosLista pagos={pedido.pagos} />
        </div>

        {/* Cancelado y vencido no tienen a dónde ir: sin pie. */}
        {opciones.length > 0 && (
          <div className="admin-drawer-footer" style={{ flexWrap: 'wrap' }}>
            <BloqueosEstado opciones={opciones} />
            <select
              className="admin-select"
              aria-label="Nuevo estado del pedido"
              value={estado}
              onChange={e => setEstado(e.target.value as EstadoPedido | '')}
              disabled={saving}
              style={{ flex: 1, minWidth: 0, minHeight: 44 }}
            >
              <option value="" disabled>Cambiar a…</option>
              {avances.map(o => (
                <option key={o.destino} value={o.destino} disabled={!!o.bloqueo}>
                  {ETIQUETA_ESTADO[o.destino]}{o.bloqueo ? ' (no disponible)' : ''}
                </option>
              ))}
              {correcciones.length > 0 && (
                <optgroup label="Corrección">
                  {correcciones.map(o => (
                    <option key={o.destino} value={o.destino}>↩ Volver a {ETIQUETA_ESTADO[o.destino]}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <button className="btn-primary" onClick={aplicar} disabled={saving || !estado} style={{ minHeight: 44 }} aria-busy={saving}>
              {saving ? <Cargando texto="Aplicando…" /> : 'Aplicar'}
            </button>
          </div>
        )}
      </div>

      {confirmar && estado && (
        <ConfirmModal
          title={confirmar.titulo}
          message={confirmar.mensaje}
          confirmLabel={confirmar.boton}
          busyLabel="Aplicando…"
          danger={estado === 'cancelado'}
          cancelLabel="Volver"
          sobrePanel
          onConfirm={async () => { setConfirmar(null); await cambiar(estado, pedido.estado) }}
          onCancel={() => setConfirmar(null)}
        />
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
