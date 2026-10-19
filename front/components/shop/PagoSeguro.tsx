'use client'
import { useTranslations } from 'next-intl'
import { CreditCard, Lock } from 'lucide-react'
import { ACEPTA_TARJETAS, MEDIOS_PAGO, WOMPI } from '@/lib/medios-pago'

/**
 * La línea de confianza bajo «Ir a pagar», en el carrito y el mini-carrito:
 * «Pago seguro con [Wompi]» y debajo los medios aceptados.
 *
 * Los logos y qué se muestra se configuran en lib/medios-pago.ts; aquí solo
 * se pintan. Sin logos cargados vuelve al texto con los medios escritos.
 */
export default function PagoSeguro() {
  const t = useTranslations('tienda.carrito')
  const conLogos = MEDIOS_PAGO.length > 0

  if (!conLogos) {
    return (
      <div className="cart-pago-seguro">
        <p className="cart-pago-seguro-texto">
          <Lock size={14} strokeWidth={2.4} aria-hidden="true" />
          <span>{t('pagoSeguro')}</span>
        </p>
      </div>
    )
  }

  return (
    <div className="cart-pago-seguro">
      <p className="cart-pago-seguro-texto">
        <Lock size={14} strokeWidth={2.4} aria-hidden="true" />
        <span>
          {/* El logo va dentro de la frase con t.rich, no concatenado: en
              otro idioma la marca puede caer en otro sitio de la oración. */}
          {t.rich('pagoSeguroLogo', {
            wompi: () => (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="cart-pago-wompi" src={WOMPI.logo} alt={WOMPI.nombre} height={16} decoding="async" />
            ),
          })}
        </span>
      </p>
      <ul className="cart-medios-pago" aria-label={t('mediosPago')}>
        {ACEPTA_TARJETAS && (
          <li className="cart-medio-tarjeta">
            <CreditCard size={18} strokeWidth={2} aria-hidden="true" />
            <span>{t('tarjeta')}</span>
          </li>
        )}
        {MEDIOS_PAGO.map(medio => (
          <li key={medio.nombre}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={medio.logo} alt={medio.nombre} height={20} decoding="async" />
          </li>
        ))}
      </ul>
    </div>
  )
}
