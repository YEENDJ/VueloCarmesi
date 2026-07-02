export function formatPrecio(n: number): string {
  return `$${n.toLocaleString('es-CO')}`
}
