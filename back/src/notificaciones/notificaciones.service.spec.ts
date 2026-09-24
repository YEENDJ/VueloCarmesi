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
  templateConfirmacionReserva: jest.fn().mockReturnValue('<html-reserva>'),
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
    expect(varsCliente.itemsTable).toContain('$40.000')
    expect(varsCliente.itemsTable).toContain('$55.000')
  })

  it('incluye la tabla de detalle de items en las filas del email admin, sin fila de total duplicada', async () => {
    await service.enviarConfirmacionPedido(pedido)

    const varsAdmin = mockEmail.templateAlertaAdmin.mock.calls[0][0]
    expect(varsAdmin.filas).toContain('Café Premium 500g')
    expect(varsAdmin.filas).toContain('$55.000')
    expect((varsAdmin.filas.match(/Total/g) ?? []).length).toBe(1)
  })

  it('incluye una línea por producto y el total en el mensaje de Telegram', async () => {
    await service.enviarConfirmacionPedido(pedido)

    const mensaje = mockTelegram.send.mock.calls[0][0]
    expect(mensaje).toContain('Café Premium 500g × 2 — $20.000 c/u — $40.000')
    expect(mensaje).toContain('Miel Orgánica 250g × 1 — $15.000 c/u — $15.000')
    expect(mensaje).toContain('Total: $55.000')
  })

  it('manda Telegram y el aviso al admin aunque el correo al cliente falle', async () => {
    mockEmail.send.mockRejectedValueOnce(new Error('Gmail: dirección inexistente'))

    await expect(service.enviarConfirmacionPedido(pedido)).resolves.toBeUndefined()

    expect(mockTelegram.send).toHaveBeenCalledTimes(1)
    expect(mockEmail.send).toHaveBeenCalledWith(
      'admin@vuelocarmesi.com', expect.any(String), '<html-admin>',
    )
  })

  it('manda Telegram aunque no se pueda leer el correo del admin', async () => {
    mockPrisma.siteConfig.findUnique.mockRejectedValueOnce(new Error('Neon caído'))

    await service.enviarConfirmacionPedido(pedido)

    expect(mockTelegram.send).toHaveBeenCalledTimes(1)
  })
})

describe('NotificacionesService: HTML del visitante en los correos', () => {
  let service: NotificacionesService
  const enlace = '<a href="https://falso.example">Paga aquí</a>'

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

  it('escapa nombre y dirección del pedido en el acuse y en el aviso al admin', async () => {
    await service.enviarConfirmacionPedido({ ...pedido, nombre: enlace, direccion: enlace })

    const cliente = mockEmail.templateConfirmacionPedido.mock.calls[0][0]
    expect(cliente.nombre).not.toContain('<a')
    expect(cliente.nombre).toContain('&lt;a href=')
    expect(cliente.direccion).not.toContain('<a')
    expect(mockEmail.templateAlertaAdmin.mock.calls[0][0].filas).not.toContain('<a href')
  })

  it('escapa el nombre de la reserva en el acuse y en el aviso al admin', async () => {
    await service.enviarConfirmacionReserva({
      id: 'r1', nombre: enlace, email: 'ana@example.com', telefono: '3001234567',
      experiencia: { nombre: 'Ruta del cacao' }, fecha: new Date('2026-10-20'), cantidadPersonas: 2,
    })

    const cliente = mockEmail.templateConfirmacionReserva.mock.calls[0][0]
    expect(cliente.nombre).toContain('&lt;a href=')
    expect(mockEmail.templateAlertaAdmin.mock.calls[0][0].filas).not.toContain('<a href')
  })
})

describe('NotificacionesService.enviarNuevaSolicitudGrupo', () => {
  let service: NotificacionesService

  const solicitud = {
    id: 'sol1', tipo: 'colegio', institucion: 'Colegio <San José> & Cía',
    nit: null, contacto: 'Juan_Pérez', cargo: null,
    email: 'juan_perez@colegio.edu.co', telefono: '+57 311 000 0000',
    personas: 40, edades: null, fechaTentativa: new Date('2026-10-20T00:00:00.000Z'),
    experiencias: ['experiencia-cacaotera', 'a-medida'],
    requiereTransporte: false, requiereFactura: false,
    mensaje: 'Somos *40* niños',
  }

  const email = {
    ...mockEmail,
    templateSolicitudGrupoRecibida: jest.fn().mockReturnValue('<html-cliente>'),
  }
  const prisma = {
    ...mockPrisma,
    experiencia: {
      findMany: jest.fn().mockResolvedValue([
        { slug: 'experiencia-cacaotera', nombre: 'Experiencia cacaotera' },
      ]),
    },
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificacionesService,
        { provide: EmailService, useValue: email },
        { provide: TelegramService, useValue: mockTelegram },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()
    service = module.get(NotificacionesService)
    jest.clearAllMocks()
    mockPrisma.siteConfig.findUnique.mockResolvedValue({ value: 'admin@vuelocarmesi.com' })
  })

  it('escapa los datos del cliente en el Telegram, que va en modo HTML', async () => {
    await service.enviarNuevaSolicitudGrupo(solicitud)

    const mensaje: string = mockTelegram.send.mock.calls[0][0]
    expect(mensaje).toContain('<b>Nueva solicitud de grupo</b>')
    expect(mensaje).toContain('Colegio &lt;San José&gt; &amp; Cía')
    expect(mensaje).not.toContain('<San José>')
    // Con Markdown, estos `_` y `*` sin pareja hacían que Telegram rechazara el mensaje.
    expect(mensaje).toContain('juan_perez@colegio.edu.co')
    expect(mensaje).toContain('Somos *40* niños')
  })

  it('pone la fecha del día elegido, sin correrla por la zona horaria', async () => {
    await service.enviarNuevaSolicitudGrupo(solicitud)

    expect(mockTelegram.send.mock.calls[0][0]).toContain('martes, 20 de octubre de 2026')
  })

  it('nombra las experiencias en vez de mandar los slugs', async () => {
    await service.enviarNuevaSolicitudGrupo(solicitud)

    const vars = email.templateSolicitudGrupoRecibida.mock.calls[0][0]
    expect(vars.experiencias).toBe('Experiencia cacaotera, A medida')
  })

  it('manda Telegram aunque falle la consulta de nombres y el acuse', async () => {
    prisma.experiencia.findMany.mockRejectedValueOnce(new Error('Neon caído'))
    email.send.mockRejectedValueOnce(new Error('Gmail: rebote'))

    await service.enviarNuevaSolicitudGrupo(solicitud)

    expect(mockTelegram.send).toHaveBeenCalledTimes(1)
  })
})
