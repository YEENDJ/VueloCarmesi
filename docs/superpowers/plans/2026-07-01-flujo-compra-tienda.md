# Flujo de compra de la tienda — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el flujo de compra completo de la tienda (Tienda → Detalle → Carrito → Checkout → Confirmación) siguiendo la especificación funcional del handoff, con un store de carrito real y compartido, persistencia, validación de checkout y modelo de datos compartido con el Admin.

**Architecture:** Store de carrito vanilla (`useSyncExternalStore`, sin librerías de estado nuevas) como fuente única de verdad en el cliente, persistido en `localStorage`. Backend NestJS/Prisma existente se extiende con 2 campos (`Producto.badge`, `Pedido.telefono/ciudad/codigoPostal`) reutilizando la transacción de stock ya implementada. Checkout valida con `react-hook-form` + `zod`.

**Tech Stack:** Next.js 14+/App Router, React 19, NestJS, Prisma (Postgres/Neon), Jest (backend, ya establecido), Vitest (frontend, nuevo — solo para lógica pura sin JSX).

## Global Constraints

- Reutilizar `front/styles/tokens.css` y los componentes UI existentes (`Button`, `Card`, `Badge`, `QuantitySelector`, `Input`) — no crear un sistema de diseño paralelo.
- Formato de precio: `$` + separador de miles `es-CO` (Colombia) en todo el flujo de tienda — no `es-AR`.
- El carrito y sus selectors (`cartCount`, `cartTotal`) deben ser un estado compartido real entre componentes, no instancias aisladas.
- `Producto.categoria` es `string` libre (no unión fija) — refleja lo que ya administra el Admin.
- Antes de ejecutar la migración de Prisma (Task 1) contra la Neon DB real, pedir confirmación explícita al usuario — es una base compartida, no local/descartable.
- No agregar dependencias de estado (`zustand` etc.) — el store se implementa sin librerías nuevas. Las únicas dependencias nuevas permitidas son las ya acordadas: `zod`, `react-hook-form`, `@hookform/resolvers`, `vitest`, `jsdom`.

---

### Task 1: Extender el schema de Prisma (badge de producto + datos de contacto del pedido)

**Files:**
- Modify: `back/prisma/schema.prisma`

**Interfaces:**
- Produces: columnas `Producto.badge` (`String?`), `Pedido.telefono` (`String`), `Pedido.ciudad` (`String`), `Pedido.codigoPostal` (`String`) — usadas por Task 2 (DTOs) y Task 3 (service).

- [ ] **Step 1: Editar el modelo `Producto`**

En `back/prisma/schema.prisma`, dentro de `model Producto`, agregar el campo `badge` después de `categoria`:

```prisma
model Producto {
  id          String       @id @default(cuid())
  slug        String       @unique
  nombre      String
  descripcion String
  precio      Float
  stock       Int
  imagen      String       @default("")
  categoria   String
  badge       String?
  createdAt   DateTime     @default(now())
  itemsPedido ItemPedido[]
}
```

- [ ] **Step 2: Editar el modelo `Pedido`**

En el mismo archivo, dentro de `model Pedido`, agregar `telefono`, `ciudad` y `codigoPostal` después de `direccion`:

```prisma
model Pedido {
  id           String       @id @default(cuid())
  nombre       String
  email        String
  telefono     String
  direccion    String
  ciudad       String
  codigoPostal String
  total        Float
  estado       String       @default("pendiente")
  createdAt    DateTime     @default(now())
  items        ItemPedido[]
}
```

- [ ] **Step 3: STOP — confirmar con el usuario antes de migrar**

`back/.env` apunta a una base Postgres real en Neon (no local, no descartable). Antes de continuar, preguntar explícitamente al usuario: *"¿Confirmás que ejecute la migración de Prisma contra la base de Neon configurada en `back/.env`?"* No avanzar al Step 4 sin una confirmación explícita.

- [ ] **Step 4: Ejecutar la migración**

```bash
cd back && npx prisma migrate dev --name add_producto_badge_and_pedido_contacto
```

Expected: la CLI reporta la migración aplicada y regenera el cliente de Prisma (`back/src/generated/prisma`) sin errores.

- [ ] **Step 5: Commit**

```bash
git add back/prisma/schema.prisma back/prisma/migrations
git commit -m "feat(back): agregar badge de producto y datos de contacto del pedido"
```

---

### Task 2: DTOs — badge de producto y datos de contacto del pedido

**Files:**
- Modify: `back/src/productos/dto/create-producto.dto.ts`
- Modify: `back/src/pedidos/dto/create-pedido.dto.ts`
- Test: `back/src/productos/dto/create-producto.dto.spec.ts`
- Test: `back/src/pedidos/dto/create-pedido.dto.spec.ts`

**Interfaces:**
- Consumes: columnas de Task 1 (solo como contexto — el DTO no importa Prisma).
- Produces: `CreateProductoDto.badge?: string`, `CreatePedidoDto.telefono/ciudad/codigoPostal: string` — usados por Task 3 (`PedidosService.create`) y por el frontend (Task 13, vía la forma del body que espera el endpoint).

- [ ] **Step 1: Escribir los tests que fallan**

Crear `back/src/productos/dto/create-producto.dto.spec.ts`:

```ts
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { CreateProductoDto } from './create-producto.dto'

const BASE = {
  nombre: 'Chocolate Negro 70%',
  slug: 'chocolate-negro-70',
  descripcion: 'Tableta 80g',
  precio: 22000,
  stock: 40,
  categoria: 'chocolates',
}

describe('CreateProductoDto', () => {
  it('es válido sin badge', async () => {
    const dto = plainToInstance(CreateProductoDto, { ...BASE })
    const errores = await validate(dto)
    expect(errores).toHaveLength(0)
  })

  it('acepta badge "Nuevo" o "Destacado"', async () => {
    const nuevo = plainToInstance(CreateProductoDto, { ...BASE, badge: 'Nuevo' })
    const destacado = plainToInstance(CreateProductoDto, { ...BASE, badge: 'Destacado' })
    expect(await validate(nuevo)).toHaveLength(0)
    expect(await validate(destacado)).toHaveLength(0)
  })

  it('rechaza un badge que no sea Nuevo/Destacado', async () => {
    const dto = plainToInstance(CreateProductoDto, { ...BASE, badge: 'Oferta' })
    const errores = await validate(dto)
    expect(errores.length).toBeGreaterThan(0)
  })
})
```

Crear `back/src/pedidos/dto/create-pedido.dto.spec.ts`:

```ts
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { CreatePedidoDto } from './create-pedido.dto'

const BASE = {
  nombre: 'Ana Pérez',
  email: 'ana@example.com',
  telefono: '3001234567',
  direccion: 'Calle 10 # 5-30',
  ciudad: 'Medellín',
  codigoPostal: '050001',
  items: [{ productoId: 'p1', cantidad: 2 }],
}

describe('CreatePedidoDto', () => {
  it('es válido con todos los campos', async () => {
    const dto = plainToInstance(CreatePedidoDto, BASE)
    const errores = await validate(dto)
    expect(errores).toHaveLength(0)
  })

  it('rechaza si falta teléfono, ciudad o código postal', async () => {
    const sinTelefono = plainToInstance(CreatePedidoDto, { ...BASE, telefono: undefined })
    const sinCiudad = plainToInstance(CreatePedidoDto, { ...BASE, ciudad: undefined })
    const sinCP = plainToInstance(CreatePedidoDto, { ...BASE, codigoPostal: undefined })
    expect((await validate(sinTelefono)).length).toBeGreaterThan(0)
    expect((await validate(sinCiudad)).length).toBeGreaterThan(0)
    expect((await validate(sinCP)).length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

```bash
cd back && npx jest productos/dto/create-producto.dto.spec.ts pedidos/dto/create-pedido.dto.spec.ts
```

Expected: FAIL — `badge`/`telefono`/`ciudad`/`codigoPostal` no existen en los DTOs todavía, los tests de "acepta"/"es válido" fallan porque `class-validator` no reconoce las propiedades nuevas del objeto plano de la misma forma esperada (o los de "rechaza" pasan trivialmente por ausencia de la propiedad — en cualquier caso, correr para confirmar el estado actual antes de implementar).

- [ ] **Step 3: Implementar `CreateProductoDto`**

```ts
import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator'

