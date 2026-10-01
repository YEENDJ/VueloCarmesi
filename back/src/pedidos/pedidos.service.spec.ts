import 'reflect-metadata'
import { Test } from '@nestjs/testing'
import { ConflictException } from '@nestjs/common'
import { PedidosService } from './pedidos.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { PagosService } from '../pagos/pagos.service'
import { VencimientoService } from '../pagos/vencimiento.service'

const mockTx = {
  producto: {
    findMany: jest.fn().mockResolvedValue([
      { id: 'p1', nombre: 'Chocolate', precio: 1000, stock: 10 },
    ]),
    update: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  pedido: {
    create: jest.fn().mockResolvedValue({ id: 'ped1' }),
    update: jest.fn().mockResolvedValue({ id: 'ped1' }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
}

const mockPrisma = {
  $transaction: jest.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
  pedido: { findUnique: jest.fn(), delete: jest.fn() },
  pago: { count: jest.fn() },
}

const DATOS = {
  nombre: 'Ana', email: 'ana@example.com', telefono: '3001234567',
  direccion: 'Calle 10', ciudad: 'Medellín', codigoPostal: '050001',
}

const mockNotificaciones = {
  enviarConfirmacionPedido: jest.fn().mockResolvedValue(undefined),
}

// Sin pasarela por defecto: es el flujo que hay hoy en producción.
const mockPagos = { activo: false }
const mockVencimiento = { vencerPendientes: jest.fn().mockResolvedValue({ pedidos: 0, reservas: 0 }) }

describe('PedidosService.create', () => {
  let service: PedidosService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PedidosService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificacionesService, useValue: mockNotificaciones },
        { provide: PagosService, useValue: mockPagos },
        { provide: VencimientoService, useValue: mockVencimiento },
      ],
    }).compile()
    service = module.get(PedidosService)
    jest.clearAllMocks()
    mockPrisma.$transaction.mockImplementation((cb: (tx: typeof mockTx) => unknown) => cb(mockTx))
    mockTx.producto.findMany.mockResolvedValue([{ id: 'p1', nombre: 'Chocolate', precio: 1000, stock: 10 }])
    mockTx.pedido.create.mockResolvedValue({ id: 'ped1' })
    mockTx.producto.updateMany.mockResolvedValue({ count: 1 })
    mockPagos.activo = false
  })

  it('sin pasarela nace en pendiente y avisa al momento, como siempre', async () => {
    mockTx.pedido.create.mockResolvedValue({ id: 'ped1', estado: 'pendiente' })
    await service.create({ ...DATOS, items: [{ productoId: 'p1', cantidad: 1 }] })
    const data = mockTx.pedido.create.mock.calls[0][0].data
    expect(data.estado).toBeUndefined()
    expect(data.venceEn).toBeUndefined()
    expect(mockNotificaciones.enviarConfirmacionPedido).toHaveBeenCalled()
  })

  it('con pasarela nace esperando pago, con plazo, y no avisa hasta que se pague', async () => {
    mockPagos.activo = true
    mockTx.pedido.create.mockResolvedValue({ id: 'ped1', estado: 'pendiente_pago' })
    await service.create({ ...DATOS, items: [{ productoId: 'p1', cantidad: 1 }] })
    const data = mockTx.pedido.create.mock.calls[0][0].data
    expect(data.estado).toBe('pendiente_pago')
    expect(data.venceEn).toBeInstanceOf(Date)
    expect(mockNotificaciones.enviarConfirmacionPedido).not.toHaveBeenCalled()
  })

  it('suelta los pedidos vencidos antes de revisar el stock', async () => {
    await service.create({ ...DATOS, items: [{ productoId: 'p1', cantidad: 1 }] })
    expect(mockVencimiento.vencerPendientes).toHaveBeenCalled()
  })

  it('vende igual si el vencimiento previo falla', async () => {
    mockVencimiento.vencerPendientes.mockRejectedValueOnce(new Error('Neon dormido'))
    await expect(service.create({ ...DATOS, items: [{ productoId: 'p1', cantidad: 1 }] })).resolves.toBeDefined()
  })

  it('reenvía teléfono, ciudad y código postal al crear el pedido', async () => {
    await service.create({
      nombre: 'Ana', email: 'ana@example.com', telefono: '3001234567',
      direccion: 'Calle 10', ciudad: 'Medellín', codigoPostal: '050001',
      items: [{ productoId: 'p1', cantidad: 2 }],
    })

    expect(mockTx.pedido.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          telefono: '3001234567', ciudad: 'Medellín', codigoPostal: '050001',
        }),
      }),
    )
  })

  it('junta las líneas repetidas del mismo producto antes de revisar el stock', async () => {
    await expect(service.create({
      ...DATOS,
      items: [{ productoId: 'p1', cantidad: 8 }, { productoId: 'p1', cantidad: 8 }],
    })).rejects.toThrow('Stock insuficiente')
    expect(mockTx.pedido.create).not.toHaveBeenCalled()
  })

  it('descuenta el stock con la condición dentro del UPDATE', async () => {
    await service.create({ ...DATOS, items: [{ productoId: 'p1', cantidad: 3 }] })
    expect(mockTx.producto.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', stock: { gte: 3 } },
      data: { stock: { decrement: 3 } },
    })
  })

  it('falla si otro pedido se llevó el stock entre la lectura y el descuento', async () => {
    mockTx.producto.updateMany.mockResolvedValue({ count: 0 })
    await expect(service.create({ ...DATOS, items: [{ productoId: 'p1', cantidad: 3 }] }))
      .rejects.toThrow('Stock insuficiente')
    expect(mockTx.pedido.create).not.toHaveBeenCalled()
  })

  it('descarta el honeypot sin tocar la base ni avisar', async () => {
    const res = await service.create({
      ...DATOS, website: 'http://spam', items: [{ productoId: 'p1', cantidad: 1 }],
    })
    expect(res).toMatchObject({ id: 'descartado' })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    expect(mockNotificaciones.enviarConfirmacionPedido).not.toHaveBeenCalled()
  })
})

