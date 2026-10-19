'use client'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { useLastOrder } from '@/lib/cart/store'

/**
 * Bajo «tu carrito está vacío»: la última compra de este navegador, con
 * «Ver cómo va», y la consulta con código y correo para cualquier otra.
 *
 * Sin cuenta, el carrito vacío era un callejón: quien pagaba y volvía con el
 * botón atrás no tenía en la página ninguna pista de qué pasó con su compra.
 */
export default function UltimoPedido() {
  const t = useTranslations('tienda.carrito')
  const ultimo = useLastOrder()

  return (
    <div className="ultimo-pedido">
      {ultimo?.token && (
        <div className="ultimo-pedido-tarjeta">
          {/* El código guardado lleva «#» delante (#VC-…); aquí sobra. */}
          <span className="ultimo-pedido-codigo">{t('ultimoPedido', { codigo: ultimo.code.replace(/^#/, '') })}</span>
          <Link href={{ pathname: '/mi-pedido/[token]', params: { token: ultimo.token } }} className="checkout-editar">
            {t('verEstado')}
          </Link>
        </div>
      )}
      <p className="ultimo-pedido-buscar">
        {t.rich('buscarPedido', {
          enlace: texto => <Link href="/mi-pedido">{texto}</Link>,
        })}
      </p>
    </div>
  )
}
