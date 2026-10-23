import type { Producto } from '@/lib/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/**
 * Se pide aquí y no con getProductos(): esa función, en desarrollo, responde
 * con el catálogo de ejemplo (MOCK_PRODUCTOS) cuando el backend falla. Para
 * pintar la tienda sin backend sirve; para sugerencias es un error: salían
 * productos que no existen, se guardaban en caché y se podían agregar al
 * carrito con ids inventados. Aquí un fallo es un fallo: catálogo vacío y la
 * sección no se muestra.
 */
async function pedirUnaVez(url: string): Promise<Producto[] | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const datos: unknown = await res.json()
    return Array.isArray(datos) ? (datos as Producto[]) : null
  } catch {
    return null
  }
}

/**
 * Con reintentos: la primera consulta tras un rato quieto suele fallar. Render
 * duerme el backend sin tráfico y tarda en arrancar; y si producción pasa a la
 * base de reserva (Neon), esa se suspende sin actividad y al despertar la
 * primera petición puede dar 500. Con un solo intento la sección quedaba
 * oculta hasta recargar la página.
 * Esperas de 1, 2 y 4 s: cubren el despertar sin martillar al backend.
 */
const ESPERAS_MS = [1_000, 2_000, 4_000]

async function pedirCatalogo(idioma: string): Promise<Producto[]> {
  const url = idioma === 'es' ? `${API}/productos` : `${API}/productos?idioma=${idioma}`
  for (let intento = 0; ; intento++) {
    const productos = await pedirUnaVez(url)
    if (productos) return productos
    if (intento >= ESPERAS_MS.length) return []
    await new Promise(resolve => setTimeout(resolve, ESPERAS_MS[intento]))
  }
}

/**
 * El catálogo del que salen las sugerencias del carrito, pedido una sola vez.
 *
 * Antes cada sección de sugerencias lo pedía al montarse, así que aparecía
 * uno o varios segundos después que el resto —en producción, con Render
 * dormido, mucho más—. Ahora:
 *   - El layout de la tienda llama a `precargarCatalogo` al entrar: cuando el
 *     cliente toca «Agregar», el catálogo ya está y el mini-carrito abre con
 *     las sugerencias puestas.
 *   - Una sola petición en vuelo por idioma: el mini-carrito y la página del
 *     carrito comparten la misma.
 *   - Copia en sessionStorage: al recargar o entrar directo a /carrito se
 *     pinta al instante con lo último conocido mientras se refresca.
 *
 * Cinco minutos de vigencia: el stock cambia, y sugerir algo que se agotó
 * deja un botón que no hace nada.
 */
const VIGENCIA_MS = 5 * 60 * 1000
// v2: la v1 pudo quedar guardada con el catálogo de ejemplo; cambiar la clave
// la deja huérfana en vez de seguir sirviéndola.
const CLAVE = (idioma: string) => `vuelo-carmesi:catalogo-v2:${idioma}`

type Entrada = { productos: Producto[]; en: number }

const memoria = new Map<string, Entrada>()
const enVuelo = new Map<string, Promise<Producto[]>>()

function leerGuardado(idioma: string): Entrada | null {
  const enMemoria = memoria.get(idioma)
  if (enMemoria) return enMemoria
  try {
    const crudo = window.sessionStorage.getItem(CLAVE(idioma))
    const guardado = crudo ? (JSON.parse(crudo) as Entrada) : null
    if (guardado && Array.isArray(guardado.productos)) {
      memoria.set(idioma, guardado)
      return guardado
    }
  } catch { /* sin sessionStorage (modo privado, bloqueado): se pide y listo */ }
  return null
}

/** Lo que haya ya, vigente o no, para pintar sin esperar. */
export function catalogoEnCache(idioma: string): Producto[] {
  if (typeof window === 'undefined') return []
  return leerGuardado(idioma)?.productos ?? []
}

/** Pide el catálogo si no hay uno vigente. Devuelve siempre el más reciente. */
export function precargarCatalogo(idioma: string): Promise<Producto[]> {
  const guardado = typeof window === 'undefined' ? null : leerGuardado(idioma)
  if (guardado && Date.now() - guardado.en < VIGENCIA_MS) return Promise.resolve(guardado.productos)

  const pendiente = enVuelo.get(idioma)
  if (pendiente) return pendiente

  const peticion = pedirCatalogo(idioma)
    .then(productos => {
      // Un catálogo vacío es casi siempre un fallo del backend (pedirCatalogo
      // devuelve [] si no responde): no se guarda, para que el
      // próximo intento vuelva a pedirlo en vez de quedarse cinco minutos sin
      // sugerencias.
      if (productos.length > 0) {
        const entrada = { productos, en: Date.now() }
        memoria.set(idioma, entrada)
        try { window.sessionStorage.setItem(CLAVE(idioma), JSON.stringify(entrada)) } catch { /* lleno o bloqueado */ }
      }
      return productos.length > 0 ? productos : (guardado?.productos ?? [])
    })
    .finally(() => enVuelo.delete(idioma))
  enVuelo.set(idioma, peticion)
  return peticion
}
