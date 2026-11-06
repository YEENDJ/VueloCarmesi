import { Clock, MapPin, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Props {
  horarios?: string
  puntoEncuentro?: string
  recomendaciones?: string
}

/**
 * Las respuestas a "¿cuándo?", "¿dónde llego?" y "¿esto es para mí?" — las tres
 * dudas que aparecen justo antes de reservar.
 *
 * Van en filas dentro de un solo recinto, y antes del programa: son condiciones
 * para decidir, no un apéndice. Una fila por dato aguanta también el texto largo
 * —un punto de encuentro de cuatro líneas— sin dejar aire en las celdas vecinas.
 *
 * Los tres campos son opcionales y el bloque entero desaparece si no hay
 * ninguno: la ficha tiene que verse intencional sin ellos, no a medio llenar.
 */
export default function DatosPracticos({ horarios, puntoEncuentro, recomendaciones }: Props) {
  const t = useTranslations('reserva')

  const datos = [
    { Icono: Clock, titulo: t('cuando'), texto: horarios?.trim() },
    { Icono: MapPin, titulo: t('puntoEncuentro'), texto: puntoEncuentro?.trim() },
    { Icono: TriangleAlert, titulo: t('tenEnCuenta'), texto: recomendaciones?.trim() },
  ].filter(d => d.texto)

  if (datos.length === 0) return null

  return (
    <section>
      <h2 className="ficha-exp-seccion-titulo">{t('antesDeReservar')}</h2>

      <dl className="ficha-exp-practicos">
        {datos.map(({ Icono, titulo, texto }) => (
          <div key={titulo} className="ficha-exp-practico">
            {/* El icono va en un disco de color y no suelto junto al rótulo:
                un icono a pelo se lee como decoración, y en disco se lee como
                la marca del dato. */}
            <span className="ficha-exp-practico-icono" aria-hidden="true">
              <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <div style={{ minWidth: 0 }}>
              <dt className="ficha-exp-practico-rotulo">{titulo}</dt>
              <dd className="ficha-exp-practico-valor">{texto}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}
