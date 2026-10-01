import type { ConfigPagos } from '@/lib/pagos'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/**
 * Si el sitio cobra en línea, leído en el servidor para que la página salga
 * con el texto correcto desde el primer render.
 *
 * Si el backend no responde se asume que no cobra: es el flujo de hoy, y
 * anunciar un pago que luego no se abre sería peor que no anunciarlo.
 */
export async function getConfigPagos(): Promise<ConfigPagos> {
  try {
    const res = await fetch(`${BASE}/pagos/config`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return { activo: false, porcentajeAbono: 30 }
  }
}
