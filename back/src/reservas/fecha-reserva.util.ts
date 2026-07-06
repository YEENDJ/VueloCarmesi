const TZ = 'America/Bogota'

export const DIAS_ANTELACION_MINIMA = 1
export const MESES_HORIZONTE_MAXIMO = 6

// 'en-CA' formatea como YYYY-MM-DD
export function hoyBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

export function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

function sumarMeses(iso: string, meses: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + meses)
  return d.toISOString().slice(0, 10)
}

export function fechaMinimaReserva(): string {
  return sumarDias(hoyBogota(), DIAS_ANTELACION_MINIMA)
}

export function fechaMaximaReserva(): string {
  return sumarMeses(hoyBogota(), MESES_HORIZONTE_MAXIMO)
}

export function fechaReservaValida(fechaIso: string): boolean {
  const dia = fechaIso.slice(0, 10)
  return dia >= fechaMinimaReserva() && dia <= fechaMaximaReserva()
}
