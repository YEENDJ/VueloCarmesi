import { useTranslations } from 'next-intl'
import { Building2, Bus, Landmark, Church, Sprout, type LucideIcon } from 'lucide-react'

/**
 * La ruta desde Bogotá hasta la finca, tramo por tramo.
 *
 * Fuente: hoja 18 del portafolio. Allá es un SVG apaisado porque la hoja tiene
 * ancho fijo; acá no puede serlo. Un SVG con `viewBox` de 960 encoge el texto
 * junto con el dibujo y a 320px los rótulos quedan en 4px. Esto es una <ol> con
 * CSS: en escritorio se lee como una línea horizontal de cuatro paradas y en
 * móvil se apila en vertical sin que ninguna cifra cambie de tamaño.
 *
 * Es `<ol>` de verdad y no divs: sin CSS —o en un lector de pantalla— sigue
 * siendo «cuatro paradas en este orden», que es exactamente la información.
 *
 * Los iconos son decorativos y van `aria-hidden`: el dato lo lleva el nombre
 * del lugar, que está al lado como texto. Lo que aportan es que la escala se
 * lea de un vistazo —ciudad grande, ciudad, pueblo, finca— sin leer los cuatro
 * rótulos, y que el autobús diga «esto se hace por carretera» sin una palabra
 * más, que es justo lo que un coordinador viene a comprobar.
 */

type Parada = {
  lugar: string
  /** El tramo que lleva HASTA esta parada. El primero no tiene: es el origen. */
  tramo: string | null
  Icono: LucideIcon
}

const PARADAS: Parada[] = [
  { lugar: 'tramoBogota', tramo: null, Icono: Building2 },
  { lugar: 'tramoVillavicencio', tramo: 'tramo1', Icono: Landmark },
  { lugar: 'tramoCubarral', tramo: 'tramo2', Icono: Church },
  { lugar: 'tramoFinca', tramo: 'tramo3', Icono: Sprout },
]

export default function RutaTramos() {
  const t = useTranslations('grupos.logistica')

  return (
    <div className="grp-ruta-marco">
      <ol className="grp-ruta" aria-label={t('rutaAria')}>
        {PARADAS.map(({ lugar, tramo, Icono }, i) => {
          const esFin = i === PARADAS.length - 1
          return (
            <li key={lugar} className="grp-ruta-parada">
              {/* El tramo va ANTES del nodo al que conduce: es la distancia que
                  se recorre para llegar a este punto, no la que sale de él. */}
              {tramo && (
                <span className="grp-ruta-tramo">
                  <Bus size={13} strokeWidth={2} aria-hidden="true" />
                  {t(tramo)}
                </span>
              )}
              <span
                className={`grp-ruta-nodo${esFin ? ' grp-ruta-nodo--fin' : ''}`}
                aria-hidden="true"
              >
                <Icono size={18} strokeWidth={1.9} />
              </span>
              <span className="grp-ruta-lugar">{t(lugar)}</span>
            </li>
          )
        })}
      </ol>
      <p className="grp-ruta-nota">{t('tramoNota')}</p>
    </div>
  )
}
