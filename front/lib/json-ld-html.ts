/**
 * JSON listo para ir dentro de `<script type="application/ld+json">`.
 *
 * `JSON.stringify` solo no basta: no escapa `<`, así que un nombre de producto
 * o de experiencia con `</script>` —escrito en el panel o devuelto por DeepL—
 * cerraba el bloque y lo que venía después se ejecutaba en la página de cada
 * visitante. Con `<`, `>` y `&` como secuencias `\u00XX` el JSON sigue siendo
 * el mismo para quien lo lee, pero el HTML ya no ve ninguna etiqueta.
 * U+2028 y U+2029 van también: son saltos de línea para JavaScript.
 */
export function jsonLdHtml(datos: unknown): string {
  return JSON.stringify(datos)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
