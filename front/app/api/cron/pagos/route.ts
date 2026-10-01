// Solo servidor: `node:crypto` no existe en el navegador.
import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Disparador del vencimiento y la conciliación de pagos.
 *
 * El backend no tiene temporizador propio: en Render se duerme sin tráfico y
 * un `setInterval` dormido no corre. Así que lo despierta un cron externo, que
 * llama aquí cada 15 minutos, y esta ruta le pasa la orden a
 * `POST /pagos/mantenimiento`.
 *
 * Por qué no llama el cron al backend directo: esa ruta exige `x-admin-key`, y
 * Vercel Cron no deja poner cabeceras propias. Solo manda
 * `Authorization: Bearer <CRON_SECRET>`, que se valida aquí. La clave de admin
 * no sale de este servidor.
 *
 * Un servicio externo (cron-job.org, GitHub Actions) sirve igual: basta con que
 * mande la misma cabecera.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/** Compara sin delatar por el tiempo cuántos caracteres acertó. */
function autorizado(cabecera: string | null): boolean {
  const secreto = process.env.CRON_SECRET
  // Sin secreto se falla cerrado: un secreto vacío dejaría pasar `Bearer `.
  if (!secreto || secreto.length < 16 || !cabecera) return false
  const esperada = Buffer.from(`Bearer ${secreto}`)
  const recibida = Buffer.from(cabecera)
  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada)
}

export async function GET(req: NextRequest) {
  if (!autorizado(req.headers.get('authorization'))) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const clave = process.env.ADMIN_API_KEY
  if (!clave) {
    return NextResponse.json(
      { message: 'Falta ADMIN_API_KEY en el servidor.' },
      { status: 500 },
    )
  }

  try {
    const res = await fetch(`${BASE}/pagos/mantenimiento`, {
      method: 'POST',
      headers: { 'x-admin-key': clave },
      cache: 'no-store',
      // Render tarda en despertar: un arranque en frío ronda el minuto.
      signal: AbortSignal.timeout(90_000),
    })
    const cuerpo = await res.text()
    // Al log de Vercel, para ver qué venció en cada pasada sin abrir la base.
    console.log(`[cron pagos] ${res.status} ${cuerpo}`)
    return new NextResponse(cuerpo, {
      status: res.ok ? 200 : 502,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    // Que falle una pasada no rompe nada: todo es idempotente y la siguiente
    // recoge lo pendiente.
    console.error(`[cron pagos] backend sin respuesta: ${(err as Error).message}`)
    return NextResponse.json({ message: 'El backend no respondió' }, { status: 502 })
  }
}

/** El arranque en frío de Render no cabe en los 10 s por defecto. */
export const maxDuration = 120
