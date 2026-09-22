import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { routing, IDIOMAS } from '@/lib/i18n/routing'
import { grafoDelSitio } from '@/lib/jsonld'
import { SITIO } from '@/lib/sitio'

/** Prerrenderiza las dos ramas de idioma en el build en vez de bajo demanda. */
export function generateStaticParams() {
  return IDIOMAS.map(locale => ({ locale }))
}

/**
 * Los metadatos que faltaban en todo el sitio.
 *
 * Hasta ahora la raíz solo declaraba un título fijo, así que cada página
 * heredaba «Vuelo Carmesí» a secas y compartir la portada por WhatsApp no
 * mostraba ni descripción ni imagen. `metadataBase` es además lo que permite
 * que las rutas relativas de las páginas hijas salgan absolutas, que es como
 * las quieren Open Graph y el hreflang.
 *
 * `title.template` deja que cada página escriba solo su nombre y reciba el de
 * la marca detrás, sin repetirlo a mano en veinte archivos.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sitio' })

  return {
    metadataBase: new URL(SITIO),
    title: {
      default: t('titulo'),
      template: `%s · ${t('titulo')}`,
    },
    description: t('descripcion'),
    // Aquí NO van los `alternates`. Declarados en el layout valdrían lo mismo
    // para todas las páginas de debajo, y /en/experiences acabaría diciendo que
    // su versión española es la portada. Los pone cada página con
    // alternatesDeIdioma(), que sí sabe en qué ruta está.
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // El segmento es texto libre en la URL: sin esta comprobación, /xx/ intentaría
  // cargar messages/xx.json y reventaría el render con un error de módulo.
  if (!hasLocale(routing.locales, locale)) notFound()

  // Habilita el render estático de las páginas hijas. Sin esta llamada, leer
  // las traducciones marca todo el árbol como dinámico y se pierde el
  // prerrenderizado que generateStaticParams acaba de pedir.
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'sitio' })

  // El grafo va en el layout y no en la portada porque declara quién es el
  // negocio, no de qué trata una página: servido en todas, cualquier URL por la
  // que entre el buscador —una ficha de la tienda, una política— trae consigo
  // la entidad y suma a la misma en vez de aparecer huérfana.
  const grafo = grafoDelSitio({ nombre: t('titulo'), descripcion: t('descripcion') })

  return (
    <html lang={locale}>
      <head>
        {/* Las dos familias que se ven sin hacer scroll: Playfair en el <h1>
            del hero y Bellota en todo lo demás. Declaradas con @font-face en
            styles/tokens.css, el navegador no se entera de que existen hasta
            que termina de leer la hoja de estilos, así que la petición sale
            tarde y el texto pasa por el hueco en blanco de `font-display:
            swap`. Este par de enlaces las pide a la vez que el CSS.

            `crossOrigin` no es opcional aunque el archivo sea del mismo
            origen: las fuentes se piden siempre en modo CORS, y un preload sin
            el atributo no casa con esa petición —se descarga dos veces y la
            consola avisa—.

            Solo estas dos. Peso-Bellota.woff2 son 2,3 KB para el símbolo de
            los precios, que no están arriba del todo, y precargarlo solo
            quitaría ancho de banda a las que sí. */}
        <link
          rel="preload"
          href="/fonts/PlayfairDisplay-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Bellota-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(grafo) }}
        />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
