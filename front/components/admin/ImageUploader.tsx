'use client'
import { useId, useRef, useState } from 'react'
import { uploadImage } from '@/lib/admin/api'

interface Props {
  value: string
  onChange: (url: string) => void
  label?: string
}

export default function ImageUploader({ value, onChange, label = 'Imagen' }: Props) {
  const inputId = useId()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const { url } = await uploadImage(file)
      onChange(url)
    } catch {
      setError('Error al subir la imagen. Verificá el formato y tamaño (máx. 5 MB).')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="admin-field-label">{label}</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {value ? (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e0d0c0' }}
            />
            <button
              type="button"
              onClick={() => onChange('')}
              style={{
                position: 'absolute', top: -6, right: -6,
                background: '#D51312', color: '#fff', border: 'none',
                borderRadius: '50%', width: 20, height: 20,
                fontSize: 12, cursor: 'pointer', lineHeight: '20px', padding: 0,
              }}
            >✕</button>
          </div>
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: 8, border: '2px dashed #d0c0b0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#a08070', fontSize: 11, flexShrink: 0,
          }}>
            Sin imagen
          </div>
        )}
        <div style={{ flex: 1 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            style={{ display: 'none' }}
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className="btn-secondary btn-sm"
            style={{ display: 'inline-block', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Subiendo…' : value ? 'Cambiar imagen' : 'Subir imagen'}
          </label>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            JPG, PNG o WebP · máx. 5 MB
          </div>
          {error && <div style={{ color: 'var(--color-crimson)', fontSize: 12, marginTop: 4 }}>{error}</div>}
        </div>
      </div>
    </div>
  )
}