export class CreateProductoDto {
  @IsString() nombre: string
  @IsString() slug: string
  @IsString() descripcion: string
  @IsNumber() @Min(0) precio: number
  @IsNumber() @Min(0) stock: number
  @IsString() categoria: string
  @IsOptional() @IsString() imagen?: string
  @IsOptional() @IsIn(['Nuevo', 'Destacado']) badge?: string
}
```

- [ ] **Step 4: Implementar `CreatePedidoDto`**

```ts
import { IsString, IsArray, ValidateNested, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

class ItemPedidoDto {
  @IsString() productoId: string
  @IsNumber() cantidad: number
}

export class CreatePedidoDto {
  @IsString() nombre: string
  @IsString() email: string
  @IsString() telefono: string
  @IsString() direccion: string
  @IsString() ciudad: string
  @IsString() codigoPostal: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => ItemPedidoDto) items: ItemPedidoDto[]
}
```

- [ ] **Step 5: Correr los tests y verificar que pasan**

```bash
cd back && npx jest productos/dto/create-producto.dto.spec.ts pedidos/dto/create-pedido.dto.spec.ts
```

Expected: PASS — 5 tests verdes.

- [ ] **Step 6: Commit**

```bash
git add back/src/productos/dto back/src/pedidos/dto
git commit -m "feat(back): validar badge de producto y datos de contacto del pedido"
```

---

### Task 3: `PedidosService` reenvía los campos nuevos + notificaciones actualizadas

**Files:**
- Modify: `back/src/pedidos/pedidos.service.ts`
- Create: `back/src/notificaciones/format-direccion.util.ts`
- Test: `back/src/notificaciones/format-direccion.util.spec.ts`
- Modify: `back/src/notificaciones/notificaciones.service.ts`
- Test: `back/src/pedidos/pedidos.service.spec.ts`

**Interfaces:**
- Consumes: `CreatePedidoDto` de Task 2 (ya incluye `telefono/ciudad/codigoPostal`).
- Produces: `formatDireccionPedido({ direccion, ciudad, codigoPostal }): string` — reutilizado en el email al cliente y la alerta al admin.

- [ ] **Step 1: Escribir el test que falla para el util de formateo**

Crear `back/src/notificaciones/format-direccion.util.spec.ts`:

```ts
import { formatDireccionPedido } from './format-direccion.util'

