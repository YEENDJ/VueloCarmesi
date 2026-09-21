'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Send } from 'lucide-react'
import {
  solicitudGrupoSchema,
  type SolicitudGrupoFormValues,
  TIPOS_SOLICITANTE,
  EXPERIENCIAS_COTIZABLES,
  MAX_PERSONAS,
  fechaMinima,
} from '@/lib/schemas/solicitud-grupo'
import { CONTACTO, MENSAJE_WHATSAPP, whatsappCon } from '@/lib/contacto'
import AvisoDatos from '@/components/ui/AvisoDatos'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const MAX_MENSAJE = 1000

/**
 * El formulario de cotización de grupos.
 *
 * Es el objetivo de toda la página: lo que hoy no existe es un sitio donde un
 * coordinador con 40 estudiantes pueda pedir precio. `/reservar/[slug]` tope el
 * selector de personas en la capacidad de la experiencia —12 y 8—, así que ese
 * visitante se queda sin camino. Acá `personas` es un campo libre.
 *
 * Los mensajes de error salen del catálogo: el esquema de Zod emite claves
 * porque se evalúa una vez al cargarse y no puede leer el idioma activo. Mismo
 * patrón que `lib/cart/checkout-schema.ts`.
 */
export default function FormularioGrupo() {
  const t = useTranslations('grupos.formulario')

  const [enviado, setEnviado] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')

  const {
    register, handleSubmit, control, formState: { errors, isSubmitting },
  } = useForm<SolicitudGrupoFormValues>({
    resolver: zodResolver(solicitudGrupoSchema),
    defaultValues: { tipo: 'colegio', experiencias: [] },
  })

  // El bloque de edades solo tiene sentido con menores de por medio, y el NIT
  // solo si pidió factura. Mostrarlos siempre alarga el formulario con dos
  // campos que la mayoría deja vacíos.
  //
  // `useWatch` y no el `watch()` que devuelve useForm: ese último es una
  // función que el compilador de React no puede memoizar, así que deja el
  // componente entero sin memoizar y avisa por ello. `useWatch` es un hook y
  // además solo vuelve a pintar por el campo que observa, no por cada tecla
  // de cualquier campo del formulario.
  const tipo = useWatch({ control, name: 'tipo' })
  const requiereFactura = useWatch({ control, name: 'requiereFactura' })
  const mensaje = useWatch({ control, name: 'mensaje' }) ?? ''

  const onSubmit = async (data: SolicitudGrupoFormValues) => {
    setErrorEnvio('')
    try {
      const res = await fetch(`${API}/solicitudes-grupo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Los opcionales vacíos no se mandan: el DTO los valida con @IsOptional
        // y una cadena vacía en `fechaTentativa` no es una fecha ISO válida.
        body: JSON.stringify({
          ...data,
          cargo: data.cargo || undefined,
          edades: data.edades || undefined,
          nit: data.nit || undefined,
          mensaje: data.mensaje || undefined,
          fechaTentativa: data.fechaTentativa || undefined,
        }),
      })
      if (!res.ok) throw new Error(`POST /solicitudes-grupo respondió ${res.status}`)
      setEnviado(true)
    } catch {
      setErrorEnvio(t('errorEnvio', { email: CONTACTO.email }))
    }
  }

  if (enviado) {
    return (
      <div className="grp-gracias" role="status">
        <span className="grp-gracias-icono" aria-hidden="true">
          <Check size={28} strokeWidth={2.4} color="var(--color-cream)" />
        </span>
        <h3 className="grp-gracias-titulo">{t('graciasTitulo')}</h3>
        <p className="grp-gracias-texto">{t('gracias')}</p>
        <a
          className="grp-boton"
          href={whatsappCon(MENSAJE_WHATSAPP.contacto)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('graciasWhatsapp')}
        </a>
      </div>
    )
  }

  return (
    <form className="grp-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* ── Tipo de solicitante ──
          Radios y no un <select>: son cinco opciones cortas y la que marque
          decide qué campos aparecen después, así que conviene que las vea
          todas de una. El valor viaja al backend; la etiqueta se traduce. */}
      <fieldset className="grp-form-grupo">
        <legend className="grp-form-legend">{t('tipoRotulo')}</legend>
        <div className="grp-radios">
          {TIPOS_SOLICITANTE.map(valor => (
            <label key={valor} className="grp-radio">
              <input type="radio" value={valor} {...register('tipo')} />
              <span>{t(`tipos.${valor}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grp-form-fila">
        <div className="grp-campo">
          <label htmlFor="institucion">{t('institucion')} *</label>
          <input
            id="institucion"
            type="text"
            aria-invalid={!!errors.institucion}
            aria-describedby={errors.institucion ? 'err-institucion' : undefined}
            {...register('institucion')}
          />
          {errors.institucion?.message && (
            <span id="err-institucion" className="grp-error">{t(errors.institucion.message)}</span>
          )}
        </div>

        <div className="grp-campo">
          <label htmlFor="contacto">{t('contacto')} *</label>
          <input
            id="contacto"
            type="text"
            autoComplete="name"
            aria-invalid={!!errors.contacto}
            aria-describedby={errors.contacto ? 'err-contacto' : undefined}
            {...register('contacto')}
          />
          {errors.contacto?.message && (
            <span id="err-contacto" className="grp-error">{t(errors.contacto.message)}</span>
          )}
        </div>
      </div>

      <div className="grp-form-fila">
        <div className="grp-campo">
          <label htmlFor="cargo">{t('cargo')}</label>
          <input
            id="cargo"
            type="text"
            autoComplete="organization-title"
            placeholder={t('cargoPlaceholder')}
            aria-invalid={!!errors.cargo}
            {...register('cargo')}
          />
          {errors.cargo?.message && <span className="grp-error">{t(errors.cargo.message)}</span>}
        </div>

        <div className="grp-campo">
          <label htmlFor="personas">{t('personas')} *</label>
          <input
            id="personas"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_PERSONAS}
            aria-invalid={!!errors.personas}
            aria-describedby={errors.personas ? 'err-personas' : undefined}
            {...register('personas', { valueAsNumber: true })}
          />
          {errors.personas?.message && (
            <span id="err-personas" className="grp-error">
              {t(errors.personas.message, { max: MAX_PERSONAS })}
            </span>
          )}
        </div>
      </div>

      <div className="grp-form-fila">
        <div className="grp-campo">
          <label htmlFor="email">{t('email')} *</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'err-email' : undefined}
            {...register('email')}
          />
          {errors.email?.message && (
            <span id="err-email" className="grp-error">{t(errors.email.message)}</span>
          )}
        </div>

        <div className="grp-campo">
          <label htmlFor="telefono">{t('telefono')} *</label>
          <input
            id="telefono"
            type="tel"
            autoComplete="tel"
            aria-invalid={!!errors.telefono}
            aria-describedby={errors.telefono ? 'err-telefono' : undefined}
            {...register('telefono')}
          />
          {errors.telefono?.message && (
            <span id="err-telefono" className="grp-error">{t(errors.telefono.message)}</span>
          )}
        </div>
      </div>

      <div className="grp-form-fila">
        {/* Solo con un colegio de por medio: es el dato que decide la póliza y
            el papeleo de menores, y no le dice nada a una empresa. */}
        {tipo === 'colegio' && (
          <div className="grp-campo">
            <label htmlFor="edades">{t('edades')}</label>
            <input
              id="edades"
              type="text"
              placeholder={t('edadesPlaceholder')}
              aria-describedby="ayuda-edades"
              {...register('edades')}
            />
            <span id="ayuda-edades" className="grp-ayuda">{t('edadesAyuda')}</span>
            {errors.edades?.message && <span className="grp-error">{t(errors.edades.message)}</span>}
          </div>
        )}

        <div className="grp-campo">
          <label htmlFor="fechaTentativa">{t('fechaTentativa')}</label>
          <input
            id="fechaTentativa"
            type="date"
            min={fechaMinima()}
            aria-describedby="ayuda-fecha"
            aria-invalid={!!errors.fechaTentativa}
            {...register('fechaTentativa')}
          />
          {/* La ayuda es la mitad del diseño de este campo: sin ella el
              coordinador se inventa una fecha o abandona el formulario. */}
          <span id="ayuda-fecha" className="grp-ayuda">{t('fechaAyuda')}</span>
          {errors.fechaTentativa?.message && (
            <span className="grp-error">{t(errors.fechaTentativa.message)}</span>
          )}
        </div>
      </div>

      <fieldset className="grp-form-grupo">
        <legend className="grp-form-legend">{t('experienciasRotulo')}</legend>
        <div className="grp-checks">
          {EXPERIENCIAS_COTIZABLES.map(slug => (
            <label key={slug} className="grp-check">
              <input type="checkbox" value={slug} {...register('experiencias')} />
              <span>{t(`experiencias.${slug}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grp-checks grp-checks--apilado">
        <label className="grp-check">
          <input type="checkbox" {...register('requiereTransporte')} />
          <span>{t('requiereTransporte')}</span>
        </label>
        <label className="grp-check">
          <input type="checkbox" {...register('requiereFactura')} />
          <span>{t('requiereFactura')}</span>
        </label>
      </div>

      {requiereFactura && (
        <div className="grp-campo">
          <label htmlFor="nit">{t('nit')}</label>
          <input id="nit" type="text" aria-invalid={!!errors.nit} {...register('nit')} />
          {errors.nit?.message && <span className="grp-error">{t(errors.nit.message)}</span>}
        </div>
      )}

      <div className="grp-campo">
        <label htmlFor="mensaje">{t('mensaje')}</label>
        <textarea
          id="mensaje"
          rows={4}
          maxLength={MAX_MENSAJE}
          placeholder={t('mensajePlaceholder')}
          aria-describedby="contador-mensaje"
          {...register('mensaje')}
        />
        <span id="contador-mensaje" className="grp-ayuda">
          {t('contador', { n: mensaje.length, max: MAX_MENSAJE })}
        </span>
        {errors.mensaje?.message && (
          <span className="grp-error">{t(errors.mensaje.message, { max: MAX_MENSAJE })}</span>
        )}
      </div>

      {/* Honeypot: fuera de pantalla, sin tabulación y sin autocompletado. Los
          humanos no lo ven; los bots lo llenan y el backend los descarta. */}
      <div className="grp-honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      {errorEnvio && <p className="grp-error grp-error--envio" role="alert">{errorEnvio}</p>}

      <button type="submit" className="grp-boton grp-boton--enviar" disabled={isSubmitting}>
        <Send size={18} strokeWidth={2} aria-hidden="true" />
        {isSubmitting ? t('enviando') : t('enviar')}
      </button>
      <AvisoDatos />
    </form>
  )
}
