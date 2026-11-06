'use client'
import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Cuánto hay que arrastrar el dedo para cambiar de foto, en píxeles. */
const UMBRAL_DESLIZAR = 40

interface Props {
  nombre: string
  imagenes: string[]
}

/**
 * La galería de la ficha. Nunca lleva texto encima: el administrador sube las
 * fotos que tiene —claras, movidas, a contraluz— y ninguna composición con el
 * título encima aguanta las tres.
 *
 * Las flechas van sobre la foto para no tapar miniaturas. En móvil no hay tira:
 * la foto se desliza con el dedo y el contador dice por dónde se va, así que el
 * título sube y queda a la vista sin hacer scroll.
 */
export default function GaleriaExperiencia({ nombre, imagenes }: Props) {
  const tg = useTranslations('galeria')
  const [indice, setIndice] = useState(0)
  const total = imagenes.length
  // El índice se acota en vez de confiarse: si la experiencia cambia de fotos
  // mientras la pestaña está abierta, un índice viejo dejaría la foto en blanco.
  const activa = Math.min(indice, Math.max(total - 1, 0))

  // Mismo criterio que la galería de producto: el `+ total` mantiene el índice
  // positivo al retroceder desde la primera, porque en JavaScript -1 % 4 es -1
  // y no 3. El acotado va dentro del actualizador para que dos clics seguidos
  // avancen dos fotos aunque React los agrupe en un lote.
  const mover = (paso: 1 | -1) =>
    setIndice(i => (total === 0 ? 0 : (Math.min(i, total - 1) + paso + total) % total))

  const inicioToque = useRef<{ x: number; y: number } | null>(null)

  const alEmpezarToque = (e: TouchEvent) => {
    const { clientX: x, clientY: y } = e.touches[0]
    inicioToque.current = { x, y }
  }

  const alSoltarToque = (e: TouchEvent) => {
    const inicio = inicioToque.current
    inicioToque.current = null
    if (!inicio || total < 2) return
    const dx = e.changedTouches[0].clientX - inicio.x
    const dy = e.changedTouches[0].clientY - inicio.y
    // Un gesto más vertical que horizontal es scroll de la página, no galería.
    if (Math.abs(dx) < UMBRAL_DESLIZAR || Math.abs(dx) < Math.abs(dy)) return
    mover(dx < 0 ? 1 : -1)
  }

  // A partir de la séptima foto la miniatura activa queda fuera de vista. Se
  // mueve `scrollLeft` a mano porque scrollIntoView también desplaza la página.
  const tira = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = tira.current
    const miniatura = el?.children[activa]
    if (!el || !(miniatura instanceof HTMLElement)) return
    const izquierda = miniatura.offsetLeft
    const derecha = izquierda + miniatura.offsetWidth
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior: ScrollBehavior = suave ? 'smooth' : 'auto'
    if (izquierda < el.scrollLeft) {
      el.scrollTo({ left: izquierda, behavior })
    } else if (derecha > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: derecha - el.clientWidth, behavior })
    }
  }, [activa])

  return (
    <div className="ficha-exp-galeria">
      <div className="ficha-exp-foto" onTouchStart={alEmpezarToque} onTouchEnd={alSoltarToque}>
        {total > 0 && (
          // El LCP de la ficha. Se sirve el original sin transformar: la
          // reducción de peso se retiró porque se notaba en pantalla.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagenes[activa]}
            alt={tg('fotoDe', { nombre, n: activa + 1, total })}
            fetchPriority="high"
            decoding="async"
          />
        )}
        {total > 1 && (
          <>
            {/* Las dos se pintan siempre: el recorrido da la vuelta, así que
                ninguna se queda sin destino. */}
            <button
              type="button"
              className="ficha-exp-foto-flecha ficha-exp-foto-flecha--prev"
              onClick={() => mover(-1)}
              aria-label={tg('fotoAnterior')}
            >
              <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="ficha-exp-foto-flecha ficha-exp-foto-flecha--next"
              onClick={() => mover(1)}
              aria-label={tg('fotoSiguiente')}
            >
              <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <span className="ficha-exp-contador">{activa + 1} / {total}</span>
          </>
        )}
      </div>

      {total > 1 && (
        <div
          className="ficha-exp-miniaturas"
          ref={tira}
          role="group"
          aria-label={tg('fotosDe', { nombre })}
        >
          {imagenes.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={tg('verFoto', { n: i + 1, total })}
              aria-current={i === activa}
            >
              {/* Con `lazy`, en móvil —donde la tira no se pinta— no se descarga
                  ninguna miniatura. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
