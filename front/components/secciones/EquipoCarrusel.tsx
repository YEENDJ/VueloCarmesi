'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Miembro {
  nombre: string
  /** Clave dentro de `equipo`: el cargo, el alt y la bio salen del catálogo. */
  clave: string
  cargo: string
  // Sin foto todavia = se muestra el placeholder rayado con el nombre
  foto?: string
  foco?: string
  /** Cuántos párrafos tiene su bio: b1, b2, … en el catálogo. */
  parrafos: number
}

// Los nombres propios no se traducen; todo lo demás sale del catálogo.
const EQUIPO: Miembro[] = [
  { nombre: 'Cristian Enciso', clave: 'cristian', cargo: 'cofundador',
    foto: '/images/personas/cristian-enciso.jpg', foco: 'center 20%', parrafos: 3 },
  { nombre: 'María Umaña', clave: 'maria', cargo: 'cofundadora',
    foto: '/images/personas/maria-umana.jpg', foco: 'center 28%', parrafos: 2 },
  { nombre: 'Orlando Enciso', clave: 'orlando', cargo: 'cofundador',
    foto: '/images/personas/orlando-enciso.jpg', foco: 'center 25%', parrafos: 4 },
  { nombre: 'Yuri Enciso', clave: 'yuri', cargo: 'cofundadora',
    foto: '/images/personas/yuri-enciso.jpg', foco: 'center 25%', parrafos: 4 },
  { nombre: 'Yeison Enciso', clave: 'yeison', cargo: 'desarrollador', parrafos: 2 },
]

const GAP = 24

