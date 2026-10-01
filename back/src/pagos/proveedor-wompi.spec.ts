import { createHash } from 'node:crypto'
import { FirmaInvalidaError } from './proveedor'
import { ProveedorWompi, configDesdeEnv, type ConfigWompi } from './proveedor-wompi'

const CONFIG: ConfigWompi = {
  llavePublica: 'pub_test_abc',
  llavePrivada: 'prv_test_xyz',
  secretoEventos: 'test_events_secreto',
  secretoIntegridad: 'test_integrity_secreto',
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

function webhook(transaction: Record<string, unknown>, secreto = CONFIG.secretoEventos) {
  const timestamp = 1727800000
  const properties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents']
  const checksum = sha256(`${transaction.id}${transaction.status}${transaction.amount_in_cents}${timestamp}${secreto}`)
  const body = {
    event: 'transaction.updated',
    data: { transaction },
    environment: 'test',
    signature: { properties, checksum: checksum.toUpperCase() },
    timestamp,
  }
  return Buffer.from(JSON.stringify(body))
}

const TX = {
  id: '1234-1610641025-49201',
  reference: 'VC-P-ABCD1234-0F0F0F',
  status: 'APPROVED',
  amount_in_cents: 15000000,
  payment_method_type: 'NEQUI',
  status_message: null,
}

describe('ProveedorWompi', () => {
  describe('configuración', () => {
    it('saca el modo del prefijo de las llaves', () => {
      expect(new ProveedorWompi(CONFIG).modo).toBe('prueba')
      expect(new ProveedorWompi({ ...CONFIG, llavePublica: 'pub_prod_a', llavePrivada: 'prv_prod_b' }).modo)
        .toBe('produccion')
    })

    it('rechaza llaves de ambientes distintos', () => {
      expect(() => new ProveedorWompi({ ...CONFIG, llavePrivada: 'prv_prod_b' })).toThrow(/ambientes distintos/)
    })

    it('rechaza credenciales vacías o con formato raro', () => {
      expect(() => new ProveedorWompi({ ...CONFIG, secretoEventos: '' })).toThrow(/secretoEventos/)
      expect(() => new ProveedorWompi({ ...CONFIG, llavePublica: 'abc' })).toThrow(/formato/)
    })

    it('lee las variables de entorno', () => {
      expect(configDesdeEnv({
        WOMPI_LLAVE_PUBLICA: ' pub_test_abc ', WOMPI_LLAVE_PRIVADA: 'prv_test_xyz',
        WOMPI_SECRETO_EVENTOS: 'e', WOMPI_SECRETO_INTEGRIDAD: 'i',
      })).toEqual({ llavePublica: 'pub_test_abc', llavePrivada: 'prv_test_xyz', secretoEventos: 'e', secretoIntegridad: 'i' })
    })
  })

  describe('crearCheckout', () => {
    const wompi = new ProveedorWompi(CONFIG)
    const cliente = { nombre: 'Ana Pérez', email: 'ana@example.com', telefono: '+57 300 123 4567' }

    it('arma la URL del Web Checkout con la firma de integridad', async () => {
      const { url } = await wompi.crearCheckout(
        { referencia: 'VC-P-1', monto: 150000, moneda: 'COP', descripcion: 'x' },
        cliente,
        'https://vuelocarmesi.com/checkout/resultado',
      )
      const u = new URL(url)
      expect(u.origin + u.pathname).toBe('https://checkout.wompi.co/p/')
      expect(u.searchParams.get('public-key')).toBe('pub_test_abc')
      expect(u.searchParams.get('amount-in-cents')).toBe('15000000')
      expect(u.searchParams.get('currency')).toBe('COP')
      expect(u.searchParams.get('reference')).toBe('VC-P-1')
      expect(u.searchParams.get('signature:integrity'))
        .toBe(sha256(`VC-P-115000000COP${CONFIG.secretoIntegridad}`))
      expect(u.searchParams.get('redirect-url')).toBe('https://vuelocarmesi.com/checkout/resultado?ref=VC-P-1')
      expect(u.searchParams.get('customer-data:phone-number')).toBe('3001234567')
      expect(u.searchParams.get('customer-data:phone-number-prefix')).toBe('+57')
    })

    it('omite el retorno local: Wompi bloquea el checkout entero con él', async () => {
      const { url } = await wompi.crearCheckout(
        { referencia: 'VC-P-1', monto: 150000, moneda: 'COP', descripcion: 'x' },
        cliente,
        'http://localhost:3000/es/checkout/resultado',
      )
      expect(new URL(url).searchParams.has('redirect-url')).toBe(false)
    })

    it('no acepta montos con decimales: romperían la firma', async () => {
      await expect(wompi.crearCheckout(
        { referencia: 'VC-P-1', monto: 49999.5, moneda: 'COP', descripcion: 'x' }, cliente, 'https://a.co/r',
      )).rejects.toThrow(/Monto inválido/)
    })
  })

  describe('verificarWebhook', () => {
    const wompi = new ProveedorWompi(CONFIG)

    it('traduce un evento auténtico a nuestro vocabulario', () => {
      const evento = wompi.verificarWebhook(webhook(TX), {})
      expect(evento).toMatchObject({
        referencia: TX.reference,
        proveedorTxId: TX.id,
        estado: 'aprobado',
        monto: 150000,
        metodo: 'nequi',
      })
    })

    it.each([
      ['DECLINED', 'rechazado'],
      ['VOIDED', 'anulado'],
      ['ERROR', 'error'],
      ['PENDING', 'pendiente'],
    ])('%s → %s', (status, estado) => {
      expect(wompi.verificarWebhook(webhook({ ...TX, status }), {}).estado).toBe(estado)
    })

    it('rechaza un evento firmado con otro secreto', () => {
      expect(() => wompi.verificarWebhook(webhook(TX, 'otro'), {})).toThrow(FirmaInvalidaError)
    })

    it('rechaza un evento alterado después de firmado', () => {
      const alterado = Buffer.from(webhook(TX).toString().replace('15000000', '100'))
      expect(() => wompi.verificarWebhook(alterado, {})).toThrow(FirmaInvalidaError)
    })

    it('rechaza basura', () => {
      expect(() => wompi.verificarWebhook(Buffer.from('no json'), {})).toThrow(FirmaInvalidaError)
      expect(() => wompi.verificarWebhook(Buffer.from('{}'), {})).toThrow(FirmaInvalidaError)
    })
  })

  describe('consultarTransaccion', () => {
    function conRespuesta(data: unknown[], status = 200) {
      const http = jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => ({ data }) })
      return { http, wompi: new ProveedorWompi(CONFIG, http as unknown as typeof fetch) }
    }

    it('consulta el sandbox con la llave privada', async () => {
      const { http, wompi } = conRespuesta([TX])
      const evento = await wompi.consultarTransaccion(TX.reference)
      expect(http).toHaveBeenCalledWith(
        `https://sandbox.wompi.co/v1/transactions?reference=${TX.reference}`,
        { headers: { Authorization: 'Bearer prv_test_xyz' } },
      )
      expect(evento?.estado).toBe('aprobado')
    })

    it('devuelve null si Wompi no conoce la referencia', async () => {
      expect(await conRespuesta([]).wompi.consultarTransaccion('VC-X')).toBeNull()
    })

    it('con varios intentos gana el aprobado sobre el rechazo', async () => {
      const { wompi } = conRespuesta([
        { ...TX, id: 'tx-1', status: 'DECLINED', created_at: '2026-10-01T10:00:00Z' },
        { ...TX, id: 'tx-2', status: 'APPROVED', created_at: '2026-10-01T10:05:00Z' },
      ])
      expect(await wompi.consultarTransaccion(TX.reference)).toMatchObject({ proveedorTxId: 'tx-2', estado: 'aprobado' })
    })

    it('sin aprobado ni en curso, toma el intento más reciente', async () => {
      const { wompi } = conRespuesta([
        { ...TX, id: 'tx-1', status: 'ERROR', created_at: '2026-10-01T10:00:00Z' },
        { ...TX, id: 'tx-2', status: 'DECLINED', created_at: '2026-10-01T10:05:00Z' },
      ])
      expect((await wompi.consultarTransaccion(TX.reference))?.proveedorTxId).toBe('tx-2')
    })

    it('lanza si Wompi responde con error', async () => {
      await expect(conRespuesta([], 401).wompi.consultarTransaccion('VC-X')).rejects.toThrow(/401/)
    })
  })
})
