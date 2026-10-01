/**
 * Cuándo cobra el sitio en línea y con qué tiempos.
 *
 * Diseño y casos de fallo en docs/superpowers/specs/2026-09-25-pasarela-pagos-design.md.
 */

/** Cuánto se aparta el stock (o el cupo) esperando un pago aprobado. */
export const MINUTOS_APARTADO = 30

/**
 * Tope para un pago que la pasarela reporta en curso. PSE y Nequi pueden
 * tardar minutos en confirmar, y mientras tanto el pedido no vence; pasado este
 * tope se da por perdido y el pedido vence igual.
 */
export const HORAS_TOPE_PENDIENTE = 24

/** Antigüedad a partir de la cual la conciliación le pregunta a la pasarela. */
export const MINUTOS_ANTES_DE_CONCILIAR = 10

/**
 * Hasta dónde mira atrás la conciliación. Incluye los `expirado` recientes:
 * alguien que se quedó en la página de la pasarela puede pagar después de que
 * el pedido venció, y si ese webhook se pierde, esta es la única forma de
 * enterarse (caso 5 del spec).
 */
export const HORAS_VENTANA_CONCILIACION = 48

export function venceEnDesde(ahora: Date): Date {
  return new Date(ahora.getTime() + MINUTOS_APARTADO * 60_000)
}
