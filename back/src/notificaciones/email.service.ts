import { Injectable, Logger } from '@nestjs/common'
import { Resend } from 'resend'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly resend = new Resend(process.env.RESEND_API_KEY)
  private readonly from = process.env.RESEND_FROM_EMAIL ?? 'hola@vuelocarmesi.com'

  private tpl(name: string, vars: Record<string, string>): string {
    const file = path.join(__dirname, 'templates', `${name}.html`)
    let html = fs.readFileSync(file, 'utf-8')
    for (const [k, v] of Object.entries(vars)) {
      html = html.replaceAll(`{{${k}}}`, v)
    }
    return html
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.resend.emails.send({ from: this.from, to, subject, html })
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
}
