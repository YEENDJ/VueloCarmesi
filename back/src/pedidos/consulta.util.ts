import { randomBytes } from 'crypto'

/**
 * La página pública «mi pedido»: lo que el cliente sin cuenta puede ver de su
 * compra con el enlace del correo, o consultando con código y correo.
 */

/** 32 bytes al azar en base64url: 43 caracteres que no se pueden adivinar. */
export function generarTokenConsulta(): string {
  return randomBytes(32).toString('base64url')
}

/** El número corto que el cliente ve en el sitio y cita por WhatsApp: VC-XXXXXX. */
export function codigoPedido(id: string): string {
  return `VC-${id.slice(-6).toUpperCase()}`
}

/**
 * Lo que escribió el cliente en «código de pedido», listo para buscar.
 *
 * Acepta el código corto del sitio («VC-AB12CD», «#vc-ab12cd», «ab12cd») y
 * también el id completo, que es lo que traían los correos hasta ahora.
 * Devuelve null si no se parece a ninguno de los dos.
 */
export function normalizarCodigo(texto: string): { sufijo: string } | { id: string } | null {
  const limpio = texto.trim().replace(/^#/, '').replace(/\s+/g, '').toLowerCase()
  const corto = /^(?:vc-?)?([a-z0-9]{6})$/.exec(limpio)
  if (corto) return { sufijo: corto[1] }
  // Los ids son cuid: 25 caracteres en minúscula, empiezan por «c».
  if (/^c[a-z0-9]{20,30}$/.test(limpio)) return { id: limpio }
  return null
}

type PedidoConDetalle = {
  id: string
  estado: string
  total: number
  venceEn: Date | null
  createdAt: Date
  pagadoEn: Date | null
  enviadoEn: Date | null
  entregadoEn: Date | null
  items: {
    cantidad: number; precio: number; nombre: string; imagen: string
    producto: { nombre: string; imagen: string; slug: string } | null
  }[]
  pagos: { referencia: string; estado: string; createdAt: Date }[]
}

/**
 * La vista pública de un pedido. Sin nombre, correo, teléfono ni dirección: el
 * enlace se puede reenviar o quedar en un historial, y para saber cómo va una
 * compra no hacen falta.
 */
export function vistaPublica(pedido: PedidoConDetalle) {
  // El último intento de pago, para que la página pueda mandar a su resultado
  // (pendiente con el banco, o reintentar uno rechazado).
  const ultimoPago = [...pedido.pagos].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
  return {
    codigo: codigoPedido(pedido.id),
    estado: pedido.estado,
    total: pedido.total,
    creadoEn: pedido.createdAt,
    venceEn: pedido.estado === 'pendiente_pago' ? pedido.venceEn : null,
    // Cuándo llegó a cada paso del avance. Nulo el que no ha llegado o no tiene registro.
    fechas: {
      recibido: pedido.createdAt,
      pagado: pedido.pagadoEn,
      enviado: pedido.enviadoEn,
      entregado: pedido.entregadoEn,
    },
    referenciaPago: ultimoPago?.referencia ?? null,
    items: pedido.items.map(i => ({
      // Sin producto (se eliminó) queda la copia del pedido y no hay ficha a la que enlazar.
      nombre: i.producto?.nombre ?? i.nombre,
      slug: i.producto?.slug ?? null,
      imagen: (i.producto?.imagen ?? i.imagen) || null,
      cantidad: i.cantidad,
      precio: i.precio,
    })),
  }
}
