import 'reflect-metadata'
import { ConflictException, ServiceUnavailableException } from '@nestjs/common'
import { PagosService } from './pagos.service'
import { VencimientoService } from './vencimiento.service'
import { ProveedorFalso, CABECERA_FIRMA_FALSA } from './proveedor-falso'
import { FirmaInvalidaError } from './proveedor'

/**
 * Los casos de «el pago no se completó» del spec, uno por uno:
 * docs/superpowers/specs/2026-09-25-pasarela-pagos-design.md.
 *
 * Corren contra un Prisma en memoria y no contra mocks sueltos porque lo que
 * se prueba es justo lo que un mock no ve: que una transacción que falla a
 * medias se deshaga entera (caso 5), y que las condiciones en el WHERE eviten
 * aplicar dos veces lo mismo (caso 7).
 */

// --- Prisma en memoria ------------------------------------------------------

type Fila = Record<string, any>
type Tablas = Record<'pedido' | 'itemPedido' | 'producto' | 'reserva' | 'experiencia' | 'pago', Fila[]>

function cumple(fila: Fila, where: Fila = {}): boolean {
  return Object.entries(where).every(([k, cond]) => {
    const v = fila[k]
    if (cond !== null && typeof cond === 'object' && !(cond instanceof Date)) {
      if ('in' in cond && !cond.in.includes(v)) return false
      if ('lt' in cond && !(v < cond.lt)) return false
      if ('gte' in cond && !(v >= cond.gte)) return false
      if ('lte' in cond && !(v <= cond.lte)) return false
      return true
    }
    return v === cond
  })
}

function aplicar(fila: Fila, data: Fila): void {
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue
    if (v !== null && typeof v === 'object' && 'increment' in v) fila[k] += v.increment
    else if (v !== null && typeof v === 'object' && 'decrement' in v) fila[k] -= v.decrement
    else fila[k] = v
  }
  if ('updatedAt' in fila) fila.updatedAt = new Date()
}

class PrismaEnMemoria {
  t: Tablas = { pedido: [], itemPedido: [], producto: [], reserva: [], experiencia: [], pago: [] }
  private seq = 0
  /** Hora de creación de las filas nuevas: los casos corren con reloj fijo. */
  reloj = new Date()

  private relaciones: Record<string, Record<string, (f: Fila) => Fila | Fila[] | null>> = {
    pedido: {
      items: f => this.t.itemPedido.filter(i => i.pedidoId === f.id),
      pagos: f => this.t.pago.filter(p => p.pedidoId === f.id),
    },
    reserva: {
      pagos: f => this.t.pago.filter(p => p.reservaId === f.id),
      experiencia: f => this.t.experiencia.find(e => e.id === f.experienciaId) ?? null,
    },
    pago: {
      pedido: f => this.t.pedido.find(p => p.id === f.pedidoId) ?? null,
      reserva: f => this.t.reserva.find(r => r.id === f.reservaId) ?? null,
    },
    itemPedido: { producto: f => this.t.producto.find(p => p.id === f.productoId) ?? null },
    experiencia: {},
    producto: {},
  }

  private vista(modelo: string, fila: Fila | undefined, args: Fila = {}): Fila | null {
    if (!fila) return null
    if (args.select) {
      return Object.fromEntries(Object.keys(args.select).map(k => [k, fila[k]]))
    }
    const salida: Fila = { ...fila }
    for (const [rel, sub] of Object.entries(args.include ?? {})) {
      const destino = { pedido: 'pedido', reserva: 'reserva', items: 'itemPedido', pagos: 'pago', experiencia: 'experiencia', producto: 'producto' }[rel]!
      const valor = this.relaciones[modelo][rel](fila)
      const subArgs = sub === true ? {} : (sub as Fila)
      salida[rel] = Array.isArray(valor)
        ? valor.map(v => this.vista(destino, v, subArgs))
        : this.vista(destino, valor ?? undefined, subArgs)
    }
    return salida
  }

