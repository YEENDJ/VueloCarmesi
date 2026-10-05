'use client'
import { useState } from 'react'
import { IDIOMAS, type Idioma } from '@/lib/i18n/routing'
import { rutaPublica, vistaPreviaSlug, type EntidadConSlug } from '@/lib/admin/direccion-web'
import { cambiarSlug } from '@/lib/admin/api'

const NOMBRE_IDIOMA: Record<Idioma, string> = { es: 'Español', en: 'Inglés' }

/**
 * Las URLs públicas de una ficha y la única forma de cambiarlas.
 *
 * Vive fuera del «Guardar» del formulario a propósito. Renombrar una ficha ya
 * no mueve su URL —antes sí, y cada corrección de una tilde dejaba en 404 lo
 * que Google tenía indexado—, así que cambiarla tiene que ser algo que se hace
 * queriendo: un botón aparte, con confirmación, que guarda en el acto.
 *
 * La URL vieja no se pierde: el backend la guarda en el historial y la ficha
 * responde con un 308 a la nueva.
 */
export default function DireccionWeb<T extends { id: string; slug: string; slugs?: Record<string, string> }>({
  entidad,
  ficha,
  onCambiado,
}: {
  entidad: EntidadConSlug
  ficha: T
  onCambiado: (actualizada: T) => void
}) {
  const slugs: Record<string, string> = ficha.slugs ?? { es: ficha.slug }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--admin-text-muted)', margin: 0, minWidth: 0 }}>
        Cambiar el nombre no cambia la dirección. Si la cambias aquí, la anterior
        seguirá funcionando y llevará a la nueva.
      </p>
      {IDIOMAS.map(idioma => (
        <FilaIdioma
          key={idioma}
          entidad={entidad}
          id={ficha.id}
          idioma={idioma}
          slug={slugs[idioma]}
          onCambiado={nueva => onCambiado(nueva as T)}
        />
      ))}
    </div>
  )
}

function FilaIdioma({
  entidad, id, idioma, slug, onCambiado,
}: {
  entidad: EntidadConSlug
  id: string
  idioma: Idioma
  slug: string | undefined
  onCambiado: (actualizada: unknown) => void
}) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(slug ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const previa = vistaPreviaSlug(valor)

  async function guardar() {
    if (!previa) {
      setError('La dirección necesita al menos una letra o un número.')
      return
    }
    if (previa === slug) {
      setEditando(false)
      return
    }
    const ok = confirm(
      `¿Cambiar la dirección a ${rutaPublica(entidad, idioma, previa)}?\n\n` +
      'La actual seguirá funcionando y redirigirá a la nueva.',
    )
    if (!ok) return

    setGuardando(true)
    setError('')
    try {
      onCambiado(await cambiarSlug(entidad, id, previa, idioma))
      setEditando(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{
      border: '1px solid var(--admin-border)', borderRadius: 8, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
        <span className="admin-field-label" style={{ margin: 0 }}>{NOMBRE_IDIOMA[idioma]}</span>
        <code style={{
          flex: '1 1 160px', minWidth: 0, fontSize: 13, overflowWrap: 'anywhere',
          color: slug ? 'var(--color-brown)' : 'var(--admin-text-muted)',
        }}>
          {/* Sin traducción la ficha inglesa se sirve con el slug español, y
              no hay URL propia que cambiar todavía. */}
          {slug ? rutaPublica(entidad, idioma, slug) : 'Aún sin versión en inglés'}
        </code>
        {slug && !editando && (
          <button
            type="button" className="btn-ghost btn-sm" style={{ minHeight: 44 }}
            onClick={() => { setValor(slug); setError(''); setEditando(true) }}
          >
            Cambiar dirección
          </button>
        )}
      </div>

      {editando && (
        <>
          <input
            className="admin-input" value={valor} disabled={guardando}
            aria-label={`Nueva dirección en ${NOMBRE_IDIOMA[idioma].toLowerCase()}`}
            onChange={e => setValor(e.target.value)}
            // Enter dentro del formulario de la ficha lo enviaría entero: acá
            // solo tiene que guardar la dirección.
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); guardar() } }}
          />
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', overflowWrap: 'anywhere', minWidth: 0 }}>
            Quedará así: {previa ? rutaPublica(entidad, idioma, previa) : '—'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary btn-sm" style={{ minHeight: 44 }} disabled={guardando} onClick={guardar}>
              {guardando ? 'Guardando…' : 'Guardar dirección'}
            </button>
            <button type="button" className="btn-ghost btn-sm" style={{ minHeight: 44 }} disabled={guardando} onClick={() => setEditando(false)}>
              Cancelar
            </button>
          </div>
        </>
      )}

      {error && <div role="alert" style={{ color: 'var(--color-crimson)', fontSize: 13, minWidth: 0 }}>{error}</div>}
    </div>
  )
}
