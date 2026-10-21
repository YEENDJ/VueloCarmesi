/**
 * `?ver=<id>` en la URL del panel: abre ese pedido o reserva al cargar. Llega
 * desde la alerta de un producto o experiencia que no se pudo eliminar.
 *
 * Lo quita de la URL al leerlo, para que cerrar el detalle o recargar no lo
 * vuelva a abrir.
 */
export function tomarVerDeLaUrl(): string | null {
  const id = new URLSearchParams(window.location.search).get('ver')
  if (id) window.history.replaceState(null, '', window.location.pathname)
  return id
}
