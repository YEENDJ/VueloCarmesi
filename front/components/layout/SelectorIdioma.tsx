'use client'
import { useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import { Globe } from 'lucide-react'
import { Link, usePathname } from '@/lib/i18n/navigation'
import { IDIOMAS, ETIQUETA_IDIOMA, type Idioma } from '@/lib/i18n/routing'
import { useSlugsIdioma } from '@/lib/i18n/slugs-store'

interface Props {
  /** 'barra' para la navbar de escritorio, 'panel' para el menú desplegable. */
  variante?: 'barra' | 'panel'
}

/**
 * Cambia de idioma conservando la página en la que está el visitante.
 *
 * Muestra el idioma al que se VA, no los dos. Con dos idiomas, enseñar ambos
 * obliga a marcar cuál está activo y a ocupar el doble de ancho para decir algo
 * que la página ya dice por sí misma: si está leyéndola en español, ya sabe que
 * está en español. Lo único que necesita es la salida.
 *
 * No manda al inicio: quien está leyendo una ficha y pulsa el botón quiere esa
 * misma ficha en el otro idioma. `usePathname` de next-intl devuelve la ruta
 * *interna* —la española, la que coincide con las carpetas— y el Link con
 * `locale` la reescribe a la del idioma destino, traduciendo de paso el tramo
 * de ruta: /experiencias pasa a /en/experiences sin que este componente sepa
 * nada de ese mapeo.
 */
export default function SelectorIdioma({ variante = 'barra' }: Props) {
  const actual = useLocale() as Idioma
  const pathname = usePathname()
  const params = useParams()
  // Los publica la página de detalle; en el resto del sitio es null y el
  // destino se queda en la ruta actual, que es lo correcto.
  const slugs = useSlugsIdioma()

  // Con dos idiomas «el otro» es una resta. Si algún día hay un tercero, esto
  // es lo único que hay que repensar: el botón único deja de tener sentido y
  // toca volver a un desplegable.
  const otro = IDIOMAS.find(i => i !== actual) ?? actual
  const slugActual = typeof params?.slug === 'string' ? params.slug : null

  /**
   * El destino, en la forma que next-intl necesita para cada caso.
   *
   * Para una ruta sin parámetros basta la cadena. Para una de detalle NO sirve
   * la ruta ya resuelta: next-intl la coteja contra la plantilla declarada en
   * routing.ts —/experiencias/[slug]— y revienta con «Insufficient params
   * provided for localized pathname» porque no sabe qué poner en [slug]. Hay
   * que darle la plantilla y el parámetro por separado.
   */
  const destino = () => {
    if (!slugActual) return pathname

    const plantilla = pathname.replace(slugActual, '[slug]')
    // Si esta ficha no tiene slug traducido se reutiliza el actual: la ruta
    // sigue resolviendo porque el backend busca el slug en los dos idiomas, y
    // la propia ficha redirige luego a la canónica.
    const slug = slugs?.[otro] ?? slugActual
    return { pathname: plantilla, params: { slug } }
  }

  return (
    <Link
      // El tipado de pathnames de next-intl espera una de las rutas
      // declaradas; acá llega ya resuelta con su slug, que es justo lo que
      // hace falta para no perder la ficha al cambiar de idioma.
      href={destino() as never}
      locale={otro}
      className={`selector-idioma selector-idioma--${variante}`}
      // El nombre del idioma va escrito EN ese idioma y con `lang` puesto, que
      // es lo que permite a un lector de pantalla pronunciarlo bien y a quien
      // no lee español entender el botón. Sin `lang`, un lector en castellano
      // leería «English» como si fuera una palabra española.
      lang={otro}
      aria-label={ETIQUETA_IDIOMA[otro]}
      title={ETIQUETA_IDIOMA[otro]}
    >
      <Globe size={16} strokeWidth={2} aria-hidden="true" />
      <span aria-hidden="true">{otro.toUpperCase()}</span>
    </Link>
  )
}
