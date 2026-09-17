import { z } from 'zod'

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
export const checkoutSchema = z.object({
  nombre: z.string().trim().min(2, 'errorNombre'),
  email: z.string().trim().email('errorEmail'),
  telefono: z.string().trim().min(7, 'errorTelefono'),
  direccion: z.string().trim().min(5, 'errorDireccion'),
  ciudad: z.string().trim().min(2, 'errorCiudad'),
  codigoPostal: z.string().trim().min(3, 'errorCodigoPostal'),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
