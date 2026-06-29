import { Test } from '@nestjs/testing'
import { ExperienciasService } from './experiencias.service'
import { PrismaService } from '../prisma.service'

const mockPrisma = {
  experiencia: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

describe('ExperienciasService.findAll', () => {
  let service: ExperienciasService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExperienciasService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get(ExperienciasService)
    jest.clearAllMocks()
  })

  it('ordena destacadas primero cuando no hay filtro', async () => {
    mockPrisma.experiencia.findMany.mockResolvedValue([])
    await service.findAll()
    expect(mockPrisma.experiencia.findMany).toHaveBeenCalledWith({
      orderBy: [{ destacada: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('filtra solo destacadas cuando soloDestacadas es true', async () => {
    mockPrisma.experiencia.findMany.mockResolvedValue([])
    await service.findAll(true)
    expect(mockPrisma.experiencia.findMany).toHaveBeenCalledWith({
      where: { destacada: true },
      orderBy: [{ destacada: 'desc' }, { createdAt: 'desc' }],
    })
  })
})
