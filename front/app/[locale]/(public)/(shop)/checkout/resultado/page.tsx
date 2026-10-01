import { setRequestLocale } from 'next-intl/server'
import ResultadoPago from '@/components/pagos/ResultadoPago'

/**
 * A donde vuelve el comprador desde la pasarela. El `noindex` lo pone el
 * layout de /checkout, que cubre también esta ruta.
 *
 * Página de servidor solo para leer `?ref=` con la prop `searchParams`: así el
 * componente cliente no necesita `useSearchParams` ni un Suspense alrededor.
 */
export default async function ResultadoCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ ref?: string | string[] }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const { ref } = await searchParams

  return <ResultadoPago tipo="pedido" referencia={typeof ref === 'string' ? ref : null} />
}
