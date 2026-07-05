import { escapeHtml } from './escape-html.util'

export type ItemPedido = {
  cantidad: number
  precio: number
  producto: { nombre: string }
}

function money(n: number): string {
  return `$ ${n.toLocaleString('es-CO')}`
}

function filaItemHtml(item: ItemPedido, variant: 'cliente' | 'admin'): string {
  const nombre = escapeHtml(item.producto.nombre)
  const subtotal = item.precio * item.cantidad
  const borderColor = variant === 'cliente' ? '#F0D6A8' : '#eee'
  const textColor = variant === 'cliente' ? 'color:#5C3317;' : ''
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid ${borderColor};${textColor}">${nombre}</td>
    <td style="padding:8px 0;border-bottom:1px solid ${borderColor};${textColor}text-align:center">${item.cantidad}</td>
    <td style="padding:8px 0;border-bottom:1px solid ${borderColor};${textColor}text-align:right">${money(item.precio)}</td>
    <td style="padding:8px 0;border-bottom:1px solid ${borderColor};${textColor}text-align:right">${money(subtotal)}</td>
  </tr>`
}

export function tablaItemsHtml(items: ItemPedido[], variant: 'cliente' | 'admin'): string {
  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
  const filas = items.map(item => filaItemHtml(item, variant)).join('')

  const headerColor = variant === 'cliente' ? '#872B13' : '#888'
  const headerBorder = variant === 'cliente' ? '2px solid #872B13' : '1px solid #ddd'
  const fontFamily = variant === 'cliente' ? 'font-family:Arial,sans-serif;' : ''
  const totalLabelColor = variant === 'cliente' ? 'color:#872B13;' : ''
  const totalValueColor = variant === 'cliente' ? 'color:#D51312;font-size:16px;' : 'color:#872B13;'
  const tableStyle = variant === 'cliente'
    ? 'width:100%;border-collapse:collapse;margin-top:8px'
    : 'width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;margin:8px 0'

  return `<table style="${tableStyle}">
    <thead><tr>
      <th style="text-align:left;padding:8px 0;border-bottom:${headerBorder};color:${headerColor};font-size:12px;text-transform:uppercase;${fontFamily}">Producto</th>
      <th style="text-align:center;padding:8px 0;border-bottom:${headerBorder};color:${headerColor};font-size:12px;text-transform:uppercase;${fontFamily}">Cant.</th>
      <th style="text-align:right;padding:8px 0;border-bottom:${headerBorder};color:${headerColor};font-size:12px;text-transform:uppercase;${fontFamily}">Precio unit.</th>
      <th style="text-align:right;padding:8px 0;border-bottom:${headerBorder};color:${headerColor};font-size:12px;text-transform:uppercase;${fontFamily}">Subtotal</th>
    </tr></thead>
    <tbody>${filas}</tbody>
    <tfoot><tr>
      <td colspan="3" style="padding:12px 0 0;text-align:right;font-weight:bold;${totalLabelColor}">Total</td>
      <td style="padding:12px 0 0;text-align:right;font-weight:bold;${totalValueColor}">${money(total)}</td>
    </tr></tfoot>
  </table>`
}

export function lineasItemsTexto(items: ItemPedido[]): string {
  return items
    .map(item => {
      const subtotal = item.precio * item.cantidad
      return `${item.producto.nombre} × ${item.cantidad} — ${money(item.precio)} c/u — ${money(subtotal)}`
    })
    .join('\n')
}
