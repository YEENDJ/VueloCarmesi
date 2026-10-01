import { Test } from '@nestjs/testing'
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { ReservasService } from './reservas.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { PagosService } from '../pagos/pagos.service'
import { PAGOS_PANEL } from '../pagos/panel'
import { hoyBogota, sumarDias } from './fecha-reserva.util'

const mockPrisma = {
  experiencia: {
    findUnique: jest.fn(),
  },
  reserva: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  pago: {
    count: jest.fn(),
  },
  siteConfig: {
    findUnique: jest.fn(),
  },
}

// Sin pasarela por defecto: es el flujo que hay hoy en producción.
const mockPagos = { activo: false }

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
        { provide: PagosService, useValue: mockPagos },
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
      include: { experiencia: { select: { id: true, nombre: true } }, pagos: PAGOS_PANEL },
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

describe('ReservasService.create', () => {
  let service: ReservasService

  // Pasado mañana: siempre dentro del rango, sea la hora que sea en Bogotá.
  const fechaValida = sumarDias(hoyBogota(), 2)

  const dto = {
    experienciaId: 'exp1',
    fecha: fechaValida,
    cantidadPersonas: 2,
    nombre: 'Ana García',
    email: 'ana@test.com',
    telefono: '3001234567',
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificacionesService, useValue: mockNotificaciones },
        { provide: PagosService, useValue: mockPagos },
      ],
    }).compile()
    service = module.get(ReservasService)
    jest.clearAllMocks()
    mockPrisma.experiencia.findUnique.mockResolvedValue({ capacidad: 12, archivada: false, precio: 95000 })
    mockPrisma.reserva.create.mockResolvedValue({ ...reservaBase, estado: 'pendiente' })
    mockPrisma.siteConfig.findUnique.mockResolvedValue(null)
    mockPagos.activo = false
  })

  it('guarda el total ofrecido aunque no haya pasarela, y sigue el flujo manual', async () => {
    await service.create(dto)
    const data = mockPrisma.reserva.create.mock.calls[0][0].data
    expect(data.total).toBe(190000)
    expect(data.estado).toBeUndefined()
    expect(data.montoAbono).toBeUndefined()
    expect(mockNotificaciones.enviarConfirmacionReserva).toHaveBeenCalled()
  })

  it('con pasarela congela el porcentaje y el abono, y espera el pago para avisar', async () => {
    mockPagos.activo = true
    mockPrisma.siteConfig.findUnique.mockResolvedValue({ key: 'reservas_abono_porcentaje', value: '40' })
    mockPrisma.reserva.create.mockResolvedValue({ ...reservaBase, estado: 'pendiente_pago' })
    await service.create(dto)
    const data = mockPrisma.reserva.create.mock.calls[0][0].data
    expect(data).toMatchObject({ total: 190000, porcentajeAbono: 40, montoAbono: 76000, estado: 'pendiente_pago' })
    expect(data.venceEn).toBeInstanceOf(Date)
    expect(mockNotificaciones.enviarConfirmacionReserva).not.toHaveBeenCalled()
  })

  it('sin porcentaje configurado cobra el 30', async () => {
    mockPagos.activo = true
    await service.create(dto)
    expect(mockPrisma.reserva.create.mock.calls[0][0].data).toMatchObject({ porcentajeAbono: 30, montoAbono: 57000 })
  })

  it('con un porcentaje dañado en la base cobra el 30, nunca cero', async () => {
    mockPagos.activo = true
    mockPrisma.siteConfig.findUnique.mockResolvedValue({ key: 'reservas_abono_porcentaje', value: '30%' })
    await service.create(dto)
    expect(mockPrisma.reserva.create.mock.calls[0][0].data).toMatchObject({ porcentajeAbono: 30, montoAbono: 57000 })
  })

  it('una experiencia de precio cero no pasa por la pasarela', async () => {
    mockPagos.activo = true
    mockPrisma.experiencia.findUnique.mockResolvedValue({ capacidad: 12, archivada: false, precio: 0 })
    await service.create(dto)
    const data = mockPrisma.reserva.create.mock.calls[0][0].data
    expect(data.estado).toBeUndefined()
    expect(data.total).toBe(0)
  })

  it('crea la reserva sin pasarle el honeypot a Prisma', async () => {
    await service.create({ ...dto, website: '' })
    const data = mockPrisma.reserva.create.mock.calls[0][0].data
    expect(data).not.toHaveProperty('website')
    expect(data.fecha).toEqual(new Date(fechaValida))
  })

  it('descarta en silencio si el honeypot viene lleno', async () => {
    const res = await service.create({ ...dto, website: 'http://spam' })
    expect(res).toMatchObject({ id: 'descartada' })
    expect(mockPrisma.reserva.create).not.toHaveBeenCalled()
  })

  it('rechaza una fecha de hoy o anterior', async () => {
    await expect(service.create({ ...dto, fecha: hoyBogota() }))
      .rejects.toThrow(BadRequestException)
    expect(mockPrisma.reserva.create).not.toHaveBeenCalled()
  })

  it('rechaza una fecha más allá del horizonte', async () => {
    await expect(service.create({ ...dto, fecha: sumarDias(hoyBogota(), 400) }))
      .rejects.toThrow(BadRequestException)
  })

  it('rechaza más personas que la capacidad de la experiencia', async () => {
    await expect(service.create({ ...dto, cantidadPersonas: 13 }))
      .rejects.toThrow(BadRequestException)
  })

  it('responde 404 si la experiencia no existe', async () => {
    mockPrisma.experiencia.findUnique.mockResolvedValue(null)
    await expect(service.create(dto)).rejects.toThrow(NotFoundException)
  })

  it('responde 404 si la experiencia está archivada', async () => {
    mockPrisma.experiencia.findUnique.mockResolvedValue({ capacidad: 12, archivada: true })
    await expect(service.create(dto)).rejects.toThrow(NotFoundException)
  })
})

describe('ReservasService.remove', () => {
  let service: ReservasService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificacionesService, useValue: mockNotificaciones },
        { provide: PagosService, useValue: mockPagos },
      ],
    }).compile()
    service = module.get(ReservasService)
    jest.clearAllMocks()
    mockPrisma.reserva.findUnique.mockResolvedValue(reservaBase)
  })

  it('borra una reserva sin pagos', async () => {
    mockPrisma.pago.count.mockResolvedValue(0)
    await service.remove('1')
    expect(mockPrisma.reserva.delete).toHaveBeenCalledWith({ where: { id: '1' } })
  })

  it('no borra una reserva con pagos: el cobro es registro de un reclamo', async () => {
    mockPrisma.pago.count.mockResolvedValue(1)
    await expect(service.remove('1')).rejects.toThrow(ConflictException)
    expect(mockPrisma.pago.count).toHaveBeenCalledWith({ where: { reservaId: '1' } })
    expect(mockPrisma.reserva.delete).not.toHaveBeenCalled()
  })
})
