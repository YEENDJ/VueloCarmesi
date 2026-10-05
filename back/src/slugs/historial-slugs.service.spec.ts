import { HistorialSlugs } from './historial-slugs.service'
import { PrismaService } from '../prisma.service'

/**
 * Doble de Prisma con lo justo para las tablas de experiencia. Las consultas
 * devuelven null por defecto —«nadie usa este slug»— y cada test pone solo lo
 * que necesita.
 */
function crearPrisma() {
  return {
    experiencia: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    experienciaTraduccion: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    experienciaSlugAnterior: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  }
}

describe('HistorialSlugs', () => {
  let prisma: ReturnType<typeof crearPrisma>
  let historial: HistorialSlugs

  beforeEach(() => {
    prisma = crearPrisma()
    historial = new HistorialSlugs(prisma as unknown as PrismaService)
  })

  describe('ocupado', () => {
    it('está libre si nadie lo usa', async () => {
      expect(await historial.ocupado('experiencia', 'ruta-del-cacao')).toBe(false)
    })

    it('no choca consigo misma', async () => {
      prisma.experiencia.findUnique.mockResolvedValue({ id: 'exp1' })
      expect(await historial.ocupado('experiencia', 'ruta-del-cacao', 'exp1')).toBe(false)
    })

    it('choca con el slug inglés vigente de otra ficha', async () => {
      prisma.experienciaTraduccion.findFirst.mockResolvedValue({ experienciaId: 'otra' })
      expect(await historial.ocupado('experiencia', 'cacao-trail', 'exp1')).toBe(true)
    })

    // Dar la URL vieja de una ficha a otra secuestraría sus enlaces.
    it('choca con un slug anterior de otra ficha', async () => {
      prisma.experienciaSlugAnterior.findFirst.mockResolvedValue({ experienciaId: 'otra' })
      expect(await historial.ocupado('experiencia', 'aviturismo', 'exp1')).toBe(true)
    })
  })

  describe('libre', () => {
    it('salta los slugs que fueron de otra ficha', async () => {
      prisma.experienciaSlugAnterior.findFirst.mockImplementation(
        ({ where }: { where: { slug: string } }) =>
          Promise.resolve(where.slug === 'aviturismo' ? { experienciaId: 'otra' } : null),
      )
      expect(await historial.libre('experiencia', 'Aviturismo')).toBe('aviturismo-2')
    })
  })

  describe('duenoAnterior', () => {
    it('devuelve la ficha dueña de una URL vieja', async () => {
      prisma.experienciaSlugAnterior.findFirst.mockResolvedValue({ experienciaId: 'exp1' })
      expect(await historial.duenoAnterior('experiencia', 'AVITURISMO')).toBe('exp1')
    })

    it('null si el slug nunca existió', async () => {
      expect(await historial.duenoAnterior('experiencia', 'no-existe')).toBeNull()
    })
  })
})
