import { Test } from '@nestjs/testing'
import { BadRequestException, ConflictException } from '@nestjs/common'
import { AvesService } from './aves.service'
import { PrismaService } from '../prisma.service'
import { TraduccionService } from '../traduccion/traduccion.service'

const mockPrisma = {
  ave: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}
const mockTraduccion = { traducir: jest.fn() }

const AVE = {
  id: 'a1',
  cientifico: 'Eurypyga helias',
  ingles: 'Sunbittern',
  local: 'Tigana',
  tipo: 'residente',
  imagen: '/images/aves/tigana.jpg',
  foco: '50% 50%',
  alt: 'Tigana caminando',
  altEn: 'Sunbittern walking',
  orden: 1,
}

describe('AvesService', () => {
  let service: AvesService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AvesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TraduccionService, useValue: mockTraduccion },
      ],
    }).compile()
    service = module.get(AvesService)
    jest.clearAllMocks()
    mockPrisma.ave.findUnique.mockResolvedValue(AVE)
    mockPrisma.ave.update.mockImplementation(({ data }) => Promise.resolve({ ...AVE, ...data }))
    mockTraduccion.traducir.mockResolvedValue({ campos: { alt: 'Sunbittern on the shore' }, huellas: {} })
  })

  it('retraduce el alt si cambió el español y el inglés quedó igual', async () => {
    await service.update('a1', { alt: 'Tigana en la orilla', altEn: AVE.altEn })
    expect(mockTraduccion.traducir).toHaveBeenCalledWith({ alt: 'Tigana en la orilla' }, ['alt'], [])
    expect(mockPrisma.ave.update.mock.calls[0][0].data.altEn).toBe('Sunbittern on the shore')
  })

  it('respeta el inglés escrito a mano en el mismo guardado', async () => {
    await service.update('a1', { alt: 'Tigana en la orilla', altEn: 'Sunbittern by the creek' })
    expect(mockTraduccion.traducir).not.toHaveBeenCalled()
    expect(mockPrisma.ave.update.mock.calls[0][0].data.altEn).toBe('Sunbittern by the creek')
  })

  it('no gasta DeepL si solo cambió el encuadre', async () => {
    await service.update('a1', { foco: '30% 50%' })
    expect(mockTraduccion.traducir).not.toHaveBeenCalled()
  })

  it('sin DeepL guarda igual, con el inglés vacío', async () => {
    mockTraduccion.traducir.mockResolvedValue(null)
    await service.update('a1', { alt: 'Otra cosa' })
    expect(mockPrisma.ave.update.mock.calls[0][0].data.altEn).toBe('')
  })

  it('no deja una residente sin foto', async () => {
    await expect(service.update('a1', { imagen: '' })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('una migratoria sí puede ir sin foto, y va al final de su grupo', async () => {
    mockPrisma.ave.findFirst.mockResolvedValue({ orden: 2 })
    mockPrisma.ave.create.mockImplementation(({ data }) => Promise.resolve(data))
    const creada = await service.create({
      cientifico: 'Piranga rubra', ingles: 'Summer Tanager', local: 'Piranga roja', tipo: 'migratoria',
    })
    expect(creada.orden).toBe(3)
  })

  it('un nombre científico repetido es un 409, no un 500', async () => {
    mockPrisma.ave.update.mockRejectedValue(Object.assign(new Error('dup'), { code: 'P2002' }))
    await expect(service.update('a1', { cientifico: 'Piranga rubra' })).rejects.toBeInstanceOf(ConflictException)
  })

  it('en inglés el alt sale en inglés, y cae al español si falta', async () => {
    mockPrisma.ave.findMany.mockResolvedValue([AVE, { ...AVE, id: 'a2', altEn: '' }])
    const [conIngles, sinIngles] = await service.findAll('en')
    expect(conIngles.alt).toBe('Sunbittern walking')
    expect(sinIngles.alt).toBe('Tigana caminando')
  })
})
