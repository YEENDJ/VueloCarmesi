'use client'
import { useEffect, useState } from 'react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import {
  CalendarCheck, Check, CircleX, Clock, MessageCircle, PartyPopper, Receipt, ScanSearch,
  SearchX, TimerOff, Wallet, WifiOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import Button from '@/components/ui/Button'
import { CopiarCodigo, Esqueleto } from '@/components/shop/SeguimientoPartes'
import BotonPagar from '@/components/pagos/BotonPagar'
import { formatPrecio } from '@/lib/format'
import { whatsappCon } from '@/lib/contacto'
import { ErrorConsulta, obtenerReserva, type ReservaPublica } from '@/lib/reservas-consulta'

type Paso = 'recibida' | 'abono' | 'confirmada' | 'realizada'
const ICONO_PASO: Record<Paso, LucideIcon> = { recibida: Receipt, abono: Wallet, confirmada: CalendarCheck, realizada: PartyPopper }

/** El estado que se muestra: el guardado, o «realizada» si se confirmó y su fecha pasó. */
type EstadoVisible = ReservaPublica['estado'] | 'realizada'

/** Icono y tono (.pedido-tono--<tono> en globals.css), los mismos de «mi pedido». */
const ASPECTO: Record<EstadoVisible, { Icono: LucideIcon; tono: 'espera' | 'avance' | 'listo' | 'revision' | 'cerrado' }> = {
  pendiente: { Icono: Receipt, tono: 'espera' },
  pendiente_pago: { Icono: Clock, tono: 'espera' },
  confirmada: { Icono: CalendarCheck, tono: 'avance' },
  realizada: { Icono: PartyPopper, tono: 'listo' },
  requiere_revision: { Icono: ScanSearch, tono: 'revision' },
  cancelada: { Icono: CircleX, tono: 'cerrado' },
  expirada: { Icono: TimerOff, tono: 'cerrado' },
}

/**
 * Los pasos del avance y en cuál va. El abono solo es un paso si la reserva se
 * cobró en línea (tiene monto de abono): las del flujo manual van de recibida a
 * confirmada. Cancelada y vencida no tienen avance que mostrar.
 */
function avance(r: ReservaPublica, estado: EstadoVisible): { pasos: Paso[]; actual: number } | null {
  const pasos: Paso[] = r.montoAbono != null
    ? ['recibida', 'abono', 'confirmada', 'realizada']
    : ['recibida', 'confirmada', 'realizada']
  const en: Partial<Record<EstadoVisible, Paso>> = {
    pendiente_pago: 'recibida',
    pendiente: r.abonoPagado ? 'abono' : 'recibida',
    requiere_revision: r.abonoPagado ? 'abono' : 'recibida',
    confirmada: 'confirmada',
    realizada: 'realizada',
  }
  const paso = en[estado]
  if (!paso) return null
  const actual = pasos.indexOf(paso)
  return { pasos, actual: actual === -1 ? 0 : actual }
}

type Carga = { tipo: 'cargando' } | { tipo: 'listo'; reserva: ReservaPublica } | { tipo: 'noEncontrado' } | { tipo: 'error' }

/**
 * «Mi reserva»: cómo va una reserva, sin cuenta. Gemela de EstadoPedido: se
 * llega con el enlace del correo, desde la confirmación o el resultado del pago,
 * o consultando con código y correo.
 */
