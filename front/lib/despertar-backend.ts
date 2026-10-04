'use client'
import { useEffect } from 'react'

/**
 * Despierta el backend en cuanto se abre una página con formulario.
 *
 * En Render gratis el backend se duerme tras 15 minutos sin tráfico, y el
 * arranque en frío ronda el minuto. Los formularios públicos —pedido, reserva,
 * contacto y grupos— le hablan directo desde el navegador, así que sin esto el
 * cliente que llega con el backend dormido se quedaba ese minuto mirando
 * «Enviando…». Con el aviso al abrir, Render arranca mientras el cliente llena
 * el formulario y al enviar ya está listo.
 *
 * Pega en `GET /salud`, que no toca la base ni cuenta para el límite de envíos de
 * los formularios (ver back/src/common/limite-formularios.ts).
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/** Menos que los 15 minutos de Render: dentro de esto el backend sigue despierto. */
const VIGENCIA_MS = 5 * 60_000

// Por pestaña: quien pasa de la tienda al checkout no avisa dos veces seguidas.
let ultimoAviso = 0

export function useDespertarBackend() {
  useEffect(() => {
    const ahora = Date.now()
    if (ahora - ultimoAviso < VIGENCIA_MS) return
    ultimoAviso = ahora
    // Sin esperar respuesta ni mostrar nada: si falla, el envío despierta al
    // backend igual que antes.
    fetch(`${API}/salud`, { cache: 'no-store' }).catch(() => {})
  }, [])
}
