import { useTranslations } from 'next-intl'
import { Users } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'

/**
 * Enlace de ida hacia /grupos, para las páginas donde hoy cae ese visitante.
 *
 * Es el componente de mayor rendimiento de toda la entrega y el más barato: el
 * tráfico institucional ya está llegando —a `/contacto`, al listado y al
 * formulario de reserva—, solo que ahí no encuentra ni capacidad, ni tarifa de
 * grupo, ni logística de bus, y se va. Esto lo redirige a la página que sí lo
 * resuelve.
 *
 * Mismo molde que `AvisoAviturismo`, a propósito: la caja entera es el enlace,
 * así que en móvil el área táctil es la fila completa en vez de una píldora, y
 * el ancla que lee el buscador es el título, que lleva la palabra.
 */
export default function AvisoGrupos({
  variante,
}: {
  /** Dónde se está pintando: sólo cambia el margen, no la caja. */
  variante: 'listado' | 'contacto'
}) {
  const t = useTranslations('grupos.aviso')

  return (
    <div className={`aviso-grp-marco aviso-grp-marco--${variante}`}>
      <Link href="/grupos" className="aviso-grp">
        <span className="aviso-grp-icono" aria-hidden="true">
          <Users size={22} strokeWidth={1.85} color="var(--color-orange)" />
        </span>
        <span className="aviso-grp-texto">
          <span className="aviso-grp-titulo">{t('titulo')}</span>
          <span className="aviso-grp-linea">{t('texto')}</span>
        </span>
        {/* <span> y no otro <a>: un enlace dentro de otro no es HTML válido. */}
        <span className="aviso-grp-cta">{t('cta')}</span>
      </Link>
    </div>
  )
}
