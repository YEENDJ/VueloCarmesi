import { tablaItemsHtml, lineasItemsTexto, ItemPedido } from './format-items-pedido.util'

const items: ItemPedido[] = [
  { cantidad: 2, precio: 20000, producto: { nombre: 'Café Premium 500g' } },
  { cantidad: 1, precio: 15000, producto: { nombre: 'Miel Orgánica 250g' } },
]

describe('tablaItemsHtml', () => {
  it('variant cliente: incluye header, filas por item y total', () => {
    const html = tablaItemsHtml(items, 'cliente')
    expect(html).toContain('Producto')
    expect(html).toContain('Cant.')
    expect(html).toContain('Precio unit.')
    expect(html).toContain('Subtotal')
    expect(html).toContain('Café Premium 500g')
    expect(html).toContain('Miel Orgánica 250g')
    expect(html).toContain('$ 20.000')
    expect(html).toContain('$ 40.000')
    expect(html).toContain('$ 15.000')
    expect(html).toContain('$ 55.000')
  })

  it('variant admin: incluye header, filas por item y total', () => {
    const html = tablaItemsHtml(items, 'admin')
    expect(html).toContain('Café Premium 500g')
    expect(html).toContain('$ 55.000')
  })

  it('escapa el nombre del producto en ambas variantes', () => {
    const itemsConHtml: ItemPedido[] = [
      { cantidad: 1, precio: 1000, producto: { nombre: '<script>alert(1)</script>' } },
    ]
    expect(tablaItemsHtml(itemsConHtml, 'cliente')).not.toContain('<script>')
    expect(tablaItemsHtml(itemsConHtml, 'admin')).not.toContain('<script>')
  })

  it('calcula el total como suma de precio * cantidad de todos los items', () => {
    const html = tablaItemsHtml(items, 'cliente')
    expect(html).toContain('$ 55.000')
  })
})

describe('lineasItemsTexto', () => {
  it('genera una línea por item con nombre, cantidad, precio unitario y subtotal', () => {
    const texto = lineasItemsTexto(items)
    expect(texto).toBe(
      'Café Premium 500g × 2 — $ 20.000 c/u — $ 40.000\n' +
      'Miel Orgánica 250g × 1 — $ 15.000 c/u — $ 15.000',
    )
  })
})
