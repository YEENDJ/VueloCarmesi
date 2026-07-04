# Detalle de items en la notificación de pedido Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar el detalle de la compra (producto, precio unitario, cantidad y subtotal, además del total) en las 3 notificaciones de un pedido nuevo: email al cliente, email al admin y mensaje de Telegram al admin.

**Architecture:** Se extraen dos utilidades puras y testeables (`format-items-pedido.util.ts` para armar la tabla HTML y las líneas de texto, `escape-html.util.ts` para escapar nombres de producto), y se las conecta desde `NotificacionesService.enviarConfirmacionPedido`, que ya recibe los `items` del pedido gracias a que `PedidosService.create` los incluye en la consulta a Prisma.

**Tech Stack:** NestJS, TypeScript, Jest (`ts-jest`), plantillas HTML con placeholders `{{var}}` reemplazados por `EmailService.tpl`.

## Global Constraints

- Formato de moneda: `es-CO` vía `toLocaleString('es-CO')`, siempre prefijado con `"$ "` (dólar + espacio), igual que el resto del código (`back/src/notificaciones/notificaciones.service.ts:83`, `confirmacion-pedido.html:15`).
- Todo nombre de producto insertado en HTML debe pasar por `escapeHtml` antes de interpolarse.
- No se modifica `PedidosService.create` — el objeto `pedido` que ya pasa a `enviarConfirmacionPedido` (con `items: { include: { producto: true } }`) ya trae los datos necesarios.
- Seguir el patrón existente de utils con spec propio (ver `format-direccion.util.ts` / `format-direccion.util.spec.ts`).

---

### Task 1: Utilidad `escapeHtml` compartida

**Files:**
- Create: `back/src/notificaciones/escape-html.util.ts`
- Test: `back/src/notificaciones/escape-html.util.spec.ts`
- Modify: `back/src/notificaciones/notificaciones.service.ts:9-16` (elimina la función local `escapeHtml` y la importa del nuevo util)

**Interfaces:**
- Produces: `escapeHtml(str: string): string` — escapa `&`, `<`, `>`, `"`, `'` en ese orden.

- [ ] **Step 1: Escribir el test que falla**

```ts
// back/src/notificaciones/escape-html.util.spec.ts
import { escapeHtml } from './escape-html.util'

describe('escapeHtml', () => {
  it('escapa caracteres especiales de HTML', () => {
    expect(escapeHtml(`<b>Café "Premium" & 'Miel'</b>`))
      .toBe('&lt;b&gt;Café &quot;Premium&quot; &amp; &#39;Miel&#39;&lt;/b&gt;')
  })

  it('deja intacto un texto sin caracteres especiales', () => {
    expect(escapeHtml('Café Premium 500g')).toBe('Café Premium 500g')
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `cd back && npx jest escape-html.util.spec.ts`
Expected: FAIL con `Cannot find module './escape-html.util'`

- [ ] **Step 3: Implementar la utilidad**

```ts
// back/src/notificaciones/escape-html.util.ts
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `cd back && npx jest escape-html.util.spec.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Reemplazar la función local en `notificaciones.service.ts` por la importada**

En `back/src/notificaciones/notificaciones.service.ts`, agregar el import y borrar la función local `escapeHtml` (líneas 9-16):

```ts
// antes de la línea "function filaHtml(...)"
import { escapeHtml } from './escape-html.util'
```

Borrar:
```ts
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
```

- [ ] **Step 6: Correr toda la suite de notificaciones para verificar que no rompió nada**

Run: `cd back && npx jest notificaciones`
Expected: PASS (sin tests todavía específicos de `notificaciones.service.ts`, pero no debe haber errores de compilación)

- [ ] **Step 7: Commit**

```bash
git add back/src/notificaciones/escape-html.util.ts back/src/notificaciones/escape-html.util.spec.ts back/src/notificaciones/notificaciones.service.ts
git commit -m "refactor(back): extraer escapeHtml a util compartido"
```

---

### Task 2: Utilidad de detalle de items (tabla HTML + líneas de texto)

**Files:**
- Create: `back/src/notificaciones/format-items-pedido.util.ts`
- Test: `back/src/notificaciones/format-items-pedido.util.spec.ts`

**Interfaces:**
- Consumes: `escapeHtml(str: string): string` de `./escape-html.util` (Task 1).
- Produces:
  - `type ItemPedido = { cantidad: number; precio: number; producto: { nombre: string } }`
  - `tablaItemsHtml(items: ItemPedido[], variant: 'cliente' | 'admin'): string`
  - `lineasItemsTexto(items: ItemPedido[]): string`

- [ ] **Step 1: Escribir los tests que fallan**

```ts
// back/src/notificaciones/format-items-pedido.util.spec.ts
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
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `cd back && npx jest format-items-pedido.util.spec.ts`
Expected: FAIL con `Cannot find module './format-items-pedido.util'`

