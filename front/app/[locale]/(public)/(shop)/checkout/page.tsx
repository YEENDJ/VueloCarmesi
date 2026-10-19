'use client'
import { useEffect, useState } from 'react'
import { useTranslations, useLocale, useFormatter } from 'next-intl'
// El router con idioma: el de next/navigation mandaba a /checkout/... sin el
// prefijo /en y el visitante inglés terminaba en la página en español.
import { Link, useRouter } from '@/lib/i18n/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCart, setLastOrder, type CartItem } from '@/lib/cart/store'
import { checkoutSchema, type CheckoutFormValues } from '@/lib/cart/checkout-schema'
import { ChevronDown } from 'lucide-react'
import { formatPrecio } from '@/lib/format'
import {
  crearPago, ErrorPago, guardarPagoPendiente, leerPagoPendiente, obtenerEstadoPago, olvidarPagoPendiente,
  reintentarPago, useConfigPagos, vistaDe,
} from '@/lib/pagos'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PagoSeguro from '@/components/shop/PagoSeguro'
import { useDespertarBackend } from '@/lib/despertar-backend'
import { whatsappCon } from '@/lib/contacto'

/** «14 oct, 3:42 p. m.»: cuándo se abrió un pago anterior, en hora de Colombia. */
const HORA_CORTA = {
  day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota',
} as const

/** El pago de una visita anterior que el banco aún no responde. */
interface PagoEnCurso {
  referencia: string
  creadoEn: string | null
  codigo: string | null
}

/** El pago de una visita anterior que el banco rechazó, con su pedido aún apartado. */
interface PagoRechazado extends PagoEnCurso {
  venceEn: string | null
  total: number | null
}

