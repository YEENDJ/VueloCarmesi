import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

/**
 * El aviso de autorización que va junto al botón de envío de cada formulario
 * público.
 *
 * La Ley 1581 de 2012 pide que la autorización sea previa, expresa e
 * informada. La política existe desde que se publicó
 * /politicas/datos-personales, pero informada solo lo es si el visitante puede
 * llegar a ella EN EL MOMENTO en que entrega el dato: un enlace en el pie, a
 * tres clics del formulario, no cumple esa parte.
 *
 * Va como componente y no copiado cuatro veces porque los cuatro formularios
 * —contacto, reserva, grupos y checkout— tienen que decir lo mismo. Si el
 * texto cambia, cambia en un solo sitio.
 *
 * El checkout no lo usa: allí el aviso menciona además las condiciones de
 * venta, porque en ese formulario se acepta una compra y no solo el uso de los
 * datos. Es el único caso en que la frase legítimamente difiere.
 */
export default function AvisoDatos() {
  const t = useTranslations('formularios')

  return (
    <p className="aviso-datos">
      {t.rich('avisoDatos', {
        datos: texto => <Link href="/politicas/datos-personales">{texto}</Link>,
      })}
    </p>
  )
}