describe('formatDireccionPedido', () => {
  it('concatena dirección, ciudad y código postal', () => {
    const resultado = formatDireccionPedido({
      direccion: 'Calle 10 # 5-30', ciudad: 'Medellín', codigoPostal: '050001',
    })
    expect(resultado).toBe('Calle 10 # 5-30, Medellín (CP 050001)')
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
cd back && npx jest notificaciones/format-direccion.util.spec.ts
```

Expected: FAIL — `Cannot find module './format-direccion.util'`.

- [ ] **Step 3: Implementar el util**

Crear `back/src/notificaciones/format-direccion.util.ts`:

```ts
export function formatDireccionPedido(pedido: {
  direccion: string; ciudad: string; codigoPostal: string
}): string {
  return `${pedido.direccion}, ${pedido.ciudad} (CP ${pedido.codigoPostal})`
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

```bash
cd back && npx jest notificaciones/format-direccion.util.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Usar el util en `NotificacionesService.enviarConfirmacionPedido`**

En `back/src/notificaciones/notificaciones.service.ts`, importar el util y actualizar el método (líneas 78-111):

```ts
import { formatDireccionPedido } from './format-direccion.util'

// ...

async enviarConfirmacionPedido(pedido: {
  id: string; nombre: string; email: string
  direccion: string; ciudad: string; codigoPostal: string; total: number
}): Promise<void> {
  const totalStr = pedido.total.toLocaleString('es-CO')
  const direccionCompleta = formatDireccionPedido(pedido)

  const htmlCliente = this.email.templateConfirmacionPedido({
    nombre: pedido.nombre,
    id: pedido.id,
    direccion: direccionCompleta,
    total: totalStr,
  })
  await this.email.send(pedido.email, `Recibimos tu pedido — Vuelo Carmesí`, htmlCliente)

  const adminEmailPedido = await this.getAdminEmail()
  if (adminEmailPedido) {
    const filas = [
      filaHtml('N° pedido', pedido.id),
      filaHtml('Nombre', pedido.nombre),
      filaHtml('Email', pedido.email),
      filaHtml('Dirección', direccionCompleta),
      filaHtml('Total', `$ ${totalStr} COP`),
    ].join('')
    const htmlAdmin = this.email.templateAlertaAdmin({
      tipo: '🛒 Nuevo Pedido',
      filas,
      adminUrl: `${ADMIN_URL}/admin/pedidos`,
    })
    await this.email.send(adminEmailPedido, `[Pedido] Nuevo: ${pedido.nombre}`, htmlAdmin)
  }

  await this.telegram.send(
    `🛒 *Nuevo Pedido*\nNombre: ${pedido.nombre}\nEmail: ${pedido.email}\nTotal: $ ${totalStr} COP`,
  )
}
```

- [ ] **Step 6: Escribir el test que falla para `PedidosService.create`**

Crear `back/src/pedidos/pedidos.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing'
import { PedidosService } from './pedidos.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'

const mockTx = {
  producto: {
    findMany: jest.fn().mockResolvedValue([
      { id: 'p1', nombre: 'Chocolate', precio: 1000, stock: 10 },
    ]),
    update: jest.fn(),
  },
  pedido: { create: jest.fn().mockResolvedValue({ id: 'ped1' }) },
}

const mockPrisma = {
  $transaction: jest.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
}

const mockNotificaciones = {
  enviarConfirmacionPedido: jest.fn().mockResolvedValue(undefined),
}

describe('PedidosService.create', () => {
  let service: PedidosService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PedidosService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificacionesService, useValue: mockNotificaciones },
      ],
    }).compile()
    service = module.get(PedidosService)
    jest.clearAllMocks()
    mockPrisma.$transaction.mockImplementation((cb: (tx: typeof mockTx) => unknown) => cb(mockTx))
    mockTx.producto.findMany.mockResolvedValue([{ id: 'p1', nombre: 'Chocolate', precio: 1000, stock: 10 }])
    mockTx.pedido.create.mockResolvedValue({ id: 'ped1' })
  })

  it('reenvía teléfono, ciudad y código postal al crear el pedido', async () => {
    await service.create({
      nombre: 'Ana', email: 'ana@example.com', telefono: '3001234567',
      direccion: 'Calle 10', ciudad: 'Medellín', codigoPostal: '050001',
      items: [{ productoId: 'p1', cantidad: 2 }],
    })

    expect(mockTx.pedido.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          telefono: '3001234567', ciudad: 'Medellín', codigoPostal: '050001',
        }),
      }),
    )
  })
})
```

- [ ] **Step 7: Correr el test y verificar que falla**

```bash
cd back && npx jest pedidos/pedidos.service.spec.ts
```

Expected: FAIL — el `data` pasado a `tx.pedido.create` no incluye `telefono`/`ciudad`/`codigoPostal` todavía.

- [ ] **Step 8: Actualizar `PedidosService.create`**

En `back/src/pedidos/pedidos.service.ts`, modificar el método `create` (líneas 32-91) para destructurar y reenviar los campos nuevos:

```ts
async create(dto: CreatePedidoDto) {
  const { nombre, email, telefono, direccion, ciudad, codigoPostal, items } = dto

  const pedido = await this.prisma.$transaction(async (tx) => {
    const productIds = items.map((i) => i.productoId)
    const productos = await tx.producto.findMany({
      where: { id: { in: productIds } },
    })

    for (const item of items) {
      const producto = productos.find((p) => p.id === item.productoId)
      if (!producto) {
        throw new NotFoundException(`Producto '${item.productoId}' no encontrado`)
      }
      if (producto.stock < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para producto '${producto.nombre}': disponible ${producto.stock}, solicitado ${item.cantidad}`,
        )
      }
    }

    const total = items.reduce((sum, item) => {
      const producto = productos.find((p) => p.id === item.productoId)!
      return sum + producto.precio * item.cantidad
    }, 0)

    const pedido = await tx.pedido.create({
      data: {
        nombre, email, telefono, direccion, ciudad, codigoPostal, total,
        items: {
          create: items.map((item) => {
            const producto = productos.find((p) => p.id === item.productoId)!
            return {
              productoId: item.productoId,
              cantidad: item.cantidad,
              precio: producto.precio,
            }
          }),
        },
      },
      include: { items: { include: { producto: true } } },
    })

    for (const item of items) {
      await tx.producto.update({
        where: { id: item.productoId },
        data: { stock: { decrement: item.cantidad } },
      })
    }

    return pedido
  })

  this.notificaciones
    .enviarConfirmacionPedido(pedido)
    .catch(err => this.logger.error('Notificación de pedido fallida', err))

  return pedido
}
```

- [ ] **Step 9: Correr los tests y verificar que pasan**

```bash
cd back && npx jest pedidos notificaciones
```

Expected: PASS — todos los tests de `pedidos` y `notificaciones` en verde.

- [ ] **Step 10: Commit**

```bash
git add back/src/pedidos back/src/notificaciones
git commit -m "feat(back): reenviar telefono/ciudad/codigoPostal en la creacion de pedidos"
```

---

### Task 4: Store de carrito (el corazón del flujo) + Vitest

**Files:**
- Create: `front/vitest.config.ts`
- Modify: `front/package.json`
- Create: `front/lib/cart/store.ts`
- Test: `front/lib/cart/store.test.ts`

**Interfaces:**
- Produces:
  - Types: `CartItem { productoId, slug, nombre, precio, imagen, stock, q }`, `LastOrderItem { nombre, q, subtotal }`, `LastOrder { code, items: LastOrderItem[], total }`.
  - Funciones: `addToCart(producto: Producto, qty?: number): void`, `inc(productoId: string): void`, `dec(productoId: string): void`, `remove(productoId: string): void`, `clearCart(): void`, `setLastOrder(order: LastOrder | null): void`.
  - Lecturas puras (para tests y componentes no-React): `getCartItems(): CartItem[]`, `getCartCount(): number`, `getCartTotal(): number`, `getToast(): string`, `getLastOrder(): LastOrder | null`.
  - Hooks React: `useCart()` → `{ items, cartCount, cartTotal, addToCart, inc, dec, remove, clearCart }`, `useToast(): string`, `useLastOrder(): LastOrder | null`.
  - Usado por: Task 7 (`CartBadge`), Task 8 (`Toast`), Task 9 (`ProductoCard`), Task 11 (`AddToCartSection`), Task 12 (`carrito/page.tsx`), Task 13 (`checkout/page.tsx`), Task 14 (`confirmacion/page.tsx`).

- [ ] **Step 1: Instalar Vitest + jsdom**

```bash
npm install --workspace=front --save-dev vitest jsdom
```

- [ ] **Step 2: Configurar Vitest**

Crear `front/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Agregar el script `test`**

En `front/package.json`, en `"scripts"`, agregar (después de `"lint"`):

```json
"test": "vitest run"
```

- [ ] **Step 4: Escribir los tests que fallan**

Crear `front/lib/cart/store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  addToCart, inc, dec, remove, clearCart, setLastOrder,
  getCartItems, getCartCount, getCartTotal, getToast, getLastOrder,
} from './store'
import type { Producto } from '@/lib/types'

function makeProducto(overrides: Partial<Producto> = {}): Producto {
  return {
    id: 'p1', slug: 'chocolate-negro-70', nombre: 'Chocolate Negro 70%',
    descripcion: '', precio: 22000, stock: 5, imagen: '', categoria: 'chocolates',
    ...overrides,
  }
}

beforeEach(() => {
  clearCart()
  setLastOrder(null)
  localStorage.clear()
})

describe('addToCart', () => {
  it('agrega un producto nuevo con la cantidad indicada', () => {
    addToCart(makeProducto(), 2)
    expect(getCartItems()).toEqual([expect.objectContaining({ productoId: 'p1', q: 2 })])
  })

  it('suma la cantidad si el producto ya está en el carrito', () => {
    addToCart(makeProducto(), 1)
    addToCart(makeProducto(), 2)
    expect(getCartCount()).toBe(3)
  })

  it('no agrega productos agotados', () => {
    addToCart(makeProducto({ stock: 0 }), 1)
    expect(getCartItems()).toEqual([])
  })

  it('no supera el stock disponible', () => {
    addToCart(makeProducto({ stock: 3 }), 5)
    expect(getCartItems()[0].q).toBe(3)
  })

  it('dispara un toast singular', () => {
    addToCart(makeProducto({ nombre: 'Tableta 72% intenso' }), 1)
    expect(getToast()).toBe('Tableta 72% intenso agregado al carrito')
  })

  it('dispara un toast plural cuando qty > 1', () => {
    addToCart(makeProducto({ nombre: 'Tableta 72% intenso' }), 3)
    expect(getToast()).toBe('3 × Tableta 72% intenso agregados')
  })
})

describe('inc / dec', () => {
  it('inc suma 1 sin superar el stock', () => {
    addToCart(makeProducto({ stock: 2 }), 1)
    inc('p1')
    expect(getCartCount()).toBe(2)
    inc('p1')
    expect(getCartCount()).toBe(2)
  })

  it('dec nunca baja de 1', () => {
    addToCart(makeProducto(), 1)
    dec('p1')
    expect(getCartCount()).toBe(1)
  })
})

describe('remove / clearCart', () => {
  it('remove elimina la línea', () => {
    addToCart(makeProducto(), 1)
    remove('p1')
    expect(getCartItems()).toEqual([])
  })

  it('clearCart vacía el carrito', () => {
    addToCart(makeProducto({ id: 'p1' }), 1)
    addToCart(makeProducto({ id: 'p2' }), 1)
    clearCart()
    expect(getCartItems()).toEqual([])
    expect(getCartCount()).toBe(0)
  })
})

describe('cartTotal', () => {
  it('suma precio × cantidad de todas las líneas', () => {
    addToCart(makeProducto({ id: 'p1', precio: 1000, stock: 10 }), 2)
    addToCart(makeProducto({ id: 'p2', precio: 500, stock: 10 }), 3)
    expect(getCartTotal()).toBe(3500)
  })
})

describe('persistencia', () => {
  it('guarda el carrito en localStorage en cada mutación', () => {
    addToCart(makeProducto(), 2)
    const stored = JSON.parse(localStorage.getItem('vuelo-carmesi:carrito')!)
    expect(stored).toEqual([expect.objectContaining({ productoId: 'p1', q: 2 })])
  })
})

describe('lastOrder', () => {
  it('setLastOrder persiste y expone la última orden', () => {
    setLastOrder({ code: '#VC-ABC123', items: [{ nombre: 'X', q: 1, subtotal: 100 }], total: 100 })
    expect(getLastOrder()?.code).toBe('#VC-ABC123')
    const stored = JSON.parse(localStorage.getItem('vuelo-carmesi:ultimo-pedido')!)
    expect(stored.code).toBe('#VC-ABC123')
  })
})
```

- [ ] **Step 5: Correr los tests y verificar que fallan**

```bash
npm run test --workspace=front
```

Expected: FAIL — `Cannot find module './store'` (el archivo no existe todavía).

- [ ] **Step 6: Implementar el store**

Crear `front/lib/cart/store.ts`:

```ts
import { useSyncExternalStore } from 'react'
import type { Producto } from '@/lib/types'

export interface CartItem {
  productoId: string
  slug: string
  nombre: string
  precio: number
  imagen: string
  stock: number
  q: number
}

export interface LastOrderItem {
  nombre: string
  q: number
  subtotal: number
}

export interface LastOrder {
  code: string
  items: LastOrderItem[]
  total: number
}

const CART_KEY = 'vuelo-carmesi:carrito'
const ORDER_KEY = 'vuelo-carmesi:ultimo-pedido'
const TOAST_DURATION_MS = 2000

let items: CartItem[] = []
let toast = ''
let lastOrder: LastOrder | null = null
let toastTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach(listener => listener())
}

function isCartItem(value: unknown): value is CartItem {
  return (
    typeof value === 'object' && value !== null &&
    typeof (value as CartItem).productoId === 'string' &&
    typeof (value as CartItem).q === 'number'
  )
}

function persistCart() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_KEY, JSON.stringify(items))
}

function persistLastOrder() {
  if (typeof window === 'undefined') return
  if (lastOrder) window.localStorage.setItem(ORDER_KEY, JSON.stringify(lastOrder))
  else window.localStorage.removeItem(ORDER_KEY)
}

function hydrate() {
  if (typeof window === 'undefined') return
  try {
    const rawCart = window.localStorage.getItem(CART_KEY)
    const parsedCart = rawCart ? JSON.parse(rawCart) : []
    items = Array.isArray(parsedCart) && parsedCart.every(isCartItem) ? parsedCart : []
  } catch {
    items = []
  }
  try {
    const rawOrder = window.localStorage.getItem(ORDER_KEY)
    lastOrder = rawOrder ? JSON.parse(rawOrder) : null
  } catch {
    lastOrder = null
  }
}

hydrate()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key === CART_KEY) {
      try {
        const parsed = event.newValue ? JSON.parse(event.newValue) : []
        items = Array.isArray(parsed) && parsed.every(isCartItem) ? parsed : []
        emit()
      } catch { /* ignora escritura externa malformada */ }
    }
    if (event.key === ORDER_KEY) {
      try {
        lastOrder = event.newValue ? JSON.parse(event.newValue) : null
        emit()
      } catch { /* ignora escritura externa malformada */ }
    }
  })
}

function showToast(message: string) {
  toast = message
  emit()
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast = ''
    emit()
  }, TOAST_DURATION_MS)
}

export function addToCart(producto: Producto, qty = 1): void {
  if (producto.stock === 0) return
  const existing = items.find(item => item.productoId === producto.id)
  if (existing) {
    const nextQ = Math.min(existing.q + qty, producto.stock)
    items = items.map(item => item.productoId === producto.id ? { ...item, q: nextQ } : item)
  } else {
    items = [...items, {
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.images?.[0] ?? producto.imagen,
      stock: producto.stock,
      q: Math.min(qty, producto.stock),
    }]
  }
  persistCart()
  showToast(qty > 1 ? `${qty} × ${producto.nombre} agregados` : `${producto.nombre} agregado al carrito`)
  emit()
}

