import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_SESION, DURACION_SESION_S, contrasenaCorrecta, crearSesion } from '@/lib/admin/sesion'
import { bloqueoRestante, ipDe, limpiarFallos, registrarFallo } from '@/lib/admin/limite-intentos'

export async function POST(req: NextRequest) {
  const ip = ipDe(req.headers)
  const espera = bloqueoRestante(ip)
  if (espera > 0) {
    const minutos = Math.ceil(espera / 60_000)
    return NextResponse.json(
      { error: `Demasiados intentos. Vuelve a probar en ${minutos} min.` },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(espera / 1000)) } },
    )
  }

  const { password } = await req.json().catch(() => ({ password: undefined }))
  if (!contrasenaCorrecta(password)) {
    registrarFallo(ip)
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }
  limpiarFallos(ip)

  let token: string
  try {
    token = crearSesion()
  } catch {
    // Falta ADMIN_SESSION_SECRET en el entorno. Mejor un mensaje claro que un
    // 500 mudo: es lo primero que se ve si se olvida configurarlo al desplegar.
    return NextResponse.json(
      { error: 'El panel no está configurado: falta ADMIN_SESSION_SECRET en el servidor.' },
      { status: 500 },
    )
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_SESION, token, {
    httpOnly: true,
    path: '/',
    maxAge: DURACION_SESION_S,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
