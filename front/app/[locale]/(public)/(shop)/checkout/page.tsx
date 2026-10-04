'use client'
import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCart, setLastOrder, type CartItem } from '@/lib/cart/store'
import { checkoutSchema, type CheckoutFormValues } from '@/lib/cart/checkout-schema'
import { ChevronDown, ShieldCheck } from 'lucide-react'
import { formatPrecio } from '@/lib/format'
import {
  crearPago, guardarPagoPendiente, leerPagoPendiente, obtenerEstadoPago, olvidarPagoPendiente,
  useConfigPagos, vistaDe,
} from '@/lib/pagos'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useDespertarBackend } from '@/lib/despertar-backend'

export default function CheckoutPage() {
  useDespertarBackend()
  const idioma = useLocale()

  const t = useTranslations('tienda.checkout')

  const router = useRouter()
  const { items, cartTotal, clearCart } = useCart()
  const [submitError, setSubmitError] = useState('')
  const pagos = useConfigPagos()
  // El pedido ya creado cuyo pago no se pudo abrir. Si el cliente vuelve a
  // pulsar, se reintenta solo el pago: crear otro pedido apartaría el stock
  // dos veces.
  const [pedidoSinPagar, setPedidoSinPagar] = useState<string | null>(null)
  // Un pago que quedó en curso de una visita anterior (ver leerPagoPendiente).
  const [pagoEnCurso, setPagoEnCurso] = useState<string | null>(null)
  // Mientras el navegador se va a la pasarela, el botón no vuelve a
  // habilitarse: un segundo clic abriría otro intento.
  const [redirigiendo, setRedirigiendo] = useState(false)

  // Quien pagó y cerró la pestaña sin volver a la página de resultado
  // encontraría aquí su carrito lleno con lo que ya compró. Se pregunta cómo
  // terminó ese pago antes de dejarlo comprar otra vez.
  useEffect(() => {
    const referencia = leerPagoPendiente()
    if (!referencia) return
    obtenerEstadoPago(referencia).then(e => {
      const vista = vistaDe(e)
      if (vista === 'aprobado' || vista === 'revision') {
        clearCart()
        olvidarPagoPendiente()
      } else if (vista === 'pendiente') {
        setPagoEnCurso(referencia)
      } else {
        olvidarPagoPendiente()
      }
    }).catch(() => { /* sin respuesta: el checkout funciona igual */ })
  }, [clearCart])

  /** Abre la pasarela para un pedido ya creado. El carrito no se toca: se vacía al aprobarse. */
  const irAPagar = async (pedidoId: string) => {
    try {
      const intento = await crearPago({ pedidoId }, idioma)
      guardarPagoPendiente(intento.referencia)
      setRedirigiendo(true)
      window.location.assign(intento.url)
    } catch {
      setPedidoSinPagar(pedidoId)
      throw new Error(t('errorAbrirPago'))
    }
  }

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({ resolver: zodResolver(checkoutSchema) })

  const onSubmit = async (data: CheckoutFormValues) => {
    setSubmitError('')
    try {
      if (pedidoSinPagar) {
        await irAPagar(pedidoSinPagar)
        return
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          items: items.map(i => ({ productoId: i.productoId, cantidad: i.q })),
        }),
      })
      // 429: el backend frena a quien manda muchos pedidos seguidos. Su mensaje
      // viene en inglés técnico; este sale del catálogo.
      if (res.status === 429) throw new Error(t('errorDemasiados'))
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message ?? `Error ${res.status}`)
      }
      const pedido = await res.json()
      setLastOrder({
        code: `#VC-${String(pedido.id).slice(-6).toUpperCase()}`,
        items: items.map(i => ({ nombre: i.nombre, q: i.q, subtotal: i.precio * i.q })),
        total: cartTotal,
      })
      // El backend decide si se cobra en línea: si el pedido nace esperando
      // pago, va a la pasarela. Si no, el flujo manual de siempre.
      if (pedido.estado === 'pendiente_pago') {
        await irAPagar(pedido.id)
        return
      }
      clearCart()
      router.push('/checkout/confirmacion')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('errorPedido'))
    }
  }

  if (items.length === 0) {
    return (
      <section className="page-shell" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem', color: 'var(--color-brown)', fontSize: 'var(--fs-h1)' }}>{t('vacio')}</h1>
        <Button href="/tienda">{t('irTienda')}</Button>
      </section>
    )
  }

  const avisoPago = pagos?.activo ? t('pagoEnLinea') : t('coordinamosMetodo')

  return (
    <section className="page-shell" style={{ maxWidth: '1000px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'clamp(24px, 4vw, 32px)' }}>
        <h1 style={{ color: 'var(--color-brown)', fontSize: 'var(--fs-h1)', lineHeight: 1.15 }}>{t('titulo')}</h1>
        <p style={{ fontSize: 'var(--fs-lead)', color: 'var(--color-brown)', opacity: 0.8 }}>{t('bajada')}</p>
      </header>

      {/* En móvil el lateral cae debajo del formulario y nadie lo veía antes
          de pagar. Este resumen va arriba, abierto, y se puede plegar. */}
      <ResumenMovil items={items} total={cartTotal} idioma={idioma} />

      <div className="shop-columns">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="shop-main form-tarjeta">
          <fieldset className="form-grupo">
            <legend className="form-grupo-titulo"><span className="form-grupo-num" aria-hidden="true">1</span>{t('datosContacto')}</legend>
            <Input label={t('nombre')} required autoComplete="name" maxLength={100}
              error={errors.nombre?.message && t(errors.nombre.message)} {...register('nombre')} />
            <div className="form-row-2">
              <Input label={t('email')} type="email" required autoComplete="email" maxLength={255}
                placeholder={t('placeholderEmail')}
                error={errors.email?.message && t(errors.email.message)} {...register('email')} />
              <Input label={t('telefono')} type="tel" required autoComplete="tel" inputMode="tel"
                placeholder="+57 300 000 0000"
                error={errors.telefono?.message && t(errors.telefono.message)} {...register('telefono')} />
            </div>
          </fieldset>

          <fieldset className="form-grupo">
            <legend className="form-grupo-titulo"><span className="form-grupo-num" aria-hidden="true">2</span>{t('datosEntrega')}</legend>
            <Input label={t('direccion')} required autoComplete="street-address" maxLength={200}
              placeholder={t('placeholderDireccion')} ayuda={t('ayudaDireccion')}
              error={errors.direccion?.message && t(errors.direccion.message)} {...register('direccion')} />
            {/* Ciudad a media columna: un nombre de ciudad no necesita todo el ancho. */}
            <div className="form-row-2">
              <Input label={t('ciudad')} required autoComplete="address-level2" maxLength={100}
                placeholder={t('placeholderCiudad')}
                error={errors.ciudad?.message && t(errors.ciudad.message)} {...register('ciudad')} />
            </div>
          </fieldset>

          {/* Honeypot: fuera de pantalla, sin tabulación y sin autocompletado. Los
              humanos no lo ven; los bots lo llenan y el backend los descarta. */}
          <div className="campo-trampa" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
          </div>

          {pagoEnCurso && (
            <p role="status" style={{
              fontSize: '0.9rem', color: 'var(--color-brown)', background: 'rgba(253,195,0,.18)',
              border: '1px solid var(--color-amber)', borderRadius: '8px', padding: '12px 16px', margin: 0,
            }}>
              {t.rich('pagoAnteriorEnCurso', {
                ver: texto => (
                  <Link
                    href={{ pathname: '/checkout/resultado', query: { ref: pagoEnCurso } }}
                    style={{ color: 'var(--color-crimson)', fontWeight: 700, display: 'inline-block', padding: '10px 0', minHeight: 44 }}
                  >
                    {texto}
                  </Link>
                ),
              })}
            </p>
          )}

          {submitError && <p role="alert" style={{ color: 'var(--color-crimson)', fontSize: '0.9rem', margin: 0 }}>{submitError}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* El aviso de pago, que en escritorio va en el lateral, aquí justo
                antes del botón: en móvil el lateral no se muestra. */}
            <p className="checkout-resumen-movil" style={{
              fontSize: '13px', lineHeight: 1.5, color: 'var(--color-brown)', background: '#FFF0D6',
              border: '1px solid rgba(245,156,0,.55)', borderRadius: '8px', padding: '12px', margin: 0,
            }}>
              {avisoPago}
            </p>
            <Button type="submit" disabled={isSubmitting || redirigiendo}
              style={{ width: '100%', minHeight: 50, borderRadius: '8px', fontSize: '17px' }}>
              {isSubmitting || redirigiendo
                ? t('procesando')
                : t(pagos?.activo ? 'pagar' : 'confirmar', { total: formatPrecio(cartTotal, idioma) })}
            </Button>
            {/* El aviso ya decía «aceptas nuestras condiciones de venta», pero no
                llevaba a ninguna parte. Ahora enlaza los dos textos que el
                comprador acepta al pulsar el botón —las condiciones de la tienda y
                el tratamiento de sus datos—, que es lo que hace que la aceptación
                sea informada y no una frase decorativa. */}
            <p style={{ textAlign: 'center', fontSize: '0.8125rem', lineHeight: 1.5, color: 'rgba(135,43,19,0.78)', margin: 0 }}>
              {t.rich('condiciones', {
                terminos: texto => (
                  <Link href="/politicas/terminos-tienda" style={{ color: 'var(--color-crimson)', fontWeight: 700 }}>
                    {texto}
                  </Link>
                ),
                datos: texto => (
                  <Link href="/politicas/datos-personales" style={{ color: 'var(--color-crimson)', fontWeight: 700 }}>
                    {texto}
                  </Link>
                ),
              })}
            </p>
          </div>
        </form>

        {/* Sin `display` en línea: le ganaría a la regla que lo oculta en móvil. */}
        <aside className="shop-aside checkout-aside" style={{
          background: 'var(--color-brown)', borderRadius: '12px', padding: '28px',
        }}>
          <p style={{
            fontWeight: 700, fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase',
            color: 'var(--color-gold)', margin: 0,
          }}>
            {t('resumenPedido')}
          </p>
          <ListaResumen items={items} total={cartTotal} idioma={idioma} />
          {pagos?.activo ? (
            // El escudo dice «pago seguro» sin una frase más: el nombre accesible
            // lo da `aria-label` para quien no ve el ícono.
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255,234,202,.08)',
              borderRadius: '8px', padding: '12px',
            }}>
              <ShieldCheck
                role="img"
                aria-label={t('pagoSeguro')}
                size={20}
                strokeWidth={1.75}
                style={{ flexShrink: 0, color: 'var(--color-gold)' }}
              >
                <title>{t('pagoSeguro')}</title>
              </ShieldCheck>
              <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,234,202,0.85)', margin: 0, minWidth: 0 }}>
                {t('pagoEnLinea')}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,234,202,0.85)', margin: 0 }}>
              {t('coordinamosMetodo')}
            </p>
          )}
        </aside>
      </div>
    </section>
  )
}

