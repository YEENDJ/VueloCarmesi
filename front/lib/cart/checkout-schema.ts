import { z } from 'zod'

export const checkoutSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingresa tu nombre completo'),
  email: z.string().trim().email('Ingresa un email válido'),
  telefono: z.string().trim().min(7, 'Ingresa un teléfono válido'),
  direccion: z.string().trim().min(5, 'Ingresa tu dirección'),
  ciudad: z.string().trim().min(2, 'Ingresa tu ciudad'),
  codigoPostal: z.string().trim().min(3, 'Ingresa tu código postal'),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
