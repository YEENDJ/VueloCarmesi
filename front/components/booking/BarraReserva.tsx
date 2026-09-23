'use client'
import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Button from '@/components/ui/Button'
import { formatPrecio } from '@/lib/format'

interface Props {
  precio: number
  duracion: string
  slug: string
}

/**
 * Barra fija de reserva para móvil. Sólo aparece cuando no hay otro botón de
 * reservar en pantalla: ni el de la tarjeta de precio de la portada ni el del
 * bloque de cierre. Era `sticky` y al llegar al final dejaba de pegarse, subía
 * con la página y quedaba encima del cierre: dos precios y dos «Reservar
 * ahora» seguidos. Ahora se retira en cuanto asoma el cierre, que es el que
 * termina la ficha.
 *
 * Los botones reales se marcan con `data-cta-reserva`; la barra no necesita
 * saber dónde están, sólo si alguno se ve.
 */
export default function BarraReserva({ precio, duracion, slug }: Props) {
  const idioma = useLocale()
  const t = useTranslations('reserva')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const nodos = document.querySelectorAll('[data-cta-reserva]')
    if (nodos.length === 0) return
    const enPantalla = new Set<Element>()
    const observador = new IntersectionObserver(
      entradas => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) enPantalla.add(entrada.target)
          else enPantalla.delete(entrada.target)
        }
        setVisible(enPantalla.size === 0)
      },
      // El margen negativo evita que la barra parpadee justo cuando un botón
      // asoma por debajo del borde inferior. Es el mismo que la ficha de producto.
      { rootMargin: '0px 0px -72px 0px' },
    )
    nodos.forEach(nodo => observador.observe(nodo))
    return () => observador.disconnect()
  }, [])

  if (!visible) return null

  return (
    <div className="ficha-exp-barra">
      <div className="ficha-exp-barra-contenido">
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 8px', minWidth: 0 }}>
          <span className="ficha-exp-barra-precio">{formatPrecio(precio, idioma)}</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,234,202,0.8)', minWidth: 0 }}>
            {t('porPersonaDuracion', { duracion })}
          </span>
        </div>
        <Button
          href={{ pathname: '/reservar/[slug]', params: { slug } }}
          style={{
            flexShrink: 0, borderRadius: '8px', padding: '14px 24px',
            fontSize: '16px', minHeight: '44px', whiteSpace: 'nowrap',
          }}
        >
          {t('reservarAhora')}
        </Button>
      </div>
    </div>
  )
}
