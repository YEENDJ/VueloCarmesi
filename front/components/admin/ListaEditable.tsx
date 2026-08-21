'use client'
import { useState } from 'react'

interface Props {
  value: string[]
  onChange: (items: string[]) => void
  label: string
  placeholder?: string
  ayuda?: string
}

/**
 * Lista de viñetas para campos como "¿Qué incluye?" o "¿Qué traer?".
 *
 * Se escribe en un input aparte y se confirma con Enter o con el botón, en vez
 * de editar un textarea y partir por saltos de línea: así una línea vacía o un
 * espacio de más no se cuelan como viñeta fantasma en la ficha pública.
 */
export default function ListaEditable({ value, onChange, label, placeholder, ayuda }: Props) {
  const [borrador, setBorrador] = useState('')

  function agregar() {
    const item = borrador.trim()
    if (!item) return
    // Repetir una viñeta en la ficha nunca es intencional.
    if (value.includes(item)) { setBorrador(''); return }
    onChange([...value, item])
    setBorrador('')
  }

  function quitar(indice: number) {
    onChange(value.filter((_, i) => i !== indice))
  }

  return (
    <div style={{ minWidth: 0 }}>
      <div className="admin-field-label">
        {label}
        {ayuda && (
          <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)' }}> · {ayuda}</span>
        )}
      </div>

      {value.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0 0 8px', padding: 0, display: 'grid', gap: 6 }}>
          {value.map((item, i) => (
            <li key={item} style={{
              display: 'flex', alignItems: 'center', gap: 8, minWidth: 0,
              background: 'var(--admin-bg-subtle, #f7f1ea)', borderRadius: 6, padding: '4px 4px 4px 10px',
            }}>
              <span style={{
                flex: 1, minWidth: 0, fontSize: 14, overflowWrap: 'anywhere',
              }}>{item}</span>
              <button
                type="button" onClick={() => quitar(i)}
                aria-label={`Quitar "${item}"`}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-crimson)', fontSize: 16,
                  minWidth: 44, minHeight: 44, flexShrink: 0, padding: 0,
                }}
              >✕</button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minWidth: 0 }}>
        <input
          className="admin-input"
          value={borrador}
          onChange={e => setBorrador(e.target.value)}
          placeholder={placeholder}
          style={{ flex: '1 1 180px', minWidth: 0 }}
          // Enter confirma la viñeta; sin esto enviaría el formulario entero.
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              agregar()
            }
          }}
        />
        <button
          type="button" onClick={agregar} className="btn-secondary btn-sm"
          style={{ minHeight: 44, flexShrink: 0 }}
        >Agregar</button>
      </div>
    </div>
  )
}
