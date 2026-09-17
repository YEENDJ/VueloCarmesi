'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react'
import IconoWhatsapp from '@/components/ui/IconoWhatsapp'
import Button from '@/components/ui/Button'
import { formatPrecio } from '@/lib/format'

/** Cuántos "incluye" asoman junto al precio. El resto se cuenta en una línea. */
const RESUMEN_INCLUYE = 3

interface Props {
  nombre: string
  imagenes: string[]
  duracion: string
  capacidad: number
  precio: number
  slug: string
  /** Frase corta bajo el título. Vacía = el título va directo a las pastillas. */
  bajada?: string
  /** Lo que incluye el cupo. Aquí solo asoman los primeros; la lista va abajo. */
  incluye?: string[]
  /** Resumen de la política, de Configuración. Vacío = no se muestra la línea. */
  avisoCancelacion?: string
  /** Teléfono de contacto, de Configuración. Vacío = no se muestra la línea. */
  whatsapp?: string
}

/**
 * Portada de la ficha: la foto a un lado, el título y la tarjeta de precio al
 * otro. Nunca hay texto encima de la foto, y esa es la decisión que sostiene
 * todo el bloque: el administrador sube las fotos que tiene —claras, movidas,
 * a contraluz— y ninguna composición con el título encima aguanta las tres.
 * Así la foto se ve entera y el título se lee siempre, sin velo de por medio.
 *
 * La columna derecha es más corta que la galería, así que sostiene además las
 * tres cosas que se preguntan mirando el precio: qué frase resume esto, qué
 * entra en el cupo y a quién le escribo si me falta un dato. Las tres son
 * opcionales y desaparecen enteras si no hay contenido — la columna tiene que
 * verse terminada también cuando el panel está a medio llenar.
 *
 * La tira de miniaturas cambia la foto grande, así que el estado vive aquí y
 * este es el único trozo de cliente de toda la ficha.
 */
