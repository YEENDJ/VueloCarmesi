'use client'
import { useState } from 'react'
import type { AdminExperiencia } from '@/lib/admin/types'
import { createExperiencia, updateExperiencia } from '@/lib/admin/api'
import Toggle from './Toggle'
import ImageUploader from './ImageUploader'

type FormData = {
  nombre: string; descripcion: string; slug: string
  precio: string; duracion: string; capacidad: string
  destacada: boolean; imagen: string
}

const EMPTY: FormData = { nombre: '', descripcion: '', slug: '', precio: '', duracion: '', capacidad: '', destacada: false, imagen: '' }


function toSlug(nombre: string) {
  return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
          nombre: experiencia.nombre, descripcion: experiencia.descripcion,
          slug: experiencia.slug, precio: String(experiencia.precio),
          duracion: experiencia.duracion, capacidad: String(experiencia.capacidad),
          destacada: experiencia.destacada, imagen: experiencia.imagen ?? '',
        }
      : EMPTY
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k: keyof FormData, v: string | boolean) {
    setForm(prev => {
      const next = { ...prev, [k]: v }
      if (k === 'nombre' && !isEdit) next.slug = toSlug(v as string)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.slug || !form.precio || !form.duracion || !form.capacidad) {
      setError('Completá todos los campos requeridos')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = {
        nombre: form.nombre, descripcion: form.descripcion, slug: form.slug,
        precio: Number(form.precio), duracion: form.duracion,
        capacidad: Number(form.capacidad), destacada: form.destacada,
        imagen: form.imagen,
      }
      const saved = isEdit
        ? await updateExperiencia(experiencia!.id, data)
        : await createExperiencia(data)
      onSaved(saved)
    } catch {
      setError('Error al guardar. Revisá que el slug sea único.')
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div style={{ fontSize: 17, fontWeight: 700 }}>{isEdit ? 'Editar experiencia' : 'Nueva experiencia'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--admin-text-muted)' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            <FormRow label="Nombre *">
              <input className="admin-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Cacao Intenso" />
            </FormRow>
            <FormRow label="Slug (URL) *">
              <input className="admin-input" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="cacao-intenso" />
            </FormRow>
            <FormRow label="Descripción">
              <textarea className="admin-input" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
            </FormRow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
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
            <ImageUploader
              value={form.imagen}
              onChange={url => set('imagen', url)}
              label="Imagen de portada"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Toggle checked={form.destacada} onChange={v => set('destacada', v)} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>Destacar en el sitio público</span>
            </div>
            {error && <div style={{ color: 'var(--color-crimson)', fontSize: 13 }}>{error}</div>}
          </div>
          <div className="admin-modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="admin-field-label">{label}</div>
      {children}
    </div>
  )
}
