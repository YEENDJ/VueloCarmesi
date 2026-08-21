'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Mantiene al día una pestaña ya abierta.
 *
 * Invalidar la caché al guardar en el admin sólo arregla la SIGUIENTE petición.
 * Una pestaña que ya renderizó no hace ninguna, así que se queda con lo viejo
 * hasta que alguien recarga. Este componente es quien hace esa petición.
 *
 * Usa router.refresh(), no location.reload(): vuelve a pedir el payload de los
 * Server Components y lo fusiona en el árbol ya montado, sin perder la posición
 * del scroll ni el estado de los componentes cliente. Para el visitante no hay
 * parpadeo — el contenido cambia y nada más.
 *
 * Dos disparadores, por orden de importancia real:
 *
 * 1. Volver a la pestaña. Es el caso dominante: guardas en el admin, cambias de
 *    pestaña al sitio y ya está actualizado. Cuesta una petición por regreso.
 * 2. Un intervalo mientras la pestaña está visible, para quien la deja abierta
 *    mirándola. Se detiene al ocultarse: una pestaña de fondo no gasta nada, que
 *    es lo que evita que esto se vuelva tráfico de balde.
 */
export default function AutoActualizar({ intervaloMs = 60_000 }: { intervaloMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    let temporizador: ReturnType<typeof setInterval> | undefined

    const detener = () => {
      if (temporizador) {
        clearInterval(temporizador)
        temporizador = undefined
      }
    }

    const arrancar = () => {
      detener() // nunca dejar dos intervalos vivos a la vez
      temporizador = setInterval(() => router.refresh(), intervaloMs)
    }

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'visible') {
        router.refresh() // ponerse al día de entrada, sin esperar al intervalo
        arrancar()
      } else {
        detener()
      }
    }

    if (document.visibilityState === 'visible') arrancar()
    document.addEventListener('visibilitychange', alCambiarVisibilidad)

    return () => {
      detener()
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    }
  }, [router, intervaloMs])

  return null
}