  private delegado(modelo: keyof Tablas) {
    const tabla = () => this.t[modelo]
    return {
      findUnique: async (a: Fila) => this.vista(modelo, tabla().find(f => cumple(f, a.where)), a),
      findUniqueOrThrow: async (a: Fila) => {
        const r = this.vista(modelo, tabla().find(f => cumple(f, a.where)), a)
        if (!r) throw new Error('no existe')
        return r
      },
      findMany: async (a: Fila = {}) =>
        tabla().filter(f => cumple(f, a.where)).slice(0, a.take ?? Infinity).map(f => this.vista(modelo, f, a)),
      create: async (a: Fila) => {
        const base = modelo === 'pago'
          ? { estado: 'pendiente', moneda: 'COP', proveedorTxId: null, metodo: null, motivo: null, payload: {}, pedidoId: null, reservaId: null, createdAt: this.reloj, updatedAt: this.reloj }
          : {}
        const fila = { id: `${modelo}_${++this.seq}`, ...base, ...a.data }
        if (modelo === 'pago' && tabla().some(p => p.referencia === fila.referencia)) throw new Error('referencia duplicada')
        tabla().push(fila)
        return { ...fila }
      },
      update: async (a: Fila) => {
        const fila = tabla().find(f => cumple(f, a.where))
        if (!fila) throw new Error('no existe')
        aplicar(fila, a.data)
        return this.vista(modelo, fila, a)
      },
      updateMany: async (a: Fila) => {
        const filas = tabla().filter(f => cumple(f, a.where))
        filas.forEach(f => aplicar(f, a.data))
        return { count: filas.length }
      },
      count: async (a: Fila) => tabla().filter(f => cumple(f, a.where)).length,
    }
  }

  pedido = this.delegado('pedido')
  reserva = this.delegado('reserva')
  pago = this.delegado('pago')
  producto = this.delegado('producto')
  siteConfig = { findUnique: async () => null }

  /** Como Postgres: si el callback lanza, no queda nada de lo que hizo. */
  async $transaction<T>(cb: (tx: this) => Promise<T>): Promise<T> {
    const antes = structuredClone(this.t)
    try {
      return await cb(this)
    } catch (err) {
      this.t = antes
      throw err
    }
  }
}

// --- Escenario --------------------------------------------------------------

const MIN = 60_000
const HORA = 60 * MIN
const T0 = new Date('2026-10-01T15:00:00Z')

function montar() {
  process.env.PAGOS_FALSO_SECRETO = 'secreto-de-prueba'
  const prisma = new PrismaEnMemoria()
  prisma.reloj = T0
  const notificaciones = {
    enviarConfirmacionPedido: jest.fn().mockResolvedValue(undefined),
    enviarConfirmacionReserva: jest.fn().mockResolvedValue(undefined),
    alertarPago: jest.fn().mockResolvedValue(undefined),
    enviarPagoRechazado: jest.fn().mockResolvedValue(undefined),
    enviarPagoEnRevisionCliente: jest.fn().mockResolvedValue(undefined),
  }
  const proveedor = new ProveedorFalso('secreto-de-prueba')
  const pagos = new PagosService(prisma as any, notificaciones as any, proveedor)
  const vencimiento = new VencimientoService(prisma as any, pagos, proveedor)

  prisma.t.producto.push({ id: 'choco', nombre: 'Chocolate', precio: 50000, stock: 3 })
  prisma.t.experiencia.push({ id: 'cacao', nombre: 'Ruta del cacao', precio: 100000 })

  /** Un pedido de 2 chocolates que ya descontó su stock (queda 1). */
  function pedido(extra: Fila = {}) {
    prisma.t.producto[0].stock -= 2
    const p = {
      id: 'ped1', nombre: 'Ana', email: 'ana@x.co', telefono: '3001234567',
      direccion: 'Calle 1', ciudad: 'Villavicencio', codigoPostal: '500001',
      total: 100000, estado: 'pendiente_pago', venceEn: new Date(T0.getTime() + 30 * MIN),
      stockApartado: true, createdAt: T0, ...extra,
    }
    prisma.t.pedido.push(p)
    prisma.t.itemPedido.push({ id: 'it1', pedidoId: 'ped1', productoId: 'choco', cantidad: 2, precio: 50000 })
    return p
  }

  function reserva(extra: Fila = {}) {
    const r = {
      id: 'res1', experienciaId: 'cacao', fecha: new Date('2026-10-20'), cantidadPersonas: 2,
      nombre: 'Luis', email: 'luis@x.co', telefono: '3007654321', notas: null,
      total: 200000, porcentajeAbono: 30, montoAbono: 60000,
      estado: 'pendiente_pago', venceEn: new Date(T0.getTime() + 30 * MIN), createdAt: T0, ...extra,
    }
    prisma.t.reserva.push(r)
    return r
  }

  /** La pasarela llama al webhook con este resultado. */
  async function webhook(referencia: string, estado: 'aprobado' | 'rechazado' | 'anulado' | 'pendiente', monto: number, extra = {}) {
    const { body, firma } = proveedor.simular(referencia, estado, monto, extra)
    await pagos.procesarWebhook(body, { [CABECERA_FIRMA_FALSA]: firma })
  }

  const stock = () => prisma.t.producto[0].stock
  const pagoDe = (ref: string) => prisma.t.pago.find(p => p.referencia === ref)!

  return { prisma, notificaciones, proveedor, pagos, vencimiento, pedido, reserva, webhook, stock, pagoDe }
}

