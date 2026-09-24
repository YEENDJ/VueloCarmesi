import { UseGuards } from '@nestjs/common'
import { ThrottlerGuard, type ThrottlerOptions } from '@nestjs/throttler'

/**
 * Cuántos envíos acepta cada formulario público desde una misma IP.
 *
 * Los cuatro formularios —pedido, reserva, contacto y grupos— son `POST`
 * abiertos, y cada envío escribe en la base, manda correo por Gmail y avisa
 * por Telegram. El honeypot para a los bots torpes; esto frena al resto:
 * sin límite, un script llenaba la bandeja, agotaba el cupo diario de Gmail y
 * apartaba stock con pedidos falsos.
 *
 * Los topes sobran para una persona: nadie reserva cinco veces en un minuto.
 * Una familia o una oficina que comparten IP tienen margen igual.
 */
export const LIMITES_FORMULARIOS: ThrottlerOptions[] = [
  { name: 'minuto', ttl: 60_000, limit: 5 },
  { name: 'hora', ttl: 60 * 60_000, limit: 20 },
]

/**
 * Se aplica por ruta y no como guard global a propósito: los `GET` del
 * catálogo los hace el servidor de Vercel, siempre desde las mismas pocas IPs,
 * y un límite global dejaría la tienda en blanco en cuanto el sitio tuviera
 * tráfico o se reconstruyera. Tampoco va en el panel, que llega por el puente.
 */
export const LimiteFormularios = () => UseGuards(ThrottlerGuard)
