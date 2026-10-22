'use client'
import { useState, useEffect, useMemo } from 'react'
import type { AdminAve } from '@/lib/admin/types'
import { getAvesAdmin, deleteAve, reordenarAves } from '@/lib/admin/api'
import { revalidateAves } from '@/app/actions/revalidate'
import AveFormModal from '@/components/admin/AveFormModal'
import ConfirmModal, { TrashIcon } from '@/components/admin/ConfirmModal'

type Tipo = AdminAve['tipo']

const GRUPOS: { tipo: Tipo; titulo: string; ayuda: string }[] = [
  { tipo: 'residente', titulo: 'Residentes', ayuda: 'La rejilla de fotos de /aviturismo, en este orden.' },
  { tipo: 'migratoria', titulo: 'Migratorias', ayuda: 'La foto es opcional: con foto salen en tarjeta como las residentes, sin foto en fichas de texto.' },
]

export default function AvesPage() {
  const [aves, setAves] = useState<AdminAve[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [moviendo, setMoviendo] = useState(false)
  const [modal, setModal] = useState<AdminAve | null | 'new'>()
  const [aEliminar, setAEliminar] = useState<AdminAve | null>(null)

  useEffect(() => {
    getAvesAdmin()
      .then(setAves)
      .catch(() => setError('No se pudo cargar la lista. Recarga la página.'))
      .finally(() => setLoading(false))
  }, [])

  const porTipo = useMemo(() => {
    const ordenadas = [...aves].sort((a, b) => a.orden - b.orden)
    return {
      residente: ordenadas.filter(a => a.tipo === 'residente'),
      migratoria: ordenadas.filter(a => a.tipo === 'migratoria'),
    }
  }, [aves])

  /**
   * Intercambia con la vecina y manda el orden completo del grupo. Se manda la
   * lista entera y no solo las dos posiciones: si los `orden` guardados tenían
   * huecos o repetidos, esto los deja limpios de 1 en adelante.
   */
  async function mover(tipo: Tipo, indice: number, paso: -1 | 1) {
    const grupo = [...porTipo[tipo]]
    const destino = indice + paso
    if (destino < 0 || destino >= grupo.length) return
    ;[grupo[indice], grupo[destino]] = [grupo[destino], grupo[indice]]

    setMoviendo(true)
    setError('')
    try {
      setAves(await reordenarAves(grupo.map(a => a.id)))
      await revalidateAves()
    } catch {
      setError('No se pudo cambiar el orden. Inténtalo de nuevo.')
    } finally {
      setMoviendo(false)
    }
  }

  async function confirmarEliminar() {
    if (!aEliminar) return
    await deleteAve(aEliminar.id)
    setAves(prev => prev.filter(a => a.id !== aEliminar.id))
    setAEliminar(null)
    await revalidateAves()
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Aves</div>
          <div className="admin-page-subtitle">
            {porTipo.residente.length} residentes · {porTipo.migratoria.length} migratorias
          </div>
        </div>
        <button className="btn-primary" style={{ minHeight: 44 }} onClick={() => setModal('new')}>
          + Nueva especie
        </button>
      </div>

      {error && <p style={{ color: 'var(--color-crimson)', fontSize: 14, marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>
      ) : (
        GRUPOS.map(({ tipo, titulo, ayuda }) => (
          <section key={tipo} style={{ marginBottom: 28 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{titulo}</div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{ayuda}</div>
            </div>

            {porTipo[tipo].length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
                No hay ninguna. En la página no se muestra este grupo hasta que agregues una.
              </p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 96 }}>Orden</th>
                      <th style={{ width: 64 }}>Foto</th>
                      <th>Especie</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porTipo[tipo].map((a, i, grupo) => (
                      <tr key={a.id}>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              className="btn-ghost btn-sm" style={{ minWidth: 44, minHeight: 44 }}
                              disabled={moviendo || i === 0}
                              onClick={() => mover(tipo, i, -1)}
                              aria-label={`Subir ${a.local}`}
                            >↑</button>
                            <button
                              className="btn-ghost btn-sm" style={{ minWidth: 44, minHeight: 44 }}
                              disabled={moviendo || i === grupo.length - 1}
                              onClick={() => mover(tipo, i, 1)}
                              aria-label={`Bajar ${a.local}`}
                            >↓</button>
                          </div>
                        </td>
                        <td>
                          {/* Miniatura con el mismo encuadre que la tarjeta pública.
                              Una migratoria sin foto deja la celda con un guion. */}
                          {a.imagen ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={a.imagen} alt="" loading="lazy" decoding="async"
                              style={{
                                width: 48, height: 60, objectFit: 'cover', objectPosition: a.foco,
                                borderRadius: 6, display: 'block', background: 'var(--admin-bg)',
                              }}
                            />
                          ) : (
                            <span aria-label="Sin foto" style={{ color: 'var(--admin-text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700 }}>{a.local}</div>
                          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                            <i>{a.cientifico}</i> · {a.ingles}
                          </div>
                          {a.imagen && !a.altEn && (
                            <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
                              ⚠️ Sin descripción en inglés: ábrela y guarda para traducirla
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn-secondary btn-sm" style={{ minHeight: 44 }} onClick={() => setModal(a)}>Editar</button>
                            <button
                              className="btn-ghost btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: 5, minHeight: 44 }}
                              onClick={() => setAEliminar(a)}
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
          </section>
        ))
      )}

      {modal !== undefined && (
        <AveFormModal
          ave={modal === 'new' ? null : modal}
          onClose={() => setModal(undefined)}
          onSaved={async saved => {
            setAves(prev => {
              const idx = prev.findIndex(a => a.id === saved.id)
              return idx >= 0 ? prev.map(a => (a.id === saved.id ? saved : a)) : [...prev, saved]
            })
            setModal(undefined)
            await revalidateAves()
          }}
        />
      )}
      {aEliminar && (
        <ConfirmModal
          title={`¿Eliminar «${aEliminar.local}»?`}
          message="Deja de verse en la página de aviturismo. Esta acción no se puede deshacer."
          onConfirm={confirmarEliminar}
          onCancel={() => setAEliminar(null)}
        />
      )}
    </>
  )
}