export default function CheckoutPage() {
  useDespertarBackend()
  const idioma = useLocale()

  const t = useTranslations('tienda.checkout')
  const tw = useTranslations('whatsapp')
  const formato = useFormatter()

  const router = useRouter()
  const { items, cartTotal, clearCart } = useCart()
  const [submitError, setSubmitError] = useState('')
  const pagos = useConfigPagos()
  // El pedido ya creado cuyo pago no se pudo abrir. Si el cliente vuelve a
  // pulsar, se reintenta solo el pago: crear otro pedido apartaría el stock
  // dos veces.
  const [pedidoSinPagar, setPedidoSinPagar] = useState<string | null>(null)
  // Un pago que quedó en curso de una visita anterior (ver leerPagoPendiente).
  const [pagoEnCurso, setPagoEnCurso] = useState<PagoEnCurso | null>(null)
  // Un pago anterior que el banco rechazó: quien se fue de la pasarela antes
  // de ver el resultado volvía aquí sin saber qué pasó, y al llenar los datos
  // otra vez creaba un segundo pedido mientras el primero seguía apartado.
  const [pagoRechazado, setPagoRechazado] = useState<PagoRechazado | null>(null)
  const [reintentando, setReintentando] = useState(false)
  // Mientras el navegador se va a la pasarela, el botón no vuelve a
  // habilitarse: un segundo clic abriría otro intento.
  const [redirigiendo, setRedirigiendo] = useState(false)

  // Quien pagó y cerró la pestaña sin volver a la página de resultado
  // encontraría aquí su carrito lleno con lo que ya compró. Se pregunta cómo
  // terminó ese pago antes de dejarlo comprar otra vez.
  //
  // El botón se bloquea solo si el banco ya tiene la transacción (PSE o Nequi
  // en curso): un pedido nuevo podría terminar en dos cobros. Quien abrió la
  // pasarela y la cerró sin pagar puede intentar de nuevo de inmediato. Se
  // vuelve a preguntar cada 15 s, así el botón se libera solo cuando el banco
  // responde, sin que el cliente tenga que recargar.
  useEffect(() => {
    const referencia = leerPagoPendiente()
    if (!referencia) return
    let vivo = true
    let reloj: ReturnType<typeof setTimeout> | undefined

    const consultar = () => obtenerEstadoPago(referencia).then(e => {
      if (!vivo) return
      const vista = vistaDe(e)
      const vencido = e.venceEn !== null && new Date(e.venceEn) <= new Date()
      // Un backend sin `enCurso` deja la regla anterior: bloquear hasta que
      // venza la reserva de 30 min.
      const enCurso = e.enCurso ?? !vencido
      if (vista === 'pendiente' && (enCurso || !vencido)) {
        // Sin transacción todavía no bloquea, pero se sigue mirando: si la
        // pasarela quedó abierta en otra pestaña y paga ahí, pasa a en curso.
        setPagoEnCurso(enCurso ? { referencia, creadoEn: e.creadoEn ?? null, codigo: e.codigo } : null)
        reloj = setTimeout(consultar, 15_000)
        return
      }
      setPagoEnCurso(null)
      // Rechazado con el pedido aún apartado (si hubiera vencido, vistaDe diría
      // «vencido»). La referencia se conserva: con ella se reintenta el mismo
      // pedido, y sigue ahí si el cliente recarga la página.
      if (vista === 'rechazado') {
        setPagoRechazado({
          referencia, creadoEn: e.creadoEn ?? null, codigo: e.codigo, venceEn: e.venceEn, total: e.total,
        })
        return
      }
      // Ya pagó: antes se vaciaba el carrito aquí en silencio y el cliente
      // veía «tu carrito está vacío» sin saber qué pasó con su compra. La
      // página de resultado lo dice, muestra el pedido y vacía el carrito.
      if (vista === 'aprobado' || vista === 'revision') {
        router.replace({ pathname: '/checkout/resultado', query: { ref: referencia } })
        return
      }
      olvidarPagoPendiente()
    }).catch(() => {
      // Sin respuesta no se bloquea a ciegas: el checkout funciona igual.
      if (vivo) setPagoEnCurso(null)
    })

    consultar()
    return () => { vivo = false; clearTimeout(reloj) }
  }, [clearCart, router])

  /**
   * Un intento nuevo sobre el pedido cuyo pago se rechazó: los datos ya están
   * en el pedido, no hay que llenarlos otra vez, y no se aparta stock dos veces.
   */
  const reintentarRechazado = async () => {
    if (!pagoRechazado) return
    setReintentando(true)
    setSubmitError('')
    try {
      const intento = await reintentarPago(pagoRechazado.referencia, idioma)
      // Una sola referencia en curso: la nueva reemplaza a la rechazada.
      guardarPagoPendiente(intento.referencia)
      setRedirigiendo(true)
      window.location.assign(intento.url)
    } catch (err) {
      setReintentando(false)
      // 409: venció mientras tanto o ya hay otro pago abierto. Ese pedido ya
      // no se puede pagar: queda el formulario para hacer uno nuevo.
      if (err instanceof ErrorPago && err.status === 409) {
        olvidarPagoPendiente()
        setPagoRechazado(null)
        setSubmitError(t('reintentoVencido'))
      } else {
        setSubmitError(t('errorAbrirPago'))
      }
    }
  }

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
    register, handleSubmit, formState: { errors, isSubmitting, isValid },
  // onTouched: el error de un campo aparece al salir de él, no con la primera
  // tecla; isValid sí se recalcula a cada cambio para habilitar el botón.
  } = useForm<CheckoutFormValues>({ resolver: zodResolver(checkoutSchema), mode: 'onTouched' })

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
        // Para «Ver cómo va» en el carrito vacío y en la confirmación.
        token: pedido.tokenConsulta ?? undefined,
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

  // Solo con la pasarela activa hay algo que avisar (la reserva de 30 min).
  // Sin ella ya no se dice «coordinamos el método de pago»: se quitó a pedido.
  const pagoEnLinea = Boolean(pagos?.activo)
  // Sin todos los datos, o con un pago anterior aún sin respuesta, no se
  // puede pagar; tampoco mientras se crea el pedido o se abre la pasarela.
  const bloqueado = !isValid || Boolean(pagoEnCurso) || isSubmitting || redirigiendo
  const reintentoPosible = Boolean(
    pagoRechazado?.codigo && pagoRechazado.venceEn && pagoRechazado.total === cartTotal,
  )

  return (
    // Sin maxWidth propio, como el carrito: el ancho de .page-shell es el del
    // navbar, así el formulario alinea con el logo y los enlaces de arriba.
    <section className="page-shell">
      {/* Compacto, como en el carrito: a tamaño de portada empujaba el
          formulario media pantalla hacia abajo. */}
      <h1 className="cart-titulo">{t('titulo')}</h1>

      {/* Arriba de todo: es lo primero que tiene que leer quien vuelve de la
          pasarela sin haber visto el resultado. */}
      {pagoRechazado && (
        <div role="alert" className="checkout-aviso checkout-aviso--rechazo">
          <p className="checkout-aviso-titulo">
            {pagoRechazado.creadoEn
              ? t('pagoRechazadoHora', { hora: formato.dateTime(new Date(pagoRechazado.creadoEn), HORA_CORTA) })
              : t('pagoRechazado')}
          </p>
          {/* Reintentar ese mismo pedido solo si el carrito no cambió: si no,
              se cobraría lo que había antes y no lo que ve en pantalla. */}
          {reintentoPosible ? (
            <>
              <p className="checkout-aviso-texto">
                {t('pagoRechazadoApartado', {
                  codigo: pagoRechazado.codigo!,
                  hora: formato.dateTime(new Date(pagoRechazado.venceEn!), {
                    hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota',
                  }),
                })}
              </p>
              <Button onClick={reintentarRechazado} disabled={reintentando || redirigiendo}
                style={{ minHeight: 48, width: '100%', borderRadius: '8px', marginTop: '4px' }}>
                {reintentando || redirigiendo
                  ? t('procesando')
                  : t('reintentarPago', { total: formatPrecio(pagoRechazado.total!, idioma) })}
              </Button>
            </>
          ) : (
            <p className="checkout-aviso-texto">{t('pagoRechazadoCambio')}</p>
          )}
        </div>
      )}

      {/* Hasta 1023px el lateral cae debajo del formulario y nadie lo veía
          antes de pagar. Este resumen va arriba, abierto, y se puede plegar. */}
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
            <div role="status" className="checkout-aviso">
              {/* Con la hora, para que se lea como algo real que está pasando
                  con su banco y no como un error del sitio. */}
              <p className="checkout-aviso-texto">
                {pagoEnCurso.creadoEn
                  ? t('pagoAnteriorEnCursoHora', {
                      hora: formato.dateTime(new Date(pagoEnCurso.creadoEn), HORA_CORTA),
                    })
                  : t('pagoAnteriorEnCurso')}
              </p>
              {/* Dos salidas: mirar cómo va, o escribir para que lo revisen a
                  mano en Wompi en vez de esperar. */}
              <div className="checkout-aviso-acciones">
                <Link
                  href={{ pathname: '/checkout/resultado', query: { ref: pagoEnCurso.referencia } }}
                  className="checkout-aviso-enlace"
                >
                  {t('verComoVa')}
                </Link>
                <a
                  href={whatsappCon(tw('pagoEnCurso', {
                    codigo: pagoEnCurso.codigo ?? pagoEnCurso.referencia, referencia: pagoEnCurso.referencia,
                  }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="checkout-aviso-enlace"
                >
                  {t('escribirWhatsapp')}
                </a>
              </div>
            </div>
          )}

          {submitError && <p role="alert" className="checkout-error">{submitError}</p>}

          <div className="checkout-cierre">
            <Button type="submit" disabled={bloqueado}
              style={{
                width: '100%', minHeight: 50, borderRadius: '8px', fontSize: '17px',
                cursor: bloqueado ? 'not-allowed' : 'pointer',
              }}>
              {isSubmitting || redirigiendo
                ? t('procesando')
                : t(pagoEnLinea ? 'pagar' : 'confirmar', { total: formatPrecio(cartTotal, idioma) })}
            </Button>
            {/* Un botón apagado sin explicación parece roto. Si falta algún
                dato, se dice aquí mismo; si lo frena un pago anterior, ya lo
                explica el aviso de arriba. */}
            {!isValid && !pagoEnCurso && (
              <p className="checkout-falta">{t('faltanDatos')}</p>
            )}
            {/* Justo bajo el botón, que es donde se duda: con quién se paga y
                cuánto aguarda el pedido. Antes iba en el lateral en escritorio
                y en una caja aparte en móvil; ahora es un solo sitio para todos. */}
            {pagoEnLinea && (
              <div className="checkout-pago-seguro">
                <PagoSeguro />
                <p className="checkout-reserva">{t('pagoEnLinea')}</p>
              </div>
            )}
            {/* El aviso ya decía «aceptas nuestras condiciones de venta», pero no
                llevaba a ninguna parte. Ahora enlaza los dos textos que el
                comprador acepta al pulsar el botón —las condiciones de la tienda y
                el tratamiento de sus datos—, que es lo que hace que la aceptación
                sea informada y no una frase decorativa. */}
            <p className="checkout-condiciones">
              {t.rich('condiciones', {
                terminos: texto => <Link href="/politicas/terminos-tienda">{texto}</Link>,
                datos: texto => <Link href="/politicas/datos-personales">{texto}</Link>,
              })}
            </p>
          </div>
        </form>

        {/* Misma tarjeta crema que el resumen del carrito: el cliente reconoce
            el pedido que acaba de revisar. Sin `display` en línea: le ganaría
            a la regla que lo oculta hasta 1023px. */}
        <aside className="shop-aside checkout-aside">
          <h2 className="cart-resumen-titulo">{t('resumenPedido')}</h2>
          <ListaResumen items={items} total={cartTotal} idioma={idioma} />
          <Link href="/carrito" className="checkout-editar">{t('editarCarrito')}</Link>
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

/** Productos, total y envío. La comparten el lateral de escritorio y el resumen de móvil. */
function ListaResumen({ items, total, idioma }: ResumenProps) {
  const t = useTranslations('tienda.checkout')
  const tc = useTranslations('tienda.carrito')
  return (
    <div className="checkout-lista">
      <ul className="checkout-items">
        {items.map(item => (
          <li key={item.productoId} className="checkout-item">
            <span className="checkout-item-media">
              {/* alt vacío: el nombre del producto está escrito al lado. */}
              {item.imagen
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={item.imagen} alt="" width={96} height={96} loading="lazy" decoding="async" />
                : <span aria-hidden="true">🍫</span>}
            </span>
            <span className="checkout-item-info">
              <span className="checkout-item-nombre">{item.nombre}</span>
              <span className="checkout-item-detalle">
                {t('cantidadPorPrecio', { q: item.q, precio: formatPrecio(item.precio, idioma) })}
              </span>
            </span>
            <span className="checkout-item-total">{formatPrecio(item.precio * item.q, idioma)}</span>
          </li>
        ))}
      </ul>
      {/* Como en el carrito: el envío no suma aquí, así que va en gris bajo el
          total diciendo qué pasa con él, y no como una línea más del cálculo. */}
      <div>
        <div className="cart-resumen-total">
          <span>{t('total')}</span>
          <span className="cart-resumen-cifra">{formatPrecio(total, idioma)}</span>
        </div>
        <p className="cart-resumen-envio">{tc('envioCotiza')}</p>
      </div>
    </div>
  )
}

/** El resumen de arriba hasta 1023px: abierto al entrar, para confirmar qué se paga antes de escribir los datos. */
function ResumenMovil({ items, total, idioma }: ResumenProps) {
  const t = useTranslations('tienda.checkout')
  const [abierto, setAbierto] = useState(true)
  const n = items.reduce((suma, item) => suma + item.q, 0)
  return (
    <div className="checkout-resumen-movil">
      <button
        type="button"
        onClick={() => setAbierto(a => !a)}
        aria-expanded={abierto}
        aria-controls="checkout-resumen-detalle"
        className="checkout-resumen-movil-boton"
      >
        <span className="checkout-resumen-movil-rotulo">
          {t(abierto ? 'ocultarResumen' : 'verResumen', { n })}
          <ChevronDown size={16} strokeWidth={2.5} aria-hidden="true"
            className="checkout-resumen-movil-flecha" data-abierto={abierto} />
        </span>
        <span className="cart-resumen-cifra">{formatPrecio(total, idioma)}</span>
      </button>
      {abierto && (
        <div id="checkout-resumen-detalle" className="checkout-resumen-movil-detalle">
          <ListaResumen items={items} total={total} idioma={idioma} />
          <Link href="/carrito" className="checkout-editar">{t('editarCarrito')}</Link>
        </div>
      )}
    </div>
  )
}
