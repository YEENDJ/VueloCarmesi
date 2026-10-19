type Sugerible = {
  id: string
  stock: number
  precio: number
  categoria: string
  badge?: 'Nuevo' | 'Destacado' | null
  imagen?: string
}

/**
 * Qué ofrecerle a quien ya está en el carrito, antes de que pase al checkout.
 *
 * Fuera lo que ya lleva y lo agotado: sugerir algo que no se puede agregar es
 * un botón muerto justo en el paso donde menos conviene frenar a nadie.
 *
 * Primero los que tienen foto: un recuadro vacío no tienta a nadie, y es
 * justo lo que se pretende con esta sección.
 *
 * Después, el orden busca el «ya que estoy»:
 *   1. La misma categoría de algo que lleva: quien compra chocolate es el más
 *      probable de sumar otro chocolate.
 *   2. Destacados y nuevos, que son los que la finca quiere mover.
 *   3. El más barato primero: un complemento pequeño se agrega sin pensarlo;
 *      uno que duplica el total hace que se lo piense de nuevo.
 */
export function sugerenciasCarrito<T extends Sugerible>(
  catalogo: T[],
  enCarrito: { productoId: string }[],
  limite = 5,
): T[] {
  const ids = new Set(enCarrito.map(item => item.productoId))
  const categorias = new Set(catalogo.filter(p => ids.has(p.id)).map(p => p.categoria))

  return catalogo
    .filter(p => !ids.has(p.id) && p.stock > 0)
    .sort((a, b) =>
      Number(!!b.imagen) - Number(!!a.imagen) ||
      Number(categorias.has(b.categoria)) - Number(categorias.has(a.categoria)) ||
      Number(!!b.badge) - Number(!!a.badge) ||
      a.precio - b.precio,
    )
    .slice(0, limite)
}
