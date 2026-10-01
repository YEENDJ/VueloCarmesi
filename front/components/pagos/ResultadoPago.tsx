'use client'
import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, CircleAlert, Clock, SearchX, ShieldCheck, TimerOff, WifiOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import { clearCart, useLastOrder } from '@/lib/cart/store'
import { formatPrecio } from '@/lib/format'
import {
  ErrorPago, guardarPagoPendiente, obtenerEstadoPago, olvidarPagoPendiente, reintentarPago, vistaDe,
  type EstadoPublico, type VistaResultado,
} from '@/lib/pagos'

/** Cada cuánto se vuelve a preguntar mientras el banco no responde. */
const INTERVALO_MS = 3000
/** Cuánto se espera en la página antes de decir «te escribimos al correo». */
const ESPERA_MAXIMA_MS = 2 * 60_000

type Pantalla = VistaResultado | 'cargando' | 'noEncontrado' | 'errorRed'

const ICONO: Record<Pantalla, { Icono: LucideIcon; fondo: string; trazo: string }> = {
  cargando: { Icono: Clock, fondo: 'rgba(253,195,0,.25)', trazo: 'var(--color-brown)' },
  pendiente: { Icono: Clock, fondo: 'rgba(253,195,0,.25)', trazo: 'var(--color-brown)' },
  aprobado: { Icono: Check, fondo: 'var(--color-gold)', trazo: 'var(--color-brown)' },
  revision: { Icono: ShieldCheck, fondo: 'var(--color-gold)', trazo: 'var(--color-brown)' },
  rechazado: { Icono: CircleAlert, fondo: 'rgba(213,19,18,.12)', trazo: 'var(--color-crimson)' },
  vencido: { Icono: TimerOff, fondo: 'rgba(135,43,19,.1)', trazo: 'var(--color-brown)' },
  noEncontrado: { Icono: SearchX, fondo: 'rgba(135,43,19,.1)', trazo: 'var(--color-brown)' },
  errorRed: { Icono: WifiOff, fondo: 'rgba(135,43,19,.1)', trazo: 'var(--color-brown)' },
}

/**
 * La página a la que vuelve el cliente desde la pasarela.
 *
 * Nunca se fía de lo que la pasarela agrega a la URL de retorno: con la
 * referencia le pregunta al backend, que a su vez le pregunta a la pasarela si
 * el pago sigue pendiente (caso 6 del spec). Lo que se muestra depende del
 * pedido o la reserva, no solo de este intento: ver `vistaDe`.
 */
