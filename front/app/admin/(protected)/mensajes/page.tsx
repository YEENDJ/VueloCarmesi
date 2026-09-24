'use client'
import { useState, useEffect, useMemo } from 'react'
import type { AdminContacto, EstadoContacto } from '@/lib/admin/types'
import { ESTADOS_CONTACTO } from '@/lib/admin/types'
import { getContactos } from '@/lib/admin/api'
import StatusBadge from '@/components/admin/StatusBadge'
import ContactoDrawer from '@/components/admin/ContactoDrawer'
import { haceCuanto, diasDesde, DIAS_ATRASO } from '@/components/admin/solicitudes-grupo'

type Filtro = 'todos' | EstadoContacto

const ROTULO_FILTRO: Record<Filtro, string> = {
  todos: 'Todos', nuevo: 'Nuevos', respondido: 'Respondidos',
}

const atrasado = (c: AdminContacto) => c.estado === 'nuevo' && diasDesde(c.createdAt) >= DIAS_ATRASO

export default function MensajesAdminPage() {
  const [contactos, setContactos] = useState<AdminContacto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Arranca en «Nuevos»: es a lo que se entra aquí. Los respondidos se quedan
  // a un clic para cuando haga falta buscar una conversación vieja.
  const [filtro, setFiltro] = useState<Filtro>('nuevo')
  const [selected, setSelected] = useState<AdminContacto | null>(null)

  useEffect(() => {
    getContactos()
      .then(setContactos)
      .catch((e: Error) => setError(
        e.message.includes('401')
          ? 'Tu sesión de administrador expiró. Vuelve a entrar.'
          : 'No se pudieron cargar los mensajes. Revisa la conexión y recarga la página.',
      ))
      .finally(() => setLoading(false))
  }, [])

  const cuenta = useMemo(() => {
    const c = { todos: contactos.length } as Record<Filtro, number>
    for (const e of ESTADOS_CONTACTO) c[e] = contactos.filter(m => m.estado === e).length
    return c
  }, [contactos])

  const lista = useMemo(
    () => (filtro === 'todos' ? contactos : contactos.filter(m => m.estado === filtro)),
    [contactos, filtro],
  )

  const atrasados = contactos.filter(atrasado).length

  function handleUpdated(updated: AdminContacto) {
    setContactos(prev => prev.map(m => (m.id === updated.id ? updated : m)))
    setSelected(updated)
  }

  function handleDeleted(id: string) {
    setContactos(prev => prev.filter(m => m.id !== id))
    setSelected(null)
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Mensajes de contacto</div>
          <div className="admin-page-subtitle">
            {contactos.length} mensajes en total
            {atrasados > 0 && (
              <span style={{ color: 'var(--status-pendiente-txt)' }}>
                {' '}· {atrasados} {atrasados === 1 ? 'lleva' : 'llevan'} más de un día sin respuesta
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="admin-pills" style={{ marginBottom: 20 }}>
        {(['nuevo', 'respondido', 'todos'] as Filtro[]).map(f => (
          <button key={f} className={`admin-pill${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>
            {ROTULO_FILTRO[f]} ({cuenta[f] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>
      ) : error ? (
        <div role="alert" style={{ background: '#fff', borderRadius: 14, padding: 32, textAlign: 'center', color: 'var(--color-crimson)', fontSize: 14, fontWeight: 700 }}>
          {error}
        </div>
      ) : lista.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 14 }}>
          {filtro === 'todos'
            ? 'Todavía no ha llegado ningún mensaje por el formulario de contacto.'
            : filtro === 'nuevo'
              ? 'No hay mensajes pendientes de respuesta.'
              : `Sin mensajes en «${ROTULO_FILTRO[filtro]}».`}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Recibido</th>
                <th>De</th>
                <th>Mensaje</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(m => (
                <tr key={m.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(m.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <div style={{ fontSize: 12, color: atrasado(m) ? 'var(--status-pendiente-txt)' : 'var(--admin-text-muted)' }}>
                      {atrasado(m) ? `⚠ ${haceCuanto(m.createdAt)}` : haceCuanto(m.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{m.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', overflowWrap: 'anywhere' }}>{m.email}</div>
                  </td>
                  {/* Solo el arranque del mensaje: el texto entero está en el
                      detalle, y aquí uno largo estiraría la fila. */}
                  <td style={{ minWidth: 200, maxWidth: 320 }}>
                    <div style={{
                      fontSize: 13, color: 'var(--admin-text-muted)',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {m.mensaje}
                    </div>
                  </td>
                  <td><StatusBadge estado={m.estado} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-secondary btn-sm" onClick={() => setSelected(m)}>Ver detalle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ContactoDrawer
          key={selected.id}
          contacto={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
