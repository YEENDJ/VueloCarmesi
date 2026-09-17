import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

/**
 * Carga el catálogo de mensajes del idioma pedido.
 *
 * `requestLocale` viene del segmento [locale] de la URL. Se valida contra la
 * lista en vez de confiar en él: el segmento es texto libre en la URL y sin
 * comprobarlo un /xx/ cualquiera intentaría importar messages/xx.json y
 * reventaría el render con un error de módulo no encontrado.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const pedido = await requestLocale
  const locale = hasLocale(routing.locales, pedido) ? pedido : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
