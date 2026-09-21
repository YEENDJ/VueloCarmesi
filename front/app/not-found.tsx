import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { IDIOMA_POR_DEFECTO } from '@/lib/i18n/routing'

/**
 * La página 404 del sitio, y la que abre su propio <html>.
 *
 * Esto no es una decisión de diseño: es la pieza que le faltaba al layout raíz.
 * `app/layout.tsx` devuelve `children` a pelo y no monta <html> ni <body>
 * porque el sitio tiene dos ramas que abren el suyo —[locale] para el público
 * y admin para el panel—, y no puede haber dos <html> anidados.
 *
 * El problema es que la 404 no cae en ninguna de las dos ramas: Next la
 * renderiza con la raíz sola. Sin este archivo, cada 404 del sitio se servía
 * sin doctype, sin <html> y sin <body> —comprobado sobre el HTML real, no
 * deducido—, que es exactamente lo que denuncia el aviso «Missing <html> and
 * <body> tags in the root layout». El navegador lo remienda a su manera, pero
 * el documento que sale por el cable está roto y un buscador lo ve así.
 *
 * Los dos caminos que llegan hasta aquí:
 *   1. Una URL que no existe: /esta-ruta-no-existe.
 *   2. Un idioma inválido: /xx/algo. El `notFound()` de app/[locale]/layout.tsx
 *      lo lanza el propio layout, así que la excepción sube por encima de él y
 *      no la puede recoger un not-found colocado dentro de [locale]. Tiene que
 *      estar en la raíz, y por eso está aquí.
 *
 * Va en español y no en el idioma del visitante a propósito: quien llega acá lo
 * hace por una ruta que no casó con ningún segmento de idioma, así que no hay
 * locale que leer. El español es el idioma por defecto del sitio y el de la
 * ruta sin prefijo.
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({
    locale: IDIOMA_POR_DEFECTO,
    namespace: 'noEncontrado',
  })
  return {
    title: `${t('metaTitulo')} · Vuelo Carmesí`,
    // Una 404 no se indexa. Sin esto, cada URL rota que alguien enlace por
    // error puede acabar en el índice compitiendo con las páginas de verdad.
    robots: { index: false, follow: true },
  }
}

export default async function NoEncontrado() {
  const t = await getTranslations({
    locale: IDIOMA_POR_DEFECTO,
    namespace: 'noEncontrado',
  })

  return (
    <html lang={IDIOMA_POR_DEFECTO}>
      <body>
        <main
          style={{
            minWidth: 0,
            // dvh y no vh: en móvil la barra del navegador hace que 100vh se
            // pase de alto y deje el contenido empujado fuera de la pantalla.
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: 'clamp(2rem, 8vw, 4rem) var(--contenido-margen)',
            textAlign: 'center',
            backgroundColor: 'var(--color-cream)',
            color: 'var(--color-brown)',
          }}
        >
          <p
            style={{
              minWidth: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3.5rem, 14vw, 6rem)',
              lineHeight: 1,
              color: 'var(--color-crimson)',
            }}
          >
            404
          </p>
          <h1
            style={{
              minWidth: 0,
              fontSize: 'var(--fs-h2)',
              lineHeight: 1.15,
              overflowWrap: 'anywhere',
            }}
          >
            {t('titulo')}
          </h1>
          <p
            style={{
              minWidth: 0,
              maxWidth: '46ch',
              fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
              lineHeight: 1.7,
              opacity: 0.85,
            }}
          >
            {t('texto')}
          </p>
          {/* Un <a> normal y no el Link de next-intl: ese necesita el contexto
              de idioma que provee el layout de [locale], y acá estamos por
              encima de él. La raíz sin prefijo es la versión española. */}
          <a
            href="/"
            style={{
              minWidth: 0,
              // 44px: el mínimo cómodo para el pulgar, igual que el resto de
              // los botones del sitio.
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 24px',
              borderRadius: 999,
              backgroundColor: 'var(--color-crimson)',
              color: 'var(--color-cream)',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            {t('volver')}
          </a>
        </main>
      </body>
    </html>
  )
}
