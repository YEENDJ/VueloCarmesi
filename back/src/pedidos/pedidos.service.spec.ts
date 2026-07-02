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
  },
  pedido: { create: jest.fn().mockResolvedValue({ id: 'ped1' }) },
}

const mockPrisma = {
  $transaction: jest.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
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
})
