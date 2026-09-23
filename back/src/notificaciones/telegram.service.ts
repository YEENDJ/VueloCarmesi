import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name)
  private readonly token = process.env.TELEGRAM_BOT_TOKEN
  private readonly chatId = process.env.TELEGRAM_CHAT_ID

  /**
   * `text` va en el modo HTML de Telegram: el rótulo en `<b>` y todo dato que
   * venga de un cliente pasado por `escapeHtml`.
   *
   * HTML y no Markdown: en Markdown un `_` o un `*` sin pareja —el de
   * `juan_perez@colegio.edu.co`— hace que Telegram rechace el mensaje entero con
   * un 400, y el aviso se pierde. En HTML solo cuentan `<`, `>` y `&`, y
   * `escapeHtml` ya los neutraliza.
   */
  async send(text: string): Promise<void> {
    if (!this.token || !this.chatId) {
      this.logger.warn('Telegram no configurado — TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID faltante')
      return
    }
    const url = `https://api.telegram.org/bot${this.token}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: this.chatId, text, parse_mode: 'HTML' }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Telegram error ${res.status}: ${body}`)
    }
  }
}