export function inc(productoId: string): void {
  items = items.map(item =>
    item.productoId === productoId ? { ...item, q: Math.min(item.q + 1, item.stock) } : item
  )
  persistCart()
  emit()
}

export function dec(productoId: string): void {
  items = items.map(item =>
    item.productoId === productoId ? { ...item, q: Math.max(1, item.q - 1) } : item
  )
  persistCart()
  emit()
}

export function remove(productoId: string): void {
  items = items.filter(item => item.productoId !== productoId)
  persistCart()
  emit()
}

export function clearCart(): void {
  items = []
  persistCart()
  emit()
}

export function setLastOrder(order: LastOrder | null): void {
  lastOrder = order
  persistLastOrder()
  emit()
}

export function getCartItems(): CartItem[] { return items }
export function getCartCount(): number { return items.reduce((sum, item) => sum + item.q, 0) }
export function getCartTotal(): number { return items.reduce((sum, item) => sum + item.precio * item.q, 0) }
export function getToast(): string { return toast }
export function getLastOrder(): LastOrder | null { return lastOrder }

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const EMPTY_ITEMS: CartItem[] = []
function getServerItems() { return EMPTY_ITEMS }
function getServerToast() { return '' }
function getServerLastOrder() { return null }

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getCartItems, getServerItems)
  const cartCount = snapshot.reduce((sum, item) => sum + item.q, 0)
  const cartTotal = snapshot.reduce((sum, item) => sum + item.precio * item.q, 0)
  return { items: snapshot, cartCount, cartTotal, addToCart, inc, dec, remove, clearCart }
}

export function useToast(): string {
  return useSyncExternalStore(subscribe, getToast, getServerToast)
}

export function useLastOrder(): LastOrder | null {
  return useSyncExternalStore(subscribe, getLastOrder, getServerLastOrder)
}
```

- [ ] **Step 7: Correr los tests y verificar que pasan**

```bash
npm run test --workspace=front
```

Expected: PASS — 11 tests verdes.

- [ ] **Step 8: Commit**

```bash
git add front/package.json front/vitest.config.ts front/lib/cart/store.ts front/lib/cart/store.test.ts
git commit -m "feat(front): store de carrito compartido con persistencia y tests"
```

---

### Task 5: Tipos compartidos, formateo de precio y catálogo mock

**Files:**
- Modify: `front/lib/types/index.ts`
- Create: `front/lib/format.ts`
- Modify: `front/lib/api/productos.ts`

**Interfaces:**
- Produces: `Producto.categoria: string`, `Producto.badge?: 'Nuevo' | 'Destacado' | null`, `formatPrecio(n: number): string`.
- Usado por: Task 9, 10, 11, 12, 13, 14 (todas las pantallas que muestran precio o filtran por categoría).

- [ ] **Step 1: Actualizar `Producto` en `front/lib/types/index.ts`**

Reemplazar la interfaz `Producto` (líneas 16-26):

```ts
export interface Producto {
  id: string
  slug: string
  nombre: string
  descripcion: string
  precio: number
  stock: number
  imagen: string
  categoria: string
  images?: string[]
  badge?: 'Nuevo' | 'Destacado' | null
}
```

- [ ] **Step 2: Crear el helper de formato**

Crear `front/lib/format.ts`:

```ts
export function formatPrecio(n: number): string {
  return `$${n.toLocaleString('es-CO')}`
}
```

- [ ] **Step 3: Actualizar los mocks de fallback**

En `front/lib/api/productos.ts`, reemplazar `MOCK_PRODUCTOS` (líneas 5-39) para reflejar categorías reales y ejemplos de badge:

```ts
export const MOCK_PRODUCTOS: Producto[] = [
  {
    id: '1',
    slug: 'chocolate-negro-70',
    nombre: 'Chocolate Negro 70%',
    descripcion: 'Tableta 80 g con cacao fino de aroma del Huila. Notas a frutos rojos y panela. Sin lecitina ni saborizantes.',
    precio: 22000,
    stock: 40,
    imagen: '',
    categoria: 'chocolates',
    badge: 'Destacado',
    images: ['https://placehold.co/800x600/872b13/ffeaca?text=Chocolate+70'],
  },
  {
    id: '2',
    slug: 'nibs-de-cacao',
    nombre: 'Nibs de Cacao Tostado',
    descripcion: 'Trozos de cacao fermentado y tostado, sin azúcar. 150 g. Ideal para yogur, ensaladas o snack.',
    precio: 18000,
    stock: 20,
    imagen: '',
    categoria: 'despensa',
    badge: 'Nuevo',
    images: ['https://placehold.co/800x600/ea5b0c/ffeaca?text=Nibs+Cacao'],
  },
  {
    id: '3',
    slug: 'cafe-especial-finca',
    nombre: 'Café Especial de la Finca',
    descripcion: 'Arábica lavado, proceso honey. Tostión media. 250 g molido o en grano. Puntuación SCA 84.',
    precio: 32000,
    stock: 22,
    imagen: '',
    categoria: 'cafe',
    images: ['https://placehold.co/800x600/f59c00/ffeaca?text=Cafe+Especial'],
  },
  {
    id: '4',
    slug: 'kit-regalo-carmesi',
    nombre: 'Kit Regalo Vuelo Carmesí',
    descripcion: 'Caja de madera artesanal con tableta negra, tableta de leche, nibs y café especial.',
    precio: 88000,
    stock: 0,
    imagen: '',
    categoria: 'regalos',
    images: ['https://placehold.co/800x600/d51312/ffeaca?text=Kit+Regalo'],
  },
]
```

- [ ] **Step 4: Verificar tipos**

```bash
npm exec --workspace=front -- tsc --noEmit
```

Expected: sin errores nuevos relacionados a `Producto`/`format`/`productos.ts` (puede haber errores preexistentes en archivos que Tasks posteriores todavía no actualizaron — ok en esta etapa, se resuelven en sus propios tasks).

- [ ] **Step 5: Commit**

```bash
git add front/lib/types/index.ts front/lib/format.ts front/lib/api/productos.ts
git commit -m "feat(front): categoria libre, badge de producto y formatPrecio compartido"
```

---

### Task 6: `Input` — soporte para `react-hook-form` y estados de error

**Files:**
- Modify: `front/components/ui/Input.tsx`

**Interfaces:**
- Produces: `Input` acepta `ref` (forwardRef), `onBlur?`, `error?: string`; `value`/`onChange`/`name` pasan a opcionales.
- Consumido por: `front/app/(public)/(landing)/contacto/page.tsx` (ya existente, sin cambios) y Task 13 (`checkout/page.tsx`, vía `register()` de react-hook-form).

- [ ] **Step 1: Reescribir `Input.tsx`**

```tsx
import { forwardRef } from 'react'

interface InputProps {
  label: string
  name?: string
  type?: string
  required?: boolean
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  multiline?: boolean
  error?: string
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  function Input({ label, name, type = 'text', required, placeholder, value, onChange, onBlur, multiline, error }, ref) {
    const fieldStyle: React.CSSProperties = {
      width: '100%', padding: '0.75rem', borderRadius: '4px',
      border: `1px solid ${error ? 'var(--color-crimson)' : 'var(--color-brown)'}`,
      fontFamily: 'var(--font-body)', fontSize: '1rem', backgroundColor: 'var(--color-cream)',
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label htmlFor={name} style={{ fontWeight: 700, color: 'var(--color-brown)' }}>
          {label}{required && ' *'}
        </label>
        {multiline
          ? <textarea ref={ref as React.Ref<HTMLTextAreaElement>} id={name} name={name} required={required} placeholder={placeholder} value={value} onChange={onChange} onBlur={onBlur} rows={4} style={fieldStyle} />
          : <input ref={ref as React.Ref<HTMLInputElement>} id={name} name={name} type={type} required={required} placeholder={placeholder} value={value} onChange={onChange} onBlur={onBlur} style={fieldStyle} />
        }
        {error && <span style={{ fontSize: '0.8rem', color: 'var(--color-crimson)' }}>{error}</span>}
      </div>
    )
  }
)

export default Input
```

- [ ] **Step 2: Verificar tipos**

```bash
npm exec --workspace=front -- tsc --noEmit
```

Expected: sin errores nuevos en `contacto/page.tsx` (sigue pasando `value`/`onChange` controlados, ambos siguen siendo props válidas).

- [ ] **Step 3: Verificación manual**

```bash
npm run dev --workspace=front
```

Abrir `http://localhost:3000/contacto` y confirmar que el formulario se ve y funciona igual que antes (labels, placeholders, escritura en los campos).

- [ ] **Step 4: Commit**

```bash
git add front/components/ui/Input.tsx
git commit -m "feat(front): Input soporta forwardRef y estados de error"
```

---

### Task 7: `CartBadge` en el Navbar

