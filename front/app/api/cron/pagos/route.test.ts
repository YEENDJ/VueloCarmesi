import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Lo que se protege es la puerta: esta ruta tiene en la mano la clave de admin
 * del backend, así que solo la puede abrir quien traiga `CRON_SECRET`.
 */

const SECRETO = 'un-secreto-de-cron-suficientemente-largo'

const peticion = (authorization?: string) =>
  ({ headers: new Headers(authorization ? { authorization } : {}) }) as never

const { GET } = await import('./route')

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.stubEnv('CRON_SECRET', SECRETO)
  vi.stubEnv('ADMIN_API_KEY', 'clave-admin')
  fetchMock = vi.fn(async () => new Response('{"conciliados":0,"pedidos":1,"reservas":0}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('GET /api/cron/pagos', () => {
  it('con el secreto, llama al mantenimiento con la clave de admin', async () => {
    const res = await GET(peticion(`Bearer ${SECRETO}`))

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/pagos\/mantenimiento$/)
    expect(init.method).toBe('POST')
    expect(init.headers['x-admin-key']).toBe('clave-admin')
  })

  it('sin cabecera responde 401 y no toca el backend', async () => {
    const res = await GET(peticion())

    expect(res.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('con un secreto equivocado responde 401', async () => {
    const res = await GET(peticion('Bearer otro-secreto-cualquiera-de-largo'))

    expect(res.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sin CRON_SECRET configurado no deja pasar ni «Bearer » vacío', async () => {
    vi.stubEnv('CRON_SECRET', '')

    const res = await GET(peticion('Bearer '))

    expect(res.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('si el backend falla responde 502 para que se vea en el log del cron', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }))

    const res = await GET(peticion(`Bearer ${SECRETO}`))

    expect(res.status).toBe(502)
  })

  it('si el backend no responde, 502 sin lanzar', async () => {
    fetchMock.mockRejectedValueOnce(new Error('timeout'))

    const res = await GET(peticion(`Bearer ${SECRETO}`))

    expect(res.status).toBe(502)
  })
})
