import { setRequestLocale } from 'next-intl/server'
import EstadoPedido from '@/components/shop/EstadoPedido'

/**
 * El estado de un pedido por su token: el enlace «Ver mi pedido» del correo.
 * El token se lee aquí, en el servidor, y la página consulta el backend en el
 * cliente para mostrar siempre el estado del momento.
 */
export default async function EstadoPedidoPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>
}) {
  const { locale, token } = await params
  setRequestLocale(locale)
  return <EstadoPedido token={token} />
}
