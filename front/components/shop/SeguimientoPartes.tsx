'use client'
import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

/**
 * Piezas que comparten «mi pedido» y «mi reserva» (EstadoPedido y
 * EstadoReserva). Los textos llegan ya traducidos: cada página usa su catálogo.
 */

/** Copia el código para citarlo por WhatsApp. Anuncia `copiadoTexto` a los lectores de pantalla. */
export function CopiarCodigo({ codigo, etiqueta, copiadoTexto }: { codigo: string; etiqueta: string; copiadoTexto: string }) {
  const [copiado, setCopiado] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sin permiso de portapapeles el código sigue a la vista para copiarlo a mano.
    }
  }

  return (
    <>
      <button type="button" className="pedido-copiar" onClick={copiar} aria-label={etiqueta}>
        {copiado ? <Check size={18} strokeWidth={2.5} aria-hidden="true" /> : <Copy size={18} strokeWidth={2.25} aria-hidden="true" />}
      </button>
      <span className="solo-lectores" role="status">{copiado ? copiadoTexto : ''}</span>
    </>
  )
}

/** Mientras carga: la forma de la página, para que no salte al llegar los datos. */
export function Esqueleto({ texto }: { texto: string }) {
  return (
    <section className="page-shell pedido" aria-busy="true">
      <p role="status" className="solo-lectores">{texto}</p>
      <div className="pedido-esqueleto" aria-hidden="true">
        <span className="pedido-hueso pedido-hueso--tarjeta" style={{ height: '16rem' }} />
        <span className="pedido-hueso pedido-hueso--tarjeta" style={{ height: '12rem' }} />
        <span className="pedido-hueso pedido-hueso--tarjeta" style={{ height: '8rem' }} />
      </div>
    </section>
  )
}
