/**
 * Manda un correo de prueba por Resend con la misma configuración que usa el
 * backend, para comprobar la clave y el dominio sin crear una reserva falsa.
 *
 *   npm run correo:probar -- tu@correo.com
 *
 * Usa RESEND_API_KEY, EMAIL_FROM y EMAIL_REPLY_TO del .env.
 */
import 'dotenv/config'
import { EmailService } from '../src/notificaciones/email.service'

async function main() {
  const to = process.argv[2]
  if (!to) {
    console.error('Falta el destinatario: npm run correo:probar -- tu@correo.com')
    process.exit(1)
  }
  console.log(`Enviando desde ${process.env.EMAIL_FROM ?? '(EMAIL_FROM sin definir)'} a ${to}…`)
  await new EmailService().send(
    to,
    'Prueba de correo — Vuelo Carmesí',
    '<p>Si lees esto, los correos de Vuelo Carmesí salen bien por Resend.</p>',
  )
  console.log('Enviado. Revisa la bandeja (y la carpeta de spam) y el panel de Resend → Emails.')
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