**Files:**
- Create: `front/components/shop/CartBadge.tsx`
- Modify: `front/components/layout/Navbar.tsx`

**Interfaces:**
- Consumes: `useCart()` de Task 4.
- Produces: `CartBadge` (componente), renderizado dentro de `Navbar`.

- [ ] **Step 1: Crear `CartBadge`**

Crear `front/components/shop/CartBadge.tsx`:

```tsx
'use client'
import Link from 'next/link'
import { useCart } from '@/lib/cart/store'

export default function CartBadge() {
  const { cartCount } = useCart()
  return (
    <Link
      href="/carrito"
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: '6px',
        color: 'var(--color-cream)', textDecoration: 'none', fontWeight: 700,
      }}
    >
      🛒 Carrito
      {cartCount > 0 && (
        <span style={{
          background: 'var(--color-gold)', color: 'var(--color-brown)',
          borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
          padding: '2px 8px', minWidth: '20px', textAlign: 'center',
        }}>
          {cartCount}
        </span>
      )}
    </Link>
  )
}
```

- [ ] **Step 2: Renderizarlo en el Navbar**

En `front/components/layout/Navbar.tsx`, importar `CartBadge` y agregarlo como último `<li>` de la lista (después de "Contacto", líneas 24-29):

```tsx
import CartBadge from '@/components/shop/CartBadge'

// ...dentro del <ul>:
<li><Link href="/" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Inicio</Link></li>
<li><Link href="/experiencias" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Experiencias</Link></li>
<li><Link href="/tienda" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Tienda</Link></li>
<li><Link href="/contacto" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Contacto</Link></li>
<li><CartBadge /></li>
```

- [ ] **Step 3: Verificación manual**

```bash
npm run dev --workspace=front
```

Abrir `http://localhost:3000` — el navbar debe mostrar "🛒 Carrito" sin número (carrito vacío). Ejecutar en la consola del navegador `window.dispatchEvent` no es necesario; basta con confirmar que el link no rompe el layout.

- [ ] **Step 4: Commit**

```bash
git add front/components/shop/CartBadge.tsx front/components/layout/Navbar.tsx
git commit -m "feat(front): badge de carrito en vivo en el navbar"
```

---

### Task 8: `StepIndicator` + `Toast` + layout de la tienda

**Files:**
- Create: `front/components/shop/StepIndicator.tsx`
- Create: `front/components/shop/Toast.tsx`
- Modify: `front/app/(public)/(shop)/layout.tsx`

**Interfaces:**
- Consumes: `useToast()` de Task 4.
- Produces: `StepIndicator`, `Toast` renderizados en todas las pantallas de `(shop)`.

- [ ] **Step 1: Crear `StepIndicator`**

Crear `front/components/shop/StepIndicator.tsx`:

```tsx
'use client'
import { usePathname } from 'next/navigation'

const STEPS = ['Tienda', 'Carrito', 'Checkout', 'Confirmación'] as const

function stepForPath(pathname: string): number {
  if (pathname.startsWith('/checkout/confirmacion')) return 3
  if (pathname.startsWith('/checkout')) return 2
  if (pathname.startsWith('/carrito')) return 1
  return 0
}

export default function StepIndicator() {
  const pathname = usePathname()
  const current = stepForPath(pathname)

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: '2rem',
      padding: '0.75rem 1rem', backgroundColor: 'var(--color-cream)',
      borderBottom: '1px solid rgba(135,43,19,0.15)', flexWrap: 'wrap',
    }}>
      {STEPS.map((step, index) => {
        const color = index < current
          ? '#1F8A5B'
          : index === current
            ? 'var(--color-crimson)'
            : 'rgba(135,43,19,0.4)'
        return (
          <span key={step} style={{ fontWeight: 700, fontSize: '0.85rem', color }}>
            {index + 1}. {step}
          </span>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Crear `Toast`**

Crear `front/components/shop/Toast.tsx`:

```tsx
'use client'
import { useToast } from '@/lib/cart/store'

export default function Toast() {
  const message = useToast()
  if (!message) return null

  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: '32px', transform: 'translateX(-50%)',
      zIndex: 90, background: 'var(--color-brown)', color: 'var(--color-cream)',
      fontWeight: 700, fontSize: '0.9rem', padding: '14px 22px', borderRadius: '999px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <span style={{ color: 'var(--color-gold)' }}>✓</span>{message}
    </div>
  )
}
```

- [ ] **Step 3: Wirear el layout de `(shop)`**

Reemplazar `front/app/(public)/(shop)/layout.tsx`:

```tsx
import StepIndicator from '@/components/shop/StepIndicator'
import Toast from '@/components/shop/Toast'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StepIndicator />
      {children}
      <Toast />
    </>
  )
}
```

- [ ] **Step 4: Verificación manual**

```bash
npm run dev --workspace=front
```

Abrir `http://localhost:3000/tienda` y `http://localhost:3000/carrito` — en ambas debe verse la barra de pasos ("1. Tienda" en crimson en `/tienda`, "2. Carrito" en crimson y "1. Tienda" en verde en `/carrito`). El toast no debe verse (no hay mensaje activo).

- [ ] **Step 5: Commit**

```bash
git add front/components/shop/StepIndicator.tsx front/components/shop/Toast.tsx "front/app/(public)/(shop)/layout.tsx"
git commit -m "feat(front): indicador de pasos y toast de feedback en la tienda"
```

---

### Task 9: `ProductoCard` — badges y store nuevo

**Files:**
- Modify: `front/components/shop/ProductoCard.tsx`

**Interfaces:**
- Consumes: `useCart()` de Task 4, `formatPrecio()` de Task 5, `Producto.badge` de Task 5.
- Produces: `ProductoCard` actualizado, usado por Task 10 (`TiendaGrid`) y por `tienda/[slug]/page.tsx` (relacionados, sin cambios en esa página).

- [ ] **Step 1: Reescribir `ProductoCard.tsx`**

```tsx
'use client'
import type { Producto } from '@/lib/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useCart } from '@/lib/cart/store'
import { formatPrecio } from '@/lib/format'

function badgeStyle(producto: Producto): { label: string; bg: string; fg: string } | null {
  if (producto.stock === 0) return { label: 'Agotado', bg: 'var(--color-brown)', fg: 'var(--color-cream)' }
  if (producto.badge === 'Nuevo') return { label: 'Nuevo', bg: 'var(--color-gold)', fg: 'var(--color-brown)' }
  if (producto.badge === 'Destacado') return { label: 'Destacado', bg: 'var(--color-crimson)', fg: 'var(--color-cream)' }
  return null
}

export default function ProductoCard({ producto }: { producto: Producto }) {
  const { addToCart } = useCart()
  const badge = badgeStyle(producto)
  const agotado = producto.stock === 0

  return (
    <Card>
      <div style={{ position: 'relative', height: '200px', backgroundColor: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '3rem' }}>🍫</span>
        {badge && (
          <span style={{
            position: 'absolute', top: '12px', right: '12px', fontWeight: 700, fontSize: '0.75rem',
            background: badge.bg, color: badge.fg, borderRadius: '999px', padding: '4px 10px',
          }}>
            {badge.label}
          </span>
        )}
      </div>
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: 'var(--color-brown)' }}>{producto.nombre}</h3>
        <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem' }}>{producto.descripcion}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-crimson)', fontSize: '1.2rem' }}>
            {formatPrecio(producto.precio)}
          </span>
          <Button onClick={() => addToCart(producto, 1)} variant="secondary" disabled={agotado}>
            {agotado ? 'Agotado' : 'Agregar'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npm exec --workspace=front -- tsc --noEmit
```

Expected: sin errores en `ProductoCard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add front/components/shop/ProductoCard.tsx
git commit -m "feat(front): badges Nuevo/Destacado/Agotado en ProductoCard"
```

---

### Task 10: `TiendaGrid` — filtro dinámico por categoría

**Files:**
- Create: `front/components/shop/TiendaGrid.tsx`
- Modify: `front/app/(public)/(shop)/tienda/page.tsx`

**Interfaces:**
- Consumes: `ProductoCard` de Task 9, `Producto` de Task 5.
- Produces: `TiendaGrid` (pills + grid), montado desde `tienda/page.tsx`.

- [ ] **Step 1: Crear `TiendaGrid`**

Crear `front/components/shop/TiendaGrid.tsx`:

