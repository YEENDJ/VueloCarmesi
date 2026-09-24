import 'reflect-metadata'
import { Test } from '@nestjs/testing'
import { PedidosService } from './pedidos.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'

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
  },
}

const mockPrisma = {
  $transaction: jest.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
  pedido: { findUnique: jest.fn() },
}

const DATOS = {
  nombre: 'Ana', email: 'ana@example.com', telefono: '3001234567',
  direccion: 'Calle 10', ciudad: 'Medellín', codigoPostal: '050001',
}

const mockNotificaciones = {
  enviarConfirmacionPedido: jest.fn().mockResolvedValue(undefined),
}

describe('PedidosService.create', () => {
  let service: PedidosService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PedidosService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificacionesService, useValue: mockNotificaciones },
      ],
    }).compile()
    service = module.get(PedidosService)
    jest.clearAllMocks()
    mockPrisma.$transaction.mockImplementation((cb: (tx: typeof mockTx) => unknown) => cb(mockTx))
    mockTx.producto.findMany.mockResolvedValue([{ id: 'p1', nombre: 'Chocolate', precio: 1000, stock: 10 }])
    mockTx.pedido.create.mockResolvedValue({ id: 'ped1' })
    mockTx.producto.updateMany.mockResolvedValue({ count: 1 })
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
