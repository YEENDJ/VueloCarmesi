# Flujo de compra de la tienda (Tienda → Carrito → Checkout → Confirmación)

**Fecha:** 2026-07-01
**Estado:** Aprobado

## Contexto

El handoff `handoff/design_handoff_flujo_compra/` es la fuente de verdad funcional del recorrido de e-commerce: Tienda → Detalle de producto → Carrito → Checkout → Confirmación, con carrito real (agregar, +/−, quitar, vaciar, totales) y confirmación con número de pedido generado.

Ya existe una implementación previa parcial (commits `727dad1`, `283bd37`, `46777c1`, `044b622`) con backend real (NestJS + Prisma + Neon Postgres, `Producto`/`Pedido`/`ItemPedido`, transacción de stock) y páginas básicas en el frontend. Pero no cumple la especificación funcional del handoff:

- **`useCarrito` no es un store real**: cada componente que lo usa crea su propio estado en memoria sincronizado a mano con `localStorage` — un cambio en una instancia no se refleja en otra (ej: un badge del navbar nunca se actualizaría en vivo).
- Falta: +/− por línea en el carrito, vaciar carrito, filtro por categoría, toast de feedback, indicador de pasos, página de confirmación, validación de checkout.
- `Producto.categoria` es un string libre en la BD (seed real: `chocolates/despensa/cafe/regalos/hogar`), pero el tipo de frontend lo fija a `'cacao'|'chocolate'|'otro'`, y tanto el prototipo como el filtro del Admin asumen `Cacao/Chocolates/Kits` — ninguno coincide con los datos reales.
- `Pedido` solo guarda `nombre/email/direccion`; el checkout del handoff pide también teléfono, ciudad y código postal.
- El precio se formatea con `es-AR` en carrito/checkout, inconsistente con el resto del sitio (`es-CO`, ya que el negocio es colombiano).

## Decisiones de diseño

- **Alcance**: reescribir el flujo completo siguiendo el orden del README del handoff (store → componentes compartidos → pantallas), reutilizando `front/styles/tokens.css` y los componentes UI existentes (`Button`, `Card`, `Badge`, `QuantitySelector`, `Input`).
- **Store de carrito sin dependencias nuevas**: módulo vanilla con `useSyncExternalStore` (React ya lo provee) en vez de agregar `zustand`. Resuelve el problema real (estado compartido) sin ampliar la superficie de dependencias.
- **Modelo de datos compartido tienda ↔ admin**: se extiende Prisma (`Producto.badge`, `Pedido.telefono/ciudad/codigoPostal`) vía migración contra la Neon DB real. **Se pide confirmación explícita antes de ejecutar la migración**, por tratarse de una base compartida.
- **Categorías dinámicas**: el filtro de la Tienda (y el mismo bug ya presente en el Admin) se deriva de las categorías reales presentes en el catálogo, no de una lista hardcodeada.
- **Badges de producto**: `Agotado` siempre se deriva de `stock === 0` (nunca se persiste). `Nuevo`/`Destacado` se persisten en `Producto.badge` (string nullable), editable desde el Admin.
- **Número de pedido en confirmación**: `#VC-` + los últimos 6 caracteres del `id` real (cuid) en mayúsculas — mismo criterio que ya usa `PedidoDrawer` en el Admin (`#XXXXXX`), con el prefijo `VC-` para la vidriera pública. No es un código random desconectado del pedido persistido.
- **Validación de checkout**: `zod` (schema) + `react-hook-form` (estado del formulario) + `@hookform/resolvers/zod` (adapter). El backend sigue validando con `class-validator` (defensa en profundidad, sin cambiar el patrón ya usado en el resto de los módulos). Se descarta tRPC: no reemplaza a react-hook-form (sigue haciendo falta para la UX del form) y el backend es REST + class-validator en todos los módulos — adoptarlo solo para `pedidos` introduciría dos paradigmas de API en paralelo.
- **Formato de precio**: se unifica a `es-CO` en un helper compartido, reemplazando el `es-AR` actual del carrito/checkout.

## Arquitectura

### Backend

