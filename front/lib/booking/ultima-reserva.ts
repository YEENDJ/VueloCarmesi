import { useMemo, useSyncExternalStore } from 'react'

/**
 * La última reserva hecha en este navegador: su código y la llave de «mi
 * reserva». La guarda el formulario al crearla y la leen la confirmación y el
 * resultado del pago para ofrecer «Ver mi reserva». Es lo mismo que hace el
 * carrito con el último pedido (lib/cart/store.ts).
 *
 * localStorage puede no estar (modo privado, cookies bloqueadas): entonces no
 * se guarda y el botón simplemente no aparece. El correo trae el enlace igual.
 */

const CLAVE = 'vuelo-carmesi:ultima-reserva'

export interface UltimaReserva {
  /** VC-XXXXXX, como lo muestra el backend. */
  codigo: string
  token: string
}

export function guardarUltimaReserva(reserva: UltimaReserva): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(reserva))
  } catch {
    // Sin almacenamiento: el botón no aparecerá, el enlace del correo sí.
  }
}

/** Lo guardado tal cual, o nulo. En el servidor no hay localStorage. */
function leerCrudo(): string | null {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

const suscribir = (aviso: () => void) => {
  window.addEventListener('storage', aviso)
  return () => window.removeEventListener('storage', aviso)
}

/**
 * La última reserva, para un componente. En el servidor (y en la primera
 * pintura del navegador) es nula, así que el HTML de los dos coincide; se
 * actualiza sola si otra pestaña guarda una reserva nueva.
 */
export function useUltimaReserva(): UltimaReserva | null {
  const crudo = useSyncExternalStore(suscribir, leerCrudo, () => null)
  return useMemo(() => {
    if (!crudo) return null
    try {
      const r = JSON.parse(crudo) as Partial<UltimaReserva>
      return typeof r.codigo === 'string' && typeof r.token === 'string' ? { codigo: r.codigo, token: r.token } : null
    } catch {
      return null
    }
  }, [crudo])
}
