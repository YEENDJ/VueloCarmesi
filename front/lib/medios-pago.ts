/**
 * Los logos de la línea «Pago seguro con Wompi» bajo «Ir a pagar» (carrito y
 * mini-carrito). Los pinta components/shop/PagoSeguro.tsx.
 *
 * Los archivos salen de los originales de cada marca con el margen
 * transparente recortado y a 80 px de alto (se muestran a ~20 px; el resto es
 * nitidez en pantallas retina). Nada más: ni recolor ni deformación, que las
 * marcas no lo permiten.
 *
 * Para agregar uno (p. ej. Visa o Mastercard, desde su brand center oficial):
 *   1. Recorta el margen y expórtalo a 80 px de alto en
 *      front/public/images/pagos/ (sharp: trim() y resize({ height: 80 })).
 *   2. Agrega una línea a MEDIOS_PAGO con el nombre de la marca (es el alt).
 *   3. Si son las tarjetas, pon ACEPTA_TARJETAS en false: sus logos ya dicen
 *      lo que dice el ícono genérico.
 *
 * Solo medios ACTIVOS en la cuenta de Wompi: mostrar uno que no se acepta
 * frustra al cliente justo en el paso de pagar.
 */

/** La pasarela: va dentro de la frase, no en la fila de medios. */
export const WOMPI = { nombre: 'Wompi', logo: '/images/pagos/wompi.webp' }

export const MEDIOS_PAGO: { nombre: string; logo: string }[] = [
  { nombre: 'Nequi', logo: '/images/pagos/nequi.webp' },
  { nombre: 'PSE', logo: '/images/pagos/pse.webp' },
]

/**
 * Ícono genérico de tarjeta con el rótulo «Tarjeta», mientras no estén los
 * logos oficiales de Visa y Mastercard. Sin él la fila callaría que se acepta
 * tarjeta, que es el medio más usado.
 */
export const ACEPTA_TARJETAS = true
