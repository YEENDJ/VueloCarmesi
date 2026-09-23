import { forwardRef } from 'react'

interface InputProps {
  label: string
  name?: string
  type?: string
  required?: boolean
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  multiline?: boolean
  error?: string
  /** Texto que va junto a la etiqueta, en peso normal: «opcional». */
  nota?: string
  /** Una línea de ayuda bajo el campo. */
  ayuda?: string
  autoComplete?: string
  maxLength?: number
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  function Input(
    { label, name, type = 'text', required, placeholder, value, onChange, onBlur, multiline, error, nota, ayuda, autoComplete, maxLength },
    ref,
  ) {
    const fieldStyle: React.CSSProperties = {
      width: '100%', padding: '0.75rem', borderRadius: '4px',
      border: `1px solid ${error ? 'var(--color-crimson)' : 'var(--color-brown)'}`,
      fontFamily: 'var(--font-body)', fontSize: '1rem', backgroundColor: 'var(--color-cream)',
    }
    // El error y la ayuda se enlazan al campo para que un lector de pantalla
    // los lea al entrar en él, no solo quien los ve pintados debajo.
    const idError = name ? `${name}-error` : undefined
    const idAyuda = name ? `${name}-ayuda` : undefined
    const describedBy = [error && idError, ayuda && idAyuda].filter(Boolean).join(' ') || undefined
    const comunes = {
      id: name, name, required, placeholder, value, onChange, onBlur, maxLength,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedBy,
      style: fieldStyle,
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
        <label htmlFor={name} style={{ fontWeight: 700, color: 'var(--color-brown)' }}>
          {label}{required && ' *'}
          {nota && <span style={{ fontWeight: 400, opacity: 0.7 }}> ({nota})</span>}
        </label>
        {multiline
          ? <textarea ref={ref as React.Ref<HTMLTextAreaElement>} rows={4} {...comunes} />
          : <input ref={ref as React.Ref<HTMLInputElement>} type={type} autoComplete={autoComplete} {...comunes} />
        }
        {ayuda && <span id={idAyuda} style={{ fontSize: '0.8rem', color: 'var(--color-brown)', opacity: 0.75 }}>{ayuda}</span>}
        {error && <span id={idError} style={{ fontSize: '0.8rem', color: 'var(--color-crimson)' }}>{error}</span>}
      </div>
    )
  }
)

export default Input
