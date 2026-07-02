import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class EmailService {
  private readonly from = process.env.EMAIL_FROM ?? process.env.GMAIL_USER ?? ''
  private readonly transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  private tpl(name: string, vars: Record<string, string>): string {
    const candidates = [
      path.join(__dirname, 'templates', `${name}.html`),
      path.join(process.cwd(), 'src', 'notificaciones', 'templates', `${name}.html`),
    ]
    const file = candidates.find(f => fs.existsSync(f)) ?? candidates[0]
    let html = fs.readFileSync(file, 'utf-8')
    for (const [k, v] of Object.entries(vars)) {
      html = html.replaceAll(`{{${k}}}`, v)
    }
    return html
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to, subject, html })
  }

  templateConfirmacionReserva(vars: Record<string, string>): string {
    return this.tpl('confirmacion-reserva', vars)
  }

  templateConfirmacionPedido(vars: Record<string, string>): string {
    return this.tpl('confirmacion-pedido', vars)
  }

  templateContactoRecibido(vars: Record<string, string>): string {
    return this.tpl('contacto-recibido', vars)
  }

  templateAlertaAdmin(vars: Record<string, string>): string {
    return this.tpl('alerta-admin', vars)
  }

  templateReservaConfirmada(vars: Record<string, string>): string {
    return this.tpl('reserva-confirmada', vars)
  }

  templateReservaCancelada(vars: Record<string, string>): string {
    return this.tpl('reserva-cancelada', vars)
  }
}