#### Prisma — migración nueva
```prisma
model Producto {
  // ...campos existentes...
  badge String?   // null | "Nuevo" | "Destacado"
}

model Pedido {
  // ...campos existentes...
  telefono     String
  ciudad       String
  codigoPostal String
}
```
`npx prisma migrate dev --name add_producto_badge_and_pedido_contacto` contra la Neon DB (requiere confirmación previa del usuario antes de ejecutarse).

#### DTOs
- `CreateProductoDto`: agrega `badge?: string` (`@IsOptional() @IsIn(['Nuevo', 'Destacado'])`).
- `CreatePedidoDto`: agrega `telefono: string`, `ciudad: string`, `codigoPostal: string` (todos `@IsString()` requeridos).

#### Services
Sin cambios de lógica: `ProductosService`/`PedidosService` ya hacen spread del DTO a Prisma; los campos nuevos pasan igual.

#### Notificaciones
`NotificacionesService.enviarConfirmacionPedido` incluye teléfono/ciudad/CP en la fila de "Dirección" del email/Telegram al admin (concatenados: `"{direccion}, {ciudad} (CP {codigoPostal})"`).

### Frontend

#### Modelo de datos (`front/lib/types/index.ts`)
```ts
export interface Producto {
  id: string
  slug: string
  nombre: string
  descripcion: string
  precio: number
  stock: number
  imagen: string
  categoria: string        // antes: unión fija — ahora string libre, igual que en Prisma
  images?: string[]
  badge?: 'Nuevo' | 'Destacado' | null
}
```
`front/lib/api/productos.ts`: los mocks de fallback (`MOCK_PRODUCTOS`) se actualizan para usar categorías reales (`chocolates`, `despensa`, `cafe`, etc.) y algunos ejemplos con `badge`.

#### `front/lib/format.ts` (nuevo)
```ts
export function formatPrecio(n: number): string {
  return `$${n.toLocaleString('es-CO')}`
}
```
Reemplaza los `.toLocaleString('es-AR')` en `carrito/page.tsx` y `checkout/page.tsx`.

#### `front/lib/cart/store.ts` (nuevo — el corazón del flujo)

Store vanilla con estado a nivel de módulo, sin librería externa:

```ts
type CartItem = {
  productoId: string; slug: string; nombre: string
  precio: number; imagen: string; stock: number; q: number
}
type LastOrder = {
  code: string
  items: { nombre: string; q: number; subtotal: number }[]
  total: number
}
```

- `addToCart(producto, qty = 1)`: si `producto.stock === 0` no hace nada. Si ya existe la línea, suma `qty` (cap al `stock` del producto); si no, la crea. Dispara toast (`"{nombre} agregado al carrito"` o `"{qty} × {nombre} agregados"` si `qty > 1`).
- `inc(productoId)` / `dec(productoId)`: ±1, `dec` nunca baja de 1, `inc` no supera el `stock` guardado en la línea.
- `remove(productoId)`, `clearCart()`.
- `setLastOrder(order | null)`: snapshot para la confirmación, persistido aparte.
- Selectors vía hooks: `useCart()` → `{ items, cartCount, cartTotal, addToCart, inc, dec, remove, clearCart }`; `useToast()` → `string`; `useLastOrder()` → `LastOrder | null`.
- Persistencia: `localStorage` bajo `vuelo-carmesi:carrito` y `vuelo-carmesi:ultimo-pedido`, sincronizado en cada mutación y entre pestañas vía evento `storage`.
- **SSR/hidratación**: cada hook usa `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` con `getServerSnapshot` devolviendo el estado vacío (`[]`/`''`/`null`). Esto evita mismatches de hidratación — el carrito real se sincroniza recién después del mount en el cliente, aunque el módulo ya haya leído `localStorage` al cargar.
- Toast con auto-clear a los 2s (mismo timing que el prototipo).

#### Componentes

