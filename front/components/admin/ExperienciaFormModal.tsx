'use client'
import { useState } from 'react'
import type { AdminExperiencia } from '@/lib/admin/types'
import { createExperiencia, updateExperiencia } from '@/lib/admin/api'
import Toggle from './Toggle'
import ImagesUploader from './ImagesUploader'
import ListaEditable from './ListaEditable'

/** Donde Google recorta la meta description. Mismo tope que valida el backend. */
const MAX_META = 160

type FormData = {
  nombre: string
  descripcion: string
  descripcionLarga: string
  precio: string; duracion: string; capacidad: string
  horarios: string; puntoEncuentro: string; recomendaciones: string
  destacada: boolean
  imagenes: string[]
  incluye: string[]
  queTraer: string[]
  noIncluye: string[]
}

const EMPTY: FormData = {
  nombre: '', descripcion: '', descripcionLarga: '',
  precio: '', duracion: '', capacidad: '',
  horarios: '', puntoEncuentro: '', recomendaciones: '',
  destacada: false, imagenes: [], incluye: [], queTraer: [], noIncluye: [],
}

/**
 * Los siete campos que definen la anatomía de la ficha. Si falta uno, la página
 * pública se ve a medio hacer: sin foto el hero es un rectángulo liso, sin
 * relato la sección principal queda en dos frases, sin "incluye" desaparece un
 * bloque entero.
 */
function loQueFalta(f: FormData): string[] {
  const falta: string[] = []
  if (!f.nombre.trim()) falta.push('el nombre')
  if (!f.descripcionLarga.trim()) falta.push('la descripción larga')
  if (f.imagenes.length === 0) falta.push('al menos una foto')
  if (!f.precio) falta.push('el precio')
  if (!f.duracion.trim()) falta.push('la duración')
  if (!f.capacidad) falta.push('la capacidad')
  if (f.incluye.length === 0) falta.push('al menos un ítem en «Incluye»')
  return falta
}

