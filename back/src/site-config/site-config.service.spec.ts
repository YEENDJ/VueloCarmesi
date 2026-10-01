import 'reflect-metadata'
import { BadRequestException } from '@nestjs/common'
import { SiteConfigService } from './site-config.service'
import type { PrismaService } from '../prisma.service'
import type { TraduccionService } from '../traduccion/traduccion.service'

const filas = [
  { key: 'whatsapp', value: '+57 300 000 0000' },
  { key: 'admin_email', value: 'alertas@example.com' },
  { key: 'punto_encuentro', value: 'Parque de Cubarral' },
  { key: 'punto_encuentro__en', value: 'Cubarral main square' },
]

const prisma = { siteConfig: { findMany: jest.fn().mockResolvedValue(filas), upsert: jest.fn() } }
const service = new SiteConfigService(
  prisma as unknown as PrismaService,
  { disponible: false } as unknown as TraduccionService,
)

describe('SiteConfigService.getAll', () => {
  it('no entrega el correo de alertas en la versión pública', async () => {
    const publica = await service.getAll()
    expect(publica).not.toHaveProperty('admin_email')
    expect(publica.whatsapp).toBe('+57 300 000 0000')
  })

  it('tampoco en la versión inglesa', async () => {
    expect(await service.getAll('en')).not.toHaveProperty('admin_email')
  })

  it('el panel sí la recibe', async () => {
    expect((await service.getAll(undefined, true)).admin_email).toBe('alertas@example.com')
  })
})

describe('SiteConfigService.patch · porcentaje de abono', () => {
  beforeEach(() => prisma.siteConfig.upsert.mockClear())

  it('guarda un entero de 1 a 100', async () => {
    await service.patch({ reservas_abono_porcentaje: '40' })
    expect(prisma.siteConfig.upsert).toHaveBeenCalled()
  })

  it('acepta vacío: rige el 30 por defecto', async () => {
    await expect(service.patch({ reservas_abono_porcentaje: '' })).resolves.toBeDefined()
  })

  // Guardado a ciegas, «30%» haría que la reserva cobrara cero.
  it.each(['30%', '0', '150', 'treinta'])('rechaza %p sin guardar nada', async valor => {
    await expect(service.patch({ reservas_abono_porcentaje: valor, whatsapp: '+57 1' })).rejects.toThrow(BadRequestException)
    expect(prisma.siteConfig.upsert).not.toHaveBeenCalled()
  })
})
