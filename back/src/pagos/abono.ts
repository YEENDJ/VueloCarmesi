/** Clave de SiteConfig con el porcentaje de la reserva que se cobra en línea. */
export const CLAVE_ABONO = 'reservas_abono_porcentaje'

/** El que rige si la clave falta o no sirve. Es el de las políticas publicadas. */
export const ABONO_POR_DEFECTO = 30

/**
 * Si un texto es un porcentaje de abono aceptable: entero de 1 a 100, sin
 * símbolo. «30%» o «treinta» no, porque guardados a ciegas harían que la
 * reserva cobrara cero.
 */
export function porcentajeAbonoValido(valor: string): boolean {
  if (!/^\d{1,3}$/.test(valor.trim())) return false
  const n = Number(valor)
  return n >= 1 && n <= 100
}

/**
 * El porcentaje a aplicar, con respaldo. Nunca devuelve algo fuera de 1–100:
 * una fila editada a mano en la base no puede hacer que se cobre 0 ni más del
 * total.
 */
export function leerPorcentajeAbono(valor: string | null | undefined): { porcentaje: number; valido: boolean } {
  if (valor != null && porcentajeAbonoValido(valor)) {
    return { porcentaje: Number(valor), valido: true }
  }
  return { porcentaje: ABONO_POR_DEFECTO, valido: valor == null || valor.trim() === '' }
}

/** Lo que se cobra hoy, en pesos enteros. El saldo es `total - abono`, exacto. */
export function calcularAbono(total: number, porcentaje: number): number {
  return Math.round((total * porcentaje) / 100)
}
