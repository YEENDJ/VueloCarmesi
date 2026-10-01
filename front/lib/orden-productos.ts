/**
 * Los agotados al final de la tienda, para que lo primero que se ve sea lo que
 * se puede comprar.
 *
 * El orden es estable: dentro de cada grupo se respeta el que trae el backend
 * (más nuevos primero), así que un producto que se agota baja al fondo sin
 * revolver a los demás.
 */
export function disponiblesPrimero<T extends { stock: number }>(productos: T[]): T[] {
  return [...productos].sort((a, b) => Number(a.stock <= 0) - Number(b.stock <= 0))
}
