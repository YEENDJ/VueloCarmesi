/**
 * El ÚNICO formato de moneda del proyecto: `$160.000`.
 *
 * La regla es corta: **siempre `$`, nunca otra cosa**. Sin espacio detrás del
 * símbolo, sin sufijo `COP`, sin `Co$`, sin `USD`, y con `es-CO` para que el
 * separador de miles sea el punto y no la coma. El sitio vende en un solo país
 * y en una sola moneda; escribirla de tres formas distintas no aclara nada y
 * hace que la misma cifra parezca dos precios diferentes.
 *
 * Todo importe que se le muestre a alguien pasa por aquí. Si te encuentras
 * escribiendo `${'$'}${n.toLocaleString(...)}` a mano en un componente, eso es
 * esta función: úsala. Se hacía a mano en nueve sitios y uno de ellos había
 * quedado en `es-AR`.
 *
 * El backend tiene su gemelo en
 * `back/src/notificaciones/format-items-pedido.util.ts`, porque los correos y
 * los avisos de Telegram no pueden importar del front. Si cambias uno, cambia
 * el otro: un pedido tiene que leerse igual en la web que en el correo.
 */
export function formatPrecio(n: number): string {
  return `$${n.toLocaleString('es-CO')}`
}
