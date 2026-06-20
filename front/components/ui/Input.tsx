interface InputProps {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  multiline?: boolean
}

export default function Input({ label, name, type = 'text', required, placeholder, value, onChange, multiline }: InputProps) {
  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem', borderRadius: '4px',
    border: '1px solid var(--color-brown)', fontFamily: 'var(--font-body)',
    fontSize: '1rem', backgroundColor: 'var(--color-cream)',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label htmlFor={name} style={{ fontWeight: 700, color: 'var(--color-brown)' }}>
        {label}{required && ' *'}
      </label>
      {multiline
        ? <textarea id={name} name={name} required={required} placeholder={placeholder} value={value} onChange={onChange} rows={4} style={fieldStyle} />
        : <input id={name} name={name} type={type} required={required} placeholder={placeholder} value={value} onChange={onChange} style={fieldStyle} />
      }
    </div>
  )
}
