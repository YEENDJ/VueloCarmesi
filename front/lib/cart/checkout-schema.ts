import { z } from 'zod'

export const checkoutSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingresá tu nombre completo'),
  email: z.string().trim().email('Ingresá un email válido'),
  telefono: z.string().trim().min(7, 'Ingresá un teléfono válido'),
  direccion: z.string().trim().min(5, 'Ingresá tu dirección'),
  ciudad: z.string().trim().min(2, 'Ingresá tu ciudad'),
  codigoPostal: z.string().trim().min(3, 'Ingresá tu código postal'),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
