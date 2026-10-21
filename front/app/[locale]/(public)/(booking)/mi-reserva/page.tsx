import { setRequestLocale } from 'next-intl/server'
import ConsultaPedido from '@/components/shop/ConsultaPedido'

/** «Consulta tu reserva» con código y correo: el mismo formulario de «mi pedido». */
export default async function ConsultaReservaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ConsultaPedido tipo="reserva" />
}
