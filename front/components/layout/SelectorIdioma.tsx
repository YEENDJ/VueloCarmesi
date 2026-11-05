'use client'
import { useLocale } from 'next-intl'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Globe } from 'lucide-react'
import { usePathname } from '@/lib/i18n/navigation'
import { IDIOMAS, ETIQUETA_IDIOMA, type Idioma } from '@/lib/i18n/routing'
import { useSlugsIdioma } from '@/lib/i18n/slugs-store'
import { destinoIdioma, recordarIdioma } from '@/lib/i18n/destino-idioma'

/**
 * Cambia de idioma conservando la página en la que está el visitante.
 *
 * Muestra el idioma al que se VA, no los dos. Con dos idiomas, enseñar ambos
 * obliga a marcar cuál está activo y a ocupar el doble de ancho para decir algo
 * que la página ya dice por sí misma: si está leyéndola en español, ya sabe que
 * está en español. Lo único que necesita es la salida.
 *
 * No manda al inicio: quien está leyendo una ficha y pulsa el botón quiere esa
 * misma ficha en el otro idioma.
 *
 * Usa `next/link` y no el Link de next-intl, que es la excepción a la regla de
 * lib/i18n/navigation.ts: con la prop `locale`, aquel escribe /es/aviturismo, una
 * URL que redirige y que los rastreadores encontraban en cada página en inglés.
 * Aquí el href ya viene resuelto y la cookie se actualiza al usarlo. El
 * `prefetch={false}` no se puede quitar: precargar la URL española con la cookie
 * en inglés guardaría en caché la redirección de vuelta a /en.
 */
export default function SelectorIdioma() {
  const actual = useLocale() as Idioma
  const pathname = usePathname()
  const params = useParams()
  // Los publica la página de detalle; en el resto del sitio es null.
  const slugs = useSlugsIdioma()

  // Con dos idiomas «el otro» es una resta. Si algún día hay un tercero, esto
  // es lo único que hay que repensar: el botón único deja de tener sentido y
  // toca volver a un desplegable.
  const otro = IDIOMAS.find(i => i !== actual) ?? actual
  const destino = destinoIdioma({ pathname, params, slugs, idioma: otro })

  const contenido = (
    <>
      <Globe size={16} strokeWidth={2} aria-hidden="true" />
      <span aria-hidden="true">{otro.toUpperCase()}</span>
    </>
  )

  // Ocupa el mismo sitio mientras la ficha publica sus slugs, para que el
  // navbar no salte al hidratarse.
  if (destino === null) {
    return (
      <span className="selector-idioma" aria-hidden="true">
        {contenido}
      </span>
    )
  }

  return (
    <NextLink
      href={destino}
      prefetch={false}
      hrefLang={otro}
      // También con la rueda y el menú contextual: abrir en otra pestaña pasa
      // igual por el middleware, y sin la cookie rebotaría al idioma actual.
      onClick={() => recordarIdioma(otro)}
      onAuxClick={() => recordarIdioma(otro)}
      onContextMenu={() => recordarIdioma(otro)}
      className="selector-idioma"
      // El nombre del idioma va escrito EN ese idioma y con `lang` puesto, que
      // es lo que permite a un lector de pantalla pronunciarlo bien y a quien
      // no lee español entender el botón. Sin `lang`, un lector en castellano
      // leería «English» como si fuera una palabra española.
      lang={otro}
      aria-label={ETIQUETA_IDIOMA[otro]}
      title={ETIQUETA_IDIOMA[otro]}
    >
      {contenido}
    </NextLink>
  )
}
