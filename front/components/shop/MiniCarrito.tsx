'use client'
import { useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { X } from 'lucide-react'
import { usePathname } from '@/lib/i18n/navigation'
import { useCart, useMiniCarrito, cerrarMiniCarrito } from '@/lib/cart/store'
import { formatPrecio } from '@/lib/format'
import { precargarCatalogo } from '@/lib/cart/catalogo-sugerencias'
import Button from '@/components/ui/Button'
import SugerenciasCarrito from '@/components/shop/SugerenciasCarrito'
import PagoSeguro from '@/components/shop/PagoSeguro'

// El estilo va inline porque Button pone el suyo inline y le gana a cualquier
// clase. Ancho completo y alto táctil de 44px.
const ESTILO_BOTON: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '100%', minHeight: '44px', textAlign: 'center',
}

/**
 * El panel lateral que se abre al agregar un producto.
 *
 * Es el gancho de venta cruzada en su mejor momento: el cliente acaba de
 * decidir comprar y ve, sin cambiar de página, lo que lleva, el subtotal y
 * unas pocas sugerencias que se suman con un clic. Muchos nunca abren la
 * página del carrito; este panel les llega igual.
 *
 * Un <dialog> nativo con showModal(): trae gratis el cierre con Escape, el
 * foco atrapado dentro, la capa por encima de todo y la devolución del foco
 * al botón que lo abrió.
 */
export default function MiniCarrito() {
  const idioma = useLocale()
  const t = useTranslations('tienda.miniCarrito')
  const tc = useTranslations('tienda.carrito')
  const tt = useTranslations('tienda.toast')
  const aviso = useMiniCarrito()
  const { items, cartCount, cartTotal } = useCart()
  const pathname = usePathname()
  const ref = useRef<HTMLDialogElement>(null)

  const abierto = aviso !== null

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  // El panel vive en el layout de la tienda: al entrar a cualquier página de
  // la tienda se adelanta el catálogo, y al tocar «Agregar» las sugerencias
  // ya están.
  useEffect(() => {
    precargarCatalogo(idioma)
  }, [idioma])

  // Cualquier enlace de adentro (checkout, carrito, una sugerencia) cambia de
  // ruta: el panel se cierra solo en vez de quedar tapando la página nueva.
  useEffect(() => {
    cerrarMiniCarrito()
  }, [pathname])

  return (
    <dialog
      ref={ref}
      className="mini-carrito"
      aria-labelledby="mini-carrito-titulo"
      onClose={cerrarMiniCarrito}
      // Un clic en el fondo oscuro llega con el propio <dialog> como destino;
      // los clics de adentro caen en .mini-carrito-marco, que lo cubre entero.
      onClick={e => { if (e.target === e.currentTarget) cerrarMiniCarrito() }}
    >
      {abierto && (
        <div className="mini-carrito-marco">
          <header className="mini-carrito-cabecera">
            <h2 id="mini-carrito-titulo" className="mini-carrito-titulo">{t('titulo')}</h2>
            <button
              type="button"
              className="mini-carrito-cerrar"
              onClick={cerrarMiniCarrito}
              aria-label={t('cerrar')}
            >
              <X size={22} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </header>

          <div className="mini-carrito-cuerpo">
            {/* Sin recuadro visible (el producto ya aparece en la lista de
                abajo), pero anunciado: quien usa lector de pantalla no ve
                la lista y sin esto no sabría que se agregó. */}
            <p className="sr-only" role="status">
              {tt(aviso.clave, { nombre: aviso.nombre, n: aviso.n })}
            </p>

            <ul className="mini-carrito-items">
              {items.map(item => (
                <li key={item.productoId} className="mini-carrito-item">
                  <span className="mini-carrito-item-media">
                    {item.imagen
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.imagen} alt="" width={96} height={96} loading="lazy" decoding="async" />
                      : <span aria-hidden="true">🍫</span>
                    }
                  </span>
                  <span className="mini-carrito-item-info">
                    <span className="mini-carrito-item-nombre">{item.nombre}</span>
                    <span className="mini-carrito-item-precio">
                      {t('linea', { q: item.q, precio: formatPrecio(item.precio, idioma) })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <SugerenciasCarrito limite={3} />
          </div>

          <footer className="mini-carrito-pie">
            <p className="mini-carrito-subtotal">
              <span>{tc('subtotal', { n: cartCount })}</span>
              <span>{formatPrecio(cartTotal, idioma)}</span>
            </p>
            <Button href="/checkout" style={ESTILO_BOTON}>{tc('irCheckout')}</Button>
            <PagoSeguro />
            <div className="mini-carrito-secundarias">
              <Button href="/carrito" variant="outline" style={ESTILO_BOTON}>{t('verCarrito')}</Button>
              <button type="button" className="mini-carrito-seguir" onClick={cerrarMiniCarrito}>
                {t('seguir')}
              </button>
            </div>
          </footer>
        </div>
      )}
    </dialog>
  )
}
