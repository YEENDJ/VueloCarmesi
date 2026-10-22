'use client'
import { useId, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Ave } from '@/lib/types'

/**
 * Ocho residentes por página: en escritorio son dos filas de cuatro y en
 * tablet 3 + 3 + 2 centradas. Con más, la rejilla de retratos 4:5 ya pasaba de
 * una pantalla y el resto de la página quedaba enterrado.
 */
const RESIDENTES_POR_PAGINA = 8

/** Las migratorias son fichas de texto y caben muchas más en el mismo alto. */
const MIGRATORIAS_POR_PAGINA = 12

/**
 * Las especies de /aviturismo: la rejilla de residentes con foto y, debajo, la
 * sección de migratorias: las que tienen foto en la misma rejilla de tarjetas y
 * las demás en fichas de texto. Cada lista pagina por su cuenta.
 *
 * Todas las especies van en el HTML y las de otras páginas solo se ocultan con
 * `hidden`. No es descuido: el nombre científico y el inglés de cada una son
 * justamente lo que busca el birder extranjero en Google, y una paginación que
 * pidiera las siguientes al servidor las dejaría fuera de lo que el buscador lee.
 * Son textos cortos y las fotos ocultas no se descargan (van con lazy).
 */
export default function GaleriaAves({ residentes, migratorias }: { residentes: Ave[]; migratorias: Ave[] }) {
  const t = useTranslations('aviturismo')
  const migratoriasConFoto = migratorias.filter(a => a.imagen)
  const migratoriasSinFoto = migratorias.filter(a => !a.imagen)

  return (
    <>
      {residentes.length > 0 && (
        <ListaPaginada
          items={residentes}
          porPagina={RESIDENTES_POR_PAGINA}
          className="avi-especies"
          etiqueta={t('residentes.paginacionAria')}
          renderItem={(ave, oculta) => <TarjetaAve key={ave.id} ave={ave} oculta={oculta} />}
        />
      )}

      {/* Sección y no tarjeta aparte: residentes y migratorias son la misma
          lista de la finca partida en dos, y separadas en dos recuadros se leían
          como temas distintos. El id es el destino del chip «Migratorias». */}
      {migratorias.length > 0 && (
        <section id="migratorias" className="avi-migratorias" aria-labelledby="avi-migratorias-titulo">
          <div className="avi-migratorias-cabecera">
            <span className="avi-icono avi-icono--chico" aria-hidden="true">
              <CalendarRange size={18} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h3 id="avi-migratorias-titulo" className="avi-migratorias-titulo">
              {t('migratoriasCard.titulo')}
            </h3>
          </div>
          <p className="avi-card-texto">{t('migratoriasCard.texto')}</p>

          {/* La foto es opcional en las migratorias. Las que la tienen van con
              la misma tarjeta que las residentes; las demás, en fichas de texto. */}
          {migratoriasConFoto.length > 0 && (
            <div className="avi-migratorias-fotos">
              <ListaPaginada
                items={migratoriasConFoto}
                porPagina={RESIDENTES_POR_PAGINA}
                className="avi-especies"
                etiqueta={t('migratoriasCard.paginacionFotosAria')}
                renderItem={(ave, oculta) => <TarjetaAve key={ave.id} ave={ave} oculta={oculta} />}
              />
            </div>
          )}

          {migratoriasSinFoto.length > 0 && (
            <ListaPaginada
              items={migratoriasSinFoto}
              porPagina={MIGRATORIAS_POR_PAGINA}
              className="avi-pills"
              etiqueta={t('migratoriasCard.paginacionAria')}
              renderItem={({ id, cientifico, ingles, local }, oculta) => (
                <li key={id} className="avi-pill" hidden={oculta}>
                  <b>
                    <i>{cientifico}</i>
                  </b>
                  <span className="avi-pill-ingles">{ingles}</span>
                  <span className="avi-pill-local">{local}</span>
                </li>
              )}
            />
          )}
        </section>
      )}
    </>
  )
}

/** La tarjeta con foto: la de las residentes y la de una migratoria que tenga foto. */
function TarjetaAve({ ave: { cientifico, ingles, local, imagen, alt, foco }, oculta }: { ave: Ave; oculta: boolean }) {
  return (
    <li className="avi-especie" hidden={oculta}>
      <div className="avi-especie-foto">
        <FotoAve src={imagen} alt={alt} foco={foco} />
      </div>
      {/* El científico manda y el inglés va justo debajo: son los dos
          nombres por los que llega buscando este visitante. */}
      <div className="avi-especie-nombres">
        <b className="avi-especie-cientifico">
          <i>{cientifico}</i>
        </b>
        <span className="avi-especie-ingles">{ingles}</span>
        <span className="avi-especie-local">{local}</span>
      </div>
    </li>
  )
}

