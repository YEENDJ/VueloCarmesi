'use client'
import { useState } from 'react'
import type { AdminAve } from '@/lib/admin/types'
import { createAve, updateAve } from '@/lib/admin/api'
import ImageUploader from './ImageUploader'

/** Mismo tope que valida el backend (MAX_ALT). */
const MAX_ALT = 200

type Tipo = AdminAve['tipo']

type FormData = {
  cientifico: string
  ingles: string
  local: string
  tipo: Tipo
  imagen: string
  foco: string
  alt: string
  altEn: string
}

const EMPTY: FormData = {
  cientifico: '', ingles: '', local: '', tipo: 'residente',
  imagen: '', foco: '50% 50%', alt: '', altEn: '',
}

export default function AveFormModal({
  ave,
  onClose,
  onSaved,
}: {
  ave: AdminAve | null
  onClose: () => void
  onSaved: (a: AdminAve) => void
}) {
  const isEdit = !!ave
  const [form, setForm] = useState<FormData>(
    ave
      ? {
          cientifico: ave.cientifico, ingles: ave.ingles, local: ave.local, tipo: ave.tipo,
          imagen: ave.imagen, foco: ave.foco, alt: ave.alt, altEn: ave.altEn,
        }
      : EMPTY,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  const conFoto = form.tipo === 'residente'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.cientifico.trim() || !form.ingles.trim() || !form.local.trim()) {
      setError('Los tres nombres son obligatorios')
      return
    }
    if (conFoto && !form.imagen) {
      setError('Las especies residentes necesitan foto')
      return
    }
    if (conFoto && !form.alt.trim()) {
      setError('Describe la foto: es lo que oye quien navega con lector de pantalla y lo que lee Google')
      return
    }
    setSaving(true)
    setError('')
    try {
      // Una migratoria no lleva foto (ver el modelo): si se cambió de tipo, se
      // limpia para que no quede una foto huérfana que nadie ve.
      const data = conFoto ? form : { ...form, imagen: '', foco: '50% 50%', alt: '', altEn: '' }
      const saved = isEdit ? await updateAve(ave!.id, data) : await createAve(data)
      setSaving(false)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error && err.message && !err.message.startsWith('API error')
        ? err.message
        : 'No se pudo guardar. Revisa la conexión e inténtalo de nuevo.')
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--grande" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div style={{ fontSize: 17, fontWeight: 700 }}>{isEdit ? 'Editar especie' : 'Nueva especie'}</div>
          <button
            onClick={onClose} aria-label="Cerrar"
            style={{
              background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
              color: 'var(--admin-text-muted)', minWidth: 44, minHeight: 44, padding: 0,
            }}
          >✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
          <div className="ave-form">
          {/* La vista previa va primero en el DOM: en móvil queda arriba, a la
              vista mientras se escribe; en escritorio el grid la pasa a la
              columna derecha y la deja fija al hacer scroll. */}
          <VistaPrevia form={form} />
          <div className="ave-form-campos">
            <div className="admin-form-row-3">
              <FormRow label="Nombre científico *">
                <input className="admin-input" value={form.cientifico} onChange={e => set('cientifico', e.target.value)} placeholder="Ej: Eurypyga helias" style={{ fontStyle: 'italic' }} />
              </FormRow>
              <FormRow label="Nombre en inglés *" ayuda="El que busca el birder">
                <input className="admin-input" value={form.ingles} onChange={e => set('ingles', e.target.value)} placeholder="Ej: Sunbittern" />
              </FormRow>
              <FormRow label="Nombre local *">
                <input className="admin-input" value={form.local} onChange={e => set('local', e.target.value)} placeholder="Ej: Tigana" />
              </FormRow>
            </div>

            <FormRow label="Tipo">
              <div className="admin-pills">
                {(['residente', 'migratoria'] as const).map(t => (
                  <button
                    key={t} type="button"
                    className={`admin-pill${form.tipo === t ? ' active' : ''}`}
                    style={{ minHeight: 44 }}
                    onClick={() => set('tipo', t)}
                  >
                    {t === 'residente' ? 'Residente · con foto' : 'Migratoria · sin foto'}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 6 }}>
                {conFoto
                  ? 'Va en la rejilla de fotos. Usa solo fotos tomadas en la finca: es lo que prueba el avistamiento.'
                  : 'Va en las fichas de texto de migratorias. No lleva foto porque no hay archivo propio.'}
              </div>
            </FormRow>

            {conFoto && (
              <>
                <ImageUploader value={form.imagen} onChange={url => set('imagen', url)} label="Foto *" />

                {form.imagen && (
                  <SelectorEncuadre
                    imagen={form.imagen}
                    foco={form.foco}
                    onChange={foco => set('foco', foco)}
                  />
                )}

                <FormRow label="Descripción de la foto *" ayuda="Qué se ve, en una frase">
                  <input
                    className="admin-input" maxLength={MAX_ALT}
                    value={form.alt} onChange={e => set('alt', e.target.value)}
                    placeholder="Ej: Tigana caminando entre la hierba a la orilla del agua"
                  />
                </FormRow>
                <FormRow label="Descripción en inglés" ayuda="Si la dejas vacía, o cambias la de español, se traduce sola al guardar">
                  <input
                    className="admin-input" maxLength={MAX_ALT}
                    value={form.altEn} onChange={e => set('altEn', e.target.value)}
                    placeholder="Se rellena automáticamente"
                  />
                </FormRow>
              </>
            )}

            {error && <div style={{ color: 'var(--color-crimson)', fontSize: 13 }}>{error}</div>}
          </div>
          </div>
          </div>
          <div className="admin-modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose} style={{ minHeight: 44 }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ minHeight: 44 }}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Elegir el encuadre tocando el ave sobre la foto entera.
 *
 * La tarjeta pública es 4:5 y casi todas las fotos son 4:3, así que el recorte
 * se come los lados. El porcentaje del clic va directo a `object-position`, que
 * es como lo pinta la página, y la vista previa lo refleja al instante: no hay
 * que adivinar números.
 */
function SelectorEncuadre({ imagen, foco, onChange }: {
  imagen: string
  foco: string
  onChange: (foco: string) => void
}) {
  const [x, y] = foco.split(' ').map(v => parseFloat(v) || 50)

  function elegir(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)))
    const py = Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)))
    onChange(`${px}% ${py}%`)
  }

  return (
    <div style={{ minWidth: 0 }}>
      <div className="admin-field-label">
        Encuadre
        <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)' }}> · Toca el ave en la foto y mira la vista previa</span>
      </div>
      <div
        onClick={elegir}
        role="presentation"
        style={{
          position: 'relative', width: '100%', maxWidth: 520,
          cursor: 'crosshair', borderRadius: 8, overflow: 'hidden', lineHeight: 0,
          border: '1px solid var(--admin-border)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagen} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
        <span aria-hidden="true" style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`, width: 22, height: 22,
          transform: 'translate(-50%, -50%)', borderRadius: '50%',
          border: '2px solid #fff', boxShadow: '0 0 0 2px var(--color-crimson), 0 2px 6px rgba(0,0,0,.4)',
          pointerEvents: 'none',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 12, color: 'var(--admin-text-muted)' }}>
        <span>Posición: {foco}</span>
        <button type="button" className="btn-ghost btn-sm" style={{ minHeight: 44 }} onClick={() => onChange('50% 50%')}>
          Centrar
        </button>
      </div>
    </div>
  )
}

/**
 * La tarjeta tal como va a salir en /aviturismo, con lo que hay escrito en el
 * formulario en este momento. Solo pinta el estado local: nada llega al
 * backend hasta que se pulsa Guardar.
 *
 * Usa el mismo marcado y las mismas clases que la página pública (las de
 * .avi-especie y .avi-pill en globals.css), así la vista previa no puede
 * desviarse de lo que se publica. Los textos de relleno van en gris para que
 * no se confundan con un nombre real.
 */
function VistaPrevia({ form }: { form: FormData }) {
  const relleno = (valor: string, texto: string) =>
    valor.trim() ? valor : <span style={{ opacity: 0.55 }}>{texto}</span>

  return (
    <aside className="ave-form-previa" aria-label="Vista previa">
      <div className="admin-field-label">Vista previa</div>

      {form.tipo === 'residente' ? (
        <div className="avi-especie ave-form-tarjeta">
          <div className="avi-especie-foto">
            {form.imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: form.foco }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: '30%', fontSize: 12, color: 'var(--admin-text-muted)', textAlign: 'center',
              }}>
                Aquí va la foto
              </div>
            )}
          </div>
          <div className="avi-especie-nombres">
            <b className="avi-especie-cientifico"><i>{relleno(form.cientifico, 'Nombre científico')}</i></b>
            <span className="avi-especie-ingles">{relleno(form.ingles, 'English name')}</span>
            <span className="avi-especie-local">{relleno(form.local, 'Nombre local')}</span>
          </div>
        </div>
      ) : (
        <div className="avi-pill">
          <b><i>{relleno(form.cientifico, 'Nombre científico')}</i></b>
          <span className="avi-pill-ingles">{relleno(form.ingles, 'English name')}</span>
          <span className="avi-pill-local">{relleno(form.local, 'Nombre local')}</span>
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 8 }}>
        Así se verá en la página. Se publica al pulsar Guardar.
      </div>
    </aside>
  )
}

function FormRow({ label, ayuda, children }: {
  label: string
  ayuda?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="admin-field-label">
        {label}
        {ayuda && (
          <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)' }}> · {ayuda}</span>
        )}
      </div>
      {children}
    </div>
  )
}
