# Handoff: Flujo de compra (Tienda) — Vuelo Carmesí

## Resumen

Flujo de e-commerce **funcional** para la tienda de Vuelo Carmesí: el recorrido completo de compra de productos (cacao, chocolates, kits), con **carrito real**. A diferencia del handoff del sitio público (`design_handoff_vuelo_carmesi/`, que son pantallas estáticas hi-fi), este prototipo tiene **lógica de carrito de verdad**: agregar, sumar/restar cantidades, quitar, vaciar, totales calculados, y confirmación de pedido con número generado.

Recorrido: **Tienda → Detalle de producto → Carrito → Checkout → Confirmación**, con un mini-carrito (badge de cantidad) siempre visible en el navbar.

---

## Sobre los archivos de diseño

`Flujo Tienda Vuelo Carmesi.dc.html` es un **prototipo funcional de referencia** — muestra el comportamiento previsto del flujo, no es código de producción. Recrealo en el stack del proyecto base reutilizando sus patrones. La lógica de carrito del prototipo (estado, cálculos, transiciones de pantalla) es la **especificación funcional**: replicá ese comportamiento contra tu store/estado real y tu API.

**Qué es funcional en el prototipo** (y debe serlo en producción):
- Agregar al carrito desde la grilla y desde el detalle (con cantidad elegida).
- Badge del navbar que refleja la cantidad total de artículos en vivo.
- Filtro de productos por categoría.
- Carrito: +/− por ítem (mínimo 1), quitar ítem, vaciar carrito, subtotales por línea y total, estado vacío.
- Checkout: resumen del pedido derivado del carrito real + total.
- Confirmación: genera un número de pedido, muestra el detalle y **vacía el carrito**.
- Toast de feedback al agregar.
- Indicador de pasos (Tienda → Carrito → Checkout → Confirmación) con estado activo/completado.

**Qué es placeholder**: imágenes (rayadas con etiqueta monospace) y el catálogo de ejemplo (8 productos). Los datos vienen del backend en producción.

---

## Fidelidad

**Alta fidelidad** visual y **funcional**. Colores, tipografía, espaciado y estados son definitivos (comparten el design system del sitio público — ver ese README para tokens completos). La lógica descrita abajo debe implementarse tal cual.

---

## Sistema de diseño (referencia rápida)

Hereda el sistema del sitio público. Resumen:

- **Colores**: cream `#FFEACA` (fondo), superficie card `#FFF6E4`, crimson `#D51312` (primario/CTA), orange `#EA5B0C` (acento/links), brown `#872B13` (texto/fondos ricos), amber `#F59C00` (precios), gold `#FDC300` (badge del carrito, detalles). Verde `#1F8A5B` para señales positivas ("A coordinar", pasos completados).
- **Tipografía**: **Honey Lips** (display script) solo en títulos H1 y el logo; **Bellota Bold** para todo lo demás; Bellota Regular para textos suaves. *(Honey Lips es "Personal Use" — resolver licencia antes de producción; ver handoff del sitio público.)*
- **Espaciado** base 8px. **Radios**: 4px inputs, 8px botones, 12px cards, 100px pills. **Sombras** basadas en brown.

---

## Estructura de pantallas y layout

Navbar sticky (crimson, 72px) con logo + link Tienda + **botón Carrito con badge** (gold, cantidad total; se oculta si 0). Debajo, una **barra de pasos** sticky-friendly (Tienda → Carrito → Checkout → Confirmación) que también sirve de indicador de progreso. Contenido centrado, máx 1200px, responsive (columnas colapsan a una sola en mobile; las columnas sticky pierden sticky).

### 1. Tienda
- Título + bajada.
- **Filtros** por categoría: pills (Todos / Cacao / Chocolates / Kits). Activo: crimson/cream. Inactivo: outline brown.
- **Grid** de ProductoCards (`auto-fill minmax(230px, 1fr)`): imagen (clickable → detalle), badge opcional (Nuevo/Destacado/Agotado), nombre (clickable), descripción, precio (amber), botón "Agregar al carrito" (crimson). Producto **agotado**: botón deshabilitado con label "Agotado".

### 2. Detalle de producto
- Link "← Volver a la tienda".
- 2 columnas: imagen cuadrada (izq) + info (der): chip de categoría, nombre H1, precio, descripción larga, **selector de cantidad** (− / n / +, mínimo 1), botón "Agregar al carrito · $subtotal" que agrega la cantidad elegida.

### 3. Carrito
- **Estado con ítems**: lista (imagen 80px, nombre, precio unitario, selector cantidad compacto, subtotal de línea, botón quitar 🗑) + acciones "← Seguir comprando" y "Vaciar carrito". **Resumen sticky** (card cream): subtotal con conteo de artículos, envío ("A coordinar"), total (amber), botón "Ir al checkout".
- **Estado vacío**: ícono, "Tu carrito está vacío", botón "Ver tienda".

### 4. Checkout
- Link "← Volver al carrito".
- 2 columnas: **formulario** (Datos de contacto: nombre, email, teléfono; Datos de entrega: dirección, ciudad, CP) + botón "Confirmar pedido · $total". **Resumen sticky bg brown** con los ítems del carrito (nombre + ×cantidad + subtotal), total y nota de pago.

### 5. Confirmación
- Círculo gold con check, "¡Pedido recibido!", texto, **card con número de pedido** (`#VC-XXXX` generado), detalle de ítems y total, botón "Volver a la tienda". Al llegar acá el carrito queda **vacío**.

---

## Especificación funcional (modelo + acciones)

### Estado

