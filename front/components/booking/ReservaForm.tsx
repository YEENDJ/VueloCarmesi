'use client'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Users } from 'lucide-react'
// El router de next-intl y no el de `next/navigation`: con el de Next, quien
// reservaba desde /en caía en /reservar/confirmacion, en español.
import { Link, useRouter } from '@/lib/i18n/navigation'
import AvisoDatos from '@/components/ui/AvisoDatos'
import { Campo } from '@/components/ui/Input'
import { usePersonasReserva } from '@/components/booking/ResumenReserva'
import { reservaSchema, MAX_NOTAS, type ReservaFormValues } from '@/lib/schemas/reserva'
import { fechaMinima, fechaMaximaReserva } from '@/lib/schemas/comunes'
import type { Experiencia } from '@/lib/types'
import { formatPrecio } from '@/lib/format'
import { calcularAbono, crearPago, type ConfigPagos } from '@/lib/pagos'
import { useDespertarBackend } from '@/lib/despertar-backend'

export default function ReservaForm({
  experiencia,
  pagos,
}: {
  experiencia: Experiencia
  /** Si el sitio cobra en línea y con qué porcentaje. Lo lee la página en el servidor. */
  pagos: ConfigPagos
}) {
  useDespertarBackend()
  const t = useTranslations('reserva')
  const tg = useTranslations('grupos.aviso')
  const idioma = useLocale()

  const router = useRouter()
  const [error, setError] = useState('')
  // La reserva ya creada cuyo pago no se pudo abrir: al volver a pulsar se
  // reintenta solo el pago, sin crear otra reserva.
  const [reservaSinPagar, setReservaSinPagar] = useState<string | null>(null)
  const [redirigiendo, setRedirigiendo] = useState(false)

  const {
    register, handleSubmit, control, formState: { errors, isSubmitting },
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
    'aria-describedby': errors[campo] ? `${campo}-error` : undefined,
  })

  // Las cifras que se anuncian son las mismas que calcula el backend al crear
  // la reserva: mismo precio, mismo porcentaje, mismo redondeo.
  const personas = Number(useWatch({ control, name: 'cantidadPersonas' })) || 1
  const total = experiencia.precio * personas
  const abono = calcularAbono(total, pagos.porcentajeAbono)
  const cobra = pagos.activo && abono > 0

  // La tarjeta de «Estás reservando» muestra el total en vivo (ResumenReserva).
  const [, publicarPersonas] = usePersonasReserva()
  useEffect(() => { publicarPersonas(personas) }, [personas, publicarPersonas])

  /** Abre la pasarela para una reserva ya creada. */
  const irAPagar = async (reservaId: string) => {
    try {
      const intento = await crearPago({ reservaId }, idioma)
      setRedirigiendo(true)
      window.location.assign(intento.url)
    } catch {
      setReservaSinPagar(reservaId)
      setError(t('pago.errorAbrir'))
    }
  }

  const onSubmit = async (data: ReservaFormValues) => {
    setError('')
    if (reservaSinPagar) {
      await irAPagar(reservaSinPagar)
      return
    }
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
      const reserva = await res.json()
      // El backend decide si se cobra: si la reserva nace esperando pago, va a
      // la pasarela; si no, el flujo manual de siempre.
      if (reserva.estado === 'pendiente_pago') {
        await irAPagar(reserva.id)
        return
      }
      router.push('/reservar/confirmacion')
    } catch {
      setError(t('campos.error'))
    }
  }

  const personasOpts = Array.from({ length: experiencia.capacidad }, (_, i) => i + 1)

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      <fieldset className="form-grupo">
        <legend className="form-grupo-titulo"><span className="form-grupo-num" aria-hidden="true">1</span>{t('grupoDatos')}</legend>

        {/* Nombre | Teléfono */}
        <div className="form-row-2">
          <Campo id="nombre" label={t('campos.nombre')} required error={msg('nombre')}>
            <input
              id="nombre"
              type="text"
              autoComplete="name"
              maxLength={100}
              required
              placeholder={t('campos.nombrePlaceholder')}
              className="campo-control"
              {...invalido('nombre')}
              {...register('nombre')}
            />
          </Campo>
          <Campo id="telefono" label={t('campos.telefono')} required error={msg('telefono')}>
            <input
              id="telefono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="+57 300 000 0000"
              className="campo-control"
              {...invalido('telefono')}
              {...register('telefono')}
            />
          </Campo>
        </div>

        <Campo id="email" label={t('campos.email')} required error={msg('email')}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            maxLength={255}
            required
            placeholder={t('campos.emailPlaceholder')}
            className="campo-control"
            {...invalido('email')}
            {...register('email')}
          />
        </Campo>
      </fieldset>

      <fieldset className="form-grupo">
        <legend className="form-grupo-titulo"><span className="form-grupo-num" aria-hidden="true">2</span>{t('grupoVisita')}</legend>

        {/* Fecha | Personas */}
        <div className="form-row-2">
          {/* min y max son la misma ventana que exige el backend: de mañana a
              seis meses. Sin ellos el calendario dejaba elegir ayer. */}
          <Campo id="fecha" label={t('campos.fecha')} required error={msg('fecha')}>
            <input
              id="fecha"
              type="date"
              required
              min={fechaMinima()}
              max={fechaMaximaReserva()}
              className="campo-control"
              {...invalido('fecha')}
              {...register('fecha')}
            />
          </Campo>
          <Campo id="cantidadPersonas" label={t('campos.personas')} required error={msg('cantidadPersonas')}>
            <select
              id="cantidadPersonas"
              required
              className="campo-control"
              {...invalido('cantidadPersonas')}
              {...register('cantidadPersonas', { valueAsNumber: true })}
            >
              {personasOpts.map(n => (
                <option key={n} value={n}>
                  {/* Plural ICU y no un ternario: `persona{n > 1 ? 's' : ''}`
                      salía en español para todo el mundo, también en /en. */}
                  {t('campos.personasOpcion', { n })}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        {/* El desplegable corta en la capacidad de la experiencia —12 y 8—, y
            este es el punto exacto donde se pierde la venta institucional:
            un coordinador con 40 estudiantes llega hasta acá, ve que el
            número más alto es 12 y se va sin que nadie se entere. */}
        <Link href="/grupos" className="reserva-tope-grupos" style={{ marginTop: 0, alignSelf: 'flex-start' }}>
          <Users size={15} strokeWidth={2} aria-hidden="true" />
          {tg('reservaTope', { capacidad: experiencia.capacidad })}
        </Link>

        <Campo id="notas" label={t('campos.notas')} nota={t('campos.opcional')} error={msg('notas')}>
          <textarea
            id="notas"
            rows={3}
            maxLength={MAX_NOTAS}
            placeholder={t('campos.notasPlaceholder')}
            className="campo-control"
            {...invalido('notas')}
            {...register('notas')}
          />
        </Campo>
      </fieldset>

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
          borderRadius: '8px',
          padding: '12px 16px',
          margin: 0,
        }}>
          {error}
        </p>
      )}

      {/* Resumen del cobro: lo que se paga hoy y lo que queda para el día. Solo
          con pasarela activa; sin ella, nada se cobra al enviar. En escritorio
          no se muestra: el mismo desglose está en la tarjeta fija de al lado
          (ResumenReservaVivo). El display vive en la clase, no aquí, para que
          la regla que lo oculta pueda ganar. */}
      {cobra && (
        <div
          className="reserva-pago-form"
          style={{
            border: '1px solid rgba(245,156,0,.6)',
            borderRadius: '10px',
            backgroundColor: '#FFF0D6',
            padding: '16px',
            color: 'var(--color-brown)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-brown)', margin: 0 }}>
            {t('pago.titulo')}
          </p>
          {[
            { id: 'total', rotulo: t('pago.total', { n: personas }), valor: total, fuerte: false },
            { id: 'hoy', rotulo: t('pago.hoy', { porcentaje: pagos.porcentajeAbono }), valor: abono, fuerte: true },
            { id: 'saldo', rotulo: t('pago.saldo'), valor: total - abono, fuerte: false },
          ].map(fila => (
            <div key={fila.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ minWidth: 0, fontSize: '15px', fontWeight: fila.fuerte ? 700 : 400 }}>{fila.rotulo}</span>
              <span style={{ fontWeight: 700, fontSize: fila.fuerte ? '20px' : '15px', color: fila.fuerte ? 'var(--color-crimson)' : 'inherit' }}>
                {formatPrecio(fila.valor, idioma)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          type="submit"
          disabled={isSubmitting || redirigiendo}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            minHeight: '50px',
            backgroundColor: isSubmitting || redirigiendo ? 'rgba(213,19,18,.6)' : 'var(--color-crimson)',
            color: 'var(--color-cream)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '17px',
            cursor: isSubmitting || redirigiendo ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {isSubmitting || redirigiendo
            ? t('campos.enviando')
            : cobra ? t('pago.enviar', { monto: formatPrecio(abono, idioma) }) : t('campos.enviar')}
        </button>
        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'rgba(135,43,19,.78)',
            margin: 0,
          }}
        >
          {cobra ? t('pago.nota') : t('contactaremos')}
        </p>
        <AvisoDatos />
      </div>

    </form>
  )
}