```tsx
'use client'
import { useMemo, useState } from 'react'
import type { Producto } from '@/lib/types'
import ProductoCard from '@/components/shop/ProductoCard'

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function TiendaGrid({ productos }: { productos: Producto[] }) {
  const categorias = useMemo(() => {
    const unicas = Array.from(new Set(productos.map(p => p.categoria)))
    return ['Todos', ...unicas]
  }, [productos])

  const [filtro, setFiltro] = useState('Todos')

  const filtrados = useMemo(() => {
    if (filtro === 'Todos') return productos
    return productos.filter(p => p.categoria === filtro)
  }, [productos, filtro])

  return (
    <>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {categorias.map(cat => {
          const activo = cat === filtro
          return (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '999px', fontWeight: 700,
                fontFamily: 'var(--font-body)', cursor: 'pointer',
                border: activo ? 'none' : '1.5px solid var(--color-brown)',
                background: activo ? 'var(--color-crimson)' : 'transparent',
                color: activo ? 'var(--color-cream)' : 'var(--color-brown)',
              }}
            >
              {cat === 'Todos' ? cat : toTitleCase(cat)}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '2rem' }}>
        {filtrados.map(p => <ProductoCard key={p.id} producto={p} />)}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Actualizar `tienda/page.tsx`**

```tsx
import TiendaGrid from '@/components/shop/TiendaGrid'
import { getProductos } from '@/lib/api/productos'

export default async function TiendaPage() {
  const productos = await getProductos()
  return (
    <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
      <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>Tienda</h1>
      <p style={{ marginBottom: '3rem', opacity: 0.7 }}>Llevate el sabor a casa.</p>
      <TiendaGrid productos={productos} />
    </section>
  )
}
```

- [ ] **Step 3: Verificación manual**

```bash
npm run dev --workspace=front
```

Abrir `http://localhost:3000/tienda` (usa los mocks si el backend no corre): deben verse las pills `Todos / Chocolates / Despensa / Cafe / Regalos`, y al hacer click en `Regalos` solo debe quedar el "Kit Regalo Vuelo Carmesí" (agotado, `stock: 0` en el mock) con badge "Agotado" y botón deshabilitado.

- [ ] **Step 4: Commit**

```bash
git add front/components/shop/TiendaGrid.tsx "front/app/(public)/(shop)/tienda/page.tsx"
git commit -m "feat(front): filtro de categorias dinamico en la tienda"
```

---

### Task 11: `AddToCartSection` — store nuevo + subtotal en el botón

**Files:**
- Modify: `front/app/(public)/(shop)/tienda/[slug]/AddToCartSection.tsx`

**Interfaces:**
- Consumes: `useCart()` de Task 4, `formatPrecio()` de Task 5.

- [ ] **Step 1: Reescribir `AddToCartSection.tsx`**

```tsx
'use client'
import { useState } from 'react'
import type { Producto } from '@/lib/types'
import { useCart } from '@/lib/cart/store'
import { formatPrecio } from '@/lib/format'
import QuantitySelector from '@/components/ui/QuantitySelector'
import Button from '@/components/ui/Button'

export default function AddToCartSection({ producto }: { producto: Producto }) {
  const [cantidad, setCantidad] = useState(1)
  const { addToCart } = useCart()
  const sinStock = producto.stock === 0

  if (sinStock) {
    return (
      <div>
        <Button disabled style={{ display: 'block', textAlign: 'center', width: '100%' }}>
          Agregar al carrito
        </Button>
        <p style={{ marginTop: '8px', fontSize: '0.875rem', color: 'var(--color-brown)', opacity: 0.6 }}>
          Sin stock disponible
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <QuantitySelector value={cantidad} onChange={setCantidad} min={1} max={producto.stock} />
      </div>
      <p style={{ marginBottom: '16px', fontSize: '0.875rem', color: 'var(--color-brown)', opacity: 0.6 }}>
        {producto.stock} unidades disponibles
      </p>
      <Button
        onClick={() => { addToCart(producto, cantidad); setCantidad(1) }}
        style={{ display: 'block', textAlign: 'center', width: '100%' }}
      >
        Agregar al carrito · {formatPrecio(producto.precio * cantidad)}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Verificación manual**

```bash
npm run dev --workspace=front
```

Abrir `http://localhost:3000/tienda/chocolate-negro-70`, cambiar la cantidad con +/− y confirmar que el botón actualiza el subtotal en vivo (`Agregar al carrito · $44.000` con cantidad 2, por ejemplo).

- [ ] **Step 3: Commit**

```bash
git add "front/app/(public)/(shop)/tienda/[slug]/AddToCartSection.tsx"
git commit -m "feat(front): detalle de producto muestra subtotal y usa el store nuevo"
```

---

### Task 12: Reescribir la pantalla de Carrito

**Files:**
- Modify: `front/app/(public)/(shop)/carrito/page.tsx`

**Interfaces:**
- Consumes: `useCart()` de Task 4, `formatPrecio()` de Task 5, `QuantitySelector` (ya existente).

- [ ] **Step 1: Reescribir `carrito/page.tsx`**

```tsx
'use client'
import { useCart } from '@/lib/cart/store'
import { formatPrecio } from '@/lib/format'
import Button from '@/components/ui/Button'
import QuantitySelector from '@/components/ui/QuantitySelector'

export default function CarritoPage() {
  const { items, cartCount, cartTotal, inc, dec, remove, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <section style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>Tu carrito está vacío</h1>
        <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>Descubrí nuestros chocolates y cacao artesanal.</p>
        <Button href="/tienda">Ver tienda</Button>
      </section>
    )
  }

  return (
    <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem', display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 420px', minWidth: 0 }}>
        <h1 style={{ marginBottom: '2rem', color: 'var(--color-brown)' }}>Carrito</h1>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map(item => (
            <div key={item.productoId} style={{
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 0',
              borderBottom: '1px solid rgba(135,43,19,0.1)', flexWrap: 'wrap',
            }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '8px', flex: 'none',
                backgroundColor: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '1.75rem' }}>🍫</span>
              </div>
              <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: 'var(--color-brown)' }}>{item.nombre}</p>
                <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>{formatPrecio(item.precio)} c/u</p>
              </div>
              <QuantitySelector
                value={item.q}
                onChange={next => next > item.q ? inc(item.productoId) : dec(item.productoId)}
                min={1}
                max={item.stock}
              />
              <span style={{ fontWeight: 700, color: 'var(--color-amber)', minWidth: '90px', textAlign: 'right' }}>
                {formatPrecio(item.precio * item.q)}
              </span>
              <button
                onClick={() => remove(item.productoId)}
                title="Quitar"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'rgba(135,43,19,0.5)' }}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <Button href="/tienda" variant="outline">← Seguir comprando</Button>
          <button
            onClick={clearCart}
            style={{
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem',
              color: 'rgba(135,43,19,0.7)', background: 'transparent',
              border: '1.5px solid rgba(135,43,19,0.25)', borderRadius: '8px',
              padding: '10px 20px', cursor: 'pointer',
            }}
          >
            🗑 Vaciar carrito
          </button>
        </div>
      </div>

      <div style={{
        flex: '0 1 320px', minWidth: '280px', position: 'sticky', top: '96px',
        background: 'var(--color-cream)', border: '1px solid rgba(135,43,19,0.15)',
        borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(135,43,19,0.16)',
      }}>
        <h3 style={{ marginBottom: '1.25rem', color: 'var(--color-brown)' }}>Resumen del pedido</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-brown)', marginBottom: '0.6rem' }}>
          <span>Subtotal ({cartCount} art.)</span>
          <span>{formatPrecio(cartTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-brown)' }}>
          <span>Envío</span>
          <span style={{ color: '#1F8A5B' }}>A coordinar</span>
        </div>
        <div style={{ height: '1px', background: 'rgba(135,43,19,0.15)', margin: '1.25rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700, fontSize: '1.375rem', color: 'var(--color-brown)' }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--color-amber)' }}>{formatPrecio(cartTotal)}</span>
        </div>
        <Button href="/checkout" style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: '1.5rem' }}>
          Ir al checkout
        </Button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verificación manual**

```bash
npm run dev --workspace=front
```

Ir a `/tienda`, agregar 2 productos distintos, ir a `/carrito`: confirmar +/− por línea, tope de cantidad al stock, quitar una línea, "Vaciar carrito" deja el estado vacío, y que el `CartBadge` del navbar refleja el conteo en todo momento sin recargar la página.

- [ ] **Step 3: Commit**

```bash
git add "front/app/(public)/(shop)/carrito/page.tsx"
git commit -m "feat(front): reescribir carrito con +/-, quitar y vaciar"
```

---

### Task 13: Checkout — `react-hook-form` + `zod`

**Files:**
- Create: `front/lib/cart/checkout-schema.ts`
- Test: `front/lib/cart/checkout-schema.test.ts`
- Modify: `front/app/(public)/(shop)/checkout/page.tsx`

**Interfaces:**
- Consumes: `useCart()`/`setLastOrder()` de Task 4, `formatPrecio()` de Task 5, `Input` (con `error`/ref) de Task 6.
- Produces: `checkoutSchema`, `CheckoutFormValues` — usados solo en `checkout/page.tsx`.

- [ ] **Step 1: Instalar las dependencias**

```bash
npm install --workspace=front zod react-hook-form @hookform/resolvers
```

- [ ] **Step 2: Escribir el test que falla**

Crear `front/lib/cart/checkout-schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { checkoutSchema } from './checkout-schema'

