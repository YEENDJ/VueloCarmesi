'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export interface FotoVisor {
  src: string
  alt: string
  ancho: number
  alto: number
}

/**
 * Visor a pantalla completa para una galería. Las miniaturas (children) llegan
 * ya pintadas como <button data-indice>; aquí solo vive el visor: flechas,
 * teclado (← →; Esc lo cierra el propio <dialog>), deslizar con el dedo y el
 * contador «3 / 6».
 *
 * Toma el aspecto de .ficha-lightbox, el visor de la ficha de producto, para
 * que las dos ampliaciones del sitio se vean iguales.
 */
export default function VisorGaleria({ fotos, children }: { fotos: FotoVisor[]; children: ReactNode }) {
  const tg = useTranslations('galeria')
  const dialogo = useRef<HTMLDialogElement>(null)
  const [indice, setIndice] = useState<number | null>(null)
  const inicioToque = useRef<number | null>(null)

  const total = fotos.length
  const mover = useCallback(
    (paso: number) => setIndice(i => (i === null ? i : (i + paso + total) % total)),
    [total],
  )

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (indice !== null && !d.open) d.showModal()
    if (indice === null && d.open) d.close()
    document.documentElement.style.overflow = indice !== null ? 'hidden' : ''
  }, [indice])

  useEffect(() => {
    if (indice === null) return
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') mover(1)
      if (e.key === 'ArrowLeft') mover(-1)
    }
    window.addEventListener('keydown', teclas)
    return () => window.removeEventListener('keydown', teclas)
  }, [indice, mover])

  // Abre el visor desde cualquier miniatura: un solo manejador para todas.
  const abrir = (e: MouseEvent<HTMLDivElement>) => {
    const boton = (e.target as HTMLElement).closest<HTMLElement>('[data-indice]')
    if (boton) setIndice(Number(boton.dataset.indice))
  }

  const alSoltar = (e: PointerEvent) => {
    if (inicioToque.current === null) return
    const delta = e.clientX - inicioToque.current
    inicioToque.current = null
    if (Math.abs(delta) > 50) mover(delta < 0 ? 1 : -1)
  }

  const foto = indice !== null ? fotos[indice] : null

  return (
    <>
      <div onClick={abrir}>{children}</div>

      <dialog
        ref={dialogo}
        onClose={() => setIndice(null)}
        aria-label={foto ? foto.alt : undefined}
        className="galeria-visor"
      >
        {foto && (
          <div
            className="ficha-lightbox"
            onPointerDown={e => (inicioToque.current = e.clientX)}
            onPointerUp={alSoltar}
            onPointerCancel={() => (inicioToque.current = null)}
          >
            <button type="button" className="ficha-lightbox-fondo" onClick={() => setIndice(null)} aria-label={tg('cerrarVisor')} />

            {/* El JPEG de `public/` tal cual, como en la galería. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={foto.src}
              src={foto.src}
              alt={foto.alt}
              width={foto.ancho}
              height={foto.alto}
              decoding="async"
              draggable={false}
              className="ficha-lightbox-foto"
              style={{ width: 'auto', height: 'auto' }}
            />

            <button type="button" className="ficha-lightbox-btn ficha-lightbox-btn--cerrar" onClick={() => setIndice(null)} aria-label={tg('cerrarVisor')}>
              <X size={22} aria-hidden="true" />
            </button>

            {total > 1 && (
              <>
                <button type="button" className="ficha-lightbox-btn ficha-lightbox-btn--prev" onClick={() => mover(-1)} aria-label={tg('fotoAnterior')}>
                  <ChevronLeft size={24} aria-hidden="true" />
                </button>
                <button type="button" className="ficha-lightbox-btn ficha-lightbox-btn--next" onClick={() => mover(1)} aria-label={tg('fotoSiguiente')}>
                  <ChevronRight size={24} aria-hidden="true" />
                </button>
                <span className="ficha-lightbox-contador" aria-live="polite">{indice! + 1} / {total}</span>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  )
}
