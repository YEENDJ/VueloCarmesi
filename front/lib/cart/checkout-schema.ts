import { z } from 'zod'
import { TELEFONO_REGEX } from '@/lib/schemas/comunes'

/**
 * Las reglas del formulario de pedido.
 *
 * Los mensajes son CLAVES del catálogo, no texto. Este módulo se evalúa una
 * sola vez al cargarse y no puede leer el idioma activo, así que un mensaje
 * escrito aquí saldría en español para todo el mundo —y así salía: un visitante
 * inglés que se equivocaba de correo recibía «Ingresa un email válido»—.
 *
 * Quien pinta el error lo traduce:
 *
 *   error={errors.email?.message && t(errors.email.message)}
 */
//
// Espejo de `create-pedido.dto.ts`: mismos mínimos y topes, para que nada que
// pase aquí lo rechace el backend con un mensaje que el visitante no entiende.
export const checkoutSchema = z.object({
  nombre: z.string().trim().min(2, 'errorNombre').max(100, 'errorNombre'),
  email: z.string().trim().email('errorEmail').max(255, 'errorEmail'),
  telefono: z.string().trim().regex(TELEFONO_REGEX, 'errorTelefono'),
  direccion: z.string().trim().min(5, 'errorDireccion').max(200, 'errorDireccion'),
  ciudad: z.string().trim().min(2, 'errorCiudad').max(100, 'errorCiudad'),
  codigoPostal: z.string().trim().min(3, 'errorCodigoPostal').max(20, 'errorCodigoPostal'),
  // Honeypot: los humanos nunca lo llenan. Mismo patrón que el backend.
  website: z.string().optional(),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