// --- Casos -------------------------------------------------------------------

describe('Pagos: casos en que el pago no se completa', () => {
  it('caso 1 · abandona: el pedido vence y devuelve el stock', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    expect(e.stock()).toBe(1)

    await e.vencimiento.vencerPendientes(new Date(T0.getTime() + 31 * MIN))

    expect(e.prisma.t.pedido[0].estado).toBe('expirado')
    expect(e.prisma.t.pedido[0].stockApartado).toBe(false)
    expect(e.stock()).toBe(3)
    expect(e.pagoDe(referencia).estado).toBe('expirado')
  })

  it('caso 1 · antes de su plazo no vence', async () => {
    const e = montar()
    e.pedido()
    await e.vencimiento.vencerPendientes(new Date(T0.getTime() + 29 * MIN))
    expect(e.prisma.t.pedido[0].estado).toBe('pendiente_pago')
    expect(e.stock()).toBe(1)
  })

  it('caso 2 · rechazado: el pedido sigue esperando y conserva el stock', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)

    await e.webhook(referencia, 'rechazado', 100000, { motivo: 'Fondos insuficientes' })

    expect(e.pagoDe(referencia)).toMatchObject({ estado: 'rechazado', motivo: 'Fondos insuficientes' })
    expect(e.prisma.t.pedido[0].estado).toBe('pendiente_pago')
    expect(e.stock()).toBe(1)
    expect(e.notificaciones.enviarConfirmacionPedido).not.toHaveBeenCalled()
  })

  it('caso 3 · reintenta: un pago nuevo con otra referencia, y ese sí se aprueba', async () => {
    const e = montar()
    e.pedido()
    const primero = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(primero.referencia, 'rechazado', 100000)

    const segundo = await e.pagos.crearIntento({ pedidoId: 'ped1' }, new Date(T0.getTime() + 5 * MIN))
    expect(segundo.referencia).not.toBe(primero.referencia)
    await e.webhook(segundo.referencia, 'aprobado', 100000)

    expect(e.prisma.t.pago).toHaveLength(2)
    expect(e.prisma.t.pedido[0].estado).toBe('pagado')
    expect(e.stock()).toBe(1)
    expect(e.notificaciones.enviarConfirmacionPedido).toHaveBeenCalledTimes(1)
  })

  it('caso 4 · PSE en curso: no vence mientras el banco responde, y no abre otro intento', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(referencia, 'pendiente', 100000, { metodo: 'pse' })
    expect(e.pagoDe(referencia).proveedorTxId).toBeTruthy()

    await e.vencimiento.vencerPendientes(new Date(T0.getTime() + 2 * HORA))
    expect(e.prisma.t.pedido[0].estado).toBe('pendiente_pago')
    expect(e.stock()).toBe(1)

    await expect(e.pagos.crearIntento({ pedidoId: 'ped1' }, new Date(T0.getTime() + 10 * MIN)))
      .rejects.toThrow(ConflictException)
  })

  it('caso 4 · pasado el tope de 24 horas, vence igual', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(referencia, 'pendiente', 100000)

    await e.vencimiento.vencerPendientes(new Date(T0.getTime() + 25 * HORA))
    expect(e.prisma.t.pedido[0].estado).toBe('expirado')
    expect(e.stock()).toBe(3)
  })

  it('caso 5 · aprobado después de vencer, con stock: vuelve a apartar y queda pagado', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.vencimiento.vencerPendientes(new Date(T0.getTime() + 31 * MIN))
    expect(e.stock()).toBe(3)

    await e.webhook(referencia, 'aprobado', 100000)

    expect(e.pagoDe(referencia).estado).toBe('aprobado')
    expect(e.prisma.t.pedido[0]).toMatchObject({ estado: 'pagado', stockApartado: true })
    expect(e.stock()).toBe(1)
    expect(e.notificaciones.enviarConfirmacionPedido).toHaveBeenCalledTimes(1)
    expect(e.notificaciones.alertarPago).not.toHaveBeenCalled()
  })

  it('caso 5 · aprobado después de vencer, sin stock: registra el pago y pide revisión', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.vencimiento.vencerPendientes(new Date(T0.getTime() + 31 * MIN))
    e.prisma.t.producto[0].stock = 1 // otro cliente se llevó dos mientras tanto

    await e.webhook(referencia, 'aprobado', 100000)

    // El dinero ya se cobró: el pago queda aprobado aunque el pedido no avance.
    expect(e.pagoDe(referencia).estado).toBe('aprobado')
    expect(e.prisma.t.pedido[0]).toMatchObject({ estado: 'requiere_revision', stockApartado: false })
    // Y el descuento a medias se deshizo: nadie perdió la unidad que quedaba.
    expect(e.stock()).toBe(1)
    expect(e.notificaciones.alertarPago).toHaveBeenCalledWith(
      expect.objectContaining({ requiereRevision: true, referencia, tipo: 'pedido' }),
    )
    expect(e.notificaciones.enviarConfirmacionPedido).not.toHaveBeenCalled()
  })

  it('caso 6 · el webhook no llega: la conciliación le pregunta a la pasarela', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    e.proveedor.simular(referencia, 'aprobado', 100000) // pagó, pero el webhook se perdió

    const aplicados = await e.vencimiento.conciliar(new Date(T0.getTime() + 15 * MIN))

    expect(aplicados).toBe(1)
    expect(e.prisma.t.pedido[0].estado).toBe('pagado')
  })

  it('caso 6 · el mantenimiento recupera un pago sin webhook aunque el pedido ya debiera vencer', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    e.proveedor.simular(referencia, 'aprobado', 100000)

    await e.vencimiento.mantenimiento(new Date(T0.getTime() + 40 * MIN))

    expect(e.prisma.t.pedido[0].estado).toBe('pagado')
    expect(e.stock()).toBe(1)
  })

  it('caso 6 · la página de resultado consulta a la pasarela si sigue pendiente', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    e.proveedor.simular(referencia, 'aprobado', 100000)

    const estado = await e.pagos.estadoPublico(referencia)

    expect(estado).toMatchObject({ estado: 'aprobado', estadoDueno: 'pagado', tipo: 'pedido', monto: 100000 })
    // Sin datos personales: la referencia viaja en una URL.
    expect(JSON.stringify(estado)).not.toMatch(/ana@x\.co|Ana|3001234567/)
  })

  it('caso 7 · el mismo webhook dos veces se aplica una sola vez', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)

    await e.webhook(referencia, 'aprobado', 100000)
    await e.webhook(referencia, 'aprobado', 100000)

    expect(e.notificaciones.enviarConfirmacionPedido).toHaveBeenCalledTimes(1)
    expect(e.stock()).toBe(1)
  })

  it('caso 7 · un rechazo que llega tarde no deshace la aprobación', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(referencia, 'aprobado', 100000)
    await e.webhook(referencia, 'rechazado', 100000)

    expect(e.pagoDe(referencia).estado).toBe('aprobado')
    expect(e.prisma.t.pedido[0].estado).toBe('pagado')
  })

  it('caso 10 · reintenta en la pasarela con la misma referencia: la aprobación cuenta', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(referencia, 'rechazado', 100000, { proveedorTxId: 'tx-1' })
    await e.webhook(referencia, 'aprobado', 100000, { proveedorTxId: 'tx-2' })

    expect(e.pagoDe(referencia)).toMatchObject({ estado: 'aprobado', proveedorTxId: 'tx-2' })
    expect(e.prisma.t.pedido[0].estado).toBe('pagado')
    expect(e.stock()).toBe(1)
    expect(e.notificaciones.enviarConfirmacionPedido).toHaveBeenCalledTimes(1)
  })

  it('caso 10 · el reintento aprobado llega después de vencer y sin stock: revisión', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(referencia, 'rechazado', 100000, { proveedorTxId: 'tx-1' })
    await e.vencimiento.vencerPendientes(new Date(T0.getTime() + 31 * MIN))
    e.prisma.t.producto[0].stock = 0 // otro cliente se llevó el stock liberado

    await e.webhook(referencia, 'aprobado', 100000, { proveedorTxId: 'tx-2' })

    expect(e.pagoDe(referencia)).toMatchObject({ estado: 'aprobado', proveedorTxId: 'tx-2' })
    expect(e.prisma.t.pedido[0].estado).toBe('requiere_revision')
    expect(e.notificaciones.alertarPago).toHaveBeenCalledTimes(1)
  })

  it('caso 10 · si el webhook del reintento se pierde, la conciliación lo encuentra', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(referencia, 'rechazado', 100000, { proveedorTxId: 'tx-1' })
    e.proveedor.simular(referencia, 'aprobado', 100000, { proveedorTxId: 'tx-2' })

    await e.vencimiento.conciliar(new Date(T0.getTime() + 15 * MIN))

    expect(e.pagoDe(referencia).estado).toBe('aprobado')
    expect(e.prisma.t.pedido[0].estado).toBe('pagado')
  })

  it('caso 10 · una transacción ajena que no es aprobación no toca el pago', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(referencia, 'aprobado', 100000, { proveedorTxId: 'tx-1' })
    await e.webhook(referencia, 'rechazado', 100000, { proveedorTxId: 'tx-2' })
    await e.webhook(referencia, 'anulado', 100000, { proveedorTxId: 'tx-3' })

    expect(e.pagoDe(referencia)).toMatchObject({ estado: 'aprobado', proveedorTxId: 'tx-1' })
    expect(e.prisma.t.pedido[0].estado).toBe('pagado')
  })

  it('caso 8 · anulación después de aprobado: a revisión, sin cancelar solo', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(referencia, 'aprobado', 100000)
    await e.webhook(referencia, 'anulado', 100000)

    expect(e.pagoDe(referencia).estado).toBe('anulado')
    expect(e.prisma.t.pedido[0].estado).toBe('requiere_revision')
    expect(e.stock()).toBe(1) // no se devolvió: puede estar ya despachado
    expect(e.notificaciones.alertarPago).toHaveBeenCalledWith(expect.objectContaining({ requiereRevision: true }))
  })
})

