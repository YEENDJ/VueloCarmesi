'use client'

import type { CSSProperties } from 'react'
import { useTranslations } from 'next-intl'
import FilasJustificadas from '@/components/galeria/FilasJustificadas'
import VisorGaleria, { type FotoVisor } from '@/components/galeria/VisorGaleria'

// En el orden del recorrido: del cacaotal a la mesa, y después la gente que
// lo vive. `ancho`/`alto` son los
// del archivo, que se sirve completo: el reparto en filas las necesita para que
// ninguna foto se recorte ni salte al cargar.
const FOTOS = [
  { clave: 'paisaje', src: '/images/cacao/cacaotal-bosque.jpg', ancho: 1280, alto: 853 },
  { clave: 'mazorca', src: '/images/cacao/mazorca-abierta-mano.jpg', ancho: 1080, alto: 1340 },
  { clave: 'cosecha', src: '/images/cacao/cosecha-mazorca-tijeras.jpg', ancho: 1884, alto: 4080 },
  { clave: 'cosechaEstudiantes', src: '/images/cacao/cosecha-estudiantes.jpg', ancho: 1884, alto: 4080 },
  { clave: 'fermentacion', src: '/images/cacao/fermentacion-cajones.jpg', ancho: 994, alto: 1279 },
  { clave: 'secado', src: '/images/cacao/secado-marquesina.jpg', ancho: 1080, alto: 1324 },
  { clave: 'secadoEquipo', src: '/images/personas/yuri-maria-orlando-secado.jpg', ancho: 1255, alto: 1184 },
  { clave: 'granosSecos', src: '/images/cacao/granos-secos-mano.jpg', ancho: 1080, alto: 1323 },
  { clave: 'taller', src: '/images/experiencias/molienda-cacao.jpg', ancho: 900, alto: 1600 },
  { clave: 'degustacion', src: '/images/experiencias/mesa-chocolate-tabletas.jpg', ancho: 1280, alto: 566 },
  { clave: 'mascarilla', src: '/images/experiencias/mascarilla-cacao.jpg', ancho: 960, alto: 1280 },
  { clave: 'recorrido', src: '/images/personas/recorrido-cacaotal.jpg', ancho: 720, alto: 1280 },
  { clave: 'clase', src: '/images/personas/clase-cacaotal.jpg', ancho: 2400, alto: 1106 },
  { clave: 'equipoCultivo', src: '/images/personas/equipo-cultivo.jpg', ancho: 901, alto: 769 },
  { clave: 'familia', src: '/images/personas/visitante-nino-mazorcas.jpg', ancho: 870, alto: 1279 },
]

/**
 * «La finca en imágenes»: un álbum de filas justificadas, cada foto completa en
 * su formato, y un visor a pantalla completa al tocar cualquiera.
 */
export default function GaleriaFinca() {
  const t = useTranslations('nosotros')
  const tg = useTranslations('galeria')

  const fotos: FotoVisor[] = FOTOS.map(f => ({
    src: f.src,
    alt: t(`galeriaAlt.${f.clave}`),
    ancho: f.ancho,
    alto: f.alto,
  }))

  return (
    <VisorGaleria fotos={fotos}>
      <FilasJustificadas className="filas-justificadas">
        {fotos.map((f, i) => {
          const proporcion = f.ancho / f.alto
          // Respaldo antes del JavaScript: cada foto parte de proporción × alto
          // de fila y crece en esa misma proporción, así las de una fila quedan
          // con la misma altura.
          const caja: CSSProperties = {
            flexGrow: proporcion,
            flexBasis: `calc(var(--alto-fila) * ${proporcion.toFixed(4)})`,
          }
          return (
            <li key={f.src} style={caja} data-proporcion={proporcion.toFixed(4)}>
              <button
                type="button"
                data-indice={i}
                className="galeria-sobre-foto"
                aria-label={tg('ampliarFoto', { alt: f.alt, n: i + 1, total: fotos.length })}
              >
                {/* El JPEG de `public/` tal cual, sin el optimizador del
                    despliegue: recomprimido se notaba. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.src}
                  alt=""
                  width={f.ancho}
                  height={f.alto}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            </li>
          )
        })}
      </FilasJustificadas>
    </VisorGaleria>
  )
}