| Componente | Cambio |
|---|---|
| `front/components/layout/Navbar.tsx` | Se agrega `CartBadge` (link a `/carrito`, círculo dorado con `cartCount`, oculto si 0) |
| `front/components/shop/StepIndicator.tsx` (nuevo) | Deriva el paso actual de `usePathname()`: `/tienda*` → Tienda, `/carrito` → Carrito, `/checkout` → Checkout, `/checkout/confirmacion` → Confirmación. Pasos recorridos en verde, actual en crimson, futuros en gris |
| `front/components/shop/Toast.tsx` (nuevo) | Lee `useToast()`, pill café con check dorado, se renderiza una sola vez desde el layout de `(shop)` |
| `front/components/shop/ProductoCard.tsx` | Cinta de badge (Nuevo=dorado, Destacado=crimson, Agotado=café-muted si `stock===0`, prioridad Agotado > `badge` guardado); usa `useCart().addToCart` |
| `front/components/ui/QuantitySelector.tsx` | Sin cambios de lógica — se reutiliza también en las líneas del carrito (el "QtyStepper" del README) |
| `front/components/ui/Input.tsx` | Se extiende con `forwardRef` + `error?: string` opcional (borde crimson + texto de error debajo), sin romper los 2 usos actuales controlados (`contacto/page.tsx`, `checkout/page.tsx`) — necesario para conectar `register()` de react-hook-form |

#### Pantallas

- **`app/(public)/(shop)/layout.tsx`**: pasa de passthrough a renderizar `<StepIndicator />` + `<Toast />` alrededor de `children`.
- **`tienda/page.tsx`**: sigue siendo Server Component (fetch de productos); las categorías dinámicas y el estado de filtro se mueven a un nuevo subcomponente cliente `TiendaGrid` (pills + grid).
- **`tienda/[slug]/page.tsx` + `AddToCartSection.tsx`**: se conectan a `useCart().addToCart` en vez de `useCarrito`.
- **`carrito/page.tsx`**: reescritura completa — líneas con imagen, `QuantitySelector` (inc/dec), subtotal, botón quitar; acciones "← Seguir comprando" / "Vaciar carrito"; resumen sticky (subtotal con conteo, envío "A coordinar" en verde, total en amber, botón "Ir al checkout"); estado vacío con 🛍️ + "Ver tienda".
- **`checkout/page.tsx`**: formulario con `react-hook-form` + schema `zod`:
  ```ts
  const checkoutSchema = z.object({
    nombre: z.string().trim().min(2, 'Ingresá tu nombre completo'),
    email: z.string().trim().email('Ingresá un email válido'),
    telefono: z.string().trim().min(7, 'Ingresá un teléfono válido'),
    direccion: z.string().trim().min(5, 'Ingresá tu dirección'),
    ciudad: z.string().trim().min(2, 'Ingresá tu ciudad'),
    codigoPostal: z.string().trim().min(3, 'Ingresá tu código postal'),
  })
  ```
  Resumen sticky bg café con ítems (nombre × cantidad + subtotal), total, nota "Coordinamos el método de pago al confirmar el pedido." Al submit válido: `POST /pedidos` con los campos nuevos → `setLastOrder({ code, items, total })` → `clearCart()` → `router.push('/checkout/confirmacion')`.
- **`checkout/confirmacion/page.tsx`** (nuevo): lee `useLastOrder()`. Si es `null` (acceso directo sin pedido reciente) → redirige a `/tienda`. Círculo dorado con check, "¡Pedido recibido!", card con código de pedido + ítems + total, botón "Volver a la tienda" (además limpia `lastOrder` al salir).

#### Admin (cambios mínimos y aislados, por consistencia del modelo compartido)

| Archivo | Cambio |
|---|---|
| `front/app/admin/(protected)/productos/page.tsx` | `CATEGORIAS` hardcodeada (`Todos/Cacao/Chocolates/Kits`) → derivada de `productos` reales, igual que en la Tienda |
| `front/components/admin/ProductoFormModal.tsx` | Nuevo `<select>` "Badge": Ninguno / Nuevo / Destacado |
| `front/components/admin/PedidoDrawer.tsx` | Muestra teléfono, ciudad y CP además de la dirección |
| `front/lib/admin/types.ts` | `AdminProducto.badge?`, `AdminPedido.telefono/ciudad/codigoPostal` |

## Flujo completo

