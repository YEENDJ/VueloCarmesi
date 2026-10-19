'use client'
import { useEffect, useRef, useState } from 'react'
import { useCart } from '@/lib/cart/store'
import { useTranslations, useLocale } from 'next-intl'
import { Trash2 } from 'lucide-react'
import { formatPrecio } from '@/lib/format'
import Button from '@/components/ui/Button'
import QuantitySelector from '@/components/ui/QuantitySelector'
import SugerenciasCarrito from '@/components/shop/SugerenciasCarrito'
import PagoSeguro from '@/components/shop/PagoSeguro'

export default function CarritoPage() {
  const idioma = useLocale()

  const tg = useTranslations('galeria')

  const t = useTranslations('tienda.carrito')

  const { items, cartCount, cartTotal, inc, dec, remove, clearCart } = useCart()

  // En móvil y tablet el resumen queda al final de la página. Mientras no se
  // ve, una barra fija abajo lleva el total y «Ir a pagar»; cuando el resumen
  // entra en pantalla la barra se va, para no mostrar dos veces lo mismo.
  // Mismo patrón que la barra de compra de la ficha de producto.
  const resumenRef = useRef<HTMLDivElement>(null)
  const [barraVisible, setBarraVisible] = useState(false)
  const hayItems = items.length > 0

  // Vaciar borra todo y no se puede deshacer: pide confirmación en una alerta
  // propia (<dialog> modal) y no con window.confirm, que en móvil es un cuadro
  // del sistema sin la marca ni el idioma del sitio.
  const alertaVaciarRef = useRef<HTMLDialogElement>(null)
  const vaciar = () => {
    alertaVaciarRef.current?.close()
    clearCart()
  }

  useEffect(() => {
    const nodo = resumenRef.current
    if (!nodo) return
    // Solo mientras el resumen está más abajo: si ya se pasó y se ve el footer,
    // la barra taparía el pie de página sin aportar nada.
    const observador = new IntersectionObserver(([entrada]) =>
      setBarraVisible(!entrada.isIntersecting && entrada.boundingClientRect.top > 0),
    )
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [hayItems])

  if (items.length === 0) {
    return (
      <section className="page-shell" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)', fontSize: 'var(--fs-h1)' }}>{t('vacio')}</h1>
        <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>{t('vacioTexto')}</p>
        <Button href="/tienda">{t('verTienda')}</Button>
      </section>
    )
  }

  return (
    // Sin maxWidth propio: el de .page-shell es --contenido-ancho, el mismo del
    // navbar, así el carrito alinea con el logo y los enlaces de arriba.
    <section className="page-shell shop-columns">
      <div className="shop-main">
        {/* Compacto y con el conteo: el h1 a tamaño de portada empujaba los
            productos y el resumen media pantalla hacia abajo. */}
        <h1 className="cart-titulo">{t('tituloConteo', { n: cartCount })}</h1>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map(item => (
            <div key={item.productoId} className="cart-row">
              <div className="cart-row-media">
                {/* El emoji queda para ítems guardados sin foto (productos sin
                    imagen o carritos viejos en localStorage). alt vacío: el
                    nombre ya está escrito al lado. */}
                {item.imagen
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={item.imagen} alt=""
                         width={160} height={160} loading="lazy" decoding="async"
                         style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <span style={{ fontSize: '1.75rem' }}>🍫</span>
                }
              </div>
              <div className="cart-row-info">
                <p className="cart-row-nombre">{item.nombre}</p>
                <p className="cart-row-unitario">{t('porUnidad', { precio: formatPrecio(item.precio, idioma) })}</p>
              </div>
              <div className="cart-row-cantidad">
                <QuantitySelector
                  value={item.q}
                  onChange={next => next > item.q ? inc(item.productoId) : dec(item.productoId)}
                  min={1}
                  max={item.stock}
                />
              </div>
              <span className="cart-row-total">
                {formatPrecio(item.precio * item.q, idioma)}
              </span>
              <button
                type="button"
                onClick={() => remove(item.productoId)}
                className="cart-row-remove"
                aria-label={t('quitar', { nombre: item.nombre })}
              >
                <Trash2 size={20} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        {/* «Seguir comprando» es un botón; «Vaciar» es un enlace discreto: es
            destructivo y no debe pesar lo mismo que la acción que sí ayuda. */}
        <div className="cart-acciones">
          <Button
            href="/tienda"
            variant="outline"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', minHeight: '44px',
              padding: '8px clamp(10px, 3vw, 24px)', fontSize: 'clamp(0.85rem, 3.4vw, 1rem)',
            }}
          >
            {tg('seguirComprando')}
          </Button>
          <button type="button" className="cart-vaciar" onClick={() => alertaVaciarRef.current?.showModal()}>
            {t('vaciar')}
          </button>
        </div>

        {/* Alerta de confirmación. showModal() trae el fondo oscuro, Escape para
            cancelar y el foco atrapado dentro. «Cancelar» va primero en el
            DOM a propósito: es el que recibe el foco al abrir, así un Enter
            por inercia cancela en vez de borrar. */}
        <dialog
          ref={alertaVaciarRef}
          className="cart-alerta"
          role="alertdialog"
          aria-labelledby="cart-alerta-titulo"
          aria-describedby="cart-alerta-texto"
          onClick={e => { if (e.target === e.currentTarget) e.currentTarget.close() }}
        >
          <div className="cart-alerta-marco">
            <span className="cart-alerta-icono" aria-hidden="true">
              <Trash2 size={24} strokeWidth={2} />
            </span>
            <h2 id="cart-alerta-titulo" className="cart-alerta-titulo">{t('vaciarPregunta')}</h2>
            <p id="cart-alerta-texto" className="cart-alerta-texto">{t('vaciarTexto', { n: cartCount })}</p>
            <div className="cart-alerta-botones">
              <button type="button" className="cart-alerta-boton" onClick={() => alertaVaciarRef.current?.close()}>
                {t('vaciarNo')}
              </button>
              <button type="button" className="cart-alerta-boton cart-alerta-boton--peligro" onClick={vaciar}>
                {t('vaciarSi')}
              </button>
            </div>
          </div>
        </dialog>
      </div>

      {/* Las sugerencias van en esta columna y no bajo los ítems: así quedan a
          la vista sin scroll, al lado del botón de checkout, que es justo donde
          el cliente decide. En móvil .cart-aside las sube por encima del
          resumen, para que pase por ellas antes de llegar al botón. */}
      <div className="shop-aside cart-aside">
        <div ref={resumenRef} className="cart-resumen" style={{
          background: 'var(--color-cream)', border: '1px solid rgba(135,43,19,0.15)',
          borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(135,43,19,0.16)',
        }}>
          <h2 className="cart-resumen-titulo">{t('resumen')}</h2>
          {/* Sin línea de subtotal: el envío no suma aquí, así que subtotal y
              total eran la misma cifra dos veces. El envío va en gris y dice
              qué pasa con él; en verde parecía «gratis». */}
          <div className="cart-resumen-total">
            <span>{t('total')}</span>
            <span className="cart-resumen-cifra">{formatPrecio(cartTotal, idioma)}</span>
          </div>
          <p className="cart-resumen-envio">{t('envioCotiza')}</p>
          <Button
            href="/checkout"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', width: '100%', minHeight: '48px', marginTop: '1.25rem',
            }}
          >
            {t('irCheckout')}
          </Button>
          {/* Justo bajo el botón, que es donde se duda: con quién se paga y cómo. */}
          <PagoSeguro />
        </div>
        {/* Tres y no cinco: con cinco la columna no cabía en la pantalla y
            las sugerencias quedaban cortadas o con scroll propio. */}
        <SugerenciasCarrito limite={3} />
      </div>

      {/* Se monta y desmonta en vez de esconderse: una barra oculta pero
          enfocable con el tabulador es peor que no tenerla. Desde 1024px el
          resumen ya viaja fijo a la derecha y el CSS la oculta. */}
      {barraVisible && (
        <div className="cart-barra-pago">
          <div className="cart-barra-pago-total">
            <span className="cart-barra-pago-rotulo">{t('total')}</span>
            <span className="cart-barra-pago-cifra">{formatPrecio(cartTotal, idioma)}</span>
          </div>
          <Button href="/checkout" style={{ flexShrink: 0, minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
            {t('irCheckout')}
          </Button>
        </div>
      )}
    </section>
  )
}
