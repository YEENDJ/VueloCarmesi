# Detalle de items en la notificación de pedido — Design

## Contexto

Al crear un pedido en la tienda, se disparan 3 notificaciones desde `NotificacionesService.enviarConfirmacionPedido`:
1. Email al cliente (`confirmacion-pedido.html`)
2. Email al admin (`alerta-admin.html`, vía `filas` armadas en `notificaciones.service.ts`)
3. Mensaje de Telegram al admin

Hoy las tres solo muestran el **total** del pedido, sin desglose de productos. `PedidosService.create` ya construye el `pedido` con `items: { include: { producto: true } }` (cada item tiene `producto.nombre`, `cantidad`, `precio`), pero esos datos no llegan a las notificaciones.

## Objetivo

Mostrar en las 3 notificaciones el detalle de la compra: producto, precio individual (unitario), cantidad y subtotal por ítem, además del total ya existente.

## Cambios

### 1. Firma de `enviarConfirmacionPedido`

`back/src/notificaciones/notificaciones.service.ts`

Extender el parámetro `pedido` para incluir:
```ts
items: { cantidad: number; precio: number; producto: { nombre: string } }[]
```

`pedidos.service.ts` no requiere cambios: el objeto `pedido` que ya pasa a `enviarConfirmacionPedido` (resultado del `create` con `include: { items: { include: { producto: true } } }`) ya satisface esta forma.

### 2. Helper de tabla de items (HTML)

Nueva función privada en `notificaciones.service.ts`, p. ej. `tablaItemsHtml(items, variant: 'cliente' | 'admin')`, que devuelve el `<table>` HTML con:
- Header: Producto | Cant. | Precio unit. | Subtotal
- Una fila por item (nombre escapado con `escapeHtml`, precio y subtotal formateados con `toLocaleString('es-CO')`, prefijo `$`)
- Footer: fila de Total (bold, en rojo `#D51312` para variante cliente / rojo oscuro `#872B13` para variante admin, acorde a la paleta de cada template)

Ambas variantes comparten la misma estructura de columnas; solo cambian estilos para calzar con cada template (`confirmacion-pedido.html` usa Georgia/serif y paleta cálida; `alerta-admin.html` usa Arial y paleta gris/admin).

### 3. Email al cliente — `confirmacion-pedido.html`

- Se quita la fila suelta de "Total" de la tabla de metadatos actual (queda solo N° de pedido y Dirección).
- Se agrega un nuevo placeholder `{{itemsTable}}` debajo de esa tabla, donde se inyecta el HTML de la tabla de detalle (incluye su propio Total en el pie).

### 4. Email al admin — vía `filas` (`alerta-admin.html`)

- Se agrega la tabla de detalle (variante admin) como una fila adicional en el array `filas`, ubicada después de "Dirección".
- Se elimina la fila `filaHtml('Total', ...)` porque el total ya queda en el pie de la nueva tabla (evita duplicar el dato).

### 5. Telegram

- Se reemplaza la línea única de "Total" por un bloque de texto plano con una línea por producto:
  `Café Premium 500g × 2 — $20.000 c/u — $40.000`
- Seguido de la línea final: `Total: $ {totalStr} COP`

### 6. Seguridad

- `producto.nombre` se escapa con `escapeHtml` (ya existe en el archivo) antes de insertarse en cualquier HTML, previniendo que caracteres como `&`, `<`, `>` rompan el layout.

## Fuera de alcance

- No se modifica el flujo de creación de pedidos (`pedidos.service.ts`) más allá de que ya pasa `items` implícitamente al pasar `pedido` completo.
- No se agregan tests nuevos de snapshot de HTML; se valida con los tests unitarios existentes de `notificaciones.service` (si existen) y prueba manual del render.
