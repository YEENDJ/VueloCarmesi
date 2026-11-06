import { Backpack, CircleX } from 'lucide-react'

type Variante = 'traer' | 'noIncluye'

const VARIANTES: Record<Variante, { Icono: typeof Backpack; acento: string }> = {
  traer: { Icono: Backpack, acento: 'var(--color-amber)' },
  // "No incluye" no es un error: nada de rojo. Va en marrón para que informe
  // sin alarmar justo antes de reservar.
  noIncluye: { Icono: CircleX, acento: 'var(--color-brown)' },
}

interface Props {
  titulo: string
  items: string[]
  variante: Variante
}

/**
 * Las listas que completan la ficha: qué traer y qué no incluye. «Incluye» va en
 * la tarjeta de reserva, junto al precio que justifica.
 *
 * Devuelve null si la lista viene vacía: son campos opcionales y la ficha debe
 * verse intencional sin ellos, no incompleta.
 */
export default function ListaFicha({ titulo, items, variante }: Props) {
  if (items.length === 0) return null

  const { Icono, acento } = VARIANTES[variante]

  return (
    <section className="ficha-exp-lista">
      <h2 className="ficha-exp-lista-titulo">
        <Icono size={22} strokeWidth={1.9} color={acento} aria-hidden="true" style={{ flexShrink: 0 }} />
        {titulo}
      </h2>
      <ul className="ficha-exp-vinetas">
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
