'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Miembro {
  nombre: string
  cargo: string
  // Sin foto todavia = se muestra el placeholder rayado con el nombre
  foto?: string
  alt?: string
  // Punto de la foto que nunca se debe recortar: las cuatro tienen encuadres
  // distintos y el recorte de la tarjeta es mas apaisado que el original.
  foco?: string
  bio: string[]
}

const EQUIPO: Miembro[] = [
  {
    nombre: 'Cristian Enciso',
    cargo: 'Cofundador',
    foto: '/images/personas/cristian-enciso.jpg',
    alt: 'Cristian Enciso con binoculares durante una salida de avistamiento de aves',
    foco: 'center 20%',
    bio: [
      'Guía Profesional de Turismo con 14 años de experiencia en turismo de naturaleza y especializado en avistamiento de aves. Administrador Ambiental y especialista en Agroecología y Desarrollo Agroecoturístico.',
      'Como coordinador operativo y comercial, lidera la planificación y articulación de las experiencias turísticas, así como el desarrollo comercial de Vuelo Carmesí.',
      'Su experiencia en turismo, conservación y desarrollo rural aporta a la construcción de experiencias que conectan la naturaleza, el cacao y la vida campesina con un turismo responsable y sostenible.',
    ],
  },
  {
    nombre: 'María Umaña',
    cargo: 'Cofundadora',
    foto: '/images/personas/maria-umana.jpg',
    alt: 'María Umaña con el uniforme de Vuelo Carmesí junto a mazorcas y granos de cacao',
    foco: 'center 28%',
    bio: [
      'Técnica en Producción Agropecuaria y gerente general de Vuelo Carmesí. Lidera la operación del proyecto y aporta su amplia experiencia en el cultivo de cacao, especialmente en productividad, cosecha y procesos de poscosecha.',
      'Su conocimiento del campo y del cacao se complementa con su pasión por el avistamiento de aves, actividad en la que también acompaña a visitantes que desean iniciarse en el mundo del aviturismo.',
    ],
  },
  {
    nombre: 'Orlando Enciso',
    cargo: 'Cofundador',
    foto: '/images/personas/orlando-enciso.jpg',
    alt: 'Orlando Enciso en el cultivo, entre árboles cargados de mazorcas de cacao',
    foco: 'center 25%',
    bio: [
      'Agricultor de toda la vida y campesino de corazón. Aporta a Vuelo Carmesí su amplio conocimiento del cultivo de cacao y su experiencia construida durante años de trabajo en el campo.',
      'Es el encargado de coordinar y desarrollar las labores operativas relacionadas con el cultivo, participando en las diferentes actividades de manejo, mantenimiento y producción de la finca.',
      'Es también el creador de Limonática, una bebida especial elaborada con siete plantas aromáticas cultivadas en la propia finca, que se ha convertido en una de las preparaciones que hacen parte de la identidad de nuestras experiencias.',
      'Su sencillez, humildad y profundo conocimiento de la vida campesina representan una parte esencial de lo que somos: una iniciativa familiar que nace de la tierra, del trabajo y de las historias de quienes la han cultivado durante generaciones.',
    ],
  },
  {
    nombre: 'Yuri Enciso',
    cargo: 'Cofundadora',
    foto: '/images/personas/yuri-enciso.jpg',
    alt: 'Yuri Enciso revisando las plantas de la huerta de la finca',
    foco: 'center 25%',
    bio: [
      'Hija de la historia de Vuelo Carmesí y parte esencial de la familia. Yuri se caracteriza por su sencillez, calidez y una sensibilidad especial para conectar con quienes visitan la finca.',
      'Hace parte del equipo operativo en los procesos de transformación artesanal del cacao, donde participa con dedicación y entusiasmo en las diferentes experiencias.',
      'Su forma particular de percibir y relacionarse con el mundo aporta una mirada única al proyecto y refleja el compromiso de Vuelo Carmesí con la inclusión, la empatía y el reconocimiento de las capacidades de cada persona.',
      'Su alegría, autenticidad y cercanía con los visitantes hacen de Yuri una integrante muy especial del equipo y de la historia de Vuelo Carmesí.',
    ],
  },
  {
    nombre: 'Yeison Enciso',
    cargo: 'Desarrollador Web',
    bio: [
      'Desarrolla y mantiene el sitio web de Vuelo Carmesí, encargándose de su implementación, actualización y evolución técnica. Realiza ajustes y mejoras en la interfaz, estructura y funcionalidades del sitio, además de solucionar errores y mantenerlo en óptimas condiciones de funcionamiento.',
      'También se encarga de incorporar nuevos requerimientos y realizar las actualizaciones necesarias para garantizar una experiencia web funcional, estable y adecuada a las necesidades del proyecto.',
    ],
  },
]

const GAP = 24

export default function EquipoCarrusel() {
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
        aria-label="Miembros del equipo"
      >
        {EQUIPO.map((m) => (
          <article key={m.nombre} className="equipo-slide">
            <div className="equipo-slide-foto">
              {m.foto ? (
                <Image
                  src={m.foto}
                  alt={m.alt ?? m.nombre}
                  fill
                  sizes="(min-width: 1000px) 33vw, (min-width: 720px) 50vw, 100vw"
                  style={{ objectFit: 'cover', objectPosition: m.foco }}
                />
              ) : (
                <span className="equipo-foto-pendiente">{`FOTO · ${m.nombre}`}</span>
              )}
            </div>
            <div className="equipo-slide-cuerpo">
              <h3 className="equipo-nombre">{m.nombre}</h3>
              <p className="equipo-cargo">{m.cargo}</p>
              <p className="equipo-bio-corta">{m.bio[0]}</p>
              <button
                type="button"
                className="equipo-ver-mas"
                onClick={(e) => abrirModal(m, e)}
                aria-label={`Ver más sobre ${m.nombre}`}
              >
                Ver más
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
          aria-label="Ver equipo anterior"
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
              aria-label={`Ir al grupo ${i + 1}`}
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
          aria-label="Ver equipo siguiente"
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
                    alt={activo.alt ?? activo.nombre}
                    fill
                    sizes="360px"
                    style={{ objectFit: 'cover', objectPosition: activo.foco }}
                  />
                ) : (
                  <span className="equipo-foto-pendiente">{`FOTO · ${activo.nombre}`}</span>
                )}
              </div>
            </div>

            <div className="equipo-modal-cuerpo">
              <h3 id="equipo-modal-titulo" className="equipo-modal-nombre">
                {activo.nombre}
              </h3>
              <p className="equipo-cargo">{activo.cargo}</p>
              <div className="equipo-modal-bio">
                {activo.bio.map((parrafo, i) => (
                  <p key={i} className="equipo-modal-parrafo">
                    {parrafo}
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
