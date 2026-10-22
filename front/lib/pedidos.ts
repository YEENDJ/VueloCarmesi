/**
 * La página pública «mi pedido»: cómo va una compra sin tener cuenta.
 *
 * Habla con `GET /pedidos/consulta/:token` y `POST /pedidos/consulta` en
 * back/src/pedidos. La vista no trae datos del cliente (nombre, correo,
 * dirección): el enlace se puede reenviar y para saber cómo va no hacen falta.
 */

const API = process.env.NEXT_PUBLIC_API_URL

/** Los estados de back/prisma/schema.prisma (Pedido.estado). */
export type EstadoPedido =
  | 'pendiente' | 'pendiente_pago' | 'pagado' | 'enviado' | 'entregado'
  | 'cancelado' | 'expirado' | 'requiere_revision'

export interface ItemPedidoPublico {
  nombre: string
  /** Nulo si el producto ya no está en la tienda. */
  slug: string | null
  imagen: string | null
  cantidad: number
  precio: number
}

export interface PedidoPublico {
  codigo: string
  estado: EstadoPedido
  total: number
  creadoEn: string
  /** Hasta cuándo se puede pagar. Solo en `pendiente_pago`. */
  venceEn: string | null
  /**
   * El banco tiene un pago en curso (PSE o Nequi sin respuesta): no se ofrece
   * pagar de nuevo. Opcional: un backend anterior a este campo no lo manda.
   */
  pagoEnCurso?: boolean
  /**
   * Cuándo llegó a cada paso del avance. Nulo el que no ha llegado, o el de un
   * pedido anterior a que se guardaran (enviado y entregado no tienen registro).
   */
  fechas?: { recibido: string; pagado: string | null; enviado: string | null; entregado: string | null }
  /** El último intento de pago, para mandar a su página de resultado. */
  referenciaPago: string | null
  items: ItemPedidoPublico[]
}

/** 404 = no existe (o código y correo no coinciden); cualquier otro, falla de red o servidor. */
export class ErrorConsulta extends Error {
  constructor(readonly status: number) {
    super(`Error ${status}`)
  }
}

/** También la usa lib/reservas-consulta.ts: mismas reglas de error para «mi reserva». */
export async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API}${ruta}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      cache: 'no-store',
    })
  } catch {
    throw new ErrorConsulta(0)
  }
  if (!res.ok) throw new ErrorConsulta(res.status)
  return res.json() as Promise<T>
}

export const obtenerPedido = (token: string) =>
  pedir<PedidoPublico>(`/pedidos/consulta/${encodeURIComponent(token)}`)

export const consultarPedido = (codigo: string, email: string) =>
  pedir<{ token: string }>('/pedidos/consulta', { method: 'POST', body: JSON.stringify({ codigo, email }) })
