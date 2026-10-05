import { Test } from '@nestjs/testing'
import { ProductosService } from './productos.service'
import { PrismaService } from '../prisma.service'
import { SincronizadorTraduccion } from '../traduccion/sincronizador.service'
import { HistorialSlugs } from '../slugs/historial-slugs.service'

/** Ver experiencias.service.spec: mismos dobles, mismo motivo. */
const mockPrisma = {
  producto: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  productoTraduccion: {
    findFirst: jest.fn(),
  },
}
const mockTraduccion = { producto: jest.fn().mockResolvedValue(undefined) }
const mockSlugs = { libre: jest.fn(), duenoAnterior: jest.fn() }

const PRODUCTO = {
  id: 'p1',
  slug: 'vino-de-cafe-x-375-ml',
  nombre: 'Vino de café x 375 ml',
  traducciones: [{ idioma: 'en', slug: 'coffee-wine-x-375-ml', nombre: 'Coffee wine x 375 ml' }],
}

describe('ProductosService: slug estable', () => {
  let service: ProductosService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductosService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SincronizadorTraduccion, useValue: mockTraduccion },
        { provide: HistorialSlugs, useValue: mockSlugs },
      ],
    }).compile()
    service = module.get(ProductosService)
    jest.clearAllMocks()
  })

  it('renombrar no toca el slug', async () => {
    mockPrisma.producto.findUnique.mockResolvedValue(PRODUCTO)
    mockPrisma.producto.update.mockResolvedValue(PRODUCTO)

    await service.update('p1', { nombre: 'Vino de café artesanal x 375 ml' })

    expect(mockPrisma.producto.update.mock.calls[0][0].data).not.toHaveProperty('slug')
    expect(mockSlugs.libre).not.toHaveBeenCalled()
  })

  it('un slug anterior devuelve el producto con su slug vigente', async () => {
    mockPrisma.producto.findUnique.mockImplementation(({ where }: { where: { id?: string } }) =>
      Promise.resolve(where.id === 'p1' ? PRODUCTO : null),
    )
    mockPrisma.productoTraduccion.findFirst.mockResolvedValue(null)
    mockSlugs.duenoAnterior.mockResolvedValue('p1')

    expect((await service.findBySlug('vino-de-cafe-x-375ml')).slug).toBe('vino-de-cafe-x-375-ml')
    expect((await service.findBySlug('vino-de-cafe-x-375ml', 'en')).slug).toBe('coffee-wine-x-375-ml')
  })
})
