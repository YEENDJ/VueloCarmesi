import { z } from 'zod'
import { TELEFONO_REGEX, fechaMinima, fechaMaximaReserva } from './comunes'

/**
 * Las reglas del formulario de reserva, espejo de `create-reserva.dto.ts`.
 *
 * Los mensajes son CLAVES de `reserva.campos`, no texto, por el mismo motivo
 * que en `solicitud-grupo.ts`: el esquema no puede leer el idioma activo.
 *
 * Es una función y no una constante porque el tope de personas depende de la
 * experiencia: 12 en una, 8 en otra.
 */
export const MAX_NOTAS = 500

export function reservaSchema(capacidad: number) {
  return z.object({
    // Mínimo 2: «Li» o «Bo» son nombres reales.
    nombre: z.string().trim().min(2, 'errorNombre').max(100, 'errorNombre'),
    telefono: z.string().trim().regex(TELEFONO_REGEX, 'errorTelefono'),
    email: z.string().trim().email('errorEmail').max(255, 'errorEmail'),
    fecha: z
      .string()
      .min(1, 'errorFechaVacia')
      .refine(v => v >= fechaMinima() && v <= fechaMaximaReserva(), 'errorFecha'),
    // Llega del <select> como texto; `valueAsNumber` lo convierte al registrar.
    cantidadPersonas: z
      .number({ message: 'errorPersonas' })
      .int('errorPersonas')
      .min(1, 'errorPersonas')
      .max(capacidad, 'errorPersonas'),
    notas: z.string().trim().max(MAX_NOTAS, 'errorNotas').optional().or(z.literal('')),
    // Honeypot: los humanos nunca lo llenan.
    website: z.string().optional(),
  })
}

export type ReservaFormValues = z.infer<ReturnType<typeof reservaSchema>>
