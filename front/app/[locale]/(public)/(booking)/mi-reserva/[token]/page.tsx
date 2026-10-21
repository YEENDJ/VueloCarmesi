import { setRequestLocale } from 'next-intl/server'
import EstadoReserva from '@/components/booking/EstadoReserva'

/**
 * El estado de una reserva por su token: el enlace «Valida el estado de tu
 * reserva» del correo. La página consulta el backend en el cliente para
 * mostrar siempre el estado del momento.
 */
export default async function EstadoReservaPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>
}) {
  const { locale, token } = await params
  setRequestLocale(locale)
  return <EstadoReserva token={token} />
}
