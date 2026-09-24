import { useTranslations, useLocale } from 'next-intl'
import { ArrowLeft } from 'lucide-react'
import { Link, getPathname } from '@/lib/i18n/navigation'
import { SITIO } from '@/lib/sitio'
import { jsonLdHtml } from '@/lib/json-ld-html'

/**
 * El enlace al padre de una página, arriba del titular.
 *
 * Es «subir», no «volver», y la diferencia no es de nombre. Una flecha de
 * volver ejecuta `history.back()` y hace cosas distintas según cómo llegaste:
 * a /grupos y /aviturismo se entra desde Google —para eso existen—, y ahí
 * `history.back()` devuelve al visitante **al buscador**, es decir, lo echa del
 * sitio. Este componente es un `<a href>` a un destino fijo, así que siempre
 * lleva al mismo sitio, funciona sin JavaScript, se abre en pestaña nueva con
 * clic derecho, muestra su destino en la barra de estado y un lector de
 * pantalla lo anuncia con ese destino en vez de un «volver» a ciegas.
 *
 * **Dónde va y dónde no.** El criterio es la profundidad, no si la página tiene
 * pestaña en el navbar. Lo lleva la página que tiene un padre DENTRO del sitio:
 * las cinco de /politicas, las fichas de experiencia y producto, y el
 * formulario de reserva. No lo llevan /grupos ni /aviturismo —que no tienen
 * pestaña, pero cuyo padre es la portada, a la que ya va el logotipo— ni las
 * pantallas de confirmación, donde la acción ya se hizo y lo que toca es
 * seguir hacia adelante.
 *
 * De paso emite el `BreadcrumbList` de schema.org, que es lo que hace que el
 * resultado de Google muestre «vuelocarmesi.com › Políticas › Cancelación» en
 * vez de la URL cruda. Un botón de JavaScript no puede dar eso.
 */

type Href = Parameters<typeof getPathname>[0]['href']

export default function MigaSuperior({
  href,
  etiqueta,
  actual,
}: {
  /** La ruta interna del padre, la española: '/politicas', '/tienda'… */
  href: Href
  /** Cómo se llama el padre, ya traducido. Es el texto del enlace. */
  etiqueta: string
  /** El nombre de esta página. Solo va en los datos estructurados. */
  actual: string
}) {
  const t = useTranslations('miga')
  const locale = useLocale()

  // Absolutas: un `item` relativo en un BreadcrumbList no le sirve de nada al
  // buscador, que necesita saber de qué URL habla cada escalón.
  const url = (h: Href) => `${SITIO}${getPathname({ href: h, locale })}`

  const datos = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('inicio'), item: url('/') },
      { '@type': 'ListItem', position: 2, name: etiqueta, item: url(href) },
      // El último escalón va sin `item` a propósito: es la página en la que ya
      // estás, y schema.org pide que no se enlace a sí misma.
      { '@type': 'ListItem', position: 3, name: actual },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(datos) }}
      />
      <nav className="miga" aria-label={t('aria')}>
        <Link href={href} className="miga-enlace">
          <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
          {/* El destino va DENTRO del enlace, no al lado: «Volver a Políticas»
              es el texto que anuncia un lector de pantalla y el que indexa el
              buscador. Un «Volver» suelto no dice a dónde. */}
          {t('volverA', { destino: etiqueta })}
        </Link>
      </nav>
    </>
  )
}
