'use client'
import { useState, useEffect } from 'react'
import type { AdminExperiencia } from '@/lib/admin/types'
import { getExperienciasAdmin, updateExperiencia, deleteExperiencia } from '@/lib/admin/api'
import Toggle from '@/components/admin/Toggle'
import ExperienciaFormModal from '@/components/admin/ExperienciaFormModal'
import ConfirmModal, { TrashIcon } from '@/components/admin/ConfirmModal'

export default function ExperienciasPage() {
  const [experiencias, setExperiencias] = useState<AdminExperiencia[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<AdminExperiencia | null | 'new'>()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [experienciaAEliminar, setExperienciaAEliminar] = useState<AdminExperiencia | null>(null)

  useEffect(() => {
    getExperienciasAdmin().then(data => { setExperiencias(data); setLoading(false) })
  }, [])

  async function toggleDestacada(exp: AdminExperiencia) {
    setTogglingId(exp.id)
    const updated = await updateExperiencia(exp.id, { destacada: !exp.destacada })
    setExperiencias(prev => prev.map(e => e.id === updated.id ? updated : e))
    setTogglingId(null)
  }

  async function archivar(exp: AdminExperiencia) {
    if (!confirm(`¿Archivar "${exp.nombre}"? Dejará de aparecer en el sitio.`)) return
    const updated = await updateExperiencia(exp.id, { archivada: true })
    setExperiencias(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  async function restaurar(exp: AdminExperiencia) {
    const updated = await updateExperiencia(exp.id, { archivada: false })
    setExperiencias(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  async function eliminar() {
    if (!experienciaAEliminar) return
    await deleteExperiencia(experienciaAEliminar.id)
    setExperiencias(prev => prev.filter(e => e.id !== experienciaAEliminar.id))
    setExperienciaAEliminar(null)
  }

  function handleSaved(saved: AdminExperiencia) {
    setExperiencias(prev => {
      const idx = prev.findIndex(e => e.id === saved.id)
      return idx >= 0 ? prev.map(e => e.id === saved.id ? saved : e) : [saved, ...prev]
    })
    setModal(undefined)
  }

  const visibles = experiencias.filter(e => !e.archivada)
  const archivadas = experiencias.filter(e => e.archivada)

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Experiencias</div>
          <div className="admin-page-subtitle">{visibles.length} activas · {archivadas.length} archivadas</div>
        </div>
        <button className="btn-primary" onClick={() => setModal('new')}>+ Nueva experiencia</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Experiencia</th>
                <th style={{ textAlign: 'right' }}>Precio</th>
                <th style={{ textAlign: 'center' }}>Duración</th>
                <th style={{ textAlign: 'center' }}>Capacidad</th>
                <th style={{ textAlign: 'center' }}>Destacada</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(exp => (
                <tr key={exp.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{exp.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{exp.slug}</div>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-amber)', fontWeight: 700 }}>
                    ${exp.precio.toLocaleString('es-CO')}
                  </td>
                  <td style={{ textAlign: 'center' }}>{exp.duracion}</td>
                  <td style={{ textAlign: 'center' }}>{exp.capacidad} personas</td>
                  <td style={{ textAlign: 'center' }}>
                    <Toggle
                      checked={exp.destacada}
                      onChange={() => toggleDestacada(exp)}
                      disabled={togglingId === exp.id}
                    />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn-secondary btn-sm" onClick={() => setModal(exp)}>Editar</button>
                      <button className="btn-ghost btn-sm" onClick={() => archivar(exp)}>Archivar</button>
                      <button
                        className="btn-ghost btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                        onClick={() => setExperienciaAEliminar(exp)}
                      >
                        <TrashIcon /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {archivadas.map(exp => (
                <tr key={exp.id} style={{ opacity: 0.45 }}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{exp.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Archivada</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>${exp.precio.toLocaleString('es-CO')}</td>
                  <td style={{ textAlign: 'center' }}>{exp.duracion}</td>
                  <td style={{ textAlign: 'center' }}>{exp.capacidad}</td>
                  <td />
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn-ghost btn-sm" onClick={() => restaurar(exp)}>Restaurar</button>
                      <button
                        className="btn-ghost btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                        onClick={() => setExperienciaAEliminar(exp)}
                      >
                        <TrashIcon /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== undefined && (
        <ExperienciaFormModal
          experiencia={modal === 'new' ? null : modal}
          onClose={() => setModal(undefined)}
          onSaved={handleSaved}
        />
      )}

      {experienciaAEliminar && (
        <ConfirmModal
          title={`¿Eliminar "${experienciaAEliminar.nombre}"?`}
          message="Esta acción es permanente y no se puede deshacer. La experiencia no se podrá recuperar."
          onConfirm={eliminar}
          onCancel={() => setExperienciaAEliminar(null)}
        />
      )}
    </>
  )
}
