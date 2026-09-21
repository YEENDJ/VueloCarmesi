'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import AvisoDatos from '@/components/ui/AvisoDatos'
import type { Experiencia } from '@/lib/types'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '4px',
  border: '1.5px solid rgba(135,43,19,.4)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '16px',
  color: 'var(--color-brown)',
  backgroundColor: 'var(--color-cream)',
  outline: 'none',
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '14px',
          color: 'var(--color-brown)',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--color-crimson)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

export default function ReservaForm({ experiencia }: { experiencia: Experiencia }) {
  const t = useTranslations('reserva')
  const tg = useTranslations('grupos.aviso')

  const router = useRouter()
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    fecha: '',
    cantidadPersonas: '1',
    notas: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit: NonNullable<React.ComponentProps<'form'>['onSubmit']> = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cantidadPersonas: Number(form.cantidadPersonas),
          experienciaId: experiencia.id,
        }),
      })
      if (!res.ok) throw new Error()
      router.push('/reservar/confirmacion')
    } catch {
      setError(t('campos.error'))
      setLoading(false)
    }
  }

  const personasOpts = Array.from({ length: experiencia.capacidad }, (_, i) => i + 1)

  const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23872b13' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Fila 1: Nombre | Teléfono */}
      <div className="form-row-2">
        <Field label={t('campos.nombre')} required>
          <input
            name="nombre"
            type="text"
            required
            placeholder={t('campos.nombrePlaceholder')}
            value={form.nombre}
            onChange={handleChange}
            style={inputStyle}
          />
        </Field>
        <Field label={t('campos.telefono')} required>
          <input
            name="telefono"
            type="tel"
            required
            placeholder="+57 300 000 0000"
            value={form.telefono}
            onChange={handleChange}
            style={inputStyle}
          />
        </Field>
      </div>

      {/* Fila 2: Email */}
      <Field label={t('campos.email')} required>
        <input
          name="email"
          type="email"
          required
          placeholder={t('campos.emailPlaceholder')}
          value={form.email}
          onChange={handleChange}
          style={inputStyle}
        />
      </Field>

      {/* Fila 3: Fecha | Personas */}
      <div className="form-row-2">
        <Field label={t('campos.fecha')} required>
          <input
            name="fecha"
            type="date"
            required
            value={form.fecha}
            onChange={handleChange}
            style={inputStyle}
          />
        </Field>
        <Field label={t('campos.personas')} required>
          <select
            name="cantidadPersonas"
            required
            value={form.cantidadPersonas}
            onChange={handleChange}
            style={{
              ...inputStyle,
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: chevronSvg,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px',
              cursor: 'pointer',
            }}
          >
            {personasOpts.map(n => (
              <option key={n} value={String(n)}>
                {/* Plural ICU y no un ternario: `persona{n > 1 ? 's' : ''}`
                    salía en español para todo el mundo, también en /en. */}
                {t('campos.personasOpcion', { n })}
              </option>
            ))}
          </select>
          {/* El desplegable corta en la capacidad de la experiencia —12 y 8—, y
              este es el punto exacto donde se pierde la venta institucional:
              un coordinador con 40 estudiantes llega hasta acá, ve que el
              número más alto es 12 y se va sin que nadie se entere. */}
          <Link href="/grupos" className="reserva-tope-grupos">
            <Users size={15} strokeWidth={2} aria-hidden="true" />
            {tg('reservaTope', { capacidad: experiencia.capacidad })}
          </Link>
        </Field>
      </div>

      {/* Comentarios */}
      <Field label={t('campos.notas')}>
        <textarea
          name="notas"
          placeholder={t('campos.notasPlaceholder')}
          value={form.notas}
          onChange={handleChange}
          rows={4}
          style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
        />
      </Field>

      {/* Error */}
      {error && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--color-crimson)',
          backgroundColor: 'rgba(213,19,18,.08)',
          border: '1px solid rgba(213,19,18,.3)',
          borderRadius: '6px',
          padding: '12px 16px',
          margin: 0,
        }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 32px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: loading ? 'rgba(213,19,18,.6)' : 'var(--color-crimson)',
            color: 'var(--color-cream)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {loading ? t('campos.enviando') : t('campos.enviar')}
        </button>
        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'var(--color-brown)',
            opacity: 0.6,
          }}
        >
          {t('contactaremos')}
        </p>
        <AvisoDatos />
      </div>

    </form>
  )
}
