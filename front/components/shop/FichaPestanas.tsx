'use client'
import { useRef, useState } from 'react'

interface Props {
  /** Pares etiqueta/valor: contenido, categoría, disponibilidad… */
  especificaciones: { etiqueta: string; valor: string }[]
  descripcion: string
}

const TITULOS = ['Características', 'Descripción']

/**
 * Pestañas de la ficha de producto. Separan el dato duro de la prosa: hoy casi
 * ningún producto tiene descripción larga, así que "Características" abre
 * primero y la ficha nunca se ve vacía. La tabla a dos columnas es la misma
 * forma que usan las tiendas grandes para las fichas técnicas, y se lee de un
 * vistazo mucho mejor que tres tarjetas sueltas.
 */
export default function FichaPestanas({ especificaciones, descripcion }: Props) {
  const [abierta, setAbierta] = useState(0)
  const pestanasRef = useRef<(HTMLButtonElement | null)[]>([])

  // Flechas para moverse entre pestañas: es lo que espera quien navega con
  // teclado, y sin esto hay que tabular a través de todo el panel.
  const alPulsarTecla = (e: React.KeyboardEvent) => {
    const paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (paso === 0) return
    e.preventDefault()
    const siguiente = (abierta + paso + TITULOS.length) % TITULOS.length
    setAbierta(siguiente)
    pestanasRef.current[siguiente]?.focus()
  }

  return (
    <div className="ficha-pestanas">
      <div role="tablist" aria-label="Información del producto" className="ficha-pestanas-tira" onKeyDown={alPulsarTecla}>
        {TITULOS.map((titulo, i) => (
          <button
            key={titulo}
            ref={nodo => { pestanasRef.current[i] = nodo }}
            type="button"
            role="tab"
            id={`ficha-pestana-${i}`}
            aria-selected={i === abierta}
            aria-controls={`ficha-panel-${i}`}
            tabIndex={i === abierta ? 0 : -1}
            onClick={() => setAbierta(i)}
            className={`ficha-pestana${i === abierta ? ' ficha-pestana--activa' : ''}`}
          >
            {titulo}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="ficha-panel-0" aria-labelledby="ficha-pestana-0" hidden={abierta !== 0}>
        <div className="ficha-tabla-marco">
          <table className="ficha-tabla">
            <tbody>
              {especificaciones.map(e => (
                <tr key={e.etiqueta}>
                  <th scope="row">{e.etiqueta}</th>
                  <td>{e.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div role="tabpanel" id="ficha-panel-1" aria-labelledby="ficha-pestana-1" hidden={abierta !== 1}>
        <p className="ficha-descripcion-larga">{descripcion}</p>
      </div>
    </div>
  )
}
