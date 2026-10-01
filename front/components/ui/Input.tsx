import { forwardRef } from 'react'

interface CampoProps {
  /** El id del control: enlaza la etiqueta y de él salen los ids del error y la ayuda. */
  id?: string
  label: string
  required?: boolean
  /** Texto que va junto a la etiqueta, en peso normal: «opcional». */
  nota?: string
  /** Una línea de ayuda bajo el campo. */
  ayuda?: string
  error?: string
  children: React.ReactNode
}

/** Los ids que un control tiene que poner en `aria-describedby`. */
export function describedByDe(id: string | undefined, error?: string, ayuda?: string) {
  if (!id) return undefined
  return [error && `${id}-error`, ayuda && `${id}-ayuda`].filter(Boolean).join(' ') || undefined
}

/**
 * Etiqueta, ayuda y error alrededor de un control con la clase `campo-control`.
 *
 * Lo usa `Input` y también quien necesita un control que `Input` no cubre —un
 * select, una fecha con min y max—: así todos los formularios del sitio
 * comparten el mismo aspecto, que vive en globals.css (`.campo*`).
 */
export function Campo({ id, label, required, nota, ayuda, error, children }: CampoProps) {
  return (
    <div className="campo">
      <label htmlFor={id} className="campo-etiqueta">
        {label}
        {/* El asterisco es solo visual: el control ya anuncia que es obligatorio. */}
        {required && <span className="campo-requerido" aria-hidden="true"> *</span>}
        {nota && <span className="campo-nota"> ({nota})</span>}
      </label>
      {children}
      {/* El error y la ayuda se enlazan al campo para que un lector de pantalla
          los lea al entrar en él, no solo quien los ve pintados debajo. */}
      {ayuda && <span id={id && `${id}-ayuda`} className="campo-ayuda">{ayuda}</span>}
      {error && <span id={id && `${id}-error`} className="campo-error">{error}</span>}
    </div>
  )
}

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
  nota?: string
  ayuda?: string
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  maxLength?: number
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  function Input(
    { label, name, type = 'text', required, placeholder, value, onChange, onBlur, multiline, error, nota, ayuda, autoComplete, inputMode, maxLength },
    ref,
  ) {
    const comunes = {
      id: name, name, required, placeholder, value, onChange, onBlur, maxLength,
      className: 'campo-control',
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedByDe(name, error, ayuda),
    }
    return (
      <Campo id={name} label={label} required={required} nota={nota} ayuda={ayuda} error={error}>
        {multiline
          ? <textarea ref={ref as React.Ref<HTMLTextAreaElement>} rows={4} {...comunes} />
          : <input ref={ref as React.Ref<HTMLInputElement>} type={type} autoComplete={autoComplete} inputMode={inputMode} {...comunes} />
        }
      </Campo>
    )
  }
)

export default Input
