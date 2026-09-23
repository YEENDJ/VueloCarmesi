import { Injectable, Logger } from '@nestjs/common'
import { EmailService } from './email.service'
import { TelegramService } from './telegram.service'
import { PrismaService } from '../prisma.service'
import { formatDireccionPedido } from './format-direccion.util'
import { escapeHtml } from './escape-html.util'
import { tablaItemsHtml, lineasItemsTexto, formatPrecio, ItemPedido } from './format-items-pedido.util'

const ADMIN_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'

/**
 * Una fila «rótulo · valor» del aviso al administrador.
 *
 * Tabla y no dos elementos en línea: con un valor largo —el mensaje de una
 * solicitud— el texto daba la vuelta por debajo del rótulo en vez de seguir en
 * su columna. Una tabla es lo único que todos los clientes de correo alinean
 * igual; Gmail y Outlook ignoran flex y grid.
 */
function filaHtml(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-bottom:1px solid #eee;font-size:14px">
    <tr>
      <td style="color:#888;width:140px;padding:8px 12px 8px 0;vertical-align:top">${label}</td>
      <td style="padding:8px 0;vertical-align:top"><strong>${value}</strong></td>
    </tr>
  </table>`
}

/**
 * Un día del calendario en letras: «martes, 20 de octubre de 2026».
 *
 * Las fechas de reserva y la fecha tentativa llegan como `YYYY-MM-DD` y se
 * guardan a la medianoche UTC. Formatearlas en la zona del servidor las corre un
 * día hacia atrás en cualquier máquina al oeste de Greenwich —en Colombia, el
 * 20 salía «lunes, 19»—, así que se leen en UTC, que es donde se guardaron.
 */
function fechaEnLetras(fecha: Date | string): string {
  return new Date(fecha).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })
}

/**
 * `a-medida` no es una experiencia del catálogo sino la opción de «quiero algo
 * que no existe», así que no tiene nombre en la base.
 */
const NOMBRES_SIN_FICHA: Record<string, string> = { 'a-medida': 'A medida' }

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name)

  constructor(
    private readonly email: EmailService,
    private readonly telegram: TelegramService,
    private readonly prisma: PrismaService,
  ) {}

  private async getAdminEmail(): Promise<string> {
    const row = await this.prisma.siteConfig.findUnique({ where: { key: 'admin_email' } })
    return row?.value || process.env.ADMIN_EMAIL || ''
  }

  /**
   * Lanza los avisos de un evento a la vez y cada uno por su cuenta.
   *
   * Antes iban en fila con `await`: acuse al cliente, correo al admin y por
   * último Telegram. Si Gmail rechazaba el acuse —una dirección mal escrita, la
   * contraseña de aplicación vencida—, el error cortaba la fila y Telegram, que
   * es el aviso que se lee al momento, no salía nunca. Ahora un fallo solo se
   * lleva su propio envío y queda en el log con su nombre.
   */
  private async enviarPorSeparado(
    evento: string,
    envios: Record<string, () => Promise<unknown>>,
  ): Promise<void> {
    const nombres = Object.keys(envios)
    const resultados = await Promise.allSettled(nombres.map(n => envios[n]()))
    resultados.forEach((r, i) => {
      if (r.status === 'rejected') {
        this.logger.error(
          `${evento}: falló «${nombres[i]}»`,
          r.reason instanceof Error ? r.reason.stack : String(r.reason),
        )
      }
    })
  }

  /** Solo manda el aviso si hay un correo de admin configurado. */
  private async alertarAdmin(asunto: string, vars: Record<string, string>): Promise<void> {
    const destino = await this.getAdminEmail()
    if (!destino) return
    await this.email.send(destino, asunto, this.email.templateAlertaAdmin(vars))
  }

  async enviarConfirmacionReserva(reserva: {
    id: string; nombre: string; email: string; telefono: string
    experiencia?: { nombre: string } | null
    fecha: Date; cantidadPersonas: number
  }): Promise<void> {
    const expNombre = reserva.experiencia?.nombre ?? 'Experiencia'
    const fechaStr = fechaEnLetras(reserva.fecha)

    await this.enviarPorSeparado(`Reserva ${reserva.id}`, {
      telegram: () => this.telegram.send(
        `📅 <b>Nueva Reserva</b>\nNombre: ${escapeHtml(reserva.nombre)}\nEmail: ${escapeHtml(reserva.email)}\nCelular: ${escapeHtml(reserva.telefono)}\nExperiencia: ${escapeHtml(expNombre)}\nFecha: ${fechaStr}\nPersonas: ${reserva.cantidadPersonas}`,
      ),
      'correo al cliente': () => this.email.send(
        reserva.email,
        `Confirmación de tu reserva — Vuelo Carmesí`,
        this.email.templateConfirmacionReserva({
          nombre: reserva.nombre,
          experiencia: expNombre,
          fecha: fechaStr,
          cantidadPersonas: String(reserva.cantidadPersonas),
          email: reserva.email,
        }),
      ),
      'correo al admin': () => this.alertarAdmin(`[Reserva] Nueva: ${reserva.nombre}`, {
        tipo: '📅 Nueva Reserva',
        filas: [
          filaHtml('Nombre', reserva.nombre),
          filaHtml('Email', reserva.email),
          filaHtml('Experiencia', expNombre),
          filaHtml('Fecha', fechaStr),
          filaHtml('Personas', String(reserva.cantidadPersonas)),
        ].join(''),
        adminUrl: `${ADMIN_URL}/admin/reservas`,
      }),
    })
  }

  async enviarConfirmacionPedido(pedido: {
    id: string; nombre: string; email: string
    direccion: string; ciudad: string; codigoPostal: string; total: number
    items: ItemPedido[]
  }): Promise<void> {
    const direccionCompleta = formatDireccionPedido(pedido)
    const itemsTableCliente = tablaItemsHtml(pedido.items, 'cliente')
    const itemsTableAdmin = tablaItemsHtml(pedido.items, 'admin')
    const lineasItems = lineasItemsTexto(pedido.items)

    await this.enviarPorSeparado(`Pedido ${pedido.id}`, {
      telegram: () => this.telegram.send(
        `🛒 <b>Nuevo Pedido</b>\nNombre: ${escapeHtml(pedido.nombre)}\nEmail: ${escapeHtml(pedido.email)}\n\n${escapeHtml(lineasItems)}\n\nTotal: ${formatPrecio(pedido.total)}`,
      ),
      'correo al cliente': () => this.email.send(
        pedido.email,
        `Recibimos tu pedido — Vuelo Carmesí`,
        this.email.templateConfirmacionPedido({
          nombre: pedido.nombre,
          id: pedido.id,
          direccion: direccionCompleta,
          itemsTable: itemsTableCliente,
        }),
      ),
      'correo al admin': () => this.alertarAdmin(`[Pedido] Nuevo: ${pedido.nombre}`, {
        tipo: '🛒 Nuevo Pedido',
        filas: [
          filaHtml('N° pedido', pedido.id),
          filaHtml('Nombre', pedido.nombre),
          filaHtml('Email', pedido.email),
          filaHtml('Dirección', direccionCompleta),
          itemsTableAdmin,
        ].join(''),
        adminUrl: `${ADMIN_URL}/admin/pedidos`,
      }),
    })
  }

  async enviarNuevoContacto(contacto: {
    id: string; nombre: string; email: string; telefono?: string | null; mensaje: string
  }): Promise<void> {
    // Opcional: solo sale si lo dejaron. Es el que permite contestar por WhatsApp.
    const telefono = contacto.telefono?.trim()
    await this.enviarPorSeparado(`Contacto ${contacto.id}`, {
      telegram: () => this.telegram.send(
        `✉️ <b>Nuevo Contacto</b>\nNombre: ${escapeHtml(contacto.nombre)}\nEmail: ${escapeHtml(contacto.email)}` +
        (telefono ? `\nTeléfono: ${escapeHtml(telefono)}` : '') +
        `\nMensaje: ${escapeHtml(contacto.mensaje)}`,
      ),
      // Escapados como en la solicitud de grupo: son texto libre de un
      // formulario público y van dentro del HTML de los dos correos.
      'correo al cliente': () => this.email.send(
        contacto.email,
        `Recibimos tu mensaje — Vuelo Carmesí`,
        this.email.templateContactoRecibido({
          nombre: escapeHtml(contacto.nombre),
          mensaje: escapeHtml(contacto.mensaje),
        }),
      ),
      'correo al admin': () => this.alertarAdmin(`[Contacto] Mensaje de ${contacto.nombre}`, {
        tipo: '✉️ Nuevo Mensaje de Contacto',
        filas: [
          filaHtml('Nombre', escapeHtml(contacto.nombre)),
          filaHtml('Email', escapeHtml(contacto.email)),
          ...(telefono ? [filaHtml('Teléfono', escapeHtml(telefono))] : []),
          filaHtml('Mensaje', escapeHtml(contacto.mensaje)),
        ].join(''),
        adminUrl: `${ADMIN_URL}/admin`,
      }),
    })
  }

  /**
   * Solicitud de cotización de un grupo.
   *
   * Tres salidas, como en contacto: acuse al solicitante, correo al admin y
   * Telegram. La que de verdad importa es Telegram: una cotización
   * institucional se gana respondiendo el mismo día, y el correo del admin se
   * lee cuando se lee. Por eso nada de lo demás puede tumbarla: ni la consulta
   * de nombres ni un correo rebotado.
   */
  async enviarNuevaSolicitudGrupo(solicitud: {
    id: string; tipo: string; institucion: string; nit?: string | null
    contacto: string; cargo?: string | null; email: string; telefono: string
    personas: number; edades?: string | null; fechaTentativa?: Date | null
    experiencias: string[]; requiereTransporte: boolean; requiereFactura: boolean
    mensaje: string
  }): Promise<void> {
    const fechaStr = solicitud.fechaTentativa
      ? fechaEnLetras(solicitud.fechaTentativa)
      : 'Sin definir'
    // El formulario manda slugs. En el correo van los nombres, que es como el
    // coordinador las eligió y como las reconoce quien cotiza.
    // Si la consulta falla se queda con los slugs: feos, pero el aviso sale.
    const fichas = await this.prisma.experiencia
      .findMany({
        where: { slug: { in: solicitud.experiencias } },
        select: { slug: true, nombre: true },
      })
      .catch(() => [] as { slug: string; nombre: string }[])
    const nombrePorSlug = new Map(fichas.map(f => [f.slug, f.nombre]))
    const experienciasStr = solicitud.experiencias.length
      ? solicitud.experiencias
          .map(slug => nombrePorSlug.get(slug) ?? NOMBRES_SIN_FICHA[slug] ?? slug)
          .join(', ')
      : 'A definir'
    const facturaStr = solicitud.requiereFactura
      ? `Sí${solicitud.nit ? ` · NIT ${solicitud.nit}` : ''}`
      : 'No'

    await this.enviarPorSeparado(`Solicitud de grupo ${solicitud.id}`, {
      telegram: () => this.telegram.send(
        `🏫 <b>Nueva solicitud de grupo</b>\n` +
          `Tipo: ${escapeHtml(solicitud.tipo)}\n` +
          `Institución: ${escapeHtml(solicitud.institucion)}\n` +
          `Contacto: ${escapeHtml(solicitud.contacto)}\n` +
          `Personas: ${solicitud.personas}\n` +
          `Fecha: ${fechaStr}\n` +
          `Celular: ${escapeHtml(solicitud.telefono)}\n` +
          `Email: ${escapeHtml(solicitud.email)}` +
          (solicitud.mensaje ? `\n\n${escapeHtml(solicitud.mensaje)}` : ''),
      ),
      'correo al cliente': () => this.email.send(
        solicitud.email,
        `Recibimos tu solicitud de grupo — Vuelo Carmesí`,
        this.email.templateSolicitudGrupoRecibida({
          contacto: escapeHtml(solicitud.contacto),
          institucion: escapeHtml(solicitud.institucion),
          tipo: escapeHtml(solicitud.tipo),
          personas: String(solicitud.personas),
          fecha: fechaStr,
          experiencias: escapeHtml(experienciasStr),
          factura: escapeHtml(facturaStr),
        }),
      ),
      'correo al admin': () => this.alertarAdmin(
        `[Grupo] ${solicitud.institucion} · ${solicitud.personas} personas`,
        {
          tipo: '🏫 Nueva Solicitud de Grupo',
          filas: [
            filaHtml('Tipo', escapeHtml(solicitud.tipo)),
            filaHtml('Institución', escapeHtml(solicitud.institucion)),
            filaHtml('Contacto', escapeHtml(solicitud.contacto)),
            ...(solicitud.cargo ? [filaHtml('Cargo', escapeHtml(solicitud.cargo))] : []),
            filaHtml('Email', escapeHtml(solicitud.email)),
            filaHtml('Teléfono', escapeHtml(solicitud.telefono)),
            filaHtml('Personas', String(solicitud.personas)),
            ...(solicitud.edades ? [filaHtml('Edades', escapeHtml(solicitud.edades))] : []),
            filaHtml('Fecha tentativa', fechaStr),
            filaHtml('Experiencias', escapeHtml(experienciasStr)),
            filaHtml('Factura', escapeHtml(facturaStr)),
            ...(solicitud.mensaje ? [filaHtml('Mensaje', escapeHtml(solicitud.mensaje))] : []),
          ].join(''),
          adminUrl: `${ADMIN_URL}/admin/grupos`,
        },
      ),
    })
  }

  async enviarReservaConfirmadaCliente(reserva: {
    id: string; nombre: string; email: string
    experiencia?: { nombre: string } | null
    fecha: Date; cantidadPersonas: number; estado: string
  }): Promise<void> {
    const expNombre = reserva.experiencia?.nombre ?? 'Experiencia'
    const fechaStr = fechaEnLetras(reserva.fecha)

    const instruccionesRow = await this.prisma.siteConfig.findUnique({ where: { key: 'instrucciones_confirmacion' } })
    const instrucciones = instruccionesRow?.value
      ?? 'Por favor llega 15 minutos antes del horario acordado. Recuerda llevar ropa cómoda, protector solar y mucho entusiasmo.'

    const contactoRow = await this.prisma.siteConfig.findUnique({ where: { key: 'contacto_negocio' } })
    const contacto = contactoRow?.value ?? 'hola@vuelocarmesi.com'

    const html = this.email.templateReservaConfirmada({
      nombre: escapeHtml(reserva.nombre),
      experiencia: escapeHtml(expNombre),
      fecha: escapeHtml(fechaStr),
      cantidadPersonas: String(reserva.cantidadPersonas),
      instrucciones: escapeHtml(instrucciones),
      contacto: escapeHtml(contacto),
    })
    await this.email.send(reserva.email, 'Tu reserva está confirmada — Vuelo Carmesí', html)
  }

  async enviarReservaCanceladaCliente(reserva: {
    id: string; nombre: string; email: string
    experiencia?: { nombre: string } | null
    fecha: Date; estado: string
  }, motivo?: string): Promise<void> {
    const expNombre = reserva.experiencia?.nombre ?? 'Experiencia'
    const fechaStr = fechaEnLetras(reserva.fecha)

    const motivoHtml = motivo
      ? `<div style="margin:16px 0;padding:16px 20px;background:#FFF8F0;border-left:3px solid #872B13;border-radius:4px"><div style="color:#872B13;font-weight:bold;font-size:13px;margin-bottom:4px">Motivo</div><div style="color:#5C3317;font-size:14px">${escapeHtml(motivo)}</div></div>`
      : ''

    const html = this.email.templateReservaCancelada({
      nombre: escapeHtml(reserva.nombre),
      experiencia: escapeHtml(expNombre),
      fecha: escapeHtml(fechaStr),
      motivoHtml,
      urlReserva: ADMIN_URL,
    })
    await this.email.send(reserva.email, 'Actualización sobre tu reserva — Vuelo Carmesí', html)
  }
}
