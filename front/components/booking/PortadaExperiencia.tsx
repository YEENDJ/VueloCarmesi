'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { Check, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react'
import IconoWhatsapp from '@/components/ui/IconoWhatsapp'
import Button from '@/components/ui/Button'
import { formatPrecio } from '@/lib/format'
import { fotoCloudinary } from '@/lib/imagenes'

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

  // Mismo criterio que la galería de producto: el `+ total` mantiene el índice
  // positivo al retroceder desde la primera, porque en JavaScript -1 % 4 es -1
  // y no 3. Da la vuelta a propósito — con el contador «1 / 8» a la vista, una
  // flecha que se apaga en los extremos no se distingue de una que se rompió.
  //
  // El acotado va DENTRO del actualizador en vez de partir de `activa`: si el
  // administrador quita fotos con la pestaña abierta, el índice guardado puede
  // apuntar fuera de la lista y la primera flecha daría un salto en vez de un
  // paso. Y leyendo el valor anterior en vez del de la última renderización,
  // dos clics seguidos avanzan dos fotos aunque React los agrupe en un lote.
  const mover = (paso: 1 | -1) =>
    setIndice(i => (total === 0 ? 0 : (Math.min(i, total - 1) + paso + total) % total))

  // La tira de miniaturas no baja de línea: se desplaza. Se mide para saber si
  // sobra ancho, porque de eso depende el aviso de abajo: «desliza la tira»
  // solo es cierto si hay algo fuera de vista.
  const tira = useRef<HTMLDivElement>(null)
  const [desborda, setDesborda] = useState(false)

  useEffect(() => {
    const el = tira.current
    if (!el) return
    const medir = () => setDesborda(el.scrollWidth - el.clientWidth > 1)
    medir()
    // Sin esto, pasar de escritorio a móvil dejaría el aviso puesto aunque ya
    // no hiciera falta, o al revés.
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [total])

  // Las flechas cambian la foto grande, así que a partir de la séptima foto la
  // miniatura activa se queda fuera de vista y la tira deja de decir por dónde
  // va uno. Esto la arrastra detrás.
  //
  // Se mueve `scrollLeft` a mano en vez de usar scrollIntoView porque ese
  // también desplaza la PÁGINA cuando el elemento no cabe entero en pantalla, y
  // aquí pulsar una flecha no puede mover nada que no sea la tira.
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
            // El LCP de la ficha. 620 = lo que `flex: 1 1 460px` le deja a
            // .ficha-exp-galeria dentro de los 1136 útiles; por debajo de
            // ~860px la fila envuelve y la foto ocupa el ancho entero.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              {...fotoCloudinary(imagenes[activa], 620)}
              sizes="(max-width: 860px) 100vw, 620px"
              alt={tg('fotoDe', { nombre, n: activa + 1, total })}
              fetchPriority="high"
              decoding="async"
            />
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

                Las flechas se apoyan en los extremos de la tira, que es donde
                estaban, pero ya no la desplazan: cambian la foto de arriba y la
                tira se recoloca sola detrás. La tira además se arrastra con el
                dedo o con el ratón, y se pulsa una miniatura para saltar
                directo a ella. */}
            <div className="ficha-exp-tira">
              {/* Las dos se pintan siempre, sin apagarse en los extremos: el
                  recorrido da la vuelta, así que ninguna se queda sin destino.
                  Antes sí se escondían, porque entonces desplazaban la tira y
                  en el extremo no llevaban a ninguna parte. */}
              <button
                type="button"
                className="ficha-exp-tira-flecha ficha-exp-tira-flecha--prev"
                onClick={() => mover(-1)}
                aria-label={tg('fotoAnterior')}
              >
                <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
              </button>

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
                    {/* 88px fijos (`flex: 0 0 88px`). Con la tira de veinte
                        fotos que admite el panel, `lazy` deja fuera todo lo
                        que no se ha desplazado todavía. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img {...fotoCloudinary(src, 88)} sizes="88px" alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="ficha-exp-tira-flecha ficha-exp-tira-flecha--next"
                onClick={() => mover(1)}
                aria-label={tg('fotoSiguiente')}
              >
                <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>

            {/* Las miniaturas se ven, pero nadie sabe que se pulsan hasta que
                alguien lo dice. Y si además hay fotos fuera de vista, el aviso
                es el único sitio donde eso se puede contar. */}
            <p className="ficha-exp-aviso-fotos">
              {desborda ? t('deslizaTira') : t('tocaFoto')}
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
            href={{ pathname: '/reservar/[slug]', params: { slug } }}
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
