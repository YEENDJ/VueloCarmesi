type Relacionable = {
  id: string
  slug: string
  stock: number
  categoria: string
}

/**
 * Qué productos enlaza una ficha en «Productos relacionados».
 *
 * Fuera lo agotado: es un enlace a algo que no se puede comprar. Esas fichas no
 * se quedan sin enlaces, porque siguen en el listado de la tienda y en el sitemap.
 *
 * Primero la misma categoría, y se completa con las demás: sin ese relleno, los
 * productos únicos de su categoría (la miel, la mascarilla) no enlazaban a nada.
 *
 * Cada ficha toma los que le siguen en una lista circular, en vez de los primeros
 * de la lista. Así el reparto de enlaces no depende de quién esté de primero: con
 * un corte fijo, los productos del final de una categoría no salían en casi
 * ninguna ficha, y es lo que les pasaba a los ARICAO.
 *
 * La lista va por slug, no en el orden del backend (más nuevos primero):
 *   - El slug no cambia nunca, así que crear un producto no revuelve los enlaces
 *     de todas las fichas.
 *   - Las presentaciones de una misma línea quedan seguidas, y son lo primero
 *     que le interesa a quien está viendo una de ellas.
 */
export function productosRelacionados<T extends Relacionable>(
  catalogo: T[],
  actual: Pick<Relacionable, 'id' | 'categoria'>,
  limite = 4,
): T[] {
  const orden = [...catalogo].sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
  const siguiente = orden.findIndex(p => p.id === actual.id) + 1
  const candidatos = [...orden.slice(siguiente), ...orden.slice(0, siguiente)]
    .filter(p => p.id !== actual.id && p.stock > 0)

  return [
    ...candidatos.filter(p => p.categoria === actual.categoria),
    ...candidatos.filter(p => p.categoria !== actual.categoria),
  ].slice(0, limite)
}
