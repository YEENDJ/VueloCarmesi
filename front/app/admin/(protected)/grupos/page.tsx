'use client'
import { useState, useEffect, useMemo } from 'react'
import type { AdminSolicitudGrupo, EstadoSolicitud } from '@/lib/admin/types'
import { ESTADOS_SOLICITUD } from '@/lib/admin/types'
import { getSolicitudesGrupo } from '@/lib/admin/api'
import StatusBadge from '@/components/admin/StatusBadge'
import StatCard from '@/components/admin/StatCard'
import SolicitudGrupoDrawer from '@/components/admin/SolicitudGrupoDrawer'
import { nombreTipo, fechaDia, haceCuanto, diasDesde, DIAS_ATRASO } from '@/components/admin/solicitudes-grupo'

type Filtro = 'todas' | EstadoSolicitud

const ROTULO_FILTRO: Record<Filtro, string> = {
  todas: 'Todas', nueva: 'Nuevas', contactada: 'Contactadas',
  cotizada: 'Cotizadas', cerrada: 'Cerradas', perdida: 'Perdidas',
}

const atrasada = (s: AdminSolicitudGrupo) => s.estado === 'nueva' && diasDesde(s.createdAt) >= DIAS_ATRASO

export default function GruposAdminPage() {
  const [solicitudes, setSolicitudes] = useState<AdminSolicitudGrupo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [selected, setSelected] = useState<AdminSolicitudGrupo | null>(null)

  useEffect(() => {
    getSolicitudesGrupo()
      .then(setSolicitudes)
      .catch((e: Error) => setError(
        e.message.includes('401')
          ? 'Tu sesión de administrador expiró. Vuelve a entrar.'
          : 'No se pudieron cargar las solicitudes. Revisa la conexión y recarga la página.',
      ))
      .finally(() => setLoading(false))
  }, [])

  const cuenta = useMemo(() => {
    const c = { todas: solicitudes.length } as Record<Filtro, number>
    for (const e of ESTADOS_SOLICITUD) c[e] = solicitudes.filter(s => s.estado === e).length
    return c
  }, [solicitudes])

  const lista = useMemo(
    () => (filtro === 'todas' ? solicitudes : solicitudes.filter(s => s.estado === filtro)),
    [solicitudes, filtro],
  )

  const atrasadas = solicitudes.filter(atrasada).length
  // Tasa de cierre sobre las que ya terminaron: contar las abiertas como
  // perdidas la hundiría cada vez que entra una solicitud nueva.
  const terminadas = cuenta.cerrada + cuenta.perdida
  const tasaCierre = terminadas ? `${Math.round((cuenta.cerrada / terminadas) * 100)}%` : '—'
  const personasCerradas = solicitudes
    .filter(s => s.estado === 'cerrada')
    .reduce((n, s) => n + s.personas, 0)

  function handleUpdated(updated: AdminSolicitudGrupo) {
    setSolicitudes(prev => prev.map(s => (s.id === updated.id ? updated : s)))
    setSelected(updated)
  }

  function handleDeleted(id: string) {
    setSolicitudes(prev => prev.filter(s => s.id !== id))
    setSelected(null)
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Cotizaciones de grupos</div>
          <div className="admin-page-subtitle">
            {solicitudes.length} solicitudes en total
            {atrasadas > 0 && (
              <span style={{ color: 'var(--status-pendiente-txt)' }}>
                {' '}· {atrasadas} {atrasadas === 1 ? 'nueva lleva' : 'nuevas llevan'} más de un día sin respuesta
              </span>
            )}
          </div>
        </div>
      </div>

      {!loading && !error && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <StatCard label="Sin atender" value={cuenta.nueva} icon="🔔" alerta={atrasadas > 0} />
          <StatCard label="Esperando respuesta" value={cuenta.cotizada} icon="⏳" />
          <StatCard label="Tasa de cierre" value={tasaCierre} icon="🎯" />
          <StatCard label="Personas en grupos cerrados" value={personasCerradas} icon="🏫" />
        </div>
      )}

      <div className="admin-pills" style={{ marginBottom: 20 }}>
        {(['todas', ...ESTADOS_SOLICITUD] as Filtro[]).map(f => (
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
          {filtro === 'todas'
            ? 'Todavía no ha llegado ninguna solicitud de grupo.'
            : `Sin solicitudes en «${ROTULO_FILTRO[filtro]}».`}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Recibida</th>
                <th>Institución</th>
                <th>Contacto</th>
                <th style={{ textAlign: 'center' }}>Personas</th>
                <th>Fecha tentativa</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(s => (
                <tr key={s.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(s.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <div style={{ fontSize: 12, color: atrasada(s) ? 'var(--status-pendiente-txt)' : 'var(--admin-text-muted)' }}>
                      {atrasada(s) ? `⚠ ${haceCuanto(s.createdAt)}` : haceCuanto(s.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{s.institucion}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{nombreTipo(s.tipo)}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{s.contacto}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{s.telefono}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{s.personas}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {s.fechaTentativa ? fechaDia(s.fechaTentativa) : <span style={{ color: 'var(--admin-text-muted)' }}>Sin definir</span>}
                  </td>
                  <td><StatusBadge estado={s.estado} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-secondary btn-sm" onClick={() => setSelected(s)}>Ver detalle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <SolicitudGrupoDrawer
          key={selected.id}
          solicitud={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
