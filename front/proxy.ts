import createMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n/routing'

/**
 * Se llama proxy.ts y no middleware.ts a propósito.
 *
 * Next 16 renombró la convención: `middleware.ts` está obsoleto y el archivo
 * pasa a ser `proxy.ts`. Con el nombre viejo Next no lo carga y no avisa — la
 * portada seguía respondiendo, pero /experiencias daba 404 porque nadie estaba
 * reescribiendo la ruta al segmento [locale].
 *
 * La función de next-intl no cambia: se admite export por defecto.
 */
export default createMiddleware(routing)

/**
 * El patrón va escrito aquí como literal, no importado, y no es por gusto:
 * Next exige que cada entrada de `matcher` sea una cadena estática que pueda
 * leer en tiempo de compilación. Con una constante importada el arranque falla
 * con «Entry `matcher[0]` need to be static strings».
 *
 * Su gemelo documentado y probado vive en lib/i18n/matcher.ts, y un test
 * compara los dos para que no se separen en silencio. Lo que hay que saber
 * antes de tocarlo está explicado allí — en particular por qué la barra
 * invertida va doblada.
 */
export const config = {
  matcher: ['/((?!api|admin|portafolio|_next|_vercel|.*\\..*).*)'],
}
