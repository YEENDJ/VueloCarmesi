import { Injectable, Logger } from '@nestjs/common'
import { EmailService } from './email.service'
import { TelegramService } from './telegram.service'

const ADMIN_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'

function filaHtml(label: string, value: string): string {
  return `<div style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px">
    <span style="color:#888;width:140px;display:inline-block">${label}</span>
    <strong>${value}</strong>
  </div>`
}

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name)
  private readonly adminEmail = process.env.ADMIN_EMAIL ?? ''

  constructor(
    private readonly email: EmailService,
    private readonly telegram: TelegramService,
  ) {}

  async enviarConfirmacionReserva(reserva: {
    id: string; nombre: string; email: string
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

    if (this.adminEmail) {
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
      await this.email.send(this.adminEmail, `[Reserva] Nueva: ${reserva.nombre}`, htmlAdmin)
    }

    await this.telegram.send(
      `📅 *Nueva Reserva*\nNombre: ${reserva.nombre}\nEmail: ${reserva.email}\nExperiencia: ${expNombre}\nFecha: ${fechaStr}\nPersonas: ${reserva.cantidadPersonas}`,
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

    if (this.adminEmail) {
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
      await this.email.send(this.adminEmail, `[Pedido] Nuevo: ${pedido.nombre}`, htmlAdmin)
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

    if (this.adminEmail) {
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
      await this.email.send(this.adminEmail, `[Contacto] Mensaje de ${contacto.nombre}`, htmlAdmin)
    }

    await this.telegram.send(
      `✉️ *Nuevo Contacto*\nNombre: ${contacto.nombre}\nEmail: ${contacto.email}\nMensaje: ${contacto.mensaje}`,
    )
  }
}
