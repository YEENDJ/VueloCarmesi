import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import { getPathname } from '@/lib/i18n/navigation'
import { etiquetaDeIdioma, ID_NEGOCIO, ID_SITIO } from '@/lib/jsonld'
import { SITIO } from '@/lib/sitio'
import ContactoContenido from '@/components/contacto/ContactoContenido'
import { jsonLdHtml } from '@/lib/json-ld-html'

/**
 * /contacto era un componente cliente de cabo a rabo —lleva formulario— y por
 * eso no declaraba metadatos: "use client" y `generateMetadata` no conviven en
 * el mismo archivo. El resultado es que la página salía con el título genérico
 * del layout y sin canónica ni hreflang, así que /contacto y /en/contact nunca
 * se declararon como la misma página en dos lenguas.
 *
 * La solución es la que ya usa /tienda con TiendaGrid: la página se queda en el
 * servidor y solo monta el cuerpo interactivo.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contacto' })
  return {
    // Sin la marca: la añade el title.template del layout de idioma.
    title: t('metaTitulo'),
    description: t('metaDescripcion'),
    alternates: alternatesDeIdioma('/contacto', locale),
  }
}

/**
 * Datos estructurados de la página.
 *
 * Solo el nodo de página: el negocio —nombre, dirección, teléfono, redes— ya lo
 * sirve el layout de idioma en todas las URLs, y volver a describirlo aquí
 * crearía una segunda entidad compitiendo con la primera justo en la página que
 * más peso tiene en las búsquedas locales de marca. Lo que hace `ContactPage`
 * es señalarlo por `@id`: «de lo que va esta página es de aquel negocio».
 *
 * `ContactPage` y no `WebPage` a secas porque el tipo es en sí la señal: le
 * dice al buscador cuál de las doce URLs del sitio es la que lleva los datos de
 * contacto, que es la pregunta que trae aquí a la mitad del tráfico.
 *
 * El `@id` del nodo lleva la URL localizada: /contacto y /en/contact son dos
 * páginas: el negocio al que apuntan las dos es uno solo.
 */
const jsonLd = (t: (k: string) => string, locale: string, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  '@id': url,
  url,
  name: t('h1'),
  description: t('metaDescripcion'),
  inLanguage: etiquetaDeIdioma(locale),
  isPartOf: { '@id': ID_SITIO },
  about: { '@id': ID_NEGOCIO },
  mainEntity: { '@id': ID_NEGOCIO },
})

export default async function ContactoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Sin esto, leer traducciones marca la página como dinámica y se pierde el
  // prerrenderizado que pidió generateStaticParams en el layout de idioma.
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'contacto' })

  // La misma fuente que la canónica: `getPathname` sabe que en inglés esta ruta
  // es /en/contact, así que el JSON-LD no puede quedarse declarando la española
  // en las dos lenguas.
  const url = `${SITIO}${getPathname({ href: '/contacto', locale })}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd(t, locale, url)) }}
      />
      <ContactoContenido />
    </>
  )
}