interface ResumenProps {
  items: CartItem[]
  total: number
  idioma: string
}

/** Productos, envío y total. La comparten el lateral de escritorio y el resumen de móvil. */
function ListaResumen({ items, total, idioma }: ResumenProps) {
  const t = useTranslations('tienda.checkout')
  const tc = useTranslations('tienda.carrito')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: 'var(--color-cream)' }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {items.map(item => (
          <li key={item.productoId} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              width: 48, height: 48, flex: 'none', borderRadius: '8px', overflow: 'hidden',
              background: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* alt vacío: el nombre del producto está escrito al lado. */}
              {item.imagen
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={item.imagen} alt="" width={96} height={96} loading="lazy" decoding="async"
                       style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>🍫</span>}
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>{item.nombre}</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,234,202,.75)' }}>
                {t('cantidadPorPrecio', { q: item.q, precio: formatPrecio(item.precio, idioma) })}
              </span>
            </span>
            <span style={{ fontWeight: 700, flex: 'none' }}>{formatPrecio(item.precio * item.q, idioma)}</span>
          </li>
        ))}
      </ul>
      <div style={{ height: '1px', background: 'rgba(253,195,0,.35)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '15px' }}>
        <span>{tc('envio')}</span>
        <span style={{ fontWeight: 700 }}>{tc('aCoordinar')}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
        <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{t('total')}</span>
        <span style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--color-gold)' }}>{formatPrecio(total, idioma)}</span>
      </div>
    </div>
  )
}

