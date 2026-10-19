import type { Metadata } from 'next'

/**
 * «Mi pedido» no entra al índice: la consulta no resuelve ninguna búsqueda y
 * la página de estado muestra una compra concreta. Mismo criterio que el
 * layout de /checkout; robots.ts además prohíbe rastrear estas rutas.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function MiPedidoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