```
cart: Array<{ id, nombre, precio (number), img, q (int ≥1) }>
filter: 'Todos' | 'Cacao' | 'Chocolates' | 'Kits'
selectedProductId: number        // producto abierto en el detalle
detailQty: int ≥1                 // cantidad en el detalle
lastOrder: { items[], total, code } | null   // snapshot para la confirmación
toast: string                     // mensaje de feedback efímero
screen: 'tienda'|'producto'|'carrito'|'checkout'|'confirm'   // en prod: rutas
```

### Producto (catálogo)

```
{ id, nombre, desc (corta), descLarga, precio (number), cat, badge (''|'Nuevo'|'Destacado'|'Agotado'), img, agotado (bool) }
```

### Acciones / reglas

- **addToCart(id, qty)**: si el producto está agotado, no hace nada. Si ya está en el carrito, **suma** `qty` a la línea existente; si no, la crea. Dispara toast.
- **inc(id) / dec(id)**: ±1 sobre la línea; `dec` nunca baja de 1 (para eliminar, usar quitar).
- **remove(id)**: elimina la línea.
- **clearCart()**: vacía el carrito.
- **cartCount** = Σ `q`. **cartTotal** = Σ `precio × q`. Subtotal de línea = `precio × q`.
- **setFilter(cat)**: filtra el grid (Todos = sin filtro).
- **openProducto(id)**: fija `selectedProductId`, resetea `detailQty` a 1, navega al detalle.
- **confirmarPedido()**: si `cartCount === 0` no procede. Genera `code` (`#VC-` + 4 dígitos), guarda `lastOrder` (snapshot de ítems + total), **vacía el carrito** y navega a confirmación.
- **Formato de precio**: `$` + separador de miles con punto (es-AR). Ej. `$15.200`.
- **goCheckout()**: solo procede si hay ítems.

### Feedback

- **Toast**: al agregar, mensaje efímero (~2s) tipo "Tableta 72% intenso agregado al carrito" (o "N × … agregados" si qty>1).
- **Indicador de pasos**: paso actual en crimson; pasos ya recorridos en verde; futuros en gris.

---

## Gestión de estado / integración (sugerida)

- El carrito debe **persistir** (localStorage o backend) para sobrevivir recargas; el prototipo lo mantiene en memoria.
- **Catálogo y productos son las mismas entidades** que gestiona el Admin Dashboard (`design_handoff_admin/`) y que muestra el sitio público — compartir modelo y API. El `stock` que administra el admin debe condicionar el estado "Agotado" y (a futuro) la cantidad máxima agregable.
- El **pedido** creado en confirmación corresponde a la entidad "Pedido" del admin (`id`, `fecha`, `cliente`, `items[]`, `total`, `estado`, `direccion`). Confirmar acá = crear un Pedido en estado "pendiente".
- Sugerido: store de carrito (Context/Zustand) + React Query/SWR para catálogo y creación de pedido. Validación de formulario con react-hook-form + zod (el prototipo no valida aún; agregar estados de error de input según el design system).

---

## Responsive

Desktop-first pero adaptativo: el grid pasa a menos columnas / una sola, los layouts de 2 columnas (detalle, carrito, checkout) se apilan, las columnas de resumen sticky pierden el sticky y van debajo, y el navbar mantiene logo + carrito (el link Tienda puede colapsar).

---

## Archivos en este bundle

- `Flujo Tienda Vuelo Carmesi.dc.html` — prototipo **funcional** navegable (agregá productos y recorré el flujo completo).
- `fonts/` — Honey Lips (títulos/logo) + Bellota (Bold/Regular).
- `screenshots/` — una imagen por pantalla del flujo.
- `README.md` — este documento.

| Screenshot | Pantalla |
|------------|----------|
| `01-tienda.png` | Tienda (grid + filtros) |
| `02-producto.png` | Detalle de producto (selector de cantidad) |
| `03-carrito.png` | Carrito con ítems (subtotales + total) |
| `04-checkout.png` | Checkout (form + resumen) |
| `05-confirmacion.png` | Confirmación (número de pedido) |

---

## Stack y estructura sugerida

> Reutilizá el stack y los `tokens.css` del sitio público. Rutas del flujo:

```
src/
├─ app/(tienda)/
│  ├─ tienda/page.tsx            # catálogo + filtros
│  ├─ tienda/[slug]/page.tsx     # detalle de producto
│  ├─ carrito/page.tsx           # carrito (+ empty state)
│  ├─ checkout/page.tsx          # formulario + resumen
│  └─ checkout/confirmacion/page.tsx
├─ components/tienda/
│  ├─ Navbar.tsx                 # con CartBadge
│  ├─ StepIndicator.tsx
│  ├─ ProductoCard.tsx
│  ├─ CartItem.tsx · CartSummary.tsx
│  ├─ QtyStepper.tsx             # selector − n +
│  └─ Toast.tsx
├─ lib/cart/                     # store del carrito + selectors (count, total) + persistencia
├─ lib/data/productos.ts         # catálogo (mock → API)
└─ styles/tokens.css             # compartido con sitio público y admin
```

### Orden de implementación
1. Store de carrito (estado + acciones + selectors + persistencia) — es el corazón del flujo.
2. Navbar con CartBadge + StepIndicator + QtyStepper + ProductoCard (componentes reutilizables).
3. Tienda (grid + filtros + agregar + toast).
4. Detalle de producto (cantidad + agregar).
5. Carrito (+/−, quitar, vaciar, totales, empty state).
6. Checkout (form + resumen derivado) → Confirmación (crear pedido + limpiar carrito).
7. Persistencia, validación de formulario y conexión a la API.
