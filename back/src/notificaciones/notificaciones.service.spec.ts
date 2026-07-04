import 'reflect-metadata'
import { Test } from '@nestjs/testing'
import { NotificacionesService } from './notificaciones.service'
import { EmailService } from './email.service'
import { TelegramService } from './telegram.service'
import { PrismaService } from '../prisma.service'

const mockEmail = {
  send: jest.fn().mockResolvedValue(undefined),
  templateConfirmacionPedido: jest.fn().mockReturnValue('<html-cliente>'),
  templateAlertaAdmin: jest.fn().mockReturnValue('<html-admin>'),
}

const mockTelegram = { send: jest.fn().mockResolvedValue(undefined) }

const mockPrisma = {
  siteConfig: { findUnique: jest.fn().mockResolvedValue({ value: 'admin@vuelocarmesi.com' }) },
}

const pedido = {
  id: 'ped1',
  nombre: 'Ana',
  email: 'ana@example.com',
  direccion: 'Calle 10',
  ciudad: 'Medellín',
  codigoPostal: '050001',
  total: 55000,
  items: [
    { cantidad: 2, precio: 20000, producto: { nombre: 'Café Premium 500g' } },
    { cantidad: 1, precio: 15000, producto: { nombre: 'Miel Orgánica 250g' } },
  ],
}

describe('NotificacionesService.enviarConfirmacionPedido', () => {
  let service: NotificacionesService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificacionesService,
        { provide: EmailService, useValue: mockEmail },
        { provide: TelegramService, useValue: mockTelegram },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get(NotificacionesService)
    jest.clearAllMocks()
    mockPrisma.siteConfig.findUnique.mockResolvedValue({ value: 'admin@vuelocarmesi.com' })
  })

  it('incluye la tabla de detalle de items en el email al cliente', async () => {
    await service.enviarConfirmacionPedido(pedido)

    const varsCliente = mockEmail.templateConfirmacionPedido.mock.calls[0][0]
    expect(varsCliente.itemsTable).toContain('Café Premium 500g')
    expect(varsCliente.itemsTable).toContain('Miel Orgánica 250g')
    expect(varsCliente.itemsTable).toContain('$ 40.000')
    expect(varsCliente.itemsTable).toContain('$ 55.000')
  })

  it('incluye la tabla de detalle de items en las filas del email admin, sin fila de total duplicada', async () => {
    await service.enviarConfirmacionPedido(pedido)

    const varsAdmin = mockEmail.templateAlertaAdmin.mock.calls[0][0]
    expect(varsAdmin.filas).toContain('Café Premium 500g')
    expect(varsAdmin.filas).toContain('$ 55.000')
    expect((varsAdmin.filas.match(/Total/g) ?? []).length).toBe(1)
  })

  it('incluye una línea por producto y el total en el mensaje de Telegram', async () => {
    await service.enviarConfirmacionPedido(pedido)

    const mensaje = mockTelegram.send.mock.calls[0][0]
    expect(mensaje).toContain('Café Premium 500g × 2 — $ 20.000 c/u — $ 40.000')
    expect(mensaje).toContain('Miel Orgánica 250g × 1 — $ 15.000 c/u — $ 15.000')
    expect(mensaje).toContain('Total: $ 55.000 COP')
  })
})
