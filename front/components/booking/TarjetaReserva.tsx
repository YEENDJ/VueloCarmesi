import { useLocale, useTranslations } from 'next-intl'
import { Check, Clock, Users } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import IconoWhatsapp from '@/components/ui/IconoWhatsapp'
import Button from '@/components/ui/Button'
import { formatPrecio } from '@/lib/format'
import { whatsappCon } from '@/lib/contacto'

interface Props {
  nombre: string
  duracion: string
  capacidad: number
  precio: number
  slug: string
  /** Lo que incluye el cupo. Vacío = no se muestra el bloque. */
  incluye?: string[]
  /** Porcentaje que se paga al reservar. Null = el sitio no cobra en línea. */
  porcentajeAbono?: number | null
  /** Resumen de la política, de Configuración. Vacío = no se muestra la línea. */
  avisoCancelacion?: string
  /** Teléfono de contacto, de Configuración. Vacío = no se muestra la línea. */
  whatsapp?: string
}

/**
 * Todo lo necesario para decidir, junto: cuánto cuesta, qué entra, cuánto se
 * paga hoy y qué pasa si hay que cancelar. En escritorio acompaña el scroll,
 * para que reservar quede siempre a un clic por largo que sea el relato.
 *
 * «Incluye» sale completo y solo aquí. Antes asomaban tres junto al precio y la
 * lista entera volvía a salir miles de píxeles más abajo.
 */
export default function TarjetaReserva({
  nombre, duracion, capacidad, precio, slug,
  incluye = [], porcentajeAbono, avisoCancelacion, whatsapp,
}: Props) {
  const idioma = useLocale()
  const t = useTranslations('reserva')
  const tw = useTranslations('whatsapp')

  // El texto llega escrito y nombra la experiencia, para que el visitante no
  // tenga que explicar de qué escribe.
  const enlaceWhatsapp = (whatsapp ?? '').replace(/\D/g, '')
    ? whatsappCon(tw('experiencia', { nombre }), whatsapp)
    : ''

  return (
    <>
      <div className="ficha-exp-precio-card">
        <div className="ficha-exp-precio-fila">
          <span className="ficha-exp-precio">{formatPrecio(precio, idioma)}</span>
          <span className="ficha-exp-precio-nota">{t('porPersona')}</span>
        </div>

        <div className="ficha-exp-pills">
          <span className="ficha-exp-pill">
            <Clock size={18} strokeWidth={1.85} color="var(--color-orange)" aria-hidden="true" style={{ flexShrink: 0 }} />
            {duracion}
          </span>
          <span className="ficha-exp-pill">
            <Users size={18} strokeWidth={1.85} color="var(--color-orange)" aria-hidden="true" style={{ flexShrink: 0 }} />
            {t('hastaPersonas', { n: capacidad })}
          </span>
        </div>

        {incluye.length > 0 && (
          <div>
            <h2 className="ficha-exp-incluye-titulo">{t('incluidoEnTuCupo')}</h2>
            <ul className="ficha-exp-incluye">
              {incluye.map(item => (
                <li key={item}>
                  <Check
                    size={16} strokeWidth={2.4} color="var(--color-orange)" aria-hidden="true"
                    style={{ flexShrink: 0, marginTop: '4px' }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* La barra fija de móvil se aparta mientras este botón se ve. */}
        <div data-cta-reserva>
          <Button
            href={{ pathname: '/reservar/[slug]', params: { slug } }}
            style={{
              display: 'block', width: '100%', textAlign: 'center', borderRadius: '8px',
              padding: '15px', fontSize: '17px', minHeight: '44px',
            }}
          >
            {t('reservarAhora')}
          </Button>
        </div>

        {/* Las dos dudas que aparecen justo al decidir: cuánto se paga hoy y si
            se puede cancelar. Hasta ahora el abono solo se veía en /reservar. */}
        {porcentajeAbono != null && (
          <p className="ficha-exp-nota">{t('pago.lateral', { porcentaje: porcentajeAbono })}</p>
        )}
        {avisoCancelacion && (
          <p className="ficha-exp-nota">
            {avisoCancelacion}{' '}
            <Link href="/politicas/cancelacion" className="ficha-exp-nota-enlace">
              {t('verPolitica')}
            </Link>
          </p>
        )}
      </div>

      {/* Fuera de la tarjeta: no es una alternativa a reservar, sino la salida
          de quien no reserva porque le falta un dato. */}
      {enlaceWhatsapp && (
        <div className="ficha-exp-contacto">
          <p>{t('dudas')}</p>
          <a href={enlaceWhatsapp} target="_blank" rel="noopener noreferrer">
            <IconoWhatsapp size={18} />
            <span>{t('escribenosWhatsapp')}</span>
          </a>
        </div>
      )}
    </>
  )
}
