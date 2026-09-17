import { useSyncExternalStore } from 'react'

/**
 * Los slugs de la ficha que se está viendo, en cada idioma.
 *
 * Existe por un problema de orden: el selector de idioma vive en el Navbar, que
 * está en el layout, y los slugs los conoce la página, que está por debajo. Un
 * contexto de React no sirve —el proveedor tendría que envolver al Navbar y la
 * página no puede hacerlo—, así que el dato viaja por fuera del árbol.
 *
 * Mismo patrón que lib/cart/store.ts: useSyncExternalStore a mano, sin librería.
 */
let slugs: Record<string, string> | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach(l => l())
}

/** La llama la página de detalle al montarse, y con null al salir de ella. */
export function publicarSlugs(nuevos: Record<string, string> | null) {
  // Comparar antes de emitir evita un render extra cuando la página se
  // remonta con los mismos slugs.
  if (slugs === nuevos) return
  slugs = nuevos
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => slugs

/**
 * En el servidor siempre null, y siempre la MISMA referencia.
 *
 * Devolver un objeto nuevo en cada llamada haría que React viera un cambio de
 * estado en cada render y entrara en bucle. Y null es además lo correcto: al
 * renderizar en servidor la página todavía no ha publicado nada.
 */
const getServerSnapshot = () => null

export function useSlugsIdioma(): Record<string, string> | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
