import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { routing, IDIOMAS } from '@/lib/i18n/routing'
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

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
