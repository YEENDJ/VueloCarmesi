/**
 * Freno a la fuerza bruta contra el login del panel.
 *
 * El panel tiene una sola contraseña y, sin esto, el login respondía a
 * cualquier cantidad de intentos por segundo. Tras `MAX_FALLOS` fallos desde la
 * misma IP, esa IP queda fuera hasta que pasa `VENTANA_MS` desde el primero.
 * Un acierto borra el contador.
 *
 * Vive en memoria, y en Vercel eso tiene un límite que hay que saber: cada
 * instancia de la función lleva su propia cuenta y se pierde cuando se apaga.
 * No es un candado perfecto, pero pasa de millones de intentos por hora a unos
 * pocos por instancia, que con una contraseña larga es la diferencia que
 * importa. Uno compartido pediría un almacén externo (Upstash, Vercel KV).
 */

export const MAX_FALLOS = 5
export const VENTANA_MS = 15 * 60 * 1000

interface Registro {
  fallos: number
  desde: number
}

const registros = new Map<string, Registro>()

/** Milisegundos que le quedan de bloqueo a esta IP, o 0 si puede intentar. */
export function bloqueoRestante(ip: string, ahora = Date.now()): number {
  const r = registros.get(ip)
  if (!r) return 0
  if (ahora - r.desde >= VENTANA_MS) {
    registros.delete(ip)
    return 0
  }
  return r.fallos >= MAX_FALLOS ? r.desde + VENTANA_MS - ahora : 0
}

export function registrarFallo(ip: string, ahora = Date.now()): void {
  const r = registros.get(ip)
  if (!r || ahora - r.desde >= VENTANA_MS) {
    registros.set(ip, { fallos: 1, desde: ahora })
  } else {
    r.fallos++
  }
  // Que un barrido desde muchas IPs no haga crecer el mapa sin fin.
  if (registros.size > 10_000) {
    for (const [clave, reg] of registros) {
      if (ahora - reg.desde >= VENTANA_MS) registros.delete(clave)
    }
  }
}

export function limpiarFallos(ip: string): void {
  registros.delete(ip)
}

/**
 * La IP del visitante. En Vercel `x-forwarded-for` la pone la plataforma y
 * pisa la que mande el cliente, así que el primer valor es de fiar.
 */
export function ipDe(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip')
    || 'desconocida'
}
