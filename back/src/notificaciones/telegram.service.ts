import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name)
  private readonly token = process.env.TELEGRAM_BOT_TOKEN
  private readonly chatId = process.env.TELEGRAM_CHAT_ID

  async send(text: string): Promise<void> {
    if (!this.token || !this.chatId) {
      this.logger.warn('Telegram no configurado — TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID faltante')
      return
    }
    const url = `https://api.telegram.org/bot${this.token}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: this.chatId, text, parse_mode: 'Markdown' }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Telegram error ${res.status}: ${body}`)
    }
  }
}
