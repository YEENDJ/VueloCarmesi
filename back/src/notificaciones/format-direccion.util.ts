export function formatDireccionPedido(pedido: {
  direccion: string; ciudad: string; codigoPostal: string
}): string {
  return `${pedido.direccion}, ${pedido.ciudad} (CP ${pedido.codigoPostal})`
}
