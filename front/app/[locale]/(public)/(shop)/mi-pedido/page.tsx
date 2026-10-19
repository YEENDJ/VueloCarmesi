import { setRequestLocale } from 'next-intl/server'
import ConsultaPedido from '@/components/shop/ConsultaPedido'

/** «Consulta tu pedido» con código y correo. */
export default async function ConsultaPedidoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ConsultaPedido />
}
