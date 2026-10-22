import { codigoPedido, pagoEnCursoDe } from '../pedidos/consulta.util'
import { hoyBogota } from './fecha-reserva.util'

/**
 * La página pública «mi reserva»: lo que el cliente sin cuenta puede ver de su
 * reserva con el enlace del correo, o consultando con código y correo. Mismas
 * llaves y mismo código corto (VC-XXXXXX) que «mi pedido»: ver pedidos/consulta.util.
 */

type ReservaConDetalle = {
  id: string
  estado: string
  fecha: Date
  cantidadPersonas: number
  total: number | null
  porcentajeAbono: number | null
  montoAbono: number | null
  venceEn: Date | null
  createdAt: Date
  abonoPagadoEn: Date | null
  confirmadaEn: Date | null
  experienciaNombre: string
  experiencia: { nombre: string; slug: string; imagen: string } | null
  pagos: { referencia: string; estado: string; createdAt: Date; proveedorTxId?: string | null }[]
}

/**
 * Sin nombre, correo ni teléfono: el enlace se puede reenviar, y para saber
 * cómo va una reserva no hacen falta.
 */
export function vistaPublicaReserva(r: ReservaConDetalle) {
  const ultimoPago = [...r.pagos].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
  // La fecha se guarda como medianoche UTC del día elegido.
  const realizada = r.estado === 'confirmada' && r.fecha < new Date(hoyBogota())
  return {
    codigo: codigoPedido(r.id),
    estado: r.estado,
    realizada,
    // Sin ficha (se eliminó) queda el nombre copiado al reservar, sin enlace.
    experiencia: {
      nombre: r.experiencia?.nombre || r.experienciaNombre,
      slug: r.experiencia?.slug ?? null,
      imagen: r.experiencia?.imagen || null,
    },
    fecha: r.fecha.toISOString().slice(0, 10),
    cantidadPersonas: r.cantidadPersonas,
    total: r.total,
    porcentajeAbono: r.porcentajeAbono,
    montoAbono: r.montoAbono,
    abonoPagado: r.abonoPagadoEn != null || r.pagos.some(p => p.estado === 'aprobado'),
    creadoEn: r.createdAt,
    venceEn: r.estado === 'pendiente_pago' ? r.venceEn : null,
    pagoEnCurso: pagoEnCursoDe(r.estado, r.pagos),
    referenciaPago: ultimoPago?.referencia ?? null,
    // Cuándo llegó a cada paso. Nulo el que no ha llegado o no tiene registro.
    fechas: {
      recibida: r.createdAt,
      abono: r.abonoPagadoEn,
      confirmada: r.confirmadaEn,
    },
  }
}