/**
 * Una lista con sus controles de página. Cada instancia guarda su propia
 * página, así residentes y migratorias avanzan por separado.
 */
function ListaPaginada<T>({ items, porPagina, className, etiqueta, renderItem }: {
  items: T[]
  porPagina: number
  className: string
  etiqueta: string
  renderItem: (item: T, oculta: boolean) => ReactNode
}) {
  const id = useId()
  const [pagina, setPagina] = useState(0)
  const lista = useRef<HTMLUListElement>(null)
  const total = Math.ceil(items.length / porPagina)
  const desde = pagina * porPagina

  function ir(destino: number) {
    setPagina(destino)
    const ul = lista.current
    if (!ul) return
    // En móvil las residentes son un carrusel horizontal: sin esto la página
    // nueva arrancaría a mitad de camino, donde quedó la anterior.
    ul.scrollLeft = 0
    // Solo se sube si el inicio de la lista ya salió de la vista; si está a la
    // vista, mover la página sería un salto sin motivo.
    if (ul.getBoundingClientRect().top < 0) {
      const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ul.scrollIntoView({ block: 'start', behavior: reducido ? 'auto' : 'smooth' })
    }
  }

  return (
    <>
      <ul ref={lista} id={id} className={className}>
        {items.map((item, i) => renderItem(item, i < desde || i >= desde + porPagina))}
      </ul>
      {total > 1 && (
        <Paginacion id={id} pagina={pagina} total={total} etiqueta={etiqueta} onIr={ir} />
      )}
    </>
  )
}

function Paginacion({ id, pagina, total, etiqueta, onIr }: {
  /** El id de la lista que controla, para aria-controls. */
  id: string
  pagina: number
  total: number
  etiqueta: string
  onIr: (pagina: number) => void
}) {
  const t = useTranslations('aviturismo.residentes.paginacion')

  return (
    <nav className="avi-paginacion" aria-label={etiqueta}>
      <button
        type="button"
        className="avi-paginacion-boton"
        onClick={() => onIr(pagina - 1)}
        disabled={pagina === 0}
        aria-controls={id}
      >
        <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
        <span className="avi-paginacion-texto">{t('anterior')}</span>
      </button>

      <ol className="avi-paginacion-numeros">
        {Array.from({ length: total }, (_, n) => (
          <li key={n}>
            <button
              type="button"
              className="avi-paginacion-numero"
              onClick={() => onIr(n)}
              aria-current={n === pagina ? 'page' : undefined}
              aria-label={t('irA', { n: n + 1 })}
              aria-controls={id}
            >
              {n + 1}
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="avi-paginacion-boton"
        onClick={() => onIr(pagina + 1)}
        disabled={pagina === total - 1}
        aria-controls={id}
      >
        <span className="avi-paginacion-texto">{t('siguiente')}</span>
        <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      {/* Para lector de pantalla: anuncia el cambio, que visualmente es
          obvio pero a oído no se nota. */}
      <p className="avi-solo-lector" aria-live="polite">
        {t('estado', { actual: pagina + 1, total })}
      </p>
    </nav>
  )
}

/**
 * La foto de la tarjeta. Las que vienen del repositorio (/images/aves/…) pasan
 * por next/image; las que sube el panel están en Cloudinary y van en <img>,
 * igual que en las tarjetas de experiencia (ver ExperienciaCard).
 *
 * Las medidas son nominales: el marco 4:5 ya reserva el hueco y la foto lo
 * llena con object-fit, así que el ratio real del archivo no se ve en ningún lado.
 */
function FotoAve({ src, alt, foco }: { src: string; alt: string; foco: string }) {
  const estilo = { width: '100%', height: '100%', objectFit: 'cover', objectPosition: foco } as const
  if (src.startsWith('/')) {
    return (
      <Image
        src={src}
        alt={alt}
        width={800}
        height={1000}
        sizes="(min-width: 1100px) 260px, (min-width: 600px) 30vw, 72vw"
        style={estilo}
      />
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={800} height={1000} loading="lazy" decoding="async" style={estilo} />
}