export default function ResultadoPago({
  referencia,
  tipo,
}: {
  referencia: string | null
  tipo: 'pedido' | 'reserva'
}) {
  const t = useTranslations('pagos.resultado')
  const tc = useTranslations('tienda.checkout')
  const idioma = useLocale()
  const ultimoPedido = useLastOrder()

  const [estado, setEstado] = useState<EstadoPublico | null>(null)
  const [pantalla, setPantalla] = useState<Pantalla>(referencia ? 'cargando' : 'noEncontrado')
  const [esperaLarga, setEsperaLarga] = useState(false)
  const [reintentando, setReintentando] = useState(false)
  const [errorReintento, setErrorReintento] = useState('')
  // Cada consulta al backend es un número más: el efecto de abajo escucha este
  // contador, y así el sondeo, «Consultar otra vez» y el reintento fallido
  // piden una consulta nueva sin llamar a setState dentro de un efecto.
  const [consulta, setConsulta] = useState(0)
  // Desde cuándo se está esperando al banco. 0 = todavía no empezó.
  const inicioEspera = useRef(0)

  useEffect(() => {
    if (!referencia) return
    let vigente = true
    obtenerEstadoPago(referencia)
      .then(e => {
        if (!vigente) return
        const vista = vistaDe(e)
        setEstado(e)
        setPantalla(vista)
        // El carrito se vacía aquí y no al crear el pedido: si el pago fallaba,
        // el cliente volvía y tenía que armar la compra otra vez.
        if (vista === 'aprobado' || vista === 'revision') {
          if (e.tipo === 'pedido') clearCart()
          olvidarPagoPendiente()
        } else if (vista === 'vencido') {
          olvidarPagoPendiente()
        }
      })
      .catch(err => {
        if (vigente) setPantalla(err instanceof ErrorPago && err.status === 404 ? 'noEncontrado' : 'errorRed')
      })
    return () => { vigente = false }
  }, [referencia, consulta])

  // Mientras el banco no responde se sigue preguntando, con tope: pasados dos
  // minutos se le dice que llega un correo, en vez de dejarlo mirando un reloj.
  useEffect(() => {
    if (pantalla !== 'pendiente' || esperaLarga) return
    const id = setInterval(() => {
      if (inicioEspera.current === 0) inicioEspera.current = Date.now()
      if (Date.now() - inicioEspera.current > ESPERA_MAXIMA_MS) setEsperaLarga(true)
      else setConsulta(n => n + 1)
    }, INTERVALO_MS)
    return () => clearInterval(id)
  }, [pantalla, esperaLarga])

  const volverAConsultar = () => {
    inicioEspera.current = 0
    setEsperaLarga(false)
    setConsulta(n => n + 1)
  }

  const reintentar = async () => {
    if (!referencia) return
    setReintentando(true)
    setErrorReintento('')
    try {
      const intento = await reintentarPago(referencia, idioma)
      // Una sola referencia en curso: la nueva reemplaza a la rechazada.
      guardarPagoPendiente(intento.referencia)
      window.location.assign(intento.url)
    } catch (err) {
      // 409: venció mientras tanto o ya hay otro pago en curso. Volver a
      // consultar pone la pantalla que corresponde.
      if (err instanceof ErrorPago && err.status === 409) setConsulta(n => n + 1)
      else setErrorReintento(t('errorReintentar'))
      setReintentando(false)
    }
  }

  const { Icono, fondo, trazo } = ICONO[pantalla]
  const esPedido = (estado?.tipo ?? tipo) === 'pedido'
  const hora = estado?.venceEn
    ? new Date(estado.venceEn).toLocaleTimeString(idioma === 'en' ? 'en-US' : 'es-CO', {
        hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota',
      })
    : null
  const saldo = estado && estado.total != null ? estado.total - estado.monto : 0
  // El resumen del carrito solo si es de ESTE pedido: el último guardado podía
  // ser de otra compra.
  const resumen = esPedido && estado?.codigo && ultimoPedido?.code === `#${estado.codigo}` ? ultimoPedido : null

  const textos: Record<Pantalla, { titulo: string; cuerpo: string }> = {
    cargando: { titulo: t('cargando'), cuerpo: '' },
    pendiente: { titulo: t('pendienteTitulo'), cuerpo: esperaLarga ? t('pendienteLargo') : t('pendienteTexto') },
    aprobado: esPedido
      ? { titulo: t('aprobadoPedidoTitulo'), cuerpo: t('aprobadoPedidoTexto') }
      : { titulo: t('aprobadoReservaTitulo'), cuerpo: t('aprobadoReservaTexto', { monto: formatPrecio(estado?.monto ?? 0, idioma) }) },
    revision: { titulo: t('revisionTitulo'), cuerpo: t('revisionTexto') },
    rechazado: { titulo: t('rechazadoTitulo'), cuerpo: t('rechazadoTexto') },
    vencido: { titulo: t('vencidoTitulo'), cuerpo: esPedido ? t('vencidoPedidoTexto') : t('vencidoReservaTexto') },
    noEncontrado: { titulo: t('noEncontradoTitulo'), cuerpo: t('noEncontradoTexto') },
    errorRed: { titulo: t('errorRed'), cuerpo: '' },
  }
  const { titulo, cuerpo } = textos[pantalla]
  // Mientras la página sigue preguntando sola. Pasados los dos minutos deja de
  // consultar, y ahí la animación mentiría.
  const consultando = pantalla === 'cargando' || (pantalla === 'pendiente' && !esperaLarga)
  const claseIcono = consultando ? 'pago-latido' : pantalla === 'aprobado' || pantalla === 'revision' ? 'pago-exito' : undefined

  return (
    <section style={{ backgroundColor: 'var(--color-cream)', minHeight: '70svh' }}>
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: 'clamp(48px, 10vw, 80px) clamp(16px, 5vw, 24px)',
          textAlign: 'center',
        }}
      >
        <div
          aria-hidden="true"
          className={consultando ? 'pago-anillo' : undefined}
          style={{
            width: '80px', height: '80px', borderRadius: '50%', backgroundColor: fondo,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}
        >
          <Icono size={40} strokeWidth={2.5} color={trazo} className={claseIcono} />
        </div>

        {/* aria-live: el título cambia solo mientras se consulta, y quien usa
            lector de pantalla tiene que enterarse de que el pago se aprobó. */}
        <div aria-live="polite">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 7vw, 44px)',
              color: pantalla === 'aprobado' ? 'var(--color-crimson)' : 'var(--color-brown)',
              lineHeight: 1.15,
              margin: '0 0 16px',
              overflowWrap: 'anywhere',
            }}
          >
            {titulo}
          </h1>
          {cuerpo && (
            <p style={{ fontSize: 'clamp(16px, 2.5vw, 18px)', color: 'var(--color-brown)', lineHeight: 1.7, maxWidth: '44ch', margin: '0 auto', opacity: 0.85 }}>
              {cuerpo}
            </p>
          )}
        </div>

        {consultando && (
          <>
            {pantalla === 'pendiente' && (
              <p style={{ fontWeight: 700, color: 'var(--color-brown)', margin: '20px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                {t('verificando')}
                <span className="pago-puntos" aria-hidden="true"><span /><span /><span /></span>
              </p>
            )}
            <div className="pago-barra" aria-hidden="true" />
          </>
        )}

        {pantalla === 'aprobado' && !esPedido && saldo > 0 && (
          <p style={{ fontWeight: 700, color: 'var(--color-brown)', margin: '16px auto 0', maxWidth: '44ch' }}>
            {t('saldoReserva', { saldo: formatPrecio(saldo, idioma) })}
          </p>
        )}

        {pantalla === 'rechazado' && hora && (
          <p style={{ fontWeight: 700, color: 'var(--color-brown)', margin: '16px auto 0' }}>
            {t('apartadoHasta', { hora })}
          </p>
        )}

        {resumen && pantalla === 'aprobado' && (
          <div
            style={{
              backgroundColor: '#FFF6E4', border: '2px solid var(--color-amber)', borderRadius: '12px',
              padding: 'clamp(20px, 5vw, 32px)', marginTop: '32px', textAlign: 'left',
            }}
          >
            <p style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-amber)', margin: 0 }}>
              {tc('pedidoCodigo', { codigo: resumen.code })}
            </p>
            <div style={{ height: '1px', background: 'rgba(135,43,19,0.15)', margin: '1rem 0' }} />
            {resumen.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontWeight: 700, color: 'var(--color-brown)', marginBottom: '0.6rem' }}>
                <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{item.nombre} ×{item.q}</span>
                <span style={{ flexShrink: 0 }}>{formatPrecio(item.subtotal, idioma)}</span>
              </div>
            ))}
            <div style={{ height: '1px', background: 'rgba(135,43,19,0.15)', margin: '1rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-brown)' }}>{tc('total')}</span>
              <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-amber)' }}>{formatPrecio(resumen.total, idioma)}</span>
            </div>
          </div>
        )}

        {errorReintento && (
          <p role="alert" style={{ color: 'var(--color-crimson)', fontWeight: 700, marginTop: '24px' }}>{errorReintento}</p>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '32px' }}>
          {pantalla === 'rechazado' && (
            <Button onClick={reintentar} disabled={reintentando} style={{ minHeight: 44 }}>
              {reintentando ? t('reintentando') : t('reintentar')}
            </Button>
          )}
          {/* Mientras está pendiente el botón está siempre: si el sondeo se
              quedó corto o la página no se enteró, el cliente no tiene que
              recargar. Secundario mientras la página consulta sola. */}
          {(pantalla === 'errorRed' || pantalla === 'pendiente') && (
            <Button
              onClick={volverAConsultar}
              variant={pantalla === 'pendiente' && !esperaLarga ? 'outline' : undefined}
              style={{ minHeight: 44 }}
            >
              {t('consultar')}
            </Button>
          )}
          {pantalla === 'vencido' && (
            esPedido
              ? <Button href="/carrito" style={{ minHeight: 44 }}>{t('irCarrito')}</Button>
              : <Button href="/experiencias" style={{ minHeight: 44 }}>{t('irExperiencias')}</Button>
          )}
          {pantalla !== 'cargando' && pantalla !== 'pendiente' && (
            <Button href={esPedido ? '/tienda' : '/'} variant="outline" style={{ minHeight: 44 }}>
              {esPedido ? t('volverTienda') : t('volverInicio')}
            </Button>
          )}
        </div>

        {/* La referencia, para que la pueda citar por WhatsApp si algo sale mal. */}
        {referencia && pantalla !== 'noEncontrado' && (
          <p style={{ fontSize: '13px', color: 'var(--color-brown)', opacity: 0.6, marginTop: '32px', overflowWrap: 'anywhere' }}>
            {t('referencia', { referencia })}
          </p>
        )}
      </div>
    </section>
  )
}
