export function formatDireccionPedido(pedido: {
  direccion: string; ciudad: string; codigoPostal?: string | null
}): string {
  const base = `${pedido.direccion}, ${pedido.ciudad}`
  // Los pedidos nuevos llegan sin código postal; los viejos lo conservan.
  return pedido.codigoPostal ? `${base} (CP ${pedido.codigoPostal})` : base
}
