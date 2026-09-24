import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

/**
 * Advertencia sobre la explotación sexual comercial de niños, niñas y
 * adolescentes (ESCNNA).
 *
 * El art. 17 de la Ley 679 de 2001 obliga al prestador turístico a informar
 * las consecuencias legales en su publicidad, y la Resolución 3840 de 2009
 * (numeral 10) a informarlas a sus usuarios. La ley no fija el lugar ni el
 * texto, así que va donde se ofrecen los servicios: el listado y las fichas
 * de experiencias, el formulario de reserva, /grupos y /aviturismo. No va en
 * el pie a propósito, y tampoco basta con la página de /politicas, que es
 * donde menos se lee.
 *
 * Solo texto y un enlace: sin anchos fijos, envuelve a cualquier ancho.
 */
export default function AvisoEscnna() {
  const t = useTranslations('escnna')

  return (
    <p
      style={{
        maxWidth: '760px',
        margin: '32px auto 0',
        fontSize: '13px',
        lineHeight: 1.6,
        textAlign: 'center',
        color: 'var(--color-brown)',
        opacity: 0.8,
        overflowWrap: 'anywhere',
      }}
    >
      {t.rich('aviso', {
        politica: (texto) => (
          <Link
            href="/politicas/proteccion-infancia"
            style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px' }}
          >
            {texto}
          </Link>
        ),
      })}
    </p>
  )
}
