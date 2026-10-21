import type { Metadata } from 'next'

/**
 * «Mi reserva» no entra al índice: la consulta no resuelve ninguna búsqueda y
 * la página de estado muestra una reserva concreta. Mismo criterio que «mi
 * pedido»; robots.ts además prohíbe rastrear estas rutas.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function MiReservaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
