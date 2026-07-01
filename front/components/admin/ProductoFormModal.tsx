'use client'
import { useState } from 'react'
import type { AdminProducto } from '@/lib/admin/types'
import { createProducto, updateProducto } from '@/lib/admin/api'
import ImageUploader from './ImageUploader'

const CATEGORIAS = ['chocolates', 'despensa', 'cafe', 'regalos', 'hogar']

type FormData = {
  nombre: string; descripcion: string; slug: string
  precio: string; stock: string; categoria: string; imagen: string; badge: string
}

const EMPTY: FormData = {
  nombre: '', descripcion: '', slug: '', precio: '',
  stock: '0', categoria: 'chocolates', imagen: '', badge: '',
}

function toSlug(nombre: string) {
  return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ProductoFormModal({
  producto,
  onClose,
  onSaved,
}: {
  producto: AdminProducto | null
  onClose: () => void
  onSaved: (p: AdminProducto) => void
}) {
  const isEdit = !!producto
  const [form, setForm] = useState<FormData>(
    producto
      ? {
          nombre: producto.nombre, descripcion: producto.descripcion,
          slug: producto.slug, precio: String(producto.precio),
          stock: String(producto.stock), categoria: producto.categoria,
          imagen: producto.imagen ?? '', badge: producto.badge ?? '',
        }
      : EMPTY
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k: keyof FormData, v: string) {
    setForm(prev => {
      const next = { ...prev, [k]: v }
      if (k === 'nombre' && !isEdit) next.slug = toSlug(v)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.nombre || !form.slug || !form.precio || !form.categoria) {
      setError('Completá todos los campos requeridos')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data: Partial<AdminProducto> = {
        nombre: form.nombre, descripcion: form.descripcion, slug: form.slug,
        precio: Number(form.precio), stock: Number(form.stock),
        categoria: form.categoria, imagen: form.imagen,
        badge: form.badge === '' ? undefined : (form.badge as 'Nuevo' | 'Destacado'),
      }
      const saved = isEdit
        ? await updateProducto(producto!.id, data)
        : await createProducto(data)
      setSaving(false)
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
          <div style={{ fontSize: 17, fontWeight: 700 }}>{isEdit ? 'Editar producto' : 'Nuevo producto'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--admin-text-muted)' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            <FormRow label="Nombre *">
              <input className="admin-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Chocolate Negro 70%" />
            </FormRow>
            <FormRow label="Slug (URL) *">
              <input className="admin-input" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="chocolate-negro-70" />
            </FormRow>
            <FormRow label="Descripción">
              <textarea className="admin-input" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
            </FormRow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <FormRow label="Precio (COP) *">
                <input className="admin-input" type="number" min={0} value={form.precio} onChange={e => set('precio', e.target.value)} />
              </FormRow>
              <FormRow label="Stock inicial">
                <input className="admin-input" type="number" min={0} value={form.stock} onChange={e => set('stock', e.target.value)} />
              </FormRow>
              <FormRow label="Categoría *">
                <select className="admin-input" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormRow>
            </div>
            <FormRow label="Badge (opcional)">
              <select className="admin-input" value={form.badge} onChange={e => set('badge', e.target.value)}>
                <option value="">Ninguno</option>
                <option value="Nuevo">Nuevo</option>
                <option value="Destacado">Destacado</option>
              </select>
            </FormRow>
            <ImageUploader value={form.imagen} onChange={url => set('imagen', url)} label="Imagen del producto" />
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
