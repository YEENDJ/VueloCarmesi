'use client'
import { useState } from 'react'
import type { AdminExperiencia } from '@/lib/admin/types'
import { createExperiencia, updateExperiencia } from '@/lib/admin/api'
import Toggle from './Toggle'
import ImagesUploader from './ImagesUploader'
import ListaEditable from './ListaEditable'

/** Mismo tope que valida el backend: pasarlo devuelve 400. */
const MAX_DESCRIPCION_CORTA = 200

type FormData = {
  nombre: string
  descripcion: string
  descripcionLarga: string
  precio: string; duracion: string; capacidad: string
  destacada: boolean
  imagenes: string[]
  incluye: string[]
  queTraer: string[]
}

const EMPTY: FormData = {
  nombre: '', descripcion: '', descripcionLarga: '',
  precio: '', duracion: '', capacidad: '',
  destacada: false, imagenes: [], incluye: [], queTraer: [],
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
          descripcion: experiencia.descripcion,
          descripcionLarga: experiencia.descripcionLarga ?? '',
          precio: String(experiencia.precio),
          duracion: experiencia.duracion,
          capacidad: String(experiencia.capacidad),
          destacada: experiencia.destacada,
          // Las fichas creadas antes de la galería solo tienen portada suelta:
          // se adopta como primera foto para no perderla al editar.
          imagenes: experiencia.imagenes?.length
            ? experiencia.imagenes
            : experiencia.imagen ? [experiencia.imagen] : [],
          incluye: experiencia.incluye ?? [],
          queTraer: experiencia.queTraer ?? [],
        }
      : EMPTY
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  const cortaExcedida = form.descripcion.length > MAX_DESCRIPCION_CORTA

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.precio || !form.duracion || !form.capacidad) {
      setError('Completa todos los campos requeridos')
      return
    }
    if (cortaExcedida) {
      setError(`La descripción corta no puede pasar de ${MAX_DESCRIPCION_CORTA} caracteres`)
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
        destacada: form.destacada,
        imagenes: form.imagenes,
        incluye: form.incluye,
        queTraer: form.queTraer,
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
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div style={{ fontSize: 17, fontWeight: 700 }}>{isEdit ? 'Editar experiencia' : 'Nueva experiencia'}</div>
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
            <FormRow label="Nombre *">
              <input className="admin-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Cacao Intenso" />
            </FormRow>

            <FormRow
              label="Descripción corta *"
              ayuda="Es la que se ve en la tarjeta del listado y en Google"
            >
              <textarea
                className="admin-input" rows={2} style={{ resize: 'vertical' }}
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Una o dos frases que inviten a entrar."
              />
              <div style={{
                fontSize: 12, marginTop: 4, textAlign: 'right',
                color: cortaExcedida ? 'var(--color-crimson)' : 'var(--admin-text-muted)',
              }}>
                {form.descripcion.length} / {MAX_DESCRIPCION_CORTA}
              </div>
            </FormRow>

            <FormRow
              label="Descripción larga"
              ayuda="El texto completo de la ficha. Si se deja vacía se usa la corta"
            >
              <textarea
                className="admin-input" rows={7} style={{ resize: 'vertical' }}
                value={form.descripcionLarga}
                onChange={e => set('descripcionLarga', e.target.value)}
                placeholder="Todo el detalle: qué se hace, cómo transcurre, qué se lleva el visitante."
              />
            </FormRow>

            <div className="admin-form-row-3">
              <FormRow label="Precio (COP) *">
                <input className="admin-input" type="number" min={0} value={form.precio} onChange={e => set('precio', e.target.value)} placeholder="8500" />
              </FormRow>
              <FormRow label="Duración *">
                <input className="admin-input" value={form.duracion} onChange={e => set('duracion', e.target.value)} placeholder="4 horas" />
              </FormRow>
              <FormRow label="Capacidad *">
                <input className="admin-input" type="number" min={1} value={form.capacidad} onChange={e => set('capacidad', e.target.value)} placeholder="12" />
              </FormRow>
            </div>

            <ImagesUploader
              value={form.imagenes}
              onChange={urls => set('imagenes', urls)}
              label="Fotos de la experiencia"
            />

            <ListaEditable
              label="¿Qué incluye?"
              ayuda="Una viñeta por ítem"
              placeholder="Ej: Guía especializado"
              value={form.incluye}
              onChange={items => set('incluye', items)}
            />

            <ListaEditable
              label="¿Qué traer?"
              ayuda="Una viñeta por ítem"
              placeholder="Ej: Calzado cerrado"
              value={form.queTraer}
              onChange={items => set('queTraer', items)}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Toggle checked={form.destacada} onChange={v => set('destacada', v)} />
              <span style={{ fontSize: 14, fontWeight: 700, minWidth: 0 }}>Destacar en el sitio público</span>
            </div>

            {error && <div style={{ color: 'var(--color-crimson)', fontSize: 13 }}>{error}</div>}
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