- [ ] **Step 3: Implementar la utilidad**

```ts
// back/src/notificaciones/format-items-pedido.util.ts
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
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `cd back && npx jest format-items-pedido.util.spec.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add back/src/notificaciones/format-items-pedido.util.ts back/src/notificaciones/format-items-pedido.util.spec.ts
git commit -m "feat(back): utilidad para tabla de detalle de items en notificaciones de pedido"
```

---

### Task 3: Conectar la utilidad en `NotificacionesService.enviarConfirmacionPedido`

**Files:**
- Modify: `back/src/notificaciones/notificaciones.service.ts:79-114`
- Test: `back/src/notificaciones/notificaciones.service.spec.ts` (nuevo)

**Interfaces:**
- Consumes: `tablaItemsHtml`, `lineasItemsTexto`, `ItemPedido` de `./format-items-pedido.util` (Task 2).
- Produces: `enviarConfirmacionPedido(pedido: { id; nombre; email; direccion; ciudad; codigoPostal; total; items: ItemPedido[] }): Promise<void>` — firma extendida con `items`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// back/src/notificaciones/notificaciones.service.spec.ts
import 'reflect-metadata'
import { Test } from '@nestjs/testing'
import { NotificacionesService } from './notificaciones.service'
import { EmailService } from './email.service'
import { TelegramService } from './telegram.service'
import { PrismaService } from '../prisma.service'

const mockEmail = {
  send: jest.fn().mockResolvedValue(undefined),
  templateConfirmacionPedido: jest.fn().mockReturnValue('<html-cliente>'),
  templateAlertaAdmin: jest.fn().mockReturnValue('<html-admin>'),
}

const mockTelegram = { send: jest.fn().mockResolvedValue(undefined) }

const mockPrisma = {
  siteConfig: { findUnique: jest.fn().mockResolvedValue({ value: 'admin@vuelocarmesi.com' }) },
}

const pedido = {
  id: 'ped1',
  nombre: 'Ana',
  email: 'ana@example.com',
  direccion: 'Calle 10',
  ciudad: 'Medellín',
  codigoPostal: '050001',
  total: 55000,
  items: [
    { cantidad: 2, precio: 20000, producto: { nombre: 'Café Premium 500g' } },
    { cantidad: 1, precio: 15000, producto: { nombre: 'Miel Orgánica 250g' } },
  ],
}

describe('NotificacionesService.enviarConfirmacionPedido', () => {
  let service: NotificacionesService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificacionesService,
        { provide: EmailService, useValue: mockEmail },
        { provide: TelegramService, useValue: mockTelegram },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get(NotificacionesService)
    jest.clearAllMocks()
    mockPrisma.siteConfig.findUnique.mockResolvedValue({ value: 'admin@vuelocarmesi.com' })
  })

  it('incluye la tabla de detalle de items en el email al cliente', async () => {
    await service.enviarConfirmacionPedido(pedido)

    const varsCliente = mockEmail.templateConfirmacionPedido.mock.calls[0][0]
    expect(varsCliente.itemsTable).toContain('Café Premium 500g')
    expect(varsCliente.itemsTable).toContain('Miel Orgánica 250g')
    expect(varsCliente.itemsTable).toContain('$ 40.000')
    expect(varsCliente.itemsTable).toContain('$ 55.000')
  })

  it('incluye la tabla de detalle de items en las filas del email admin, sin fila de total duplicada', async () => {
    await service.enviarConfirmacionPedido(pedido)

    const varsAdmin = mockEmail.templateAlertaAdmin.mock.calls[0][0]
    expect(varsAdmin.filas).toContain('Café Premium 500g')
    expect(varsAdmin.filas).toContain('$ 55.000')
    expect((varsAdmin.filas.match(/Total/g) ?? []).length).toBe(1)
  })

  it('incluye una línea por producto y el total en el mensaje de Telegram', async () => {
    await service.enviarConfirmacionPedido(pedido)

    const mensaje = mockTelegram.send.mock.calls[0][0]
    expect(mensaje).toContain('Café Premium 500g × 2 — $ 20.000 c/u — $ 40.000')
    expect(mensaje).toContain('Miel Orgánica 250g × 1 — $ 15.000 c/u — $ 15.000')
    expect(mensaje).toContain('Total: $ 55.000 COP')
  })
})
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `cd back && npx jest notificaciones.service.spec.ts`
Expected: FAIL — `varsCliente.itemsTable` es `undefined`, `varsAdmin.filas` no contiene la tabla, el mensaje de Telegram no tiene las líneas por producto (la implementación actual solo pasa `total`, no `items`).

- [ ] **Step 3: Modificar `enviarConfirmacionPedido`**

En `back/src/notificaciones/notificaciones.service.ts`, agregar el import junto al de `escapeHtml`:

```ts
import { tablaItemsHtml, lineasItemsTexto, ItemPedido } from './format-items-pedido.util'
```

Reemplazar el método completo (líneas 79-114) por:

```ts
  async enviarConfirmacionPedido(pedido: {
    id: string; nombre: string; email: string
    direccion: string; ciudad: string; codigoPostal: string; total: number
    items: ItemPedido[]
  }): Promise<void> {
    const totalStr = pedido.total.toLocaleString('es-CO')
    const direccionCompleta = formatDireccionPedido(pedido)
    const itemsTableCliente = tablaItemsHtml(pedido.items, 'cliente')
    const itemsTableAdmin = tablaItemsHtml(pedido.items, 'admin')
    const lineasItems = lineasItemsTexto(pedido.items)

    const htmlCliente = this.email.templateConfirmacionPedido({
      nombre: pedido.nombre,
      id: pedido.id,
      direccion: direccionCompleta,
      itemsTable: itemsTableCliente,
    })
    await this.email.send(pedido.email, `Recibimos tu pedido — Vuelo Carmesí`, htmlCliente)

    const adminEmailPedido = await this.getAdminEmail()
    if (adminEmailPedido) {
      const filas = [
        filaHtml('N° pedido', pedido.id),
        filaHtml('Nombre', pedido.nombre),
        filaHtml('Email', pedido.email),
        filaHtml('Dirección', direccionCompleta),
        itemsTableAdmin,
      ].join('')
      const htmlAdmin = this.email.templateAlertaAdmin({
        tipo: '🛒 Nuevo Pedido',
        filas,
        adminUrl: `${ADMIN_URL}/admin/pedidos`,
      })
      await this.email.send(adminEmailPedido, `[Pedido] Nuevo: ${pedido.nombre}`, htmlAdmin)
    }

    await this.telegram.send(
      `🛒 *Nuevo Pedido*\nNombre: ${pedido.nombre}\nEmail: ${pedido.email}\n\n${lineasItems}\n\nTotal: $ ${totalStr} COP`,
    )
  }
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `cd back && npx jest notificaciones.service.spec.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Correr toda la suite del backend para verificar que nada más se rompió**

Run: `cd back && npx jest`
Expected: PASS en todos los archivos, incluyendo `pedidos.service.spec.ts` (el mock `enviarConfirmacionPedido: jest.fn()` no exige la nueva forma del parámetro en runtime, y `pedido` ya trae `items` desde el `include` de Prisma en `pedidos.service.ts:82`)

- [ ] **Step 6: Commit**

```bash
git add back/src/notificaciones/notificaciones.service.ts back/src/notificaciones/notificaciones.service.spec.ts
git commit -m "feat(back): incluir detalle de items en notificaciones de pedido"
```

---

### Task 4: Actualizar el template HTML del email al cliente

**Files:**
- Modify: `back/src/notificaciones/templates/confirmacion-pedido.html`

**Interfaces:**
- Consumes: variable `{{itemsTable}}` (HTML ya armado por `tablaItemsHtml`, Task 3) en lugar de `{{total}}`.

- [ ] **Step 1: Modificar el template**

Reemplazar en `back/src/notificaciones/templates/confirmacion-pedido.html` el bloque de la tabla de metadatos (líneas 12-16):

Antes:
```html
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#872B13;font-weight:bold;width:40%">N° de pedido</td><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#5C3317;font-family:monospace">{{id}}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#872B13;font-weight:bold">Dirección</td><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#5C3317">{{direccion}}</td></tr>
        <tr><td style="padding:10px 0;color:#872B13;font-weight:bold">Total</td><td style="padding:10px 0;color:#D51312;font-size:18px;font-weight:bold">$ {{total}}</td></tr>
      </table>
