import 'reflect-metadata'
import { SiteConfigService } from './site-config.service'
import type { PrismaService } from '../prisma.service'
import type { TraduccionService } from '../traduccion/traduccion.service'

const filas = [
  { key: 'whatsapp', value: '+57 300 000 0000' },
  { key: 'admin_email', value: 'alertas@example.com' },
  { key: 'punto_encuentro', value: 'Parque de Cubarral' },
  { key: 'punto_encuentro__en', value: 'Cubarral main square' },
]

const prisma = { siteConfig: { findMany: jest.fn().mockResolvedValue(filas) } }
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