export default function ExperienciaFormModal({
  experiencia,
  onClose,
  onSaved,
}: {
  experiencia: AdminExperiencia | null
  onClose: () => void
  onSaved: (e: AdminExperiencia) => void
}) {
  const isEdit = !!experiencia
  const [form, setForm] = useState<FormData>(
    experiencia
      ? {
          nombre: experiencia.nombre,
          descripcion: experiencia.descripcion ?? '',
          descripcionLarga: experiencia.descripcionLarga ?? '',
          precio: String(experiencia.precio),
          duracion: experiencia.duracion,
          capacidad: String(experiencia.capacidad),
          horarios: experiencia.horarios ?? '',
          puntoEncuentro: experiencia.puntoEncuentro ?? '',
          recomendaciones: experiencia.recomendaciones ?? '',
          destacada: experiencia.destacada,
          // Las fichas anteriores a la galería solo tienen portada suelta: se
          // adopta como primera foto para no perderla al editar.
          imagenes: experiencia.imagenes?.length
            ? experiencia.imagenes
            : experiencia.imagen ? [experiencia.imagen] : [],
          incluye: experiencia.incluye ?? [],
          queTraer: experiencia.queTraer ?? [],
          noIncluye: experiencia.noIncluye ?? [],
        }
      : EMPTY
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  const falta = loQueFalta(form)
  const metaExcedida = form.descripcion.length > MAX_META

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Crear exige la ficha completa. Editar no: una ficha vieja incompleta debe
    // poder corregirse de precio sin obligar a rellenarla entera primero.
    if (!isEdit && falta.length > 0) {
      setError(`Para crear la experiencia falta ${falta.join(', ')}.`)
      return
    }
    if (metaExcedida) {
      setError(`La descripción para buscadores no puede pasar de ${MAX_META} caracteres.`)
      return
    }

    setSaving(true)
    setError('')
    try {
      // `imagen` no se manda: el backend la deriva de imagenes[0].
      const data = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        descripcionLarga: form.descripcionLarga,
        precio: Number(form.precio),
        duracion: form.duracion,
        capacidad: Number(form.capacidad),
        horarios: form.horarios,
        puntoEncuentro: form.puntoEncuentro,
        recomendaciones: form.recomendaciones,
        destacada: form.destacada,
        imagenes: form.imagenes,
        incluye: form.incluye,
        queTraer: form.queTraer,
        noIncluye: form.noIncluye,
      }
      const saved = isEdit
        ? await updateExperiencia(experiencia!.id, data)
        : await createExperiencia(data)
      onSaved(saved)
    } catch {
      setError('No se pudo guardar. Revisa la conexión e inténtalo de nuevo.')
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--grande" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div style={{ fontSize: 17, fontWeight: 700, minWidth: 0 }}>
            {isEdit ? 'Editar experiencia' : 'Nueva experiencia'}
          </div>
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

            {/* Al editar no se bloquea, se avisa: así se ve de un vistazo qué le
                falta a esta ficha para verse como las demás. */}
            {isEdit && falta.length > 0 && (
              <div
                role="status"
                style={{
                  background: 'rgba(245,156,0,0.12)',
                  border: '1px solid rgba(245,156,0,0.45)',
                  borderRadius: 8, padding: '12px 14px',
                  fontSize: 13, lineHeight: 1.6, color: 'var(--color-brown)', minWidth: 0,
                }}
              >
                <strong>Ficha incompleta.</strong> En el sitio se verá distinta a las
                demás porque falta {falta.join(', ')}. Puedes guardar igual.
              </div>
            )}

            <Seccion titulo="Identidad" />
            <FormRow label="Nombre *">
              <input className="admin-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Ruta del Cacao" />
            </FormRow>
            <FormRow
              label="Descripción para buscadores"
              ayuda="El texto que Google muestra bajo el título. Vacío = se toma del relato"
            >
              <textarea
                className="admin-input" rows={2} style={{ resize: 'vertical' }}
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Una frase que dé ganas de hacer clic desde el buscador."
              />
              <div style={{
                fontSize: 12, marginTop: 4, textAlign: 'right',
                color: metaExcedida ? 'var(--color-crimson)' : 'var(--admin-text-muted)',
              }}>
                {form.descripcion.length} / {MAX_META}
              </div>
            </FormRow>

            <Seccion titulo="Relato" />
            <FormRow
              label="Descripción larga *"
              ayuda="El texto principal de la ficha. El primer párrafo va destacado"
            >
              <textarea
                className="admin-input" rows={9} style={{ resize: 'vertical' }}
                value={form.descripcionLarga}
                onChange={e => set('descripcionLarga', e.target.value)}
                placeholder={'Una frase de apertura que enganche.\n\nY luego el detalle: qué se hace, cómo transcurre, qué se lleva el visitante. Deja una línea en blanco entre párrafos.'}
              />
            </FormRow>

            <Seccion titulo="Fotos" />
            <ImagesUploader
              value={form.imagenes}
              onChange={urls => set('imagenes', urls)}
              label="Fotos de la experiencia *"
            />

            <Seccion titulo="Datos prácticos" />
            <div className="admin-form-row-3">
              <FormRow label="Precio ($) *">
                <input className="admin-input" type="number" min={0} value={form.precio} onChange={e => set('precio', e.target.value)} placeholder="95000" />
              </FormRow>
              <FormRow label="Duración *">
                <input className="admin-input" value={form.duracion} onChange={e => set('duracion', e.target.value)} placeholder="4 horas" />
              </FormRow>
              <FormRow label="Capacidad *">
                <input className="admin-input" type="number" min={1} value={form.capacidad} onChange={e => set('capacidad', e.target.value)} placeholder="12" />
              </FormRow>
            </div>
            {/* Textarea y no input de una línea: en las fichas reales esto no es
                "martes a domingo", es el itinerario —5:30 salida, 8:00 desayuno,
                media mañana observación—, y la ficha ya lo pinta con saltos de
                línea (white-space: pre-line). En un input esos saltos no se
                pueden escribir y la primera edición desde el panel los aplasta
                todos en un renglón. */}
            <FormRow label="Cuándo se realiza" ayuda="Días, horas o el itinerario, una línea por tramo">
              <textarea
                className="admin-input" rows={3} style={{ resize: 'vertical' }}
                value={form.horarios}
                onChange={e => set('horarios', e.target.value)}
                placeholder={'5:30 a. m. — salida con binoculares\n8:00 a. m. — desayuno en la finca'}
              />
            </FormRow>
            <FormRow
              label="Punto de encuentro"
              ayuda="Solo si esta experiencia NO sale del punto habitual"
            >
              <input className="admin-input" value={form.puntoEncuentro} onChange={e => set('puntoEncuentro', e.target.value)} placeholder="Déjalo vacío para usar el de Configuración" />
            </FormRow>
            <FormRow label="Ten en cuenta" ayuda="Edad mínima, condición física, advertencias">
              <textarea
                className="admin-input" rows={2} style={{ resize: 'vertical' }}
                value={form.recomendaciones}
                onChange={e => set('recomendaciones', e.target.value)}
                placeholder="Desde 8 años. Requiere caminar 40 minutos por terreno irregular."
              />
            </FormRow>

            <Seccion titulo="Listas" />
            <ListaEditable
              label="¿Qué incluye? *" ayuda="Una viñeta por ítem"
              placeholder="Ej: Guía especializado"
              value={form.incluye} onChange={items => set('incluye', items)}
            />
            <ListaEditable
              label="¿Qué traer?" ayuda="Opcional"
              placeholder="Ej: Calzado cerrado"
              value={form.queTraer} onChange={items => set('queTraer', items)}
            />
            <ListaEditable
              label="¿Qué NO incluye?" ayuda="Opcional. Evita malentendidos"
              placeholder="Ej: Transporte hasta la finca"
              value={form.noIncluye} onChange={items => set('noIncluye', items)}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Toggle checked={form.destacada} onChange={v => set('destacada', v)} />
              <span style={{ fontSize: 14, fontWeight: 700, minWidth: 0 }}>Destacar en el sitio público</span>
            </div>

            {error && <div style={{ color: 'var(--color-crimson)', fontSize: 13, minWidth: 0 }}>{error}</div>}
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose} style={{ minHeight: 44 }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ minHeight: 44 }}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Separador de sección: con trece campos, el formulario necesita respiraderos. */
function Seccion({ titulo }: { titulo: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, minWidth: 0,
      marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(135,43,19,0.12)',
    }}>
      <span className="admin-field-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>{titulo}</span>
    </div>
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
