import type { Prisma } from '@prisma/client'

type Tx = Prisma.TransactionClient
// `productoId` nulo: el producto se eliminó y no hay inventario al que volver.
type Item = { productoId: string | null; cantidad: number }

/**
 * Devuelve al inventario las unidades de un pedido, una sola vez.
 *
 * La marca `stockApartado` se baja con la condición dentro del UPDATE: si dos
 * caminos llegan a la vez —el admin cancela justo cuando el pedido vence—, solo
 * uno encuentra la fila en `true` y devuelve. Sin esto, las unidades volvían
 * dos veces y la tienda vendía lo que no tenía.
 *
 * Devuelve si esta llamada fue la que las devolvió.
 */
export async function devolverStock(tx: Tx, pedidoId: string, items: Item[]): Promise<boolean> {
  const { count } = await tx.pedido.updateMany({
    where: { id: pedidoId, stockApartado: true },
    data: { stockApartado: false },
  })
  if (count === 0) return false
  for (const item of items) {
    if (!item.productoId) continue
    await tx.producto.update({
      where: { id: item.productoId },
      data: { stock: { increment: item.cantidad } },
    })
  }
  return true
}

/**
 * Vuelve a apartar las unidades de un pedido que ya las había soltado. Es el
 * caso 5 del spec: un pago aprobado después de que el pedido venció.
 *
 * Todo o nada: si falta una sola unidad lanza, y la transacción que la llamó
 * deshace los descuentos que alcanzó a hacer. Mismo descuento condicionado que
 * `PedidosService.create`, por la misma razón: dos a la vez no pueden pasar
 * los dos con la última unidad.
 */
export async function reapartarStock(tx: Tx, pedidoId: string, items: Item[]): Promise<void> {
  for (const item of items) {
    // Un producto eliminado ya no tiene unidades que apartar.
    if (!item.productoId) throw new StockInsuficienteError(null)
    const { count } = await tx.producto.updateMany({
      where: { id: item.productoId, stock: { gte: item.cantidad } },
      data: { stock: { decrement: item.cantidad } },
    })
    if (count === 0) throw new StockInsuficienteError(item.productoId)
  }
  await tx.pedido.update({ where: { id: pedidoId }, data: { stockApartado: true } })
}

export class StockInsuficienteError extends Error {
  constructor(readonly productoId: string | null) {
    super(productoId ? `Stock insuficiente para '${productoId}'` : 'El producto se eliminó')
  }
}
