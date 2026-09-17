import { Test } from '@nestjs/testing'
import { ExperienciasService } from './experiencias.service'
import { PrismaService } from '../prisma.service'
import { SincronizadorTraduccion } from '../traduccion/sincronizador.service'

const mockPrisma = {
  experiencia: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

// El servicio espera la traduccion antes de responder, asi que en los tests
// hay que darle un doble. No se comprueba acá: la traduccion tiene su propia
// verificacion contra la API real en scripts/verificar-traduccion.ts.
const mockTraduccion = {
  experiencia: jest.fn().mockResolvedValue(undefined),
  producto: jest.fn().mockResolvedValue(undefined),
}

describe('ExperienciasService.findAll', () => {
  let service: ExperienciasService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExperienciasService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SincronizadorTraduccion, useValue: mockTraduccion },
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
      // Las traducciones viajan con la consulta: sin el include, la lectura
      // en inglés no tendría con qué fundir y devolvería todo en español.
      include: { traducciones: true },
    })
  })

  it('filtra solo destacadas cuando soloDestacadas es true', async () => {
    mockPrisma.experiencia.findMany.mockResolvedValue([])
    await service.findAll(true)
    expect(mockPrisma.experiencia.findMany).toHaveBeenCalledWith({
      where: { destacada: true },
      orderBy: [{ destacada: 'desc' }, { createdAt: 'desc' }],
      include: { traducciones: true },
    })
  })
})
