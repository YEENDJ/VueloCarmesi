import { z } from 'zod'
import { TELEFONO_REGEX, fechaMinima } from './comunes'

/**
 * Las reglas del formulario de cotización de grupos.
 *
 * Los mensajes son CLAVES del catálogo, no texto, por el mismo motivo que en
 * `lib/cart/checkout-schema.ts`: este módulo se evalúa una sola vez al cargarse
 * y no puede leer el idioma activo. Quien pinta el error lo traduce:
 *
 *   {errors.email?.message && t(errors.email.message)}
 */

/**
 * Los cinco tipos de solicitante.
 *
 * Son VALORES, no etiquetas: viajan al backend, se guardan en la columna `tipo`
 * y son por lo que se va a contar. La etiqueta que ve el visitante sale del
 * catálogo (`grupos.formulario.tipos.<valor>`) y puede traducirse sin que la
 * comparación deje de cuadrar.
 */
export const TIPOS_SOLICITANTE = [
  'colegio', 'universidad', 'empresa', 'agencia', 'otro',
] as const

export type TipoSolicitante = (typeof TIPOS_SOLICITANTE)[number]

/**
 * Las experiencias que se pueden marcar, como slugs.
 *
 * Slugs y no nombres: el nombre lo edita el panel y se traduce, el slug es la
 * URL y no cambia sin una redirección de por medio (`lib/slugs-legados.ts`).
 * `a-medida` no es una experiencia del catálogo — es la opción de quien quiere
 * algo que todavía no existe, y es la que más vende en este segmento.
 */
export const EXPERIENCIAS_COTIZABLES = [
  'experiencia-cacaotera',
  'avistamiento-de-aves',
  'experiencia-aves-cacao',
  'chocoterapia',
  'a-medida',
] as const

/** Mismo tope que el DTO del backend. */
export const MAX_PERSONAS = 500

// El calendario de grupos usa el mismo mínimo que el de reserva. Se reexporta
// para que el formulario siga importando todo de su propio esquema.
export { fechaMinima }

export const solicitudGrupoSchema = z.object({
  tipo: z.enum(TIPOS_SOLICITANTE),
  institucion: z.string().trim().min(3, 'errorInstitucion').max(140, 'errorInstitucion'),
  contacto: z.string().trim().min(2, 'errorContacto').max(100, 'errorContacto'),
  cargo: z.string().trim().max(100, 'errorCargo').optional().or(z.literal('')),
  email: z.string().trim().email('errorEmail').max(255, 'errorEmail'),
  telefono: z.string().trim().regex(TELEFONO_REGEX, 'errorTelefono'),

  // Sin tope por capacidad de experiencia: es justamente el motivo de que esta
  // página exista. El formulario de reserva corta en 12 y este comprador llega
  // con 40, así que acá el único límite es el del absurdo.
  // `z.number()` y no `z.coerce.number()`: la coerción deja el tipo de ENTRADA
  // del esquema en `unknown` mientras el de salida es `number`, y ahí
  // `useForm` deja de tipar. La conversión la hace react-hook-form en el
  // registro del campo, con `valueAsNumber`, que además convierte el vacío en
  // NaN y eso ya lo rechaza esta regla con el mensaje correcto.
  personas: z
    .number({ message: 'errorPersonas' })
    .int('errorPersonas')
    .min(1, 'errorPersonas')
    .max(MAX_PERSONAS, 'errorPersonasMax'),

  edades: z.string().trim().max(60, 'errorEdades').optional().or(z.literal('')),

  // Opcional a propósito: la fecha depende de una aprobación que el coordinador
  // todavía no tiene. Exigírsela lo obliga a inventarla o a irse.
  fechaTentativa: z
    .string()
    .refine(v => !v || v >= fechaMinima(), 'errorFecha')
    .optional()
    .or(z.literal('')),

  experiencias: z.array(z.enum(EXPERIENCIAS_COTIZABLES)).optional(),
  requiereFactura: z.boolean().optional(),
  nit: z.string().trim().max(40, 'errorNit').optional().or(z.literal('')),
  mensaje: z.string().trim().max(1000, 'errorMensaje').optional().or(z.literal('')),

  // Honeypot: los humanos nunca lo llenan. Mismo patrón que el backend.
  website: z.string().optional(),
})

export type SolicitudGrupoFormValues = z.infer<typeof solicitudGrupoSchema>
