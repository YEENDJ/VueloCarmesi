import { Test } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { ExperienciasService } from './experiencias.service'
import { PrismaService } from '../prisma.service'
import { SincronizadorTraduccion } from '../traduccion/sincronizador.service'
import { HistorialSlugs } from '../slugs/historial-slugs.service'

const mockPrisma = {
  experiencia: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  experienciaTraduccion: {
    findFirst: jest.fn(),
  },
}

// El servicio espera la traduccion antes de responder, asi que en los tests
// hay que darle un doble. No se comprueba acá: la traduccion tiene su propia
// verificacion contra la API real en scripts/verificar-traduccion.ts.
const mockTraduccion = {
  experiencia: jest.fn().mockResolvedValue(undefined),
  producto: jest.fn().mockResolvedValue(undefined),
}

// El historial tiene su propio spec; acá solo importa que el servicio lo use.
const mockSlugs = {
  libre: jest.fn(),
  duenoAnterior: jest.fn(),
  cambiar: jest.fn(),
}

async function crearServicio() {
  const module = await Test.createTestingModule({
    providers: [
      ExperienciasService,
      { provide: PrismaService, useValue: mockPrisma },
      { provide: SincronizadorTraduccion, useValue: mockTraduccion },
      { provide: HistorialSlugs, useValue: mockSlugs },
    ],
  }).compile()
  jest.clearAllMocks()
  return module.get(ExperienciasService)
}

describe('ExperienciasService.findAll', () => {
  let service: ExperienciasService

  beforeEach(async () => {
    service = await crearServicio()
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

const FICHA = {
  id: 'exp1',
  slug: 'ruta-del-cacao',
  nombre: 'Ruta del Cacao',
  traducciones: [{ idioma: 'en', slug: 'cacao-trail', nombre: 'Cacao Trail' }],
}

describe('ExperienciasService: slug estable', () => {
  let service: ExperienciasService

  beforeEach(async () => {
    service = await crearServicio()
    mockPrisma.experiencia.findUnique.mockResolvedValue(FICHA)
    mockPrisma.experiencia.update.mockResolvedValue(FICHA)
  })

  it('renombrar no toca el slug', async () => {
    await service.update('exp1', { nombre: 'Ruta del cacao y el café' })

    const { data } = mockPrisma.experiencia.update.mock.calls[0][0]
    expect(data.nombre).toBe('Ruta del cacao y el café')
    expect(data).not.toHaveProperty('slug')
    expect(mockSlugs.libre).not.toHaveBeenCalled()
  })

  it('el slug se genera al crear, a partir del nombre', async () => {
    mockSlugs.libre.mockResolvedValue('ruta-del-cacao')
    mockPrisma.experiencia.create.mockResolvedValue(FICHA)

    await service.create({
      nombre: 'Ruta del Cacao', descripcionLarga: 'x', duracion: '3 horas',
      precio: 95000, capacidad: 12, imagenes: ['a.jpg'], incluye: ['Guía'],
    })

    expect(mockSlugs.libre).toHaveBeenCalledWith('experiencia', 'Ruta del Cacao')
    expect(mockPrisma.experiencia.create.mock.calls[0][0].data.slug).toBe('ruta-del-cacao')
  })
})

describe('ExperienciasService.findBySlug', () => {
  let service: ExperienciasService

  beforeEach(async () => {
    service = await crearServicio()
  })

  // La URL vieja tiene que encontrar la ficha y devolverla con el slug de hoy:
  // con eso la página responde 308 a la nueva en vez de 404.
  it('un slug anterior devuelve la ficha con su slug vigente', async () => {
    mockPrisma.experiencia.findUnique.mockImplementation(({ where }: { where: { slug?: string; id?: string } }) =>
      Promise.resolve(where.id === 'exp1' ? FICHA : null),
    )
    mockPrisma.experienciaTraduccion.findFirst.mockResolvedValue(null)
    mockSlugs.duenoAnterior.mockResolvedValue('exp1')

    const es = await service.findBySlug('experiencia-cacaotera')
    expect(es.slug).toBe('ruta-del-cacao')

    // En inglés vuelve con el slug inglés, que es a donde redirige /en.
    const en = await service.findBySlug('experiencia-cacaotera', 'en')
    expect(en.slug).toBe('cacao-trail')

    expect(mockSlugs.duenoAnterior).toHaveBeenCalledWith('experiencia', 'experiencia-cacaotera')
  })

  it('no mira el historial si el slug es vigente', async () => {
    mockPrisma.experiencia.findUnique.mockResolvedValue(FICHA)
    await service.findBySlug('ruta-del-cacao')
    expect(mockSlugs.duenoAnterior).not.toHaveBeenCalled()
  })

  it('404 si no es vigente ni anterior', async () => {
    mockPrisma.experiencia.findUnique.mockResolvedValue(null)
    mockPrisma.experienciaTraduccion.findFirst.mockResolvedValue(null)
    mockSlugs.duenoAnterior.mockResolvedValue(null)
    await expect(service.findBySlug('no-existe')).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('ExperienciasService.cambiarSlug', () => {
  let service: ExperienciasService

  beforeEach(async () => {
    service = await crearServicio()
    mockPrisma.experiencia.findUnique.mockResolvedValue(FICHA)
  })

  it('delega en el historial y devuelve la ficha con los slugs de los dos idiomas', async () => {
    mockSlugs.cambiar.mockResolvedValue('ruta-del-cacao-y-cafe')
    mockPrisma.experiencia.findUniqueOrThrow.mockResolvedValue({ ...FICHA, slug: 'ruta-del-cacao-y-cafe' })

    const res = await service.cambiarSlug('exp1', { slug: 'ruta-del-cacao-y-cafe' })

    // Sin idioma = español.
    expect(mockSlugs.cambiar).toHaveBeenCalledWith('experiencia', 'exp1', 'es', 'ruta-del-cacao-y-cafe')
    expect(res.slugs).toEqual({ es: 'ruta-del-cacao-y-cafe', en: 'cacao-trail' })
  })

  it('pasa el idioma cuando se cambia el inglés', async () => {
    mockPrisma.experiencia.findUniqueOrThrow.mockResolvedValue(FICHA)
    await service.cambiarSlug('exp1', { slug: 'cacao-route', idioma: 'en' })
    expect(mockSlugs.cambiar).toHaveBeenCalledWith('experiencia', 'exp1', 'en', 'cacao-route')
  })
})
