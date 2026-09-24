/**
 * El número de radicado de un mensaje de contacto: `VC-20260924-4F7K2Q`.
 *
 * La Ley 2439 de 2024 pide que cada reclamo tenga un registro con fecha, hora y
 * forma de seguimiento. El radicado se deriva del mensaje guardado —la fecha
 * de recepción en hora de Colombia y el final de su id—, así que no necesita
 * columna propia y el mismo número se puede reconstruir desde cualquier lado.
 *
 * Gemelo de `radicado` en front/lib/radicado.ts: el visitante ve el número en
 * pantalla al enviar y lo recibe en el correo. Si cambia uno, cambia el otro.
 */
export function radicado(id: string, recibido: Date | string): string {
  const dia = new Date(recibido).toLocaleDateString('en-CA', { timeZone: ZONA }).replaceAll('-', '')
  return `VC-${dia}-${id.slice(-6).toUpperCase()}`
}

/** «24 de septiembre de 2026, 10:32 a. m.», en hora de Colombia. */
export function fechaHoraRecibido(recibido: Date | string): string {
  return new Date(recibido).toLocaleString('es-CO', {
    dateStyle: 'long', timeStyle: 'short', timeZone: ZONA,
  })
}

const ZONA = 'America/Bogota'
