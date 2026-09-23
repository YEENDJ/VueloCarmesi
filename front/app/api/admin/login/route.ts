import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_SESION, DURACION_SESION_S, contrasenaCorrecta, crearSesion } from '@/lib/admin/sesion'

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: undefined }))
  if (!contrasenaCorrecta(password)) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

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
