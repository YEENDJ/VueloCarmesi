import { BadRequestException, ConflictException } from '@nestjs/common'
import { HistorialSlugs } from './historial-slugs.service'
import { PrismaService } from '../prisma.service'

/**
 * Doble de Prisma con lo justo para las tablas de experiencia. Las consultas
 * devuelven null por defecto —«nadie usa este slug»— y cada test pone solo lo
 * que necesita. `$transaction` recibe el array ya construido, así que basta con
 * esperar sus promesas.
 */
function crearPrisma() {
  return {
    experiencia: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
    experienciaTraduccion: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
    experienciaSlugAnterior: {
      findFirst: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      upsert: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
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

  describe('cambiar', () => {
    it('guarda el anterior y deja el nuevo vigente, en una transacción', async () => {
      prisma.experiencia.findUnique.mockImplementation(({ where }: { where: { id?: string } }) =>
        Promise.resolve(where.id ? { slug: 'experiencia-cacaotera' } : null),
      )

      const slug = await historial.cambiar('experiencia', 'exp1', 'es', 'Ruta del Cacao')

      expect(slug).toBe('ruta-del-cacao')
      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
      expect(prisma.experienciaSlugAnterior.upsert).toHaveBeenCalledWith({
        where: { idioma_slug: { idioma: 'es', slug: 'experiencia-cacaotera' } },
        update: { experienciaId: 'exp1' },
        create: { experienciaId: 'exp1', idioma: 'es', slug: 'experiencia-cacaotera' },
      })
      expect(prisma.experiencia.update).toHaveBeenCalledWith({
        where: { id: 'exp1' },
        data: { slug: 'ruta-del-cacao' },
      })
    })

    // Volver a un slug que la ficha ya tuvo: deja de ser «anterior».
    it('recupera un slug propio que estaba en el historial', async () => {
      prisma.experiencia.findUnique.mockImplementation(({ where }: { where: { id?: string } }) =>
        Promise.resolve(where.id ? { slug: 'ruta-del-cacao' } : null),
      )
      prisma.experienciaSlugAnterior.findFirst.mockResolvedValue({ experienciaId: 'exp1' })

      await historial.cambiar('experiencia', 'exp1', 'es', 'experiencia-cacaotera')

      expect(prisma.experienciaSlugAnterior.deleteMany).toHaveBeenCalledWith({
        where: { idioma: 'es', slug: 'experiencia-cacaotera' },
      })
      expect(prisma.experiencia.update).toHaveBeenCalled()
    })

    it('cambia el slug inglés en la fila de traducción', async () => {
      prisma.experienciaTraduccion.findUnique.mockResolvedValue({ slug: 'cacao-experience' })

      await historial.cambiar('experiencia', 'exp1', 'en', 'cacao-trail')

      expect(prisma.experienciaSlugAnterior.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: { experienciaId: 'exp1', idioma: 'en', slug: 'cacao-experience' },
        }),
      )
      expect(prisma.experienciaTraduccion.update).toHaveBeenCalledWith({
        where: { experienciaId_idioma: { experienciaId: 'exp1', idioma: 'en' } },
        data: { slug: 'cacao-trail' },
      })
      expect(prisma.experiencia.update).not.toHaveBeenCalled()
    })

    it('no hace nada si el slug pedido ya es el vigente', async () => {
      prisma.experiencia.findUnique.mockResolvedValue({ slug: 'ruta-del-cacao' })
      expect(await historial.cambiar('experiencia', 'exp1', 'es', 'ruta-del-cacao')).toBe('ruta-del-cacao')
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('rechaza un slug que es o fue de otra ficha, sin inventarle sufijo', async () => {
      prisma.experiencia.findUnique.mockImplementation(({ where }: { where: { id?: string } }) =>
        Promise.resolve(where.id ? { slug: 'experiencia-cacaotera' } : { id: 'otra' }),
      )
      await expect(
        historial.cambiar('experiencia', 'exp1', 'es', 'avistamiento-de-aves'),
      ).rejects.toBeInstanceOf(ConflictException)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('rechaza un slug que queda vacío al normalizarse', async () => {
      await expect(historial.cambiar('experiencia', 'exp1', 'es', '¿¿??')).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('rechaza cambiar el inglés de una ficha que aún no tiene traducción', async () => {
      await expect(historial.cambiar('experiencia', 'exp1', 'en', 'cacao-trail')).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })
  })
})
