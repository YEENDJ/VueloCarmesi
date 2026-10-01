import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import ResultadoPago from '@/components/pagos/ResultadoPago'

/**
 * A donde vuelve quien pagó el abono de una reserva desde la pasarela.
 *
 * Fuera del índice por lo mismo que /reservar/confirmacion: solo tiene sentido
 * con un pago recién hecho detrás.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default async function ResultadoReservaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ ref?: string | string[] }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const { ref } = await searchParams

  return <ResultadoPago tipo="reserva" referencia={typeof ref === 'string' ? ref : null} />
}
