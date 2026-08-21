'use client'
import { useState } from 'react'
import type { AdminProducto } from '@/lib/admin/types'
import { createProducto, updateProducto } from '@/lib/admin/api'
import ImagesUploader from './ImagesUploader'

const CATEGORIAS = ['chocolates', 'despensa', 'cafe', 'regalos', 'hogar']

/** Mismo tope que valida el backend: pasarlo devuelve 400. */
const MAX_DESCRIPCION_CORTA = 200

type FormData = {
  nombre: string
  descripcion: string
  descripcionLarga: string
  precio: string; stock: string; categoria: string; badge: string
  imagenes: string[]
}

const EMPTY: FormData = {
  nombre: '', descripcion: '', descripcionLarga: '', precio: '',
  stock: '0', categoria: 'chocolates', badge: '', imagenes: [],
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
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          descripcionLarga: producto.descripcionLarga ?? '',
          precio: String(producto.precio),
          stock: String(producto.stock),
          categoria: producto.categoria,
          badge: producto.badge ?? '',
          // Los productos anteriores a la galería solo tienen portada suelta:
          // se adopta como primera foto para no perderla al editar.
          imagenes: producto.imagenes?.length
            ? producto.imagenes
            : producto.imagen ? [producto.imagen] : [],
        }
      : EMPTY
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  const cortaExcedida = form.descripcion.length > MAX_DESCRIPCION_CORTA

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.nombre || !form.precio || !form.categoria) {
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
        stock: Number(form.stock),
        categoria: form.categoria,
        imagenes: form.imagenes,
        badge: form.badge === '' ? null : (form.badge as 'Nuevo' | 'Destacado'),
      }
      const saved = isEdit
        ? await updateProducto(producto!.id, data)
        : await createProducto(data)
      setSaving(false)
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
          <div style={{ fontSize: 17, fontWeight: 700 }}>{isEdit ? 'Editar producto' : 'Nuevo producto'}</div>
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
              <input className="admin-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Chocolate Negro 70%" />
            </FormRow>

            <FormRow
              label="Descripción corta *"
              ayuda="Es la que se ve en la tarjeta de la tienda y en Google"
            >
              <textarea
                className="admin-input" rows={2} style={{ resize: 'vertical' }}
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Una o dos frases que den ganas de abrirlo."
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
              ayuda="La ficha completa. Si se deja vacía se usa la corta"
            >
              <textarea
                className="admin-input" rows={7} style={{ resize: 'vertical' }}
                value={form.descripcionLarga}
                onChange={e => set('descripcionLarga', e.target.value)}
                placeholder="Origen del cacao, notas de cata, ingredientes, peso, conservación."
              />
            </FormRow>

            <div className="admin-form-row-3">
              <FormRow label="Precio ($) *">
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

            <ImagesUploader
              value={form.imagenes}
              onChange={urls => set('imagenes', urls)}
              label="Fotos del producto"
            />

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
