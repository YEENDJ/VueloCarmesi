/**
 * El ÚNICO formato de moneda del proyecto.
 *
 *   español → `$160.000`
 *   inglés  → `COP 160,000`
 *
 * La regla en español no cambia: **siempre `$`, nunca otra cosa**. Sin espacio
 * detrás del símbolo, sin sufijo, y con `es-CO` para que el separador de miles
 * sea el punto y no la coma.
 *
 * EN INGLÉS SÍ VA `COP`, Y NO ES UNA INCOHERENCIA. La regla del `$` a secas se
 * escribió cuando el sitio vendía en un solo país a un solo público: ahí el
 * símbolo no es ambiguo porque todo el mundo sabe de qué moneda se habla. Para
 * un visitante estadounidense —que es el público de /en— «$160.000» se lee como
 * ciento sesenta dólares con una puntuación rara, y son cuarenta. Es la única
 * parte del sitio donde el idioma cambia el significado de un dato, no su
 * redacción, así que se desambigua explícitamente.
 *
 * El separador también cambia: `160.000` en inglés es «ciento sesenta coma
 * cero», porque el punto es el decimal. Va `en-US`, que pone la coma.
 *
 * No se convierte a dólares a propósito. El cobro es en pesos y una cifra en
 * USD sería un importe que el visitante no va a pagar: la tasa se mueve a
 * diario y su banco añade su propio spread. Aclarar la moneda resuelve la
 * confusión sin prometer un precio que no controlamos.
 *
 * Todo importe que se le muestre a alguien pasa por aquí. Si te encuentras
 * escribiendo `${'$'}${n.toLocaleString(...)}` a mano en un componente, eso es
 * esta función: úsala.
 *
 * El backend tiene su gemelo en
 * `back/src/notificaciones/format-items-pedido.util.ts`, porque los correos y
 * los avisos de Telegram no pueden importar del front. Ese sigue solo en
 * español: los correos todavía no se envían traducidos.
 */
export function formatPrecio(n: number, idioma: string = 'es'): string {
  if (idioma === 'en') return `COP ${n.toLocaleString('en-US')}`
  return `$${n.toLocaleString('es-CO')}`
}
