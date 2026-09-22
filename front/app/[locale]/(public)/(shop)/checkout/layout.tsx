import type { Metadata } from 'next'

/**
 * El checkout y su confirmación no entran al índice.
 *
 * El formulario es un paso del embudo y la confirmación pinta los datos del
 * pedido de quien acaba de comprar: ninguna de las dos es un destino de
 * búsqueda y la segunda no debería quedar cacheada en ningún buscador.
 *
 * Una sola regla en el layout cubre /checkout y /checkout/confirmacion, que
 * cuelga de él. No va en el layout de (shop) —de ahí cuelgan /tienda y las
 * fichas, que sí se indexan— y no va en las páginas porque ambas son
 * 'use client' y no pueden exportar `metadata`.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