describe('Pagos: otras defensas', () => {
  it('rechaza un webhook con firma falsa sin tocar nada', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    const { body } = e.proveedor.simular(referencia, 'aprobado', 100000)

    await expect(e.pagos.procesarWebhook(body, { [CABECERA_FIRMA_FALSA]: 'inventada' }))
      .rejects.toThrow(FirmaInvalidaError)
    expect(e.prisma.t.pedido[0].estado).toBe('pendiente_pago')
  })

  it('un monto distinto al esperado no da el pedido por pagado', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(referencia, 'aprobado', 1000)

    expect(e.prisma.t.pedido[0].estado).toBe('requiere_revision')
    expect(e.notificaciones.enviarConfirmacionPedido).not.toHaveBeenCalled()
  })

  it('dos intentos aprobados: el segundo avisa de cobro doble', async () => {
    const e = montar()
    e.pedido()
    const a = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    const b = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0) // dos pestañas
    await e.webhook(a.referencia, 'aprobado', 100000)
    await e.webhook(b.referencia, 'aprobado', 100000)

    expect(e.prisma.t.pedido[0].estado).toBe('pagado')
    expect(e.notificaciones.alertarPago).toHaveBeenCalledWith(
      expect.objectContaining({ requiereRevision: false, motivo: expect.stringContaining('Cobro doble') }),
    )
  })

  it('el pago de un pedido cancelado en el panel pide revisión', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    e.prisma.t.pedido[0].estado = 'cancelado'
    await e.webhook(referencia, 'aprobado', 100000)

    expect(e.prisma.t.pedido[0].estado).toBe('requiere_revision')
  })

  it('no abre intentos sobre algo vencido, ya pagado o sin pasarela', async () => {
    const e = montar()
    e.pedido()
    await expect(e.pagos.crearIntento({ pedidoId: 'ped1' }, new Date(T0.getTime() + 31 * MIN)))
      .rejects.toThrow(ConflictException)

    e.prisma.t.pedido[0].estado = 'pagado'
    await expect(e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)).rejects.toThrow(ConflictException)

    const apagado = new PagosService(e.prisma as any, e.notificaciones as any, null)
    expect(apagado.activo).toBe(false)
    await expect(apagado.crearIntento({ pedidoId: 'ped1' }, T0)).rejects.toThrow(ServiceUnavailableException)
  })

  it('cobra el monto guardado en el pedido, nunca uno que mande el cliente', async () => {
    const e = montar()
    e.pedido()
    const intento = await e.pagos.crearIntento({ pedidoId: 'ped1', monto: 1 } as any, T0)
    expect(intento.monto).toBe(100000)
    expect(e.pagoDe(intento.referencia).monto).toBe(100000)
  })
})

