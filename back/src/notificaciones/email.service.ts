import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Los correos salen por la API de Resend (HTTPS), no por SMTP: Render bloquea
 * los puertos SMTP salientes en el plan gratuito y con Gmail no salía nada.
 *
 * `EMAIL_FROM` tiene que ser de un dominio verificado en Resend. Sin eso,
 * Resend solo entrega al correo del dueño de la cuenta y al cliente no le
 * llega nada; fue lo que hizo abandonar Resend la primera vez.
 */
@Injectable()
export class EmailService {
  private readonly from = process.env.EMAIL_FROM ?? 'Vuelo Carmesí <hola@vuelocarmesi.com>'
  private readonly replyTo = process.env.EMAIL_REPLY_TO || undefined
  // Perezoso: `new Resend()` lanza si falta la clave, y eso tumbaría el arranque
  // del backend entero en vez de solo los correos.
  private resend: Resend | null = null

  private cliente(): Resend {
    if (!process.env.RESEND_API_KEY) throw new Error('Falta RESEND_API_KEY: no se puede enviar el correo')
    return (this.resend ??= new Resend(process.env.RESEND_API_KEY))
  }

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
    // Resend v6 no lanza: devuelve `{ error }`. Hay que lanzarlo aquí para que
    // `enviarPorSeparado` lo registre; si no, el fallo pasaría como un envío bueno.
    const { error } = await this.cliente().emails.send({
      from: this.from, to, subject, html, replyTo: this.replyTo,
    })
    if (error) throw new Error(`Resend rechazó el correo a ${to}: ${error.name} — ${error.message}`)
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

  templateSolicitudGrupoRecibida(vars: Record<string, string>): string {
    return this.tpl('solicitud-grupo-recibida', vars)
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

  templatePagoRechazado(vars: Record<string, string>): string {
    return this.tpl('pago-rechazado', vars)
  }

  templatePagoEnRevision(vars: Record<string, string>): string {
    return this.tpl('pago-en-revision', vars)
  }
}