const VALID = {
  nombre: 'Ana Pérez', email: 'ana@example.com', telefono: '3001234567',
  direccion: 'Calle 10 # 5-30', ciudad: 'Medellín', codigoPostal: '050001',
}

describe('checkoutSchema', () => {
  it('acepta datos válidos', () => {
    expect(checkoutSchema.safeParse(VALID).success).toBe(true)
  })

  it('rechaza nombre vacío', () => {
    expect(checkoutSchema.safeParse({ ...VALID, nombre: '' }).success).toBe(false)
  })

  it('rechaza email inválido', () => {
    expect(checkoutSchema.safeParse({ ...VALID, email: 'no-es-un-email' }).success).toBe(false)
  })

  it('rechaza teléfono muy corto', () => {
    expect(checkoutSchema.safeParse({ ...VALID, telefono: '123' }).success).toBe(false)
  })

  it('rechaza campos de entrega vacíos', () => {
    expect(checkoutSchema.safeParse({ ...VALID, direccion: '' }).success).toBe(false)
    expect(checkoutSchema.safeParse({ ...VALID, ciudad: '' }).success).toBe(false)
    expect(checkoutSchema.safeParse({ ...VALID, codigoPostal: '' }).success).toBe(false)
  })
})
```

- [ ] **Step 3: Correr el test y verificar que falla**

```bash
npm run test --workspace=front
```

Expected: FAIL — `Cannot find module './checkout-schema'`.

- [ ] **Step 4: Implementar el schema**

Crear `front/lib/cart/checkout-schema.ts`:

```ts
import { z } from 'zod'

export const checkoutSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingresá tu nombre completo'),
  email: z.string().trim().email('Ingresá un email válido'),
  telefono: z.string().trim().min(7, 'Ingresá un teléfono válido'),
  direccion: z.string().trim().min(5, 'Ingresá tu dirección'),
  ciudad: z.string().trim().min(2, 'Ingresá tu ciudad'),
  codigoPostal: z.string().trim().min(3, 'Ingresá tu código postal'),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
```

- [ ] **Step 5: Correr el test y verificar que pasa**

```bash
npm run test --workspace=front
```

Expected: PASS.

- [ ] **Step 6: Reescribir `checkout/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCart, setLastOrder } from '@/lib/cart/store'
import { checkoutSchema, type CheckoutFormValues } from '@/lib/cart/checkout-schema'
import { formatPrecio } from '@/lib/format'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, cartTotal, clearCart } = useCart()
  const [submitError, setSubmitError] = useState('')
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({ resolver: zodResolver(checkoutSchema) })

  const onSubmit = async (data: CheckoutFormValues) => {
    setSubmitError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          items: items.map(i => ({ productoId: i.productoId, cantidad: i.q })),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message ?? `Error ${res.status}`)
      }
      const pedido = await res.json()
      setLastOrder({
        code: `#VC-${String(pedido.id).slice(-6).toUpperCase()}`,
        items: items.map(i => ({ nombre: i.nombre, q: i.q, subtotal: i.precio * i.q })),
        total: cartTotal,
      })
      clearCart()
      router.push('/checkout/confirmacion')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo procesar el pedido')
    }
  }

  if (items.length === 0) {
    return (
      <section style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem', color: 'var(--color-brown)' }}>No hay productos en tu carrito</h1>
        <Button href="/tienda">Ir a la tienda</Button>
      </section>
    )
  }

  return (
    <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem', display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h1 style={{ color: 'var(--color-brown)' }}>Checkout</h1>

        <h3 style={{ color: 'var(--color-brown)', marginBottom: 0 }}>Datos de contacto</h3>
        <Input label="Nombre completo" error={errors.nombre?.message} {...register('nombre')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Teléfono" type="tel" error={errors.telefono?.message} {...register('telefono')} />

        <h3 style={{ color: 'var(--color-brown)', marginBottom: 0 }}>Datos de entrega</h3>
        <Input label="Dirección" error={errors.direccion?.message} {...register('direccion')} />
        <Input label="Ciudad" error={errors.ciudad?.message} {...register('ciudad')} />
        <Input label="Código postal" error={errors.codigoPostal?.message} {...register('codigoPostal')} />

        {submitError && <p style={{ color: 'var(--color-crimson)', fontSize: '0.9rem' }}>{submitError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Procesando...' : `Confirmar pedido · ${formatPrecio(cartTotal)}`}
        </Button>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(135,43,19,0.6)' }}>
          Al confirmar aceptás nuestras condiciones de venta
        </p>
      </form>

      <div style={{
        flex: '0 1 320px', minWidth: '280px', position: 'sticky', top: '96px',
        background: 'var(--color-brown)', borderRadius: '12px', padding: '2rem',
      }}>
        <p style={{
          fontWeight: 700, fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase',
          color: 'var(--color-gold)', marginBottom: '1.1rem',
        }}>
          Resumen de tu pedido
        </p>
        {items.map(item => (
          <div key={item.productoId} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.85rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--color-cream)', flex: 1 }}>{item.nombre}</span>
            <span style={{ fontWeight: 700, fontSize: '0.75rem', background: 'var(--color-amber)', color: 'var(--color-brown)', borderRadius: '999px', padding: '2px 8px' }}>
              ×{item.q}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--color-cream)' }}>{formatPrecio(item.precio * item.q)}</span>
          </div>
        ))}
        <div style={{ height: '1px', background: 'rgba(253,195,0,0.4)', margin: '1.25rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-cream)' }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: '1.375rem', color: 'var(--color-amber)' }}>{formatPrecio(cartTotal)}</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,234,202,0.6)', marginTop: '1rem' }}>
          Coordinamos el método de pago al confirmar el pedido.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Verificación manual**

```bash
npm run dev --workspace=front
npm run dev --workspace=back
```

Ir a `/checkout` con ítems en el carrito: enviar el form vacío y confirmar que aparecen los 6 mensajes de error inline; completar con un email inválido y confirmar el mensaje específico de email; completar todo correctamente y confirmar que crea el pedido (ver en `/admin/pedidos`) y navega a `/checkout/confirmacion`.

- [ ] **Step 8: Commit**

```bash
git add front/package.json package-lock.json front/lib/cart/checkout-schema.ts front/lib/cart/checkout-schema.test.ts "front/app/(public)/(shop)/checkout/page.tsx"
git commit -m "feat(front): checkout con validacion react-hook-form + zod"
```

---

### Task 14: Pantalla de Confirmación

**Files:**
- Create: `front/app/(public)/(shop)/checkout/confirmacion/page.tsx`

**Interfaces:**
- Consumes: `useLastOrder()`/`setLastOrder()` de Task 4, `formatPrecio()` de Task 5.

- [ ] **Step 1: Crear la página**

Crear `front/app/(public)/(shop)/checkout/confirmacion/page.tsx`:

```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLastOrder, setLastOrder } from '@/lib/cart/store'
import { formatPrecio } from '@/lib/format'
import Button from '@/components/ui/Button'

export default function ConfirmacionPage() {
  const router = useRouter()
  const lastOrder = useLastOrder()

  useEffect(() => {
    if (!lastOrder) router.replace('/tienda')
  }, [lastOrder, router])

  if (!lastOrder) return null

  return (
    <section style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
        fontSize: '2.5rem', color: 'var(--color-brown)', fontWeight: 700,
      }}>
        ✓
      </div>
      <h1 style={{ color: 'var(--color-crimson)', margin: '1.5rem 0 0' }}>¡Pedido recibido!</h1>
      <p style={{ color: 'var(--color-brown)', maxWidth: '44ch', margin: '1rem auto 0' }}>
        Te enviamos un correo con los detalles. Coordinaremos el pago y el envío a la brevedad.
      </p>

      <div style={{
        background: 'var(--color-cream)', border: '1px solid var(--color-amber)',
        borderRadius: '12px', padding: '2rem', margin: '2.5rem 0', textAlign: 'left',
      }}>
        <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-amber)' }}>
          Pedido {lastOrder.code}
        </p>
        <div style={{ height: '1px', background: 'rgba(135,43,19,0.15)', margin: '1.25rem 0' }} />
        {lastOrder.items.map((item, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-brown)', marginBottom: '0.6rem' }}>
            <span>{item.nombre} ×{item.q}</span>
            <span>{formatPrecio(item.subtotal)}</span>
          </div>
        ))}
        <div style={{ height: '1px', background: 'rgba(135,43,19,0.15)', margin: '1rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-brown)' }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-amber)' }}>{formatPrecio(lastOrder.total)}</span>
        </div>
      </div>

      <Button onClick={() => { setLastOrder(null); router.push('/tienda') }}>Volver a la tienda</Button>
    </section>
  )
}
```

- [ ] **Step 2: Verificación manual**

```bash
npm run dev --workspace=front
```

Completar un checkout válido y confirmar que `/checkout/confirmacion` muestra el código `#VC-XXXXXX`, los ítems y el total; recargar la página (F5) y confirmar que el pedido sigue visible (persistido); luego click "Volver a la tienda" y confirmar que vuelve a entrar directo a `/checkout/confirmacion` en el navegador redirige a `/tienda` (porque `lastOrder` ya se limpió).

