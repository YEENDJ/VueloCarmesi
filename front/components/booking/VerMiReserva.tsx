'use client'
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import { useUltimaReserva } from '@/lib/booking/ultima-reserva'

/**
 * «Ver mi reserva» con la llave que el formulario guardó al reservar. Sin ella
 * (otro navegador, almacenamiento bloqueado) no se pinta: el correo trae el
 * mismo enlace.
 *
 * Con `codigo`, solo si la guardada es esa reserva: el resultado de un pago
 * puede ser de otra reserva hecha antes en este navegador.
 */
export default function VerMiReserva({ codigo, variant = 'primary' }: { codigo?: string; variant?: 'primary' | 'outline' }) {
  const t = useTranslations('miReserva')
  // En el servidor y en la primera pintura es nula, así que no hay desajuste de hidratación.
  const ultima = useUltimaReserva()

  if (!ultima || (codigo && ultima.codigo !== codigo)) return null
  return (
    <Button href={{ pathname: '/mi-reserva/[token]', params: { token: ultima.token } }} variant={variant} style={{ minHeight: 44 }}>
      {t('consultar')}
    </Button>
  )
}
