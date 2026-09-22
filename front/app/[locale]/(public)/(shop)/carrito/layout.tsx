import type { Metadata } from 'next'

/**
 * El carrito no entra al índice.
 *
 * No responde a ninguna consulta: su contenido vive en el navegador de quien
 * lo llena, así que lo que vería el rastreador es siempre el carrito vacío
 * servido con el title genérico de la marca —una URL que compite con la
 * portada sin decir nada.
 *
 * El `noindex` va en un layout propio de /carrito y NO en el de (shop)
 * porque de ese layout cuelgan también /tienda y /tienda/[slug], cuyo
 * `generateMetadata` no declara `robots`: heredarían la regla y se caerían
 * del índice las fichas de producto. Y va en un layout y no en la página
 * porque la página es 'use client' y no puede exportar `metadata`.
 *
 * `follow: true` para que el rastreador siga usando los enlaces de vuelta a
 * la tienda.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function CarritoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
