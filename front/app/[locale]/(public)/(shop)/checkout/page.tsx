'use client'
import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCart, setLastOrder } from '@/lib/cart/store'
import { checkoutSchema, type CheckoutFormValues } from '@/lib/cart/checkout-schema'
import { formatPrecio } from '@/lib/format'
import {
  crearPago, guardarPagoPendiente, leerPagoPendiente, obtenerEstadoPago, olvidarPagoPendiente,
  useConfigPagos, vistaDe,
} from '@/lib/pagos'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function CheckoutPage() {
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

  return (
    <section className="page-shell shop-columns" style={{ maxWidth: '1000px' }}>
      <form onSubmit={handleSubmit(onSubmit)} className="shop-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h1 style={{ color: 'var(--color-brown)', fontSize: 'var(--fs-h1)' }}>Checkout</h1>

        <h3 style={{ color: 'var(--color-brown)', marginBottom: 0, fontSize: 'var(--fs-h3)' }}>{t('datosContacto')}</h3>
        <Input label={t('nombre')} error={errors.nombre?.message && t(errors.nombre.message)} {...register('nombre')} />
        <Input label={t('email')} type="email" error={errors.email?.message && t(errors.email.message)} {...register('email')} />
        <Input label={t('telefono')} type="tel" error={errors.telefono?.message && t(errors.telefono.message)} {...register('telefono')} />

        <h3 style={{ color: 'var(--color-brown)', marginBottom: 0, fontSize: 'var(--fs-h3)' }}>{t('datosEntrega')}</h3>
        <Input label={t('direccion')} error={errors.direccion?.message && t(errors.direccion.message)} {...register('direccion')} />
        <Input label={t('ciudad')} error={errors.ciudad?.message && t(errors.ciudad.message)} {...register('ciudad')} />
        <Input label={t('codigoPostal')} error={errors.codigoPostal?.message && t(errors.codigoPostal.message)} {...register('codigoPostal')} />

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

        {submitError && <p role="alert" style={{ color: 'var(--color-crimson)', fontSize: '0.9rem' }}>{submitError}</p>}

        <Button type="submit" disabled={isSubmitting || redirigiendo} style={{ minHeight: 44 }}>
          {isSubmitting || redirigiendo
            ? t('procesando')
            : t(pagos?.activo ? 'pagar' : 'confirmar', { total: formatPrecio(cartTotal, idioma) })}
        </Button>
        {/* El aviso ya decía «aceptas nuestras condiciones de venta», pero no
            llevaba a ninguna parte. Ahora enlaza los dos textos que el
            comprador acepta al pulsar el botón —las condiciones de la tienda y
            el tratamiento de sus datos—, que es lo que hace que la aceptación
            sea informada y no una frase decorativa. */}
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'rgba(135,43,19,0.6)' }}>
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
      </form>

      <div className="shop-aside" style={{
        background: 'var(--color-brown)', borderRadius: '12px', padding: '2rem',
      }}>
        <p style={{
          fontWeight: 700, fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase',
          color: 'var(--color-gold)', marginBottom: '1.1rem',
        }}>
          {t('resumenPedido')}
        </p>
        {items.map(item => (
          <div key={item.productoId} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.85rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-cream)', flex: 1 }}>{item.nombre}</span>
            <span style={{ fontWeight: 700, fontSize: '0.75rem', background: 'var(--color-amber)', color: 'var(--color-brown)', borderRadius: '999px', padding: '2px 8px' }}>
              ×{item.q}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--color-cream)' }}>{formatPrecio(item.precio * item.q, idioma)}</span>
          </div>
        ))}
        <div style={{ height: '1px', background: 'rgba(253,195,0,0.4)', margin: '1.25rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-cream)' }}>{t('total')}</span>
          <span style={{ fontWeight: 700, fontSize: '1.375rem', color: 'var(--color-amber)' }}>{formatPrecio(cartTotal, idioma)}</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,234,202,0.6)', marginTop: '1rem' }}>
          {t(pagos?.activo ? 'pagoEnLinea' : 'coordinamosMetodo')}
        </p>
      </div>
    </section>
  )
}
