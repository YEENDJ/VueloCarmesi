import { SincronizadorTraduccion } from './sincronizador.service'
import { PrismaService } from '../prisma.service'
import { TraduccionService } from './traduccion.service'
import { HistorialSlugs } from '../slugs/historial-slugs.service'

/**
 * Solo el slug inglés. La traducción en sí se verifica contra DeepL en
 * scripts/verificar-traduccion.ts; acá DeepL es un doble que devuelve lo que
 * cada test le dice.
 */
function montar(previa: Record<string, unknown> | null, camposTraducidos: Record<string, unknown>) {
  const prisma = {
    experiencia: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'exp1',
        slug: 'ruta-del-cacao',
        nombre: 'Ruta del Cacao y el Café',
        traducciones: previa ? [{ idioma: 'en', ...previa }] : [],
      }),
    },
    experienciaTraduccion: { upsert: jest.fn().mockResolvedValue({}) },
  }
  const traduccion = {
    disponible: true,
    traducir: jest.fn().mockResolvedValue({ campos: camposTraducidos, huellas: {} }),
  }
  const slugs = { libre: jest.fn().mockResolvedValue('cacao-and-coffee-trail') }

  const sincronizador = new SincronizadorTraduccion(
    prisma as unknown as PrismaService,
    traduccion as unknown as TraduccionService,
    slugs as unknown as HistorialSlugs,
  )
  const datosGuardados = () => prisma.experienciaTraduccion.upsert.mock.calls[0][0].update
  return { sincronizador, slugs, datosGuardados }
}

describe('SincronizadorTraduccion: slug inglés', () => {
  // Corregir el español retraduce el nombre; antes eso movía la URL inglesa.
  it('un nombre retraducido no cambia el slug que ya había', async () => {
    const { sincronizador, slugs, datosGuardados } = montar(
      { slug: 'cacao-trail', nombre: 'Cacao Trail' },
      { nombre: 'Cacao and coffee trail' },
    )

    await sincronizador.experiencia('exp1')

    expect(datosGuardados().slug).toBe('cacao-trail')
    expect(datosGuardados().nombre).toBe('Cacao and coffee trail')
    expect(slugs.libre).not.toHaveBeenCalled()
  })

  it('la primera traducción sí genera el slug, desde el nombre traducido', async () => {
    const { sincronizador, slugs, datosGuardados } = montar(null, { nombre: 'Cacao and coffee trail' })

    await sincronizador.experiencia('exp1')

    expect(slugs.libre).toHaveBeenCalledWith('experiencia', 'Cacao and coffee trail', 'exp1')
    expect(datosGuardados().slug).toBe('cacao-and-coffee-trail')
  })

  // Las traducciones de antes del slug inglés lo reciben con la siguiente edición.
  it('una traducción vieja sin slug lo recibe del nombre que ya tenía', async () => {
    const { sincronizador, slugs } = montar({ slug: '', nombre: 'Cacao Trail' }, {})

    await sincronizador.experiencia('exp1')

    expect(slugs.libre).toHaveBeenCalledWith('experiencia', 'Cacao Trail', 'exp1')
  })
})