/** El resumen de arriba en móvil: abierto al entrar, para confirmar qué se paga antes de escribir los datos. */
function ResumenMovil({ items, total, idioma }: ResumenProps) {
  const t = useTranslations('tienda.checkout')
  const [abierto, setAbierto] = useState(true)
  const n = items.reduce((suma, item) => suma + item.q, 0)
  return (
    <div className="checkout-resumen-movil" style={{
      background: 'var(--color-brown)', color: 'var(--color-cream)', borderRadius: '12px',
      marginBottom: '24px', overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        aria-expanded={abierto}
        aria-controls="checkout-resumen-detalle"
        style={{
          width: '100%', minHeight: 56, padding: '0 16px', border: 0, background: 'transparent',
          color: 'inherit', fontFamily: 'var(--font-body)', fontSize: '15px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, minWidth: 0, textAlign: 'left' }}>
          {t(abierto ? 'ocultarResumen' : 'verResumen', { n })}
          <ChevronDown size={16} strokeWidth={2.5} aria-hidden="true"
            style={{ flex: 'none', color: 'var(--color-gold)', transform: abierto ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} />
        </span>
        <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--color-gold)', flex: 'none' }}>{formatPrecio(total, idioma)}</span>
      </button>
      {abierto && (
        <div id="checkout-resumen-detalle" style={{ padding: '14px 16px 8px', borderTop: '1px solid rgba(253,195,0,.25)' }}>
          <ListaResumen items={items} total={total} idioma={idioma} />
          <Link href="/carrito" style={{
            display: 'inline-flex', alignItems: 'center', minHeight: 44, marginTop: '4px',
            fontSize: '14px', fontWeight: 700, color: 'var(--color-gold)',
          }}>
            {t('editarCarrito')}
          </Link>
        </div>
      )}
    </div>
  )
}
