import { z } from 'zod'
import { TELEFONO_REGEX } from './comunes'

/**
 * Las reglas del formulario de contacto, espejo de `create-contacto.dto.ts`.
 *
 * Los mensajes son CLAVES de `contacto`, no texto: el esquema no puede leer el
 * idioma activo. Quien pinta el error lo traduce.
 */
export const MAX_MENSAJE_CONTACTO = 2000

export const contactoSchema = z.object({
  nombre: z.string().trim().min(2, 'errorNombre').max(100, 'errorNombre'),
  email: z.string().trim().email('errorEmail').max(255, 'errorEmail'),
  // Opcional: si lo deja, se le puede contestar por WhatsApp.
  telefono: z.string().trim().regex(TELEFONO_REGEX, 'errorTelefono').optional().or(z.literal('')),
  mensaje: z.string().trim().min(1, 'errorMensaje').max(MAX_MENSAJE_CONTACTO, 'errorMensaje'),
  // Honeypot: los humanos nunca lo llenan.
  website: z.string().optional(),
})

export type ContactoFormValues = z.infer<typeof contactoSchema>
