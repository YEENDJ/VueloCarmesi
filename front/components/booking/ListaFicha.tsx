import { Backpack, CircleCheck, CircleX } from 'lucide-react'

type Variante = 'incluye' | 'traer' | 'noIncluye'

const VARIANTES: Record<Variante, {
  Icono: typeof CircleCheck
  acento: string
  punto: string
  texto: string
}> = {
  incluye: {
    Icono: CircleCheck,
    acento: 'var(--color-orange)',
    punto: 'var(--color-orange)',
    texto: 'var(--color-brown)',
  },
  traer: {
    Icono: Backpack,
    acento: 'var(--color-amber)',
    punto: 'var(--color-amber)',
    texto: 'var(--color-brown)',
  },
  // "No incluye" no es un error: nada de rojo ni de aspa de alerta. Va en
  // marrón apagado para que informe sin alarmar justo antes de reservar.
  noIncluye: {
    Icono: CircleX,
    acento: 'rgba(135,43,19,0.45)',
    punto: 'rgba(135,43,19,0.45)',
    texto: 'rgba(135,43,19,0.7)',
  },
}

interface Props {
  titulo: string
  items: string[]
  variante: Variante
}

/**
 * Uno de los tres bloques de lista de la ficha: incluye, qué traer y qué no
 * incluye. Los tres comparten forma para que la ficha se lea como una sola
 * pieza y no como tres inventos distintos.
 *
 * Cada bloque es una tarjeta con su icono, y dentro los elementos van en filas
 * apiladas. Fueron píldoras sueltas en una fila que envolvía, y el problema de
 * aquello era que las tres listas se mezclaban en una sola mancha: para saber
 * si algo estaba incluido o no había que buscar bajo qué rótulo caía. En
 * tarjetas, cada lista tiene su recinto y la respuesta se ve de un vistazo.
 *
 * Una tarjeta con un solo elemento se sigue viendo deliberada porque lleva
 * título e icono propios — que era lo que le faltaba a la versión en tarjetas
 * de antes, donde el elemento suelto flotaba en un rectángulo de aire.
 *
 * Devuelve null si la lista viene vacía: son campos opcionales y la ficha debe
 * verse intencional sin ellos, no incompleta.
 */
export default function ListaFicha({ titulo, items, variante }: Props) {
  if (items.length === 0) return null

  const { Icono, acento, punto, texto } = VARIANTES[variante]

  return (
    <section
      className={
        variante === 'noIncluye'
          ? 'ficha-exp-lista-card ficha-exp-lista-card--apagada'
          : 'ficha-exp-lista-card'
      }
    >
      <h2 className="ficha-exp-lista-titulo">
        <Icono size={22} strokeWidth={1.9} color={acento} aria-hidden="true" style={{ flexShrink: 0 }} />
        {titulo}
      </h2>
      <ul className="ficha-exp-vinetas">
        {items.map(item => (
          <li key={item} className="ficha-exp-vineta" style={{ color: texto }}>
            <span className="ficha-exp-punto" style={{ backgroundColor: punto }} aria-hidden="true" />
            <span style={{ minWidth: 0 }}>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
