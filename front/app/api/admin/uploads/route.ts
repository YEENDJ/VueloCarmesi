import { NextRequest, NextResponse } from 'next/server'
import { BASE, comoLlego, sesionAdmin } from '../proxy'

/** Subir una foto. El archivo se reenvía al backend sin tocarlo. */
export async function POST(req: NextRequest) {
  const sesion = await sesionAdmin()
  if (!sesion.ok) return sesion.respuesta

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    // El caso real es el archivo que supera el límite de cuerpo de la
    // plataforma: la petición llega cortada y `formData()` revienta. Sin este
    // catch el panel recibe un 500 sin explicación.
    return NextResponse.json(
      { message: 'La foto es demasiado pesada para subirla. El máximo son 4 MB.' },
      { status: 413 },
    )
  }

  const res = await fetch(`${BASE}/uploads/image`, {
    method: 'POST',
    // Solo la cookie: el content-type lo pone fetch con el boundary nuevo que
    // le corresponde a este FormData, y copiar el de la petición original lo
    // rompería.
    headers: { cookie: sesion.cookie },
    body: form,
  })

  return comoLlego(res)
}

/** Borrar una foto de Cloudinary al quitarla de una galería. */
export async function DELETE(req: NextRequest) {
  const sesion = await sesionAdmin()
  if (!sesion.ok) return sesion.respuesta

  const res = await fetch(`${BASE}/uploads/image`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json', cookie: sesion.cookie },
    body: await req.text(),
  })

  return comoLlego(res)
}