```

Después:
```html
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#872B13;font-weight:bold;width:40%">N° de pedido</td><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#5C3317;font-family:monospace">{{id}}</td></tr>
        <tr><td style="padding:10px 0;color:#872B13;font-weight:bold;width:40%">Dirección</td><td style="padding:10px 0;color:#5C3317">{{direccion}}</td></tr>
      </table>
      {{itemsTable}}
```

- [ ] **Step 2: Verificar visualmente el render**

Run:
```bash
cd back
node -e "
const fs = require('fs');
let html = fs.readFileSync('src/notificaciones/templates/confirmacion-pedido.html', 'utf-8');
html = html
  .replaceAll('{{nombre}}', 'Ana')
  .replaceAll('{{id}}', 'ped1')
  .replaceAll('{{direccion}}', 'Calle 10, Medellín (CP 050001)')
  .replaceAll('{{itemsTable}}', '<table><tr><td>Café Premium 500g</td><td>2</td><td>\$ 20.000</td><td>\$ 40.000</td></tr></table>');
fs.writeFileSync('/tmp/preview-confirmacion-pedido.html', html);
console.log('OK, sin placeholders sin reemplazar:', !html.includes('{{'));
"
```
Expected: imprime `OK, sin placeholders sin reemplazar: true`

- [ ] **Step 3: Commit**

```bash
git add back/src/notificaciones/templates/confirmacion-pedido.html
git commit -m "feat(back): agregar tabla de detalle de items al email de confirmacion de pedido"
```

---

## Self-Review Notes

- **Cobertura del spec:** Task 1 cubre la sección "Seguridad" (escapeHtml compartido), Task 2 cubre "Helper de tabla de items", Task 3 cubre "Firma de enviarConfirmacionPedido" + "Email al admin" + "Telegram", Task 4 cubre "Email al cliente". Todas las secciones del spec tienen tarea.
- **Consistencia de tipos:** `ItemPedido` se define una sola vez en `format-items-pedido.util.ts` (Task 2) y se reusa sin redefinir en `notificaciones.service.ts` (Task 3) y en los tests (Task 3).
- **Sin placeholders:** todos los steps incluyen código completo y comandos exactos.
