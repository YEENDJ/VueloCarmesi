import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { PasoPrograma } from '@/lib/programa'

/**
 * El programa de la experiencia, paso a paso.
 *
 * Quien evalúa una salida quiere recorrer qué va a hacer sin leerlo todo, así
 * que se ven los títulos y se abre lo que interese. El primero va abierto para
 * que se entienda de entrada que hay detalle debajo.
 *
 * `<details>` nativo y no estado de React: no añade JavaScript a la ficha,
 * funciona con teclado y lector de pantalla, y el texto sigue en el HTML para
 * los buscadores.
 */
export default function ProgramaExperiencia({ pasos }: { pasos: PasoPrograma[] }) {
  const t = useTranslations('reserva')
  if (pasos.length === 0) return null

  return (
    <section>
      <h2 className="ficha-exp-seccion-titulo">{t('programa')}</h2>
      <ol className="ficha-exp-pasos">
        {pasos.map((paso, i) => (
          <li key={i}>
            <details className="ficha-exp-paso" open={i === 0}>
              <summary>
                <span
                  className={paso.numero === null ? 'ficha-exp-paso-num ficha-exp-paso-num--final' : 'ficha-exp-paso-num'}
                  aria-hidden="true"
                >
                  {paso.numero}
                </span>
                <span className="ficha-exp-paso-titulo">{paso.titulo}</span>
                <ChevronDown className="ficha-exp-paso-flecha" size={20} strokeWidth={2} aria-hidden="true" />
              </summary>
              <ul className="ficha-exp-paso-detalles">
                {paso.detalles.map((detalle, j) => (
                  <li key={j}>{detalle}</li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ol>
    </section>
  )
}
