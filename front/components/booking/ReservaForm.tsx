'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
      setError('Hubo un problema al enviar tu reserva. Por favor intentá de nuevo o escribinos directamente.')
      setLoading(false)
    }
  }

  const personasOpts = Array.from({ length: experiencia.capacidad }, (_, i) => i + 1)

  const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23872b13' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Fila 1: Nombre | Teléfono */}
      <div className="form-row-2">
        <Field label="Nombre completo" required>
          <input
            name="nombre"
            type="text"
            required
            placeholder="Tu nombre"
            value={form.nombre}
            onChange={handleChange}
            style={inputStyle}
          />
        </Field>
        <Field label="Teléfono" required>
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
      <Field label="Email" required>
        <input
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
          value={form.email}
          onChange={handleChange}
          style={inputStyle}
        />
      </Field>

      {/* Fila 3: Fecha | Personas */}
      <div className="form-row-2">
        <Field label="Fecha deseada" required>
          <input
            name="fecha"
            type="date"
            required
            value={form.fecha}
            onChange={handleChange}
            style={inputStyle}
          />
        </Field>
        <Field label="Cantidad de personas" required>
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
                {n} persona{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Comentarios */}
      <Field label="Comentarios adicionales">
        <textarea
          name="notas"
          placeholder="¿Alguna consulta o necesidad especial?"
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
            padding: '18px 40px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: loading ? 'rgba(213,19,18,.6)' : 'var(--color-crimson)',
            color: 'var(--color-cream)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '18px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {loading ? 'Procesando...' : 'Confirmar reserva'}
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
          Te contactaremos para confirmar disponibilidad
        </p>
      </div>

    </form>
  )
}
