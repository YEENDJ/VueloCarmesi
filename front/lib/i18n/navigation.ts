import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Los envoltorios de navegación que saben de idioma.
 *
 * Son reemplazos directos de `next/link` y `next/navigation`, y hay que usarlos
 * en todo el sitio público: reciben la ruta *interna* —la española, la misma
 * que las carpetas— y escriben el href del idioma activo. Un <Link href="/tienda">
 * sale como /tienda en español y como /en/shop en inglés, sin que la página que
 * lo pinta tenga que enterarse de en qué idioma está.
 *
 * Si alguien importa `next/link` a secas dentro de app/[locale], el enlace
 * pierde el idioma y devuelve al visitante al español a mitad de navegación.
 */
export const {
  Link,
  redirect,
  permanentRedirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing)
