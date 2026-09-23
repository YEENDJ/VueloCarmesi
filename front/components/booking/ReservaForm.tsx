'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Users } from 'lucide-react'
// El router de next-intl y no el de `next/navigation`: con el de Next, quien
// reservaba desde /en caía en /reservar/confirmacion, en español.
import { Link, useRouter } from '@/lib/i18n/navigation'
import AvisoDatos from '@/components/ui/AvisoDatos'
import { reservaSchema, MAX_NOTAS, type ReservaFormValues } from '@/lib/schemas/reserva'
import { fechaMinima, fechaMaximaReserva } from '@/lib/schemas/comunes'
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

const errorStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--color-crimson)',
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
      <label
        htmlFor={htmlFor}
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
      {error && <span id={`err-${htmlFor}`} style={errorStyle}>{error}</span>}
    </div>
  )
}

export default function ReservaForm({ experiencia }: { experiencia: Experiencia }) {
  const t = useTranslations('reserva')
  const tg = useTranslations('grupos.aviso')

  const router = useRouter()
  const [error, setError] = useState('')

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<ReservaFormValues>({
    resolver: zodResolver(reservaSchema(experiencia.capacidad)),
    defaultValues: { cantidadPersonas: 1, notas: '' },
  })

  // Los errores del esquema son claves de `reserva.campos`; se traducen aquí.
  const msg = (campo: keyof ReservaFormValues) => {
    const clave = errors[campo]?.message
    return clave ? t(`campos.${clave}`, { max: MAX_NOTAS }) : undefined
  }
  const invalido = (campo: keyof ReservaFormValues) => ({
    'aria-invalid': !!errors[campo],
    'aria-describedby': errors[campo] ? `err-${campo}` : undefined,
  })

  const onSubmit = async (data: ReservaFormValues) => {
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Las notas vacías no se mandan: son opcionales en el DTO.
        body: JSON.stringify({
          ...data,
          notas: data.notas || undefined,
          experienciaId: experiencia.id,
        }),
      })
      if (!res.ok) throw new Error(`POST /reservas respondió ${res.status}`)
      router.push('/reservar/confirmacion')
    } catch {
      setError(t('campos.error'))
    }
  }

  const personasOpts = Array.from({ length: experiencia.capacidad }, (_, i) => i + 1)

  const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23872b13' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Fila 1: Nombre | Teléfono */}
      <div className="form-row-2">
        <Field label={t('campos.nombre')} htmlFor="nombre" required error={msg('nombre')}>
          <input
            id="nombre"
            type="text"
            autoComplete="name"
            maxLength={100}
            placeholder={t('campos.nombrePlaceholder')}
            style={inputStyle}
            {...invalido('nombre')}
            {...register('nombre')}
          />
        </Field>
        <Field label={t('campos.telefono')} htmlFor="telefono" required error={msg('telefono')}>
          <input
            id="telefono"
            type="tel"
            autoComplete="tel"
            placeholder="+57 300 000 0000"
            style={inputStyle}
            {...invalido('telefono')}
            {...register('telefono')}
          />
        </Field>
      </div>

      {/* Fila 2: Email */}
      <Field label={t('campos.email')} htmlFor="email" required error={msg('email')}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          maxLength={255}
          placeholder={t('campos.emailPlaceholder')}
          style={inputStyle}
          {...invalido('email')}
          {...register('email')}
        />
      </Field>

      {/* Fila 3: Fecha | Personas */}
      <div className="form-row-2">
        {/* min y max son la misma ventana que exige el backend: de mañana a
            seis meses. Sin ellos el calendario dejaba elegir ayer. */}
        <Field label={t('campos.fecha')} htmlFor="fecha" required error={msg('fecha')}>
          <input
            id="fecha"
            type="date"
            min={fechaMinima()}
            max={fechaMaximaReserva()}
            style={inputStyle}
            {...invalido('fecha')}
            {...register('fecha')}
          />
        </Field>
        <Field
          label={t('campos.personas')}
          htmlFor="cantidadPersonas"
          required
          error={msg('cantidadPersonas')}
        >
          <select
            id="cantidadPersonas"
            {...invalido('cantidadPersonas')}
            {...register('cantidadPersonas', { valueAsNumber: true })}
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
              <option key={n} value={n}>
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
      <Field label={t('campos.notas')} htmlFor="notas" error={msg('notas')}>
        <textarea
          id="notas"
          rows={4}
          maxLength={MAX_NOTAS}
          placeholder={t('campos.notasPlaceholder')}
          style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
          {...invalido('notas')}
          {...register('notas')}
        />
      </Field>

      {/* Honeypot: fuera de pantalla, sin tabulación y sin autocompletado. Los
          humanos no lo ven; los bots lo llenan y el backend los descarta. */}
      <div className="campo-trampa" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      {/* Error */}
      {error && (
        <p role="alert" style={{
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
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px 32px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isSubmitting ? 'rgba(213,19,18,.6)' : 'var(--color-crimson)',
            color: 'var(--color-cream)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '16px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {isSubmitting ? t('campos.enviando') : t('campos.enviar')}
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