export default function PortadaExperiencia({
  nombre, imagenes, duracion, capacidad, precio, slug,
  bajada, incluye = [], avisoCancelacion, whatsapp,
}: Props) {
  const idioma = useLocale()

  const tg = useTranslations('galeria')

  const t = useTranslations('reserva')

  const [indice, setIndice] = useState(0)
  const total = imagenes.length
  // El índice se acota en vez de confiarse: si la experiencia cambia de fotos
  // mientras la pestaña está abierta, un índice viejo dejaría la foto en blanco.
  const activa = Math.min(indice, Math.max(total - 1, 0))

  // La tira de miniaturas no baja de línea: se desplaza. Hay que medirla para
  // saber si sobra ancho, porque las flechas solo tienen sentido si hay algo
  // fuera de vista — y en cuál de los dos extremos está la tira, para no dejar
  // una flecha que no lleva a ninguna parte.
  const tira = useRef<HTMLDivElement>(null)
  const [despl, setDespl] = useState({ desborda: false, inicio: true, final: false })

  useEffect(() => {
    const el = tira.current
    if (!el) return
    const medir = () => {
      const margen = el.scrollWidth - el.clientWidth
      setDespl({
        desborda: margen > 1,
        inicio: el.scrollLeft <= 1,
        final: el.scrollLeft >= margen - 1,
      })
    }
    medir()
    el.addEventListener('scroll', medir, { passive: true })
    // Sin esto, pasar de escritorio a móvil dejaría las flechas puestas aunque
    // ya no hicieran falta, o al revés.
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', medir); ro.disconnect() }
  }, [total])

  function desplazar(sentido: 1 | -1) {
    const el = tira.current
    if (!el) return
    // Ocho décimas del ancho visible y no el ancho entero: deja una miniatura
    // de las que ya se veían, y así no se pierde el hilo de dónde iba uno.
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: sentido * el.clientWidth * 0.8, behavior: suave ? 'smooth' : 'auto' })
  }

  const incluyeVisible = incluye.slice(0, RESUMEN_INCLUYE)
  const incluyeResto = incluye.length - incluyeVisible.length

  // wa.me no admite espacios ni el "+": se queda solo con los dígitos. El texto
  // llega escrito para que el visitante no tenga que explicar de qué escribe.
  const telefono = (whatsapp ?? '').replace(/\D/g, '')
  const enlaceWhatsapp = telefono
    ? `https://wa.me/${telefono}?text=${encodeURIComponent(`Hola, quiero información sobre ${nombre}.`)}`
    : ''

  return (
    <div className="ficha-exp-portada">
      <div className="ficha-exp-galeria">
        <div className="ficha-exp-foto">
          {total > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagenes[activa]} alt={tg('fotoDe', { nombre, n: activa + 1, total })} />
          )}
          {total > 1 && (
            <span className="ficha-exp-contador">{activa + 1} / {total}</span>
          )}
        </div>

        {total > 1 && (
          <>
            {/* Las miniaturas iban en una rejilla que bajaba de línea: con doce
                fotos la tira crecía a tres filas, empujaba el aviso hacia abajo
                y la portada dejaba de caber en pantalla. Ahora es una sola fila
                que se desplaza — el alto de la galería ya no depende de cuántas
                fotos suba el administrador.

                Las flechas solo se pintan si hay algo fuera de vista, y en
                pantallas táctiles ni eso: ahí se arrastra con el dedo. */}
            <div className="ficha-exp-tira">
              {/* Se pinta solo si lleva a alguna parte, no deshabilitada: va
                  encima de una miniatura, y una flecha muerta ahí taparía la
                  foto que hay debajo sin dejar pulsarla. */}
              {despl.desborda && !despl.inicio && (
                <button
                  type="button"
                  className="ficha-exp-tira-flecha ficha-exp-tira-flecha--prev"
                  onClick={() => desplazar(-1)}
                  aria-label={t('verFotosAnteriores')}
                >
                  <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
                </button>
              )}

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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>

              {despl.desborda && !despl.final && (
                <button
                  type="button"
                  className="ficha-exp-tira-flecha ficha-exp-tira-flecha--next"
                  onClick={() => desplazar(1)}
                  aria-label={t('verMasFotos')}
                >
                  <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Las miniaturas se ven, pero nadie sabe que se pulsan hasta que
                alguien lo dice. Y si además hay fotos fuera de vista, el aviso
                es el único sitio donde eso se puede contar. */}
            <p className="ficha-exp-aviso-fotos">
              {despl.desborda
                ? t('deslizaTira')
                : t('tocaFoto')}
            </p>
          </>
        )}
      </div>

      <div className="ficha-exp-resumen">

        <h1 className="ficha-exp-titulo">{nombre}</h1>

        {/* La descripción corta ya estaba escrita para Google y no se veía en
            ninguna parte de la página. Aquí hace de bajada: el salto del título
            a las pastillas era el único sitio de la ficha sin una sola frase. */}
        {bajada && <p className="ficha-exp-bajada">{bajada}</p>}

        <div className="ficha-exp-pills">
          <span className="ficha-exp-pill">
            <Clock size={18} strokeWidth={1.85} color="var(--color-orange)" aria-hidden="true" style={{ flexShrink: 0 }} />
            {duracion}
          </span>
          <span className="ficha-exp-pill">
            <Users size={18} strokeWidth={1.85} color="var(--color-orange)" aria-hidden="true" style={{ flexShrink: 0 }} />
            {t('hastaPersonas', { n: capacidad })}
          </span>
        </div>

        <div className="ficha-exp-precio-card">
          <span className="ficha-eyebrow" style={{ fontSize: '12px', letterSpacing: '2px', color: 'rgba(135,43,19,0.6)' }}>
            {t('desde')}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', minWidth: 0 }}>
            <span className="ficha-exp-precio">{formatPrecio(precio, idioma)}</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(135,43,19,0.65)', minWidth: 0 }}>
              {t('porPersona')}
            </span>
          </div>

          {/* Va entre el precio y el botón a propósito: es lo que sostiene la
              cifra. La lista completa sigue más abajo, así que aquí solo asoman
              tres y el resto se cuenta — repetirla entera duplicaría la ficha. */}
          {incluyeVisible.length > 0 && (
            <ul className="ficha-exp-incluye-mini">
              {incluyeVisible.map(item => (
                <li key={item}>
                  <Check
                    size={16} strokeWidth={2.4} color="var(--color-orange)" aria-hidden="true"
                    style={{ flexShrink: 0, marginTop: '4px' }}
                  />
                  <span>{item}</span>
                </li>
              ))}
              {incluyeResto > 0 && (
                <li className="ficha-exp-incluye-resto">
                  {t('masFotos', { n: incluyeResto })}
                </li>
              )}
            </ul>
          )}

          <Button
            href={`/reservar/${slug}`}
            style={{
              width: '100%', textAlign: 'center', borderRadius: '8px',
              padding: '15px', fontSize: '17px', minHeight: '44px',
            }}
          >
            {t('reservarAhora')}
          </Button>

          {/* La duda sobre cancelar aparece justo aquí, en el momento de
              decidir. Resolverla en una línea evita que el visitante tenga
              que irse de la página a buscarla. */}
          {avisoCancelacion && (
            <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'rgba(135,43,19,0.7)', minWidth: 0 }}>
              {avisoCancelacion}{' '}
              <Link
                href="/politicas/cancelacion"
                style={{ color: 'var(--color-crimson)', fontWeight: 700, textDecoration: 'underline' }}
              >
                {t('verPolitica')}
              </Link>
            </p>
          )}
        </div>

        {/* Fuera de la tarjeta: quien no reserva casi nunca es porque el precio
            no le sirva, sino porque le falta un dato que la ficha no contesta.
            Esta línea es la salida de esa persona, y va donde se decide. */}
        {enlaceWhatsapp && (
          <div className="ficha-exp-contacto">
            <p>{t('dudas')}</p>
            {/* Hermano del párrafo, no hijo: los dos van en la misma línea
                porque el contenedor es flex, y así el enlace conserva sus 44px
                de alto sin deformar el interlineado de la pregunta. Cuando la
                columna se estrecha, el wrap los reparte en dos líneas.

                El icono sí va dentro del enlace: así la fila entera —glifo y
                texto— es lo que se pulsa, y no solo las letras. */}
            <a href={enlaceWhatsapp} target="_blank" rel="noopener noreferrer">
              <IconoWhatsapp size={18} />
              <span>{t('escribenosWhatsapp')}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
