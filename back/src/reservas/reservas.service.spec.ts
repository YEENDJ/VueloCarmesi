import { Test } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ReservasService } from './reservas.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'

const mockPrisma = {
  reserva: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

const mockNotificaciones = {
  enviarConfirmacionReserva: jest.fn().mockResolvedValue(undefined),
  enviarReservaConfirmadaCliente: jest.fn().mockResolvedValue(undefined),
  enviarReservaCanceladaCliente: jest.fn().mockResolvedValue(undefined),
}

const reservaBase = {
  id: '1',
  nombre: 'Ana García',
  email: 'ana@test.com',
  telefono: '3001234567',
  fecha: new Date('2026-08-15'),
  cantidadPersonas: 2,
  experienciaId: 'exp1',
  experiencia: { id: 'exp1', nombre: 'Agroturismo' },
  notas: null,
  createdAt: new Date(),
}

describe('ReservasService.cambiarEstado', () => {
  let service: ReservasService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificacionesService, useValue: mockNotificaciones },
      ],
    }).compile()
    service = module.get(ReservasService)
    jest.clearAllMocks()
  })

  it('lanza NotFoundException si la reserva no existe', async () => {
    mockPrisma.reserva.findUnique.mockResolvedValue(null)
    await expect(service.cambiarEstado('id-fake', { estado: 'confirmada' }))
      .rejects.toThrow(NotFoundException)
  })

  it('lanza BadRequestException al cambiar de cancelada a confirmada', async () => {
    mockPrisma.reserva.findUnique.mockResolvedValue({ ...reservaBase, estado: 'cancelada' })
    await expect(service.cambiarEstado('1', { estado: 'confirmada' }))
      .rejects.toThrow(BadRequestException)
  })

  it('lanza BadRequestException al cambiar de cancelada a pendiente', async () => {
    mockPrisma.reserva.findUnique.mockResolvedValue({ ...reservaBase, estado: 'cancelada' })
    await expect(service.cambiarEstado('1', { estado: 'pendiente' }))
      .rejects.toThrow(BadRequestException)
  })

  it('actualiza estado a confirmada y llama enviarReservaConfirmadaCliente', async () => {
    mockPrisma.reserva.findUnique.mockResolvedValue({ ...reservaBase, estado: 'pendiente' })
    const updated = { ...reservaBase, estado: 'confirmada' }
    mockPrisma.reserva.update.mockResolvedValue(updated)

    const result = await service.cambiarEstado('1', { estado: 'confirmada' })

    expect(mockPrisma.reserva.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { estado: 'confirmada' },
      include: { experiencia: { select: { id: true, nombre: true } } },
    })
    expect(result.estado).toBe('confirmada')
    await new Promise(r => setImmediate(r))
    expect(mockNotificaciones.enviarReservaConfirmadaCliente).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'confirmada' })
    )
    expect(mockNotificaciones.enviarReservaCanceladaCliente).not.toHaveBeenCalled()
  })

  it('actualiza estado a cancelada y llama enviarReservaCanceladaCliente con motivo', async () => {
    mockPrisma.reserva.findUnique.mockResolvedValue({ ...reservaBase, estado: 'pendiente' })
    const updated = { ...reservaBase, estado: 'cancelada' }
    mockPrisma.reserva.update.mockResolvedValue(updated)

    await service.cambiarEstado('1', { estado: 'cancelada', motivo: 'Sin disponibilidad' })

    await new Promise(r => setImmediate(r))
    expect(mockNotificaciones.enviarReservaCanceladaCliente).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'cancelada' }),
      'Sin disponibilidad'
    )
    expect(mockNotificaciones.enviarReservaConfirmadaCliente).not.toHaveBeenCalled()
  })

  it('no llama ninguna notificación al cambiar a pendiente', async () => {
    mockPrisma.reserva.findUnique.mockResolvedValue({ ...reservaBase, estado: 'confirmada' })
    mockPrisma.reserva.update.mockResolvedValue({ ...reservaBase, estado: 'pendiente' })

    await service.cambiarEstado('1', { estado: 'pendiente' })

    await new Promise(r => setImmediate(r))
    expect(mockNotificaciones.enviarReservaConfirmadaCliente).not.toHaveBeenCalled()
    expect(mockNotificaciones.enviarReservaCanceladaCliente).not.toHaveBeenCalled()
  })
})
