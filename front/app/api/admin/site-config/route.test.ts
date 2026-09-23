import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Lo que se protege aquí es la invalidación de caché, no el reenvío.
 *
 * El reenvío se nota enseguida si se rompe: el panel deja de guardar. La
 * invalidación no se nota nunca — se guarda bien, el backend responde bien, y
 * lo único que pasa es que la web sigue mostrando el valor viejo un rato. Es
 * exactamente el fallo que llegó a producción con el aviso de cancelación, y
 * ninguna prueba del reenvío lo habría atrapado.
 */

const revalidateTag = vi.fn()
vi.mock('next/cache', () => ({ revalidateTag: (...a: unknown[]) => revalidateTag(...a) }))

// Se dobla el puente entero para no arrastrar `cookies()` de next/headers, que
// fuera de una petición real no existe. Lo que se prueba está en route.ts.
vi.mock('../proxy', () => ({
  BASE: 'http://backend',
  sesionAdmin: async () => ({ ok: true, headers: { 'x-admin-key': 'k' } }),
  comoLlego: async (res: Response) => res,
}))

const { PATCH } = await import('./route')

/** Una petición del panel con el cuerpo que manda Configuración. */
const peticion = () =>
  ({ text: async () => JSON.stringify({ punto_encuentro: 'Finca La Fortuna' }) }) as never

beforeEach(() => {
  revalidateTag.mockClear()
})

describe('PATCH /api/admin/site-config', () => {
  it('invalida la caché cuando el backend acepta', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))

    await PATCH(peticion())

    expect(revalidateTag).toHaveBeenCalledTimes(1)
  })

  it('usa la etiqueta que llevan los fetch de site-config', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))

    await PATCH(peticion())

    // La etiqueta tiene que coincidir con la de lib/api/site-config.ts. Si
    // alguna de las dos se renombra sola, la invalidación deja de encontrar la
    // entrada y no avisa nadie.
    expect(revalidateTag).toHaveBeenCalledWith('site-config', expect.anything())
  })

  it('pasa un perfil, porque la forma de un solo argumento está obsoleta', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))

    await PATCH(peticion())

    expect(revalidateTag.mock.calls[0]).toHaveLength(2)
    expect(revalidateTag.mock.calls[0][1]).toBe('max')
  })

  it('NO invalida si el backend rechaza el guardado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })))

    await PATCH(peticion())

    // Nada cambió en la base, así que tirar la caché solo obliga a rehacer la
    // petición para volver a leer lo mismo.
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('tampoco invalida si no hay sesión de admin', async () => {
    vi.doUnmock('../proxy')
    vi.resetModules()
    vi.doMock('../proxy', () => ({
      BASE: 'http://backend',
      sesionAdmin: async () => ({ ok: false, respuesta: new Response(null, { status: 401 }) }),
      comoLlego: async (res: Response) => res,
    }))

    const { PATCH: conSesionCaducada } = await import('./route')
    const res = await conSesionCaducada(peticion())

    expect(res.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