- [ ] **Step 3: Commit**

```bash
git add "front/app/(public)/(shop)/checkout/confirmacion/page.tsx"
git commit -m "feat(front): pantalla de confirmacion con numero de pedido real"
```

---

### Task 15: Admin — categorías dinámicas en Productos

**Files:**
- Modify: `front/app/admin/(protected)/productos/page.tsx`

**Interfaces:**
- Ninguna (fix autocontenido).

- [ ] **Step 1: Reemplazar la constante `CATEGORIAS`**

En `front/app/admin/(protected)/productos/page.tsx`, eliminar la línea 9 (`const CATEGORIAS = ['Todos', 'Cacao', 'Chocolates', 'Kits']`) y, dentro del componente (después de la línea de `useState` de `productos`), agregar:

```tsx
const categorias = useMemo(
  () => ['Todos', ...Array.from(new Set(productos.map(p => p.categoria)))],
  [productos],
)
```

- [ ] **Step 2: Actualizar el render de las pills**

Reemplazar el bloque de pills (líneas 73-77):

```tsx
<div className="admin-pills" style={{ marginBottom: 20 }}>
  {categorias.map(c => (
    <button key={c} className={`admin-pill${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>
      {c === 'Todos' ? c : c.charAt(0).toUpperCase() + c.slice(1)}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Verificación manual**

```bash
npm run dev --workspace=front
```

Abrir `/admin/productos` (con sesión de admin) y confirmar que las pills muestran las categorías reales (`Chocolates`, `Despensa`, `Cafe`, `Regalos`, `Hogar`) y que cada una filtra correctamente la tabla.

- [ ] **Step 4: Commit**

```bash
git add "front/app/admin/(protected)/productos/page.tsx"
git commit -m "fix(front): filtro de categorias del admin usa datos reales"
```

---

### Task 16: Admin — badge de producto en `ProductoFormModal`

**Files:**
- Modify: `front/lib/admin/types.ts`
- Modify: `front/components/admin/ProductoFormModal.tsx`

**Interfaces:**
- Consumes: `Producto.badge` (columna de Task 1, DTO de Task 2).
- Produces: `AdminProducto.badge?`.

- [ ] **Step 1: Extender `AdminProducto`**

En `front/lib/admin/types.ts`, agregar `badge` a la interfaz (línea 40, después de `categoria: string`):

```ts
export interface AdminProducto {
  id: string
  slug: string
  nombre: string
  descripcion: string
  precio: number
  stock: number
  imagen: string
  categoria: string
  badge?: 'Nuevo' | 'Destacado' | null
  createdAt: string
}
```

- [ ] **Step 2: Extender el formulario**

En `front/components/admin/ProductoFormModal.tsx`, actualizar `FormData` y `EMPTY` (líneas 9-17):

```tsx
type FormData = {
  nombre: string; descripcion: string; slug: string
  precio: string; stock: string; categoria: string; imagen: string; badge: string
}

const EMPTY: FormData = {
  nombre: '', descripcion: '', slug: '', precio: '',
  stock: '0', categoria: 'chocolates', imagen: '', badge: '',
}
```

Actualizar la inicialización desde `producto` existente (líneas 33-42):

```tsx
const [form, setForm] = useState<FormData>(
  producto
    ? {
        nombre: producto.nombre, descripcion: producto.descripcion,
        slug: producto.slug, precio: String(producto.precio),
        stock: String(producto.stock), categoria: producto.categoria,
        imagen: producto.imagen ?? '', badge: producto.badge ?? '',
      }
    : EMPTY
)
```

Actualizar el payload de guardado (líneas 63-67):

```tsx
const data = {
  nombre: form.nombre, descripcion: form.descripcion, slug: form.slug,
  precio: Number(form.precio), stock: Number(form.stock),
  categoria: form.categoria, imagen: form.imagen,
  badge: form.badge === '' ? undefined : form.badge,
}
```

Agregar el `<select>` de badge después del grid de Precio/Stock/Categoría (después de la línea 109, antes de `<ImageUploader .../>`):

```tsx
<FormRow label="Badge (opcional)">
  <select className="admin-input" value={form.badge} onChange={e => set('badge', e.target.value)}>
    <option value="">Ninguno</option>
    <option value="Nuevo">Nuevo</option>
    <option value="Destacado">Destacado</option>
  </select>
</FormRow>
```

- [ ] **Step 3: Verificación manual**

```bash
npm run dev --workspace=front
npm run dev --workspace=back
```

En `/admin/productos`, crear o editar un producto asignándole badge "Nuevo", guardar, y confirmar en `/tienda` que la card de ese producto muestra la cinta dorada "Nuevo".

- [ ] **Step 4: Commit**

```bash
git add front/lib/admin/types.ts front/components/admin/ProductoFormModal.tsx
git commit -m "feat(front): admin puede asignar badge Nuevo/Destacado a un producto"
```

---

### Task 17: Admin — datos de contacto del pedido en `PedidoDrawer`

**Files:**
- Modify: `front/lib/admin/types.ts`
- Modify: `front/components/admin/PedidoDrawer.tsx`

**Interfaces:**
- Consumes: `Pedido.telefono/ciudad/codigoPostal` (columnas de Task 1, DTO de Task 2).
- Produces: `AdminPedido.telefono/ciudad/codigoPostal`.

- [ ] **Step 1: Extender `AdminPedido`**

En `front/lib/admin/types.ts`, actualizar la interfaz (líneas 51-60):

```ts
export interface AdminPedido {
  id: string
  nombre: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  codigoPostal: string
  total: number
  estado: EstadoPedido
  createdAt: string
  items: ItemPedido[]
}
```

- [ ] **Step 2: Mostrar los campos en el drawer**

En `front/components/admin/PedidoDrawer.tsx`, reemplazar la línea `<Field label="Dirección de envío">{pedido.direccion}</Field>` (línea 43):

```tsx
<Field label="Dirección de envío">{pedido.direccion}, {pedido.ciudad} (CP {pedido.codigoPostal})</Field>
<Field label="Teléfono">{pedido.telefono}</Field>
```

- [ ] **Step 3: Verificación manual**

```bash
npm run dev --workspace=front
npm run dev --workspace=back
```

Crear un pedido completo desde `/checkout` y abrir su detalle en `/admin/pedidos` — confirmar que el drawer muestra dirección+ciudad+CP y el teléfono.

- [ ] **Step 4: Commit**

```bash
git add front/lib/admin/types.ts front/components/admin/PedidoDrawer.tsx
git commit -m "feat(front): admin ve telefono/ciudad/CP del pedido en el drawer"
```

---

### Task 18: Limpieza final y verificación end-to-end

**Files:**
- Delete: `front/lib/useCarrito.ts`

**Interfaces:**
- Ninguna — task de cierre.

- [ ] **Step 1: Confirmar que no queda ninguna referencia al hook viejo**

```bash
grep -rn "useCarrito" front --include="*.tsx" --include="*.ts"
```

Expected: sin resultados (todas las pantallas ya migraron a `useCart` en las Tasks 7-14).

- [ ] **Step 2: Eliminar el archivo viejo**

```bash
git rm front/lib/useCarrito.ts
```

- [ ] **Step 3: Type-check completo del frontend**

```bash
npm exec --workspace=front -- tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 4: Suite completa de tests**

```bash
npm run test --workspace=front
cd back && npx jest
```

Expected: todos los tests (frontend Vitest + backend Jest) en verde.

- [ ] **Step 5: Verificación manual end-to-end**

```bash
npm run dev
```

Con el backend y frontend corriendo, recorrer el flujo completo en el navegador:
1. `/tienda` → filtrar por categoría → agregar 2 productos distintos desde el grid (toast visible cada vez, badge del navbar sumando en vivo).
2. Entrar al detalle de un tercer producto, subir la cantidad al tope de stock, agregarlo (el botón muestra el subtotal correcto antes de agregar).
3. `/carrito` → subir/bajar cantidades (verificar que no supera el stock ni baja de 1), quitar una línea, confirmar totales.
4. `/checkout` → enviar vacío (ver los 6 errores), completar con datos válidos → confirmar pedido.
5. `/checkout/confirmacion` → validar código `#VC-XXXXXX`, ítems y total; recargar (F5) y confirmar que persiste; volver a la tienda.
6. Navegar directo a `/checkout/confirmacion` en una pestaña nueva (sin pedido reciente) → debe redirigir a `/tienda`.
7. `/admin/productos` → poner stock en 0 de un producto → confirmar que en `/tienda` aparece "Agotado" y el botón está deshabilitado.
8. `/admin/pedidos` → abrir el pedido recién creado → confirmar que el drawer muestra teléfono/ciudad/CP.

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "chore(front): eliminar useCarrito legado tras migrar al store nuevo"
```