describe('Pagos: reservas', () => {
  it('cobra el abono congelado y, aprobado, la deja pendiente de confirmar', async () => {
    const e = montar()
    e.reserva()
    const { referencia, monto } = await e.pagos.crearIntento({ reservaId: 'res1' }, T0)
    expect(monto).toBe(60000)

    await e.webhook(referencia, 'aprobado', 60000)

    expect(e.prisma.t.reserva[0].estado).toBe('pendiente')
    expect(e.notificaciones.enviarConfirmacionReserva).toHaveBeenCalledTimes(1)
  })

  it('vence sin pago y revive si el abono llega tarde', async () => {
    const e = montar()
    e.reserva()
    const { referencia } = await e.pagos.crearIntento({ reservaId: 'res1' }, T0)
    await e.vencimiento.vencerPendientes(new Date(T0.getTime() + 31 * MIN))
    expect(e.prisma.t.reserva[0].estado).toBe('expirada')

    await e.webhook(referencia, 'aprobado', 60000)
    expect(e.prisma.t.reserva[0].estado).toBe('pendiente')
  })
})

describe('Pagos: avisos al cliente', () => {
  // El aviso de rechazo mira la hora real (llega por webhook, sin reloj
  // inyectado), así que aquí el plazo se fija contra Date.now() y no contra T0.
  const enMedia = () => new Date(Date.now() + 30 * MIN)

  it('aprobado: el acuse de pedido lleva lo que se cobró', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(referencia, 'aprobado', 100000)

    expect(e.notificaciones.enviarConfirmacionPedido).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ped1' }), { monto: 100000 },
    )
  })

  it('aprobado: el acuse de reserva lleva el abono y la reserva con su total congelado', async () => {
    const e = montar()
    e.reserva()
    const { referencia } = await e.pagos.crearIntento({ reservaId: 'res1' }, T0)
    await e.webhook(referencia, 'aprobado', 60000)

    expect(e.notificaciones.enviarConfirmacionReserva).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'res1', total: 200000, porcentajeAbono: 30 }), { monto: 60000 },
    )
  })

  it('rechazado a tiempo: le escribe con el enlace de reintento y el plazo', async () => {
    const e = montar()
    const venceEn = enMedia()
    e.pedido({ venceEn })
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' })
    await e.webhook(referencia, 'rechazado', 100000, { motivo: 'Fondos insuficientes' })

    expect(e.notificaciones.enviarPagoRechazado).toHaveBeenCalledWith({
      tipo: 'pedido', nombre: 'Ana', email: 'ana@x.co', referencia, monto: 100000, venceEn,
    })
    expect(e.notificaciones.alertarPago).not.toHaveBeenCalled()
  })

  it('rechazado cuando ya no hay tiempo de reintentar: no le escribe', async () => {
    const e = montar()
    e.pedido({ venceEn: enMedia() })
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' })
    e.prisma.t.pedido[0].venceEn = new Date(Date.now() - MIN)
    await e.webhook(referencia, 'rechazado', 100000)

    expect(e.notificaciones.enviarPagoRechazado).not.toHaveBeenCalled()
  })

  it('rechazo tardío de un pedido ya pagado con otro intento: no le escribe', async () => {
    const e = montar()
    e.pedido({ venceEn: enMedia() })
    const a = await e.pagos.crearIntento({ pedidoId: 'ped1' })
    const b = await e.pagos.crearIntento({ pedidoId: 'ped1' })
    await e.webhook(b.referencia, 'aprobado', 100000)
    await e.webhook(a.referencia, 'rechazado', 100000)

    expect(e.notificaciones.enviarPagoRechazado).not.toHaveBeenCalled()
  })

  it('un error de la pasarela no es un rechazo: no le escribe', async () => {
    const e = montar()
    e.pedido({ venceEn: enMedia() })
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' })
    const { body, firma } = e.proveedor.simular(referencia, 'error' as any, 100000)
    await e.pagos.procesarWebhook(body, { [CABECERA_FIRMA_FALSA]: firma })

    expect(e.notificaciones.enviarPagoRechazado).not.toHaveBeenCalled()
  })

  it('caso 5 sin stock: le dice que su pago llegó y que lo contactan', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.vencimiento.vencerPendientes(new Date(T0.getTime() + 31 * MIN))
    e.prisma.t.producto[0].stock = 1
    await e.webhook(referencia, 'aprobado', 100000)

    expect(e.notificaciones.enviarPagoEnRevisionCliente).toHaveBeenCalledWith({
      tipo: 'pedido', id: 'ped1', nombre: 'Ana', email: 'ana@x.co', monto: 100000,
    })
  })

  it('anulación: al cliente no le dice que recibió su pago, porque el dinero volvió', async () => {
    const e = montar()
    e.pedido()
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(referencia, 'aprobado', 100000)
    await e.webhook(referencia, 'anulado', 100000)

    expect(e.notificaciones.enviarPagoEnRevisionCliente).not.toHaveBeenCalled()
    expect(e.notificaciones.alertarPago).toHaveBeenCalled()
  })

  it('si falla el correo al cliente, el aviso al admin sale igual', async () => {
    const e = montar()
    e.pedido()
    e.notificaciones.enviarPagoEnRevisionCliente.mockRejectedValueOnce(new Error('Gmail caído'))
    const { referencia } = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(referencia, 'aprobado', 1000) // monto distinto: a revisión

    expect(e.notificaciones.alertarPago).toHaveBeenCalledWith(expect.objectContaining({ requiereRevision: true }))
  })
})