describe('PedidosService.update', () => {
  let service: PedidosService
  const pedido = (estado: string) => ({
    id: 'ped1', estado, items: [{ productoId: 'p1', cantidad: 2 }, { productoId: 'p2', cantidad: 1 }],
  })

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PedidosService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificacionesService, useValue: mockNotificaciones },
        { provide: PagosService, useValue: mockPagos },
        { provide: VencimientoService, useValue: mockVencimiento },
      ],
    }).compile()
    service = module.get(PedidosService)
    jest.clearAllMocks()
    mockPrisma.$transaction.mockImplementation((cb: (tx: typeof mockTx) => unknown) => cb(mockTx))
  })

  it('devuelve las unidades al inventario al cancelar', async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(pedido('pendiente'))
    await service.update('ped1', { estado: 'cancelado' })
    expect(mockTx.producto.update).toHaveBeenCalledWith({
      where: { id: 'p1' }, data: { stock: { increment: 2 } },
    })
    expect(mockTx.producto.update).toHaveBeenCalledWith({
      where: { id: 'p2' }, data: { stock: { increment: 1 } },
    })
  })

  it('no toca el stock en los demás cambios de estado', async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(pedido('pendiente'))
    await service.update('ped1', { estado: 'enviado' })
    expect(mockTx.producto.update).not.toHaveBeenCalled()
    expect(mockTx.pedido.update).toHaveBeenCalled()
  })

  it('al cancelar, devuelve el stock solo si el pedido todavía lo tiene apartado', async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(pedido('requiere_revision'))
    mockTx.pedido.updateMany.mockResolvedValueOnce({ count: 0 }) // ya lo había soltado
    await service.update('ped1', { estado: 'cancelado' })
    expect(mockTx.pedido.updateMany).toHaveBeenCalledWith({
      where: { id: 'ped1', stockApartado: true }, data: { stockApartado: false },
    })
    expect(mockTx.producto.update).not.toHaveBeenCalled()
  })

  it('no reabre un pedido expirado', async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(pedido('expirado'))
    await expect(service.update('ped1', { estado: 'pagado' })).rejects.toThrow('expirado')
  })

  it('no reabre un pedido cancelado', async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(pedido('cancelado'))
    await expect(service.update('ped1', { estado: 'pendiente' })).rejects.toThrow('cancelado')
    expect(mockTx.pedido.update).not.toHaveBeenCalled()
  })

  it('cancelar dos veces no devuelve el stock dos veces', async () => {
    mockPrisma.pedido.findUnique.mockResolvedValue(pedido('cancelado'))
    await service.update('ped1', { estado: 'cancelado' })
    expect(mockTx.producto.update).not.toHaveBeenCalled()
  })
})

describe('PedidosService.remove', () => {
  let service: PedidosService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PedidosService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificacionesService, useValue: mockNotificaciones },
        { provide: PagosService, useValue: mockPagos },
        { provide: VencimientoService, useValue: mockVencimiento },
      ],
    }).compile()
    service = module.get(PedidosService)
    jest.clearAllMocks()
    mockPrisma.pedido.findUnique.mockResolvedValue({ id: 'ped1', items: [] })
  })

  it('borra un pedido sin pagos', async () => {
    mockPrisma.pago.count.mockResolvedValue(0)
    await service.remove('ped1')
    expect(mockPrisma.pedido.delete).toHaveBeenCalledWith({ where: { id: 'ped1' } })
  })

  it('no borra un pedido con pagos: el cobro es registro de un reclamo', async () => {
    mockPrisma.pago.count.mockResolvedValue(2)
    await expect(service.remove('ped1')).rejects.toThrow(ConflictException)
    expect(mockPrisma.pago.count).toHaveBeenCalledWith({ where: { pedidoId: 'ped1' } })
    expect(mockPrisma.pedido.delete).not.toHaveBeenCalled()
  })
})
