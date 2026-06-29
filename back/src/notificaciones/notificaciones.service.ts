import { Injectable } from '@nestjs/common'
import { EmailService } from './email.service'
import { TelegramService } from './telegram.service'
import { PrismaService } from '../prisma.service'

const ADMIN_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function filaHtml(label: string, value: string): string {
  return `<div style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px">
    <span style="color:#888;width:140px;display:inline-block">${label}</span>
    <strong>${value}</strong>
  </div>`
}

@Injectable()
export class NotificacionesService {
  constructor(
    private readonly email: EmailService,
    private readonly telegram: TelegramService,
    private readonly prisma: PrismaService,
  ) {}

  private async getAdminEmail(): Promise<string> {
    const row = await this.prisma.siteConfig.findUnique({ where: { key: 'admin_email' } })
    return row?.value || process.env.ADMIN_EMAIL || ''
  }

  async enviarConfirmacionReserva(reserva: {
    id: string; nombre: string; email: string; telefono: string
    experiencia?: { nombre: string } | null
    fecha: Date; cantidadPersonas: number
  }): Promise<void> {
    const expNombre = reserva.experiencia?.nombre ?? 'Experiencia'
    const fechaStr = new Date(reserva.fecha).toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const htmlCliente = this.email.templateConfirmacionReserva({
      nombre: reserva.nombre,
      experiencia: expNombre,
      fecha: fechaStr,
      cantidadPersonas: String(reserva.cantidadPersonas),
      email: reserva.email,
    })
    await this.email.send(reserva.email, `Confirmación de tu reserva — Vuelo Carmesí`, htmlCliente)

    const adminEmailReserva = await this.getAdminEmail()
    if (adminEmailReserva) {
      const filas = [
        filaHtml('Nombre', reserva.nombre),
        filaHtml('Email', reserva.email),
        filaHtml('Experiencia', expNombre),
        filaHtml('Fecha', fechaStr),
        filaHtml('Personas', String(reserva.cantidadPersonas)),
      ].join('')
      const htmlAdmin = this.email.templateAlertaAdmin({
        tipo: '📅 Nueva Reserva',
        filas,
        adminUrl: `${ADMIN_URL}/admin/reservas`,
      })
      await this.email.send(adminEmailReserva, `[Reserva] Nueva: ${reserva.nombre}`, htmlAdmin)
    }

    await this.telegram.send(
      `📅 *Nueva Reserva*\nNombre: ${reserva.nombre}\nEmail: ${reserva.email}\nCelular: ${reserva.telefono}\nExperiencia: ${expNombre}\nFecha: ${fechaStr}\nPersonas: ${reserva.cantidadPersonas}`,
    )
  }

  async enviarConfirmacionPedido(pedido: {
    id: string; nombre: string; email: string; direccion: string; total: number
  }): Promise<void> {
    const totalStr = pedido.total.toLocaleString('es-CO')

    const htmlCliente = this.email.templateConfirmacionPedido({
      nombre: pedido.nombre,
      id: pedido.id,
      direccion: pedido.direccion,
      total: totalStr,
    })
    await this.email.send(pedido.email, `Recibimos tu pedido — Vuelo Carmesí`, htmlCliente)

    const adminEmailPedido = await this.getAdminEmail()
    if (adminEmailPedido) {
      const filas = [
        filaHtml('N° pedido', pedido.id),
        filaHtml('Nombre', pedido.nombre),
        filaHtml('Email', pedido.email),
        filaHtml('Dirección', pedido.direccion),
        filaHtml('Total', `$ ${totalStr} COP`),
      ].join('')
      const htmlAdmin = this.email.templateAlertaAdmin({
        tipo: '🛒 Nuevo Pedido',
        filas,
        adminUrl: `${ADMIN_URL}/admin/pedidos`,
      })
      await this.email.send(adminEmailPedido, `[Pedido] Nuevo: ${pedido.nombre}`, htmlAdmin)
    }

    await this.telegram.send(
      `🛒 *Nuevo Pedido*\nNombre: ${pedido.nombre}\nEmail: ${pedido.email}\nTotal: $ ${totalStr} COP`,
    )
  }

  async enviarNuevoContacto(contacto: {
    id: string; nombre: string; email: string; mensaje: string
  }): Promise<void> {
    const htmlCliente = this.email.templateContactoRecibido({
      nombre: contacto.nombre,
      mensaje: contacto.mensaje,
    })
    await this.email.send(contacto.email, `Recibimos tu mensaje — Vuelo Carmesí`, htmlCliente)

    const adminEmailContacto = await this.getAdminEmail()
    if (adminEmailContacto) {
      const filas = [
        filaHtml('Nombre', contacto.nombre),
        filaHtml('Email', contacto.email),
        filaHtml('Mensaje', contacto.mensaje),
      ].join('')
      const htmlAdmin = this.email.templateAlertaAdmin({
        tipo: '✉️ Nuevo Mensaje de Contacto',
        filas,
        adminUrl: `${ADMIN_URL}/admin`,
      })
      await this.email.send(adminEmailContacto, `[Contacto] Mensaje de ${contacto.nombre}`, htmlAdmin)
    }

    await this.telegram.send(
      `✉️ *Nuevo Contacto*\nNombre: ${contacto.nombre}\nEmail: ${contacto.email}\nMensaje: ${contacto.mensaje}`,
    )
  }

  async enviarReservaConfirmadaCliente(reserva: {
    id: string; nombre: string; email: string
    experiencia?: { nombre: string } | null
    fecha: Date; cantidadPersonas: number; estado: string
  }): Promise<void> {
    const expNombre = reserva.experiencia?.nombre ?? 'Experiencia'
    const fechaStr = new Date(reserva.fecha).toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const instruccionesRow = await this.prisma.siteConfig.findUnique({ where: { key: 'instrucciones_confirmacion' } })
    const instrucciones = instruccionesRow?.value
      ?? 'Por favor llega 15 minutos antes del horario acordado. Recuerda llevar ropa cómoda, protector solar y mucho entusiasmo.'

    const contactoRow = await this.prisma.siteConfig.findUnique({ where: { key: 'contacto_negocio' } })
    const contacto = contactoRow?.value ?? 'hola@vuelocarmesi.com'

    const html = this.email.templateReservaConfirmada({
      nombre: reserva.nombre,
      experiencia: expNombre,
      fecha: fechaStr,
      cantidadPersonas: String(reserva.cantidadPersonas),
      instrucciones,
      contacto,
    })
    await this.email.send(reserva.email, 'Tu reserva está confirmada — Vuelo Carmesí', html)
  }

  async enviarReservaCanceladaCliente(reserva: {
    id: string; nombre: string; email: string
    experiencia?: { nombre: string } | null
    fecha: Date; estado: string
  }, motivo?: string): Promise<void> {
    const expNombre = reserva.experiencia?.nombre ?? 'Experiencia'
    const fechaStr = new Date(reserva.fecha).toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const motivoHtml = motivo
      ? `<div style="margin:16px 0;padding:16px 20px;background:#FFF8F0;border-left:3px solid #872B13;border-radius:4px"><div style="color:#872B13;font-weight:bold;font-size:13px;margin-bottom:4px">Motivo</div><div style="color:#5C3317;font-size:14px">${escapeHtml(motivo)}</div></div>`
      : ''

    const html = this.email.templateReservaCancelada({
      nombre: reserva.nombre,
      experiencia: expNombre,
      fecha: fechaStr,
      motivoHtml,
      urlReserva: ADMIN_URL,
    })
    await this.email.send(reserva.email, 'Actualización sobre tu reserva — Vuelo Carmesí', html)
  }
}
