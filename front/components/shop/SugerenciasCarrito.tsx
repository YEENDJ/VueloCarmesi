'use client'
import { useEffect, useId, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Plus } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import type { Producto } from '@/lib/types'
import { useCart } from '@/lib/cart/store'
import { catalogoEnCache, precargarCatalogo } from '@/lib/cart/catalogo-sugerencias'
import { sugerenciasCarrito } from '@/lib/sugerencias-carrito'
import { formatPrecio } from '@/lib/format'

/**
 * «¿Te llevas algo más?»: el último empujón antes del checkout.
 *
 * El catálogo se pide desde el navegador y no desde el servidor porque la
 * página del carrito es cliente entera (su contenido vive en localStorage).
 * Se comparte y se precarga: ver lib/cart/catalogo-sugerencias.ts.
 * Si el backend tarda o falla, la sección simplemente no aparece: el carrito
 * no espera por ella ni muestra un error por algo que nadie pidió.
 *
 * Al agregar, el producto sale de las sugerencias y entra a las filas de
 * arriba, y el Toast de la tienda confirma: no hace falta más aviso aquí.
 */
export default function SugerenciasCarrito({ limite = 5 }: { limite?: number }) {
  const idioma = useLocale()
  const t = useTranslations('tienda.carrito')
  const { items, addToCart } = useCart()
  // Arranca con lo que ya haya en caché (precargado por el mini-carrito o de
  // una visita anterior) para no aparecer segundos después que el carrito.
  const [catalogo, setCatalogo] = useState<Producto[]>(() => catalogoEnCache(idioma))
  // Se pinta en la página del carrito y en el mini-carrito: el id del título
  // no puede ser fijo.
  const tituloId = useId()

  useEffect(() => {
    let vigente = true
    precargarCatalogo(idioma).then(productos => { if (vigente) setCatalogo(productos) })
    return () => { vigente = false }
  }, [idioma])

  const sugeridos = sugerenciasCarrito(catalogo, items, limite)
  if (sugeridos.length === 0) return null

  return (
    <section className="cart-sugerencias" aria-labelledby={tituloId}>
      <h2 id={tituloId} className="cart-sugerencias-titulo">{t('sugerenciasTitulo')}</h2>
      <ul className="cart-sugerencias-lista">
        {sugeridos.map(producto => (
          <li key={producto.id} className="cart-sugerencia">
            {/* La foto repite el enlace del nombre: fuera del orden de tabulación
                y alt vacío, para no anunciar dos veces el mismo producto. */}
            <Link
              href={{ pathname: '/tienda/[slug]', params: { slug: producto.slug } }}
              className="cart-sugerencia-media"
              tabIndex={-1}
              aria-hidden="true"
            >
              {producto.imagen
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={producto.imagen} alt=""
                       width={112} height={112} loading="lazy" decoding="async" />
                : <span aria-hidden="true">🍫</span>
              }
            </Link>
            <div className="cart-sugerencia-info">
              <Link
                href={{ pathname: '/tienda/[slug]', params: { slug: producto.slug } }}
                className="cart-sugerencia-nombre"
              >
                {producto.nombre}
              </Link>
              <span className="cart-sugerencia-precio">{formatPrecio(producto.precio, idioma)}</span>
            </div>
            <button
              type="button"
              className="cart-sugerencia-agregar"
              // Sin abrir el mini-carrito: en la página del carrito sobra, y dentro
              // del mini-carrito ya está abierto.
              onClick={() => addToCart(producto, 1, { abrirMiniCarrito: false })}
              aria-label={t('sugerenciaAgregar', { nombre: producto.nombre })}
            >
              <Plus size={20} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
