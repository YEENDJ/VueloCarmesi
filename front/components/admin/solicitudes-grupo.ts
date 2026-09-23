import es from '@/messages/es.json'

/**
 * Nombres legibles de lo que guarda una solicitud de grupo.
 *
 * Salen del mismo catálogo que pinta el formulario público, en español porque
 * el panel está en español: así el administrador lee cada opción con las
 * palabras exactas que marcó el coordinador, y si alguien cambia el texto del
 * formulario el panel lo sigue sin tocar nada aquí.
 */
const TIPOS: Record<string, string> = es.grupos.formulario.tipos
const EXPERIENCIAS: Record<string, string> = es.grupos.formulario.experiencias

export const nombreTipo = (tipo: string) => TIPOS[tipo] ?? tipo
export const nombreExperiencia = (slug: string) => EXPERIENCIAS[slug] ?? slug

/**
 * La fecha tentativa, en letras. Llega como medianoche UTC del día elegido; sin
 * `timeZone: 'UTC'` un navegador en Colombia la pintaría un día antes.
 */
export const fechaDia = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })

/** Días enteros desde que entró la solicitud. */
export const diasDesde = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)

export function haceCuanto(iso: string): string {
  const dias = diasDesde(iso)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  return `hace ${dias} días`
}

/**
 * Una solicitud nueva sin atender a partir de este punto se marca como
 * atrasada. Un día y no más: una cotización institucional se gana
 * respondiendo el mismo día, y al segundo el coordinador ya le escribió a otro.
 */
export const DIAS_ATRASO = 1
