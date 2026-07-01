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
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  function Input({ label, name, type = 'text', required, placeholder, value, onChange, onBlur, multiline, error }, ref) {
    const fieldStyle: React.CSSProperties = {
      width: '100%', padding: '0.75rem', borderRadius: '4px',
      border: `1px solid ${error ? 'var(--color-crimson)' : 'var(--color-brown)'}`,
      fontFamily: 'var(--font-body)', fontSize: '1rem', backgroundColor: 'var(--color-cream)',
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label htmlFor={name} style={{ fontWeight: 700, color: 'var(--color-brown)' }}>
          {label}{required && ' *'}
        </label>
        {multiline
          ? <textarea ref={ref as React.Ref<HTMLTextAreaElement>} id={name} name={name} required={required} placeholder={placeholder} value={value} onChange={onChange} onBlur={onBlur} rows={4} style={fieldStyle} />
          : <input ref={ref as React.Ref<HTMLInputElement>} id={name} name={name} type={type} required={required} placeholder={placeholder} value={value} onChange={onChange} onBlur={onBlur} style={fieldStyle} />
        }
        {error && <span style={{ fontSize: '0.8rem', color: 'var(--color-crimson)' }}>{error}</span>}
      </div>
    )
  }
)

export default Input