export default function EstadoReserva({ token }: { token: string }) {
  const t = useTranslations('miReserva')
  const tw = useTranslations('whatsapp')
  const idioma = useLocale()
  const formato = useFormatter()

  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' })
  // «Volver a intentar» sube el número y el efecto vuelve a pedir.
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    obtenerReserva(token)
      .then(reserva => { if (vigente) setCarga({ tipo: 'listo', reserva }) })
      .catch(err => {
        if (!vigente) return
        setCarga(err instanceof ErrorConsulta && err.status === 404 ? { tipo: 'noEncontrado' } : { tipo: 'error' })
      })
    return () => { vigente = false }
  }, [token, intento])

  if (carga.tipo === 'cargando') return <Esqueleto texto={t('cargando')} />

  if (carga.tipo !== 'listo') {
    const noEncontrado = carga.tipo === 'noEncontrado'
    const Icono = noEncontrado ? SearchX : WifiOff
    return (
      <section className="page-shell pedido">
        <div className="pedido-vacio">
          <span className="pedido-disco pedido-disco--grande" aria-hidden="true"><Icono size={32} strokeWidth={2.25} /></span>
          <h1 className="pedido-vacio-titulo">{noEncontrado ? t('noEncontradoTitulo') : t('errorRed')}</h1>
          {noEncontrado && <p className="pedido-vacio-texto">{t('noEncontradoTexto')}</p>}
          <div className="pedido-acciones">
            {noEncontrado
              ? <Button href="/mi-reserva" style={{ minHeight: 44 }}>{t('buscarOtro')}</Button>
              : <Button onClick={() => { setCarga({ tipo: 'cargando' }); setIntento(n => n + 1) }} style={{ minHeight: 44 }}>{t('reintentar')}</Button>}
            <Button href="/experiencias" variant="outline" style={{ minHeight: 44 }}>{t('verExperiencias')}</Button>
          </div>
        </div>
      </section>
    )
  }

  const { reserva } = carga
  const estado: EstadoVisible = reserva.realizada ? 'realizada' : reserva.estado
  const { Icono: IconoEstado, tono } = ASPECTO[estado]
  const progreso = avance(reserva, estado)
  const esperaPago = reserva.estado === 'pendiente_pago' && reserva.venceEn && new Date(reserva.venceEn) > new Date()
  // El día de la experiencia llega como YYYY-MM-DD: se formatea en UTC para no correrlo un día.
  const dia = new Date(`${reserva.fecha}T00:00:00Z`)
  const fechaExperiencia = formato.dateTime(dia, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  const estadoTexto = t(`estados.${estado}.texto`, {
    hora: reserva.venceEn
      ? formato.dateTime(new Date(reserva.venceEn), { hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' })
      : '',
    fecha: fechaExperiencia,
  })
  // Cuándo llegó a cada paso; «realizada» es el día de la experiencia (sin hora).
  const cuandoPaso = (paso: Paso): string | null => {
    const iso = paso === 'realizada' ? null : reserva.fechas[paso]
    if (iso) return formato.dateTime(new Date(iso), { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' })
    if (paso === 'realizada') return formato.dateTime(dia, { day: 'numeric', month: 'short', timeZone: 'UTC' })
    return null
  }
  const saldo = reserva.total != null && reserva.montoAbono != null ? Math.max(reserva.total - reserva.montoAbono, 0) : null

  return (
    <section className="page-shell pedido">
      {/* Portada: cuál es, cómo va y su avance, igual que «mi pedido». */}
      <div className={`pedido-portada pedido-tono--${tono}`}>
        <div className="pedido-portada-fila">
          <header className="pedido-cabecera">
            <p className="pedido-antetitulo">{t('antetitulo')}</p>
            <h1 className="pedido-titulo">{t('titulo', { codigo: reserva.codigo })}</h1>
            <p className="pedido-fecha">
              {t('hecho', {
                fecha: formato.dateTime(new Date(reserva.creadoEn), {
                  day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
                  timeZone: 'America/Bogota',
                }),
              })}
            </p>
          </header>

          {/* aria-live: si vuelve a cargar tras pagar, el lector de pantalla anuncia el estado nuevo. */}
          <div className="pedido-estado" aria-live="polite">
            <span className="pedido-disco pedido-disco--grande" aria-hidden="true">
              <IconoEstado size={30} strokeWidth={2.25} />
            </span>
            <div className="pedido-estado-cuerpo">
              <h2 className="pedido-estado-titulo">{t(`estados.${estado}.titulo`)}</h2>
              <p className="pedido-estado-texto">{estadoTexto}</p>
              {/* Esperando el abono y aún a tiempo: abre un intento nuevo y va a
                  la pasarela. Si el banco ya tiene uno en curso, se espera: otro
                  intento podría terminar en un cobro doble. */}
              {esperaPago && reserva.pagoEnCurso && (
                <p className="pedido-estado-texto" style={{ marginTop: '0.75rem', fontWeight: 700 }}>{t('pagoEnCurso')}</p>
              )}
              {esperaPago && !reserva.pagoEnCurso && reserva.referenciaPago && (
                <BotonPagar referencia={reserva.referenciaPago} tipo="reserva">{t('irAPagar')}</BotonPagar>
              )}
            </div>
          </div>
        </div>

        {progreso && (
          <section className="pedido-portada-avance" aria-labelledby="reserva-avance-titulo">
            <h2 id="reserva-avance-titulo" className="pedido-portada-avance-titulo">{t('progreso')}</h2>
            <ol className="pedido-pasos" style={{ gridTemplateColumns: `repeat(${progreso.pasos.length}, minmax(0, 1fr))` }}>
              {progreso.pasos.map((clave, i) => {
                const paso = i < progreso.actual ? 'hecho' : i === progreso.actual ? 'actual' : 'pendiente'
                const Icono = ICONO_PASO[clave]
                // Solo los pasos alcanzados: un paso futuro no tiene fecha que mostrar.
                const cuando = paso !== 'pendiente' ? cuandoPaso(clave) : null
                return (
                  <li key={clave} className={`pedido-paso pedido-paso--${paso}`} aria-current={paso === 'actual' ? 'step' : undefined}>
                    <span className="pedido-paso-disco" aria-hidden="true">
                      {paso === 'hecho' ? <Check size={20} strokeWidth={3} /> : <Icono size={20} strokeWidth={2.25} />}
                    </span>
                    <span className="pedido-paso-texto">
                      <span className="pedido-paso-rotulo">
                        {t(`pasos.${clave}`)}
                        {paso !== 'pendiente' && (
                          <span className="solo-lectores"> ({paso === 'actual' ? t('pasoActual') : t('pasoHecho')})</span>
                        )}
                      </span>
                      <span className="pedido-paso-detalle">{t(`pasosDetalle.${clave}`)}</span>
                      {cuando && <span className="pedido-paso-fecha">{cuando}</span>}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>
        )}
      </div>

      <div className="pedido-rejilla">
        <section className="pedido-tarjeta pedido-resumen" aria-labelledby="reserva-resumen-titulo">
          <h2 id="reserva-resumen-titulo" className="pedido-tarjeta-titulo">{t('resumen')}</h2>
          <dl className="pedido-datos">
            <div className="pedido-dato">
              <dt>{t('resumenCodigo')}</dt>
              <dd className="pedido-dato-codigo">
                <span>{reserva.codigo}</span>
                <CopiarCodigo codigo={reserva.codigo} etiqueta={t('copiar')} copiadoTexto={t('copiado')} />
              </dd>
            </div>
            <div className="pedido-dato">
              <dt>{t('resumenFecha')}</dt>
              <dd>{formato.dateTime(new Date(reserva.creadoEn), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' })}</dd>
            </div>
            {reserva.montoAbono != null && (
              <div className="pedido-dato">
                <dt>{t('abono', { porcentaje: reserva.porcentajeAbono ?? 0 })}</dt>
                <dd>
                  {formatPrecio(reserva.montoAbono, idioma)} · {reserva.abonoPagado ? t('abonoPagado') : t('abonoPendiente')}
                </dd>
              </div>
            )}
            {saldo != null && (
              <div className="pedido-dato">
                <dt>{t('saldo')}</dt>
                <dd>{formatPrecio(saldo, idioma)}</dd>
              </div>
            )}
            {reserva.total != null && (
              <div className="pedido-dato pedido-dato--total">
                <dt>{t('total')}</dt>
                <dd>{formatPrecio(reserva.total, idioma)}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="pedido-tarjeta pedido-productos" aria-labelledby="reserva-experiencia-titulo">
          <h2 id="reserva-experiencia-titulo" className="pedido-tarjeta-titulo">{t('experiencia')}</h2>
          <div className="pedido-item">
            <span className="pedido-item-media">
              {/* alt vacío: el nombre está escrito al lado. */}
              {reserva.experiencia.imagen
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={reserva.experiencia.imagen} alt="" width={64} height={64} loading="lazy" decoding="async" />
                : <span aria-hidden="true">🌿</span>}
            </span>
            <span className="pedido-item-info">
              {reserva.experiencia.slug
                ? <Link href={{ pathname: '/experiencias/[slug]', params: { slug: reserva.experiencia.slug } }} className="pedido-item-nombre">{reserva.experiencia.nombre}</Link>
                // Sin slug la experiencia ya no está en el sitio: el nombre queda sin enlace.
                : <span className="pedido-item-nombre">{reserva.experiencia.nombre}</span>}
            </span>
          </div>
          <dl className="pedido-datos" style={{ marginTop: '0.75rem' }}>
            <div className="pedido-dato">
              <dt>{t('fechaExperiencia')}</dt>
              <dd>{fechaExperiencia}</dd>
            </div>
            <div className="pedido-dato pedido-dato--sin-borde">
              <dt>{t('personasRotulo')}</dt>
              <dd>{t('personas', { n: reserva.cantidadPersonas })}</dd>
            </div>
          </dl>
        </section>

        {/* Cierre: ayuda por WhatsApp y las dos salidas, a todo el ancho. */}
        <section className="pedido-tarjeta pedido-cierre" aria-labelledby="reserva-ayuda-titulo">
          <div className="pedido-ayuda">
            <span className="pedido-disco" aria-hidden="true"><MessageCircle size={22} strokeWidth={2.25} /></span>
            <div className="pedido-ayuda-cuerpo">
              <h2 id="reserva-ayuda-titulo" className="pedido-tarjeta-titulo">{t('ayudaTitulo')}</h2>
              <p>{t('ayudaTexto', { codigo: reserva.codigo })}</p>
              <a
                className="pedido-ayuda-boton"
                href={whatsappCon(tw('reserva', { codigo: reserva.codigo }))}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('ayudaBoton')}
              </a>
            </div>
          </div>
          <div className="pedido-salidas">
            <Button href="/mi-reserva" variant="outline" style={{ minHeight: 44, width: '100%', textAlign: 'center' }}>
              {t('consultarOtro')}
            </Button>
            <Link href="/experiencias" className="checkout-editar">{t('verExperiencias')}</Link>
          </div>
        </section>
      </div>
    </section>
  )
}
