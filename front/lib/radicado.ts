/**
 * El número de radicado de un mensaje de contacto: `VC-20260924-4F7K2Q`.
 *
 * La Ley 2439 de 2024 pide que cada reclamo tenga un registro con fecha, hora y
 * forma de seguimiento. Se deriva de lo que responde `POST /contacto` —el id y
 * la fecha de recepción—: el día en hora de Colombia y el final del id.
 *
 * Gemelo de `radicado` en back/src/notificaciones/radicado.util.ts, que es el
 * que sale en el correo de acuse. Tienen que dar el mismo número: si cambia
 * uno, cambia el otro.
 */
export function radicado(id: string, recibido: Date | string): string {
  const dia = new Date(recibido)
    .toLocaleDateString('en-CA', { timeZone: ZONA_RADICADO })
    .replaceAll('-', '')
  return `VC-${dia}-${id.slice(-6).toUpperCase()}`
}

/** La fecha y la hora del radicado se muestran en hora de Colombia. */
export const ZONA_RADICADO = 'America/Bogota'
