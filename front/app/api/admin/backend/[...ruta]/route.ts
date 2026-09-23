import { NextRequest, NextResponse } from 'next/server'
import { BASE, comoLlego, sesionAdmin } from '../../proxy'
import { rutaPermitida, type Metodo } from '../../rutas-permitidas'

/**
 * Puente genérico del panel hacia las rutas de administración del backend:
 * reservas, pedidos, experiencias, productos y solicitudes de grupo.
 *
 * Solo reenvía lo que figura en rutas-permitidas.ts.
 *
 * Las subidas de fotos y Configuración tienen su propio archivo porque hacen
 * algo más que reenviar (el FormData y la invalidación de caché).
 */

async function reenviar(
  req: NextRequest,
  ctx: RouteContext<'/api/admin/backend/[...ruta]'>,
  metodo: Metodo,
) {
  const ruta = (await ctx.params).ruta.join('/')
  if (!rutaPermitida(metodo, ruta)) {
    return NextResponse.json({ message: 'Ruta no permitida' }, { status: 404 })
  }

  const sesion = await sesionAdmin()
  if (!sesion.ok) return sesion.respuesta

  const conCuerpo = metodo === 'POST' || metodo === 'PATCH'
  const res = await fetch(`${BASE}/${ruta}${req.nextUrl.search}`, {
    method: metodo,
    headers: conCuerpo ? { 'content-type': 'application/json', ...sesion.headers } : sesion.headers,
    body: conCuerpo ? await req.text() : undefined,
    // Datos personales que cambian a cada rato: nunca de caché.
    cache: 'no-store',
  })

  return comoLlego(res)
}

type Ctx = RouteContext<'/api/admin/backend/[...ruta]'>

export const GET = (req: NextRequest, ctx: Ctx) => reenviar(req, ctx, 'GET')
export const POST = (req: NextRequest, ctx: Ctx) => reenviar(req, ctx, 'POST')
export const PATCH = (req: NextRequest, ctx: Ctx) => reenviar(req, ctx, 'PATCH')
export const DELETE = (req: NextRequest, ctx: Ctx) => reenviar(req, ctx, 'DELETE')
