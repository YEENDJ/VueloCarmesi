'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from '@/lib/i18n/navigation'
import { whatsappCon } from '@/lib/contacto'
import IconoWhatsapp from '@/components/ui/IconoWhatsapp'

/**
 * Qué mensaje lleva escrito el chat según la página desde la que se abre.
 *
 * `usePathname` de next-intl devuelve la ruta *interna* —la española, con los
 * `[slug]` sin rellenar—, así que /en/birding llega aquí como /aviturismo. La
 * ficha de experiencia no usa el mensaje con el nombre porque este botón no lo
 * conoce: esa ficha ya tiene su propio enlace de WhatsApp que sí lo lleva.
 */
function claveMensaje(ruta: string) {
  if (ruta === '/aviturismo') return 'aviturismo'
  if (ruta === '/grupos') return 'grupos'
  if (ruta.startsWith('/experiencias') || ruta.startsWith('/reservar')) return 'contacto'
  if (ruta.startsWith('/tienda') || ruta === '/carrito' || ruta.startsWith('/checkout')) return 'tienda'
  return 'general'
}

/**
 * Botón flotante de WhatsApp, en todas las páginas públicas (va en el layout).
 *
 * Es la misma estrategia de xyracode.com, con la marca de la finca: en reposo
 * solo el glifo, sin círculo detrás, que flota, emite un halo y saluda cada
 * pocos segundos; al pasar el ratón o al llegar con el teclado despliega la
 * etiqueta. Las animaciones que se repiten solo corren sin reduced-motion.
 *
 * En móvil, en las fichas de experiencia y de producto, sube para quedar por
 * encima de la barra fija de reservar/comprar (ver `.wa-flotante` en
 * globals.css) en vez de taparle el botón.
 *
 * Encima del footer cambia de colores: el carmesí sobre el marrón del footer
 * casi no se ve. Se mide con el centro del botón y no con su borde, para que
 * el cambio llegue cuando el glifo ya está sobre el marrón y no antes.
 */
export default function WhatsappFlotante() {
  const t = useTranslations('whatsappFlotante')
  const tw = useTranslations('whatsapp')
  const ruta = usePathname()
  const marco = useRef<HTMLDivElement>(null)
  const [sobreFooter, setSobreFooter] = useState(false)

  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return
    let cuadro = 0
    const medir = () => {
      cuadro = 0
      const boton = marco.current?.getBoundingClientRect()
      if (!boton) return
      // Dentro del footer, no solo por debajo de su borde de arriba: en una
      // página corta (carrito vacío) el footer acaba antes que la ventana y
      // debajo vuelve el crema.
      const centro = boton.top + boton.height / 2
      const { top, bottom } = footer.getBoundingClientRect()
      setSobreFooter(top <= centro && centro <= bottom)
    }
    // Un solo cálculo por fotograma, por muchos eventos de scroll que lleguen.
    const programar = () => { if (!cuadro) cuadro = requestAnimationFrame(medir) }
    medir()
    window.addEventListener('scroll', programar, { passive: true })
    window.addEventListener('resize', programar)
    return () => {
      window.removeEventListener('scroll', programar)
      window.removeEventListener('resize', programar)
      if (cuadro) cancelAnimationFrame(cuadro)
    }
    // Al cambiar de página cambia el largo del contenido y hay que volver a medir.
  }, [ruta])

  return (
    <div ref={marco} className={`wa-flotante${sobreFooter ? ' wa-flotante--sobre-footer' : ''}`}>
      <a
        href={whatsappCon(tw(claveMensaje(ruta)))}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('aria')}
        className="wa-fab"
      >
        <span className="wa-etiqueta" aria-hidden="true">
          <span className="wa-etiqueta-panel">
            <span className="wa-etiqueta-marca">WhatsApp</span>
            <span className="wa-etiqueta-texto">{t('rotulo')}</span>
          </span>
        </span>
        <span className="wa-nucleo">
          <span className="wa-halo" aria-hidden="true" />
          <span className="wa-glifo">
            <IconoWhatsapp size={52} />
          </span>
        </span>
      </a>
    </div>
  )
}
