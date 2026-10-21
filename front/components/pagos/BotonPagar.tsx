'use client'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import { useRouter } from '@/lib/i18n/navigation'
import { ErrorPago, guardarPagoPendiente, reintentarPago } from '@/lib/pagos'

/**
 * «Pagar» desde «mi pedido» y «mi reserva»: abre un intento nuevo sobre el
 * último y lleva directo a la pasarela.
 *
 * Antes enlazaba a la página de resultado del último intento. Si ese intento
 * quedó abierto sin pagar (entró a la pasarela y la cerró), esa página se
 * quedaba en «Estamos confirmando tu pago» esperando a un banco que nunca
 * tuvo la transacción, sin forma de pagar.
 *
 * Si el backend no deja abrir otro (409: el banco tiene un pago en curso, o
 * venció mientras tanto), va a la página de resultado, que sabe mostrar
 * cualquiera de los dos casos.
 */
export default function BotonPagar({
  referencia, tipo, children,
}: {
  /** El último intento de pago: de él sale el pedido o la reserva. */
  referencia: string
  tipo: 'pedido' | 'reserva'
  children: React.ReactNode
}) {
  const t = useTranslations('pagos.resultado')
  const idioma = useLocale()
  const router = useRouter()
  const [abriendo, setAbriendo] = useState(false)
  const [error, setError] = useState('')

  const pagar = async () => {
    setAbriendo(true)
    setError('')
    try {
      const intento = await reintentarPago(referencia, idioma)
      guardarPagoPendiente(intento.referencia)
      window.location.assign(intento.url)
    } catch (err) {
      if (err instanceof ErrorPago && err.status === 409) {
        router.push({
          pathname: tipo === 'pedido' ? '/checkout/resultado' : '/reservar/resultado',
          query: { ref: referencia },
        })
        return
      }
      setError(t('errorReintentar'))
      setAbriendo(false)
    }
  }

  return (
    <>
      <Button onClick={pagar} disabled={abriendo} style={{ minHeight: 48, marginTop: '1rem' }}>
        {abriendo ? t('reintentando') : children}
      </Button>
      {error && <p role="alert" className="pedido-estado-texto" style={{ marginTop: '0.75rem' }}>{error}</p>}
    </>
  )
}
