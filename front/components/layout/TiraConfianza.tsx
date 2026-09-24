import CertBadge from '@/components/secciones/CertBadge'
import { useTranslations } from 'next-intl'
import { CERTIFICACIONES } from '@/lib/certificaciones'

/**
 * Tira de confianza: BPA · Calidad Turística · RNT · marca registrada.
 *
 * Es un recurso fijo de marca, no una decoración del footer: los cuatro avales
 * van siempre juntos, en el mismo orden y con el mismo pie legal que la hoja 14
 * del portafolio comercial. Está aparte del footer para poder reutilizarla tal
 * cual en el one-pager y en el tarifario B2B cuando existan.
 *
 * `sinLegal` quita el pie para que quien la use lo ponga en otro sitio: el
 * footer lo lleva en su barra legal, junto al copyright, justo debajo.
 */
export default function TiraConfianza({ sinLegal = false }: { sinLegal?: boolean }) {
  const ta = useTranslations('avales')

  return (
    <section className="tira-confianza" aria-label={ta('rotulo')}>
      <div className="tira-confianza-sellos">
        {CERTIFICACIONES.map((cert) => (
          <CertBadge key={cert.clave} cert={cert} variant="footer" />
        ))}
      </div>
      {!sinLegal && <p className="tira-confianza-legal">{ta('legal')}</p>}
    </section>
  )
}