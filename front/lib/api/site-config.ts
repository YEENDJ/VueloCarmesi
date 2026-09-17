const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/**
 * La configuración del sitio en un idioma.
 *
 * Las claves de texto —punto de encuentro, resumen de cancelación— vuelven ya
 * traducidas, con respaldo al español si todavía no lo están. El español no
 * lleva parámetro: así la URL de caché queda idéntica a la de antes del i18n.
 */
export async function getSiteConfig(idioma = 'es'): Promise<Record<string, string>> {
  try {
    const url = idioma === 'es' ? `${BASE}/site-config` : `${BASE}/site-config?idioma=${idioma}`
    const res = await fetch(url, { next: { revalidate: 300, tags: ['site-config'] } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return {}
  }
}