describe('Pagos: lo que usa el front', () => {
  it('reintenta desde la referencia anterior, que es lo único que conoce la página de resultado', async () => {
    const e = montar()
    e.pedido()
    const primero = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    await e.webhook(primero.referencia, 'rechazado', 100000)

    const segundo = await e.pagos.reintentar(primero.referencia, 'es', T0)

    expect(segundo.referencia).not.toBe(primero.referencia)
    expect(e.pagoDe(segundo.referencia).pedidoId).toBe('ped1')
  })

  it('devuelve al cliente a la página de resultado en su idioma', async () => {
    const e = montar()
    e.pedido()
    e.reserva()
    const es = await e.pagos.crearIntento({ pedidoId: 'ped1' }, T0)
    const en = await e.pagos.crearIntento({ reservaId: 'res1', idioma: 'en' }, T0)

    expect(new URL(es.url).pathname).toBe('/checkout/resultado')
    expect(new URL(en.url).pathname).toBe('/en/book/result')
    expect(new URL(en.url).searchParams.get('ref')).toBe(en.referencia)
  })

  it('anuncia si cobra y con qué porcentaje, con el mismo respaldo que la reserva', async () => {
    const e = montar()
    expect(await e.pagos.configPublica()).toEqual({ activo: true, porcentajeAbono: 30 })
    const apagado = new PagosService(e.prisma as any, e.notificaciones as any, null)
    expect((await apagado.configPublica()).activo).toBe(false)
  })

  it('el estado da el código corto y el total, para el saldo de la reserva', async () => {
    const e = montar()
    e.reserva()
    const { referencia } = await e.pagos.crearIntento({ reservaId: 'res1' }, T0)
    expect(await e.pagos.estadoPublico(referencia)).toMatchObject({
      tipo: 'reserva', monto: 60000, total: 200000, codigo: 'VC-RES1',
    })
  })
})
