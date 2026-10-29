'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** Pasa "11rem" / "176px" (el valor de --alto-fila) a píxeles. */
function aPixeles(valor: string) {
  const n = parseFloat(valor)
  if (valor.trim().endsWith('rem')) {
    return n * parseFloat(getComputedStyle(document.documentElement).fontSize)
  }
  return n
}

/** Máximo de fotos por fila: acota el cálculo y evita filas de miniaturas. */
const MAX_POR_FILA = 5

/**
 * Qué tan mala es una fila de alto h frente al alto ideal. Asimétrica: una fila
 * más baja que el ideal (fotos pequeñas) pesa cinco veces más que una más alta,
 * para que la mayoría de fotos se vean grandes. Una fila desmedidamente alta
 * —una vertical sola a todo el ancho— también se castiga, así que solo aparece
 * si no hay otra salida.
 */
function costo(h: number, ideal: number) {
  const x = h / ideal
  return x < 1 ? 5 * (1 / x - 1) ** 2 : (x - 1) ** 2
}

/**
 * Galería tipo álbum con final plano: cada foto completa en su formato, sin
 * recortes, y TODAS las filas justificadas al ancho, incluida la última.
 *
 * Reparto global por programación dinámica: entre todas las formas de cortar
 * las fotos en filas, en su orden, se elige la de menor costo total (ver
 * `costo`). Cada <li> trae `data-proporcion` (ancho / alto); el alto ideal sale
 * de --alto-fila.
 *
 * Antes de que cargue el JavaScript la lista ya se acomoda sola con CSS
 * (.filas-justificadas en globals.css): aquí solo se afina el corte.
 *
 * Es la misma galería de los eventos de ruben-dario-bodas.
 */
export default function FilasJustificadas({
  className,
  children,
}: {
  className: string
  children: ReactNode
}) {
  const lista = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const ul = lista.current
    if (!ul) return

    const acomodar = () => {
      const items = [...ul.children].filter(
        (e): e is HTMLElement => e instanceof HTMLElement && !!e.dataset.proporcion,
      )
      const estilo = getComputedStyle(ul)
      // -1 px: margen contra redondeos que harían saltar la última foto de la fila.
      const ancho = ul.clientWidth - 1
      const espacio = parseFloat(estilo.columnGap) || 0
      const ideal = aPixeles(estilo.getPropertyValue('--alto-fila') || '176px')
      const r = items.map(el => Number(el.dataset.proporcion))
      const n = r.length
      if (!ancho || !ideal || !n) return

      // Alto de la fila con las fotos [a, b) justificada al ancho.
      const altoFila = (a: number, b: number) => {
        let suma = 0
        for (let k = a; k < b; k++) suma += r[k]
        return (ancho - espacio * (b - a - 1)) / suma
      }

      // mejor[i] = menor costo para acomodar las primeras i fotos; corte[i] =
      // dónde empieza la última fila de esa solución.
      const mejor = new Array<number>(n + 1).fill(Infinity)
      const corte = new Array<number>(n + 1).fill(0)
      mejor[0] = 0
      for (let i = 1; i <= n; i++) {
        for (let j = Math.max(0, i - MAX_POR_FILA); j < i; j++) {
          const total = mejor[j] + costo(altoFila(j, i), ideal)
          if (total < mejor[i]) {
            mejor[i] = total
            corte[i] = j
          }
        }
      }

      for (let i = n; i > 0; i = corte[i]) {
        const alto = altoFila(corte[i], i)
        for (let k = corte[i]; k < i; k++) {
          items[k].style.flex = '0 0 auto'
          items[k].style.width = `${Math.floor(r[k] * alto * 100) / 100}px`
        }
      }
    }

    acomodar()
    const observador = new ResizeObserver(acomodar)
    observador.observe(ul)
    return () => observador.disconnect()
  }, [])

  return (
    <ul ref={lista} className={className}>
      {children}
    </ul>
  )
}