export default function EquipoCarrusel() {
  const tg = useTranslations('galeria')

  const t = useTranslations('equipo')

  const trackRef = useRef<HTMLDivElement>(null)
  const cerrarRef = useRef<HTMLButtonElement>(null)
  // Botón que abrió el modal: al cerrar hay que devolverle el foco
  const disparadorRef = useRef<HTMLButtonElement | null>(null)
  const [indice, setIndice] = useState(0)
  const [porVista, setPorVista] = useState(1)
  const [activo, setActivo] = useState<Miembro | null>(null)

  // Cuántas tarjetas caben a la vez: 3 en escritorio, 2 en tablet, 1 en móvil.
  // Tiene que ir en sincronía con los breakpoints de .equipo-slide en globals.css.
  useEffect(() => {
    const tres = window.matchMedia('(min-width: 1000px)')
    const dos = window.matchMedia('(min-width: 720px)')
    const sincronizar = () => setPorVista(tres.matches ? 3 : dos.matches ? 2 : 1)
    sincronizar()
    tres.addEventListener('change', sincronizar)
    dos.addEventListener('change', sincronizar)
    return () => {
      tres.removeEventListener('change', sincronizar)
      dos.removeEventListener('change', sincronizar)
    }
  }, [])

  // Con el modal abierto: Esc cierra, el fondo no scrollea y el foco entra al panel
  useEffect(() => {
    if (!activo) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivo(null)
    }
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', alTeclear)
    cerrarRef.current?.focus()
    return () => {
      document.body.style.overflow = overflowPrevio
      document.removeEventListener('keydown', alTeclear)
    }
  }, [activo])

  const cerrarModal = () => {
    setActivo(null)
    disparadorRef.current?.focus()
  }

  const abrirModal = (m: Miembro, e: React.MouseEvent<HTMLButtonElement>) => {
    disparadorRef.current = e.currentTarget
    setActivo(m)
  }

  const maxIndice = Math.max(0, EQUIPO.length - porVista)

  // El scroll manda: el índice sale de la posición real del track
  const alHacerScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const slide = track.firstElementChild as HTMLElement | null
    if (!slide) return
    setIndice(Math.round(track.scrollLeft / (slide.offsetWidth + GAP)))
  }, [])

  const irA = (destino: number) => {
    const track = trackRef.current
    if (!track) return
    const slide = track.firstElementChild as HTMLElement | null
    if (!slide) return
    const seguro = Math.min(Math.max(destino, 0), EQUIPO.length - porVista)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({
      left: seguro * (slide.offsetWidth + GAP),
      behavior: reduce ? 'auto' : 'smooth',
    })
  }

  const indiceVisible = Math.min(indice, maxIndice)

  return (
    <div className="equipo-carrusel">
      <div
        className="equipo-track"
        ref={trackRef}
        onScroll={alHacerScroll}
        role="group"
        aria-label={t('rotulo')}
      >
        {EQUIPO.map((m) => (
          <article key={m.nombre} className="equipo-slide">
            <div className="equipo-slide-foto">
              {m.foto ? (
                <Image
                  src={m.foto}
                  alt={t(`${m.clave}.alt`) || m.nombre}
                  fill
                  sizes="(min-width: 1000px) 33vw, (min-width: 720px) 50vw, 100vw"
                  style={{ objectFit: 'cover', objectPosition: m.foco }}
                />
              ) : (
                <span className="equipo-foto-pendiente">{tg('fotoPendiente', { nombre: m.nombre })}</span>
              )}
            </div>
            <div className="equipo-slide-cuerpo">
              <h3 className="equipo-nombre">{m.nombre}</h3>
              <p className="equipo-cargo">{t(m.cargo)}</p>
              <p className="equipo-bio-corta">{t(`${m.clave}.b1`)}</p>
              <button
                type="button"
                className="equipo-ver-mas"
                onClick={(e) => abrirModal(m, e)}
                aria-label={`${t('verMas')} · ${m.nombre}`}
              >
                {t('verMas')}
                <span aria-hidden="true"> →</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="equipo-controles">
        <button
          type="button"
          className="equipo-flecha"
          onClick={() => irA(indiceVisible - 1)}
          disabled={indiceVisible <= 0}
          aria-label={t('anterior')}
        >
          <span aria-hidden="true">←</span>
        </button>

        <div className="equipo-puntos">
          {Array.from({ length: maxIndice + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              className="equipo-punto"
              onClick={() => irA(i)}
              aria-label={t('irAlGrupo', { n: i + 1 })}
              aria-current={i === indiceVisible}
            >
              <span
                className="equipo-punto-marca"
                data-activo={i === indiceVisible}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          className="equipo-flecha"
          onClick={() => irA(indiceVisible + 1)}
          disabled={indiceVisible >= maxIndice}
          aria-label={t('siguiente')}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {activo && (
        <div
          className="equipo-modal-fondo"
          onClick={cerrarModal}
          role="presentation"
        >
          <div
            className="equipo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="equipo-modal-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="equipo-modal-cerrar"
              onClick={cerrarModal}
              ref={cerrarRef}
              aria-label="Cerrar"
            >
              <span aria-hidden="true">✕</span>
            </button>

            <div className="equipo-modal-media">
              <div className="equipo-modal-foto">
                {activo.foto ? (
                  <Image
                    src={activo.foto}
                    alt={t(`${activo.clave}.alt`) || activo.nombre}
                    fill
                    sizes="360px"
                    style={{ objectFit: 'cover', objectPosition: activo.foco }}
                  />
                ) : (
                  <span className="equipo-foto-pendiente">{tg('fotoPendiente', { nombre: activo.nombre })}</span>
                )}
              </div>
            </div>

            <div className="equipo-modal-cuerpo">
              <h3 id="equipo-modal-titulo" className="equipo-modal-nombre">
                {activo.nombre}
              </h3>
              <p className="equipo-cargo">{t(activo.cargo)}</p>
              <div className="equipo-modal-bio">
                {/* `parrafos` dice cuántos tiene esta persona; las claves van
                    numeradas b1, b2, … en el catálogo. Así la bio se traduce
                    párrafo a párrafo sin que el componente sepa su contenido. */}
                {Array.from({ length: activo.parrafos }, (_, i) => (
                  <p key={i} className="equipo-modal-parrafo">
                    {t(`${activo.clave}.b${i + 1}`)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
