'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { fotoCloudinary } from '@/lib/imagenes'

/**
 * Galería de la ficha de producto, con la mecánica que la gente ya trae
 * aprendida de las tiendas grandes: tira de miniaturas en vertical al lado de
 * la foto en escritorio —que cambia al pasar el ratón, sin pulsar— y debajo,
 * deslizable, en móvil. La foto se amplía a pantalla completa al pulsarla.
 *
 * A diferencia de ImageGallery no recorta a cuatro fotos y marca la activa con
 * borde en vez de con opacidad, que sobre fondo claro apenas se distinguía.
 */
export default function GaleriaProducto({ imagenes, alt }: { imagenes: string[]; alt: string }) {
  const tg = useTranslations('galeria')

  const t = useTranslations('tienda')

  const [activa, setActiva] = useState(0)
  const [ampliada, setAmpliada] = useState(false)
  const botonZoomRef = useRef<HTMLButtonElement>(null)
  const botonCerrarRef = useRef<HTMLButtonElement>(null)
  const total = imagenes.length

  // El módulo con `+ total` mantiene el índice positivo al retroceder desde la
  // primera foto: -1 % 4 es -1 en JavaScript, no 3.
  const mover = useCallback(
    (paso: number) => setActiva(i => (total === 0 ? 0 : (i + paso + total) % total)),
    [total],
  )

  // Sin teclado la vista ampliada es una trampa: se entra y no se sale. Esc
  // cierra, las flechas pasan de foto y el fondo deja de desplazarse detrás.
  useEffect(() => {
    if (!ampliada) return
    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAmpliada(false)
      if (e.key === 'ArrowRight') mover(1)
      if (e.key === 'ArrowLeft') mover(-1)
    }
    const desbordePrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', alPulsarTecla)
    botonCerrarRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', alPulsarTecla)
      document.body.style.overflow = desbordePrevio
    }
  }, [ampliada, mover])

  const cerrar = () => {
    setAmpliada(false)
    // El foco vuelve de donde salió; si no, aterriza al principio del documento.
    botonZoomRef.current?.focus()
  }

  if (total === 0) {
    return (
      <div className="ficha-galeria-vacia">{t('sinFotografia')}</div>
    )
  }

  const varias = total > 1

  return (
    <>
      <div className="ficha-galeria">
        <div className="ficha-galeria-principal">
          <button
            ref={botonZoomRef}
            type="button"
            className="ficha-galeria-zoom"
            onClick={() => setAmpliada(true)}
            aria-label={tg('ampliarFoto', { alt, n: activa + 1, total })}
          >
            {/* El LCP de la ficha. 520 = la columna de la foto (600px) menos
                el riel de miniaturas y su hueco; entre 560 y 899px manda el
                `max-width: 460px` de .ficha-galeria. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              {...fotoCloudinary(imagenes[activa], 520)}
              sizes="(max-width: 559px) 100vw, (max-width: 899px) 460px, 520px"
              alt={tg('fotoSimple', { alt, n: activa + 1 })}
              fetchPriority="high"
              decoding="async"
            />
          </button>

          {varias && (
            <>
              <button type="button" className="ficha-galeria-flecha ficha-galeria-flecha--prev" onClick={() => mover(-1)} aria-label={t('fotoAnterior')}>
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <button type="button" className="ficha-galeria-flecha ficha-galeria-flecha--next" onClick={() => mover(1)} aria-label={t('fotoSiguiente')}>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </>
          )}

          <span className="ficha-galeria-lupa" aria-hidden="true">
            <ZoomIn size={14} /> Ampliar
          </span>
          {varias && <span className="ficha-galeria-contador">{activa + 1} / {total}</span>}
        </div>

        {varias && (
          <div className="ficha-galeria-rail" role="group" aria-label={t('miniaturas')}>
            {imagenes.map((src, i) => (
              <button
                key={src}
                type="button"
                className="ficha-galeria-thumb"
                onClick={() => setActiva(i)}
                onMouseEnter={() => setActiva(i)}
                onFocus={() => setActiva(i)}
                aria-label={tg('verFoto', { n: i + 1, total })}
                aria-current={i === activa}
              >
                {/* 64px fijos por CSS: pedir el original para un cuadrado de
                    64 era la peor relación de todo el sitio. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img {...fotoCloudinary(src, 64)} sizes="64px" alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>

      {ampliada && (
        <div className="ficha-lightbox" role="dialog" aria-modal="true" aria-label={tg('fotoDe', { nombre: alt, n: activa + 1, total })}>
          {/* Botón de verdad y no un div con onClick: pulsar el fondo para
              cerrar tiene que existir también para lector de pantalla. */}
          <button type="button" className="ficha-lightbox-fondo" onClick={cerrar} aria-label={t('cerrarAmpliada')} />

          {/* Aquí sí hace falta ancho: `contain` a pantalla completa. El tope
              del srcset queda en 2000px y `c_limit` evita que Cloudinary
              amplíe si el original es más pequeño. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            {...fotoCloudinary(imagenes[activa], 1000)}
            sizes="100vw"
            alt={tg('fotoSimple', { alt, n: activa + 1 })}
            decoding="async"
            className="ficha-lightbox-foto"
          />

          <button ref={botonCerrarRef} type="button" className="ficha-lightbox-btn ficha-lightbox-btn--cerrar" onClick={cerrar} aria-label="Cerrar">
            <X size={22} aria-hidden="true" />
          </button>

          {varias && (
            <>
              <button type="button" className="ficha-lightbox-btn ficha-lightbox-btn--prev" onClick={() => mover(-1)} aria-label={t('fotoAnterior')}>
                <ChevronLeft size={24} aria-hidden="true" />
              </button>
              <button type="button" className="ficha-lightbox-btn ficha-lightbox-btn--next" onClick={() => mover(1)} aria-label={t('fotoSiguiente')}>
                <ChevronRight size={24} aria-hidden="true" />
              </button>
              <span className="ficha-lightbox-contador">{activa + 1} / {total}</span>
            </>
          )}
        </div>
      )}
    </>
  )
}