```
Tienda (pills dinámicas + grid)
  → click "Agregar" → useCart().addToCart() → toast + CartBadge se actualiza en vivo
  → click en producto → Detalle (selector de cantidad, tope = stock)
    → "Agregar al carrito · $subtotal" → addToCart(producto, qty)
  → click en CartBadge → Carrito
    → +/− por línea (tope = stock, piso = 1), quitar, vaciar
    → "Ir al checkout" (solo si hay ítems)
  → Checkout
    → formulario (react-hook-form + zod), resumen derivado del carrito real
    → submit válido → POST /pedidos → back valida stock en transacción y lo descuenta
    → setLastOrder() + clearCart() → navega a Confirmación
  → Confirmación
    → muestra #VC-XXXXXX + detalle + total (desde lastOrder persistido)
    → "Volver a la tienda" → limpia lastOrder
```

## Manejo de errores

- `addToCart` sobre producto agotado: no-op silencioso (el botón ya está deshabilitado, no debería poder dispararse).
- Checkout con carrito vacío: la página ya redirige/muestra mensaje (comportamiento actual, se mantiene).
- Error de `POST /pedidos` (ej. stock insuficiente detectado en el backend por condición de carrera): se muestra el mensaje de error devuelto por la API sin limpiar el carrito ni navegar — el usuario puede ajustar cantidades y reintentar.
- Acceso directo a `/checkout/confirmacion` sin `lastOrder`: redirige a `/tienda`.
- Migración de `localStorage` con forma vieja (de la implementación previa, `useCarrito`): si el JSON no matchea la forma nueva (`productoId`/`q` vs `producto`/`cantidad`), se descarta y se arranca con carrito vacío en vez de romper — evita un error de runtime para usuarios con el carrito viejo en localStorage.

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `back/prisma/schema.prisma` | Modificar — `Producto.badge`, `Pedido.telefono/ciudad/codigoPostal` |
| `back/prisma/migrations/..._add_producto_badge_and_pedido_contacto/` | Crear (migración, requiere confirmación antes de ejecutar) |
| `back/src/productos/dto/create-producto.dto.ts` | Modificar — `badge?` |
| `back/src/pedidos/dto/create-pedido.dto.ts` | Modificar — `telefono`, `ciudad`, `codigoPostal` |
| `back/src/notificaciones/notificaciones.service.ts` | Modificar — incluir nuevos campos en email/Telegram de pedido |
| `front/lib/types/index.ts` | Modificar — `Producto.categoria: string`, `Producto.badge?` |
| `front/lib/api/productos.ts` | Modificar — mocks con categorías/badges reales |
| `front/lib/format.ts` | Crear — `formatPrecio()` |
| `front/lib/cart/store.ts` | Crear — store + selectors + persistencia |
| `front/components/layout/Navbar.tsx` | Modificar — `CartBadge` |
| `front/components/shop/StepIndicator.tsx` | Crear |
| `front/components/shop/Toast.tsx` | Crear |
| `front/components/shop/ProductoCard.tsx` | Modificar — badges, `useCart` |
| `front/components/ui/Input.tsx` | Modificar — `forwardRef` + `error?` |
| `front/app/(public)/(shop)/layout.tsx` | Modificar — `StepIndicator` + `Toast` |
| `front/app/(public)/(shop)/tienda/page.tsx` | Modificar — delega filtro a `TiendaGrid` |
| `front/components/shop/TiendaGrid.tsx` | Crear — pills dinámicas + grid |
| `front/app/(public)/(shop)/tienda/[slug]/AddToCartSection.tsx` | Modificar — `useCart` |
| `front/app/(public)/(shop)/carrito/page.tsx` | Reescribir |
| `front/app/(public)/(shop)/checkout/page.tsx` | Reescribir — react-hook-form + zod |
| `front/app/(public)/(shop)/checkout/confirmacion/page.tsx` | Crear |
| `front/app/admin/(protected)/productos/page.tsx` | Modificar — categorías dinámicas |
| `front/components/admin/ProductoFormModal.tsx` | Modificar — select de badge |
| `front/components/admin/PedidoDrawer.tsx` | Modificar — mostrar teléfono/ciudad/CP |
| `front/lib/admin/types.ts` | Modificar — tipos extendidos |
| `front/package.json` | Modificar — agrega `zod`, `react-hook-form`, `@hookform/resolvers` |
| `front/lib/useCarrito.ts` | Eliminar (reemplazado por `lib/cart/store.ts`) |
