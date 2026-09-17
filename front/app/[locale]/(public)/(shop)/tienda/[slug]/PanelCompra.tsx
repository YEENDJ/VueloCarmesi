'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { TriangleAlert } from 'lucide-react'
import type { Producto } from '@/lib/types'
import { useCart } from '@/lib/cart/store'
import { formatPrecio } from '@/lib/format'
import QuantitySelector from '@/components/ui/QuantitySelector'
import Button from '@/components/ui/Button'

const ESTILO_BOTON = { display: 'block', textAlign: 'center', width: '100%' } as const

/**
 * Bloque de compra de la ficha: estado del stock, cantidad y las dos acciones
 * que ya son convención en cualquier tienda —comprar ahora, que lleva derecho
 * al checkout, y agregar al carrito, que deja seguir mirando—. Incluye la barra
 * fija de móvil, que aparece sólo cuando los botones reales salen de pantalla.
 */
export default function PanelCompra({ producto }: { producto: Producto }) {
  const idioma = useLocale()

  const t = useTranslations('tienda.panel')

  const [cantidad, setCantidad] = useState(1)
  const [barraVisible, setBarraVisible] = useState(false)
  const accionesRef = useRef<HTMLDivElement>(null)
  const { addToCart } = useCart()
  const router = useRouter()

  const sinStock = producto.stock === 0
  // El aviso sale sólo cuando queda poco de verdad, no siempre: si aparece en
  // todas las fichas deja de significar nada.
  const pocoStock = producto.stock > 0 && producto.stock <= 5

  useEffect(() => {
    const nodo = accionesRef.current
    if (!nodo || sinStock) return
    const observador = new IntersectionObserver(
      ([entrada]) => setBarraVisible(!entrada.isIntersecting),
      // El margen negativo evita que la barra parpadee justo cuando el botón
      // asoma por debajo del borde inferior.
      { rootMargin: '0px 0px -72px 0px' },
    )
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [sinStock])

  const agregar = () => {
    addToCart(producto, cantidad)
    setCantidad(1)
  }

  const comprarAhora = () => {
    addToCart(producto, cantidad)
    router.push('/checkout')
  }

  if (sinStock) {
    return (
      <div>
        <p className="ficha-compra-estado ficha-compra-estado--agotado">{t('sinStock')}</p>
        <Button disabled style={ESTILO_BOTON}>{t('agregarCarrito')}</Button>
        <p className="ficha-compra-nota">
          {t('sinStockTexto')}
        </p>
      </div>
    )
  }

  const subtotal = producto.precio * cantidad

  return (
    <>
      <div ref={accionesRef}>
        {pocoStock ? (
          <div className="ficha-compra-alerta">
            <TriangleAlert size={17} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span style={{ minWidth: 0 }}>{t('quedanSolo', { n: producto.stock })}</span>
          </div>
        ) : (
          <p className="ficha-compra-estado">{t('stockDisponible')}</p>
        )}

        <div className="ficha-compra-cantidad">
          <span className="ficha-compra-cantidad-rotulo">{t('cantidad')}</span>
          <QuantitySelector value={cantidad} onChange={setCantidad} min={1} max={producto.stock} />
          <span className="ficha-compra-disponibles">
            {t('disponiblesParen', { n: producto.stock })}
          </span>
        </div>

        <div className="ficha-compra-acciones">
          <Button onClick={comprarAhora} style={ESTILO_BOTON}>{t('comprarAhora')}</Button>
          <Button onClick={agregar} variant="outline" style={ESTILO_BOTON}>{t('agregarCarrito')}</Button>
        </div>

        {cantidad > 1 && (
          <p className="ficha-compra-subtotal">
            {t('subtotalUnidades', { n: cantidad })}<strong>{formatPrecio(subtotal, idioma)}</strong>
          </p>
        )}
      </div>

      {/* Se monta y desmonta en vez de esconderse con aria-hidden: una barra
          oculta pero enfocable con el tabulador es peor que no tenerla. */}
      {barraVisible && (
        <div className="ficha-prod-barra">
          <div className="ficha-prod-barra-precio">
            <span className="ficha-prod-barra-cifra">{formatPrecio(subtotal, idioma)}</span>
            {cantidad > 1 && (
              <span className="ficha-prod-barra-detalle">{t('unidades', { n: cantidad })}</span>
            )}
          </div>
          <Button onClick={agregar} style={{ flexShrink: 0 }}>{t('agregarCarrito')}</Button>
        </div>
      )}
    </>
  )
}
