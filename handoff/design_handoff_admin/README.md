# Handoff: Admin Dashboard — Vuelo Carmesí

## Resumen

Panel de administración para la finca **Vuelo Carmesí**. Permite gestionar las cuatro entidades del negocio — **Experiencias, Reservas, Productos, Pedidos** — más un Overview con métricas y una sección de Configuración (v2).

Es el **back-office del sitio público** de Vuelo Carmesí (ese front-end tiene su propio handoff: `design_handoff_vuelo_carmesi/`). Comparte la marca pero adapta el sistema a un contexto data-dense.

---

## Sobre los archivos de diseño

Los archivos son **referencias de diseño en HTML** — un prototipo navegable que muestra layout, comportamiento y estados previstos, **no código de producción para copiar tal cual**. La tarea es **recrearlo en el stack del proyecto base** (idealmente el mismo del sitio público), usando sus patrones y librerías.

El prototipo `Admin Vuelo Carmesi.dc.html` es un solo archivo: la **sidebar izquierda** navega entre los 6 módulos; los drawers de detalle (Reserva/Pedido) y el modal de CRUD se abren con sus botones.

Datos = **mock realista**. La gráfica, métricas, tablas y estados son ilustrativos; en producción vienen del backend.

---

## Fidelidad

**Alta fidelidad.** Colores, tipografía, espaciado, estados y componentes son definitivos. Lo único "de relleno": las **imágenes** (thumbnails de experiencias/productos, placeholders rayados) y los **datos de ejemplo**.

---

## Adaptación de la marca al admin

El sitio público es cálido y cream-dominante. Para un back-office data-dense se ajusta así (manteniendo la identidad):

| Rol | Color | Nota |
|-----|-------|------|
| Fondo de la app | `#FBF6EC` | Neutro cálido claro (el cream puro `#FFEACA` cansa en tablas densas) |
| Sidebar | `#872B13` (brown) | Navegación fija, ancla visual |
| Superficies (cards, tablas, header) | `#FFFFFF` | Contraste limpio para datos |
| Relleno de inputs / hover de fila | `#FBF6EC` | |
| Primario / item activo / CTAs | `#D51312` (crimson) | |
| Acento, links, botones secundarios | `#EA5B0C` (orange) | |
| Precios, valores destacados | `#F59C00` (amber) | |
| Detalles, badge de notificación numérica | `#FDC300` (gold) | |
| Texto principal | `#872B13` (brown) | |
| Bordes sutiles | `rgba(135,43,19,.12)` | |

**Colores semánticos de estado** (nuevos, fuera de la paleta de marca, solo para el admin):
- **Éxito / confirmada / entregado / activo**: verde `#1F8A5B`
- **Pendiente / aviso**: amber `#F59C00` (texto brown)
- **En tránsito / enviado**: azul `#2A6FDB`
- **Cancelado / agotado / inactivo**: gris cálido `rgba(135,43,19,.15)` con texto `rgba(135,43,19,.6)`
- **Alerta stock bajo**: texto `#B45309` + fondo `rgba(245,156,0,.18)` + ícono ⚠️

### Tipografía

- **Honey Lips** (display script): **solo el logo** de la sidebar. No usar en datos. *(Licencia "Personal Use" — comprar comercial o reemplazar antes de producción; ver handoff del sitio público.)*
- **Bellota Bold (700)**: todo lo demás — títulos de página, headers de tabla, celdas, labels, botones. Es la fuente de trabajo por legibilidad.
- **Bellota Regular (400)**: subtítulos y textos secundarios suaves.

Escala admin: Título de página 26px · Card de métrica (número) 34px · Título de sección 17px · Header de tabla 12px uppercase `letter-spacing .5px` · Celda/body 14px · Caption 12–13px.

### Espaciado, radios, sombras

- Base 8px. Padding de contenido principal: 28px. Padding de cards: 22–24px. Celdas de tabla: 13–14px vertical / 20px horizontal.
- Radios: **6px** botones/inputs de tabla · **8px** botones/thumbnails · **14px** cards y contenedores de tabla · **100px** pills/badges.
- Sombra de card: `0 2px 8px rgba(135,43,19,.06)`. Drawer: `-8px 0 40px rgba(0,0,0,.2)`. Modal: `0 20px 60px rgba(0,0,0,.3)`.

---

## Layout

```
┌────────────┬─────────────────────────────────────────────┐
│            │  HEADER (64px, sticky): breadcrumb · 🔔 ·    │
│  SIDEBAR   │  avatar+nombre+rol · botón Salir              │
│  (248px,   ├─────────────────────────────────────────────┤
│  fija,     │                                              │
│  brown)    │  CONTENIDO (padding 28px)                    │
│            │  · Título de página + subtítulo + acción     │
│  logo      │  · Filtros / controles                       │
│  6 items   │  · Tabla / cards / formulario                │
│            │                                              │
│  user card │                                              │
└────────────┴─────────────────────────────────────────────┘
```

- **Sidebar (248px, fija, `height:100vh`, `position:sticky`)**: logo "Vuelo Carmesí" (Honey Lips, gold) + subtítulo "Panel de administración". 6 items de nav con ícono + label + badge numérico opcional (cuántos requieren atención). Item activo: fondo crimson, texto cream. Inactivo: texto cream 80%, hover fondo `rgba(255,234,202,.06)`. Abajo: card de usuario (avatar + finca + rol).
- **Header (64px, sticky, bg blanco)**: breadcrumb `Admin / [Módulo]` (izq); campana con punto de notificación, avatar+nombre+rol, botón "Salir" (der).
- **Contenido**: cada módulo abre con un encabezado (título 26px + subtítulo con conteos + botón de acción primaria a la derecha cuando aplica), luego filtros y la tabla/contenido.

---

## Componentes del admin

### StatCard (Overview)
Card blanca radius 14, padding 22. Fila: label uppercase 13px brown-55% + ícono en cuadro redondeado (9px) con fondo tinte. Número 34px brown. Pie: delta de tendencia (verde `▲` / con `▼` rojo si baja). Variante de alerta: borde amber `rgba(245,156,0,.5)`, número en `#B45309`.

### Tabla
Contenedor blanco radius 14 con `overflow:hidden` y scroll horizontal interno (`min-width` por tabla). **Importante de implementación**: header como fila + filas de datos. Header bg `#FBF6EC`, texto 12px uppercase brown-55%. Filas separadas por `border-top:1px solid rgba(135,43,19,.08)`, hover fondo `#FBF6EC`. Columnas con ancho fijo (las de dato variable como nombre usan `flex:1`). Última columna "Acciones" alineada a la derecha.
> En el prototipo las tablas se construyeron con divs flex (no `<table>`) por una limitación del runtime; en producción usá `<table>` semántica real con `<thead>/<tbody>`, respetando los mismos anchos y estilos.

### StatusBadge (pill)
Pill radius 100, Bellota 700 11px, `text-transform:capitalize`. Color según el mapa semántico de estado (arriba). Reutilizable para reservas, pedidos y stock.

### Toggle (switch)
42×24px, radius 100. ON: fondo verde `#1F8A5B`, perilla blanca 18px a la derecha. OFF: fondo `rgba(135,43,19,.2)`, perilla a la izquierda. Usado para "Destacada" (featured) en Experiencias y en el form.

### Botones
- **Primary**: crimson, texto cream, radius 8 — acciones principales ("+ Nueva experiencia", "Guardar", "Aplicar").
- **Secondary (outline orange)**: borde+texto orange — "Editar", "Detalle", "Ver detalle".
- **Ghost (outline brown-25%)**: texto brown-55% — acciones destructivas/secundarias ("Archivar", "Eliminar", "Cancelar").
- **Botón de tabla**: versiones compactas (font 12px, padding `6px 12px`).

### Input / Select / Textarea
Fondo `#FBF6EC` (o blanco en filtros sobre fondo claro), borde `1.5px rgba(135,43,19,.25)`, radius 6–8. `select` con chevron SVG custom. Input numérico de stock: 60px, centrado, color/fondo según nivel (normal / amber si <5 / gris si 0).

### Filtros
Fila de **pills** (activo crimson/cream, inactivo blanco con borde brown). Para fechas: dos `input[type=date]` con separador `→`. Para orden: un `select`.

### Drawer de detalle (Reserva / Pedido)
Panel lateral derecho (420–440px), entra desde la derecha sobre overlay `rgba(92,29,13,.4)`. Header bg brown con label gold + nombre/ID + badge de estado. Cuerpo: campos en grupos (label uppercase 12px + valor), separadores, y acciones al pie (Reserva: Confirmar/Cancelar; Pedido: select de estado + Aplicar). Cierra con ✕ o clic en overlay.

### Modal de CRUD (Experiencia)
Modal centrado (560px) sobre overlay. Header con título + ✕. Cuerpo: campos del formulario (nombre, descripción, precio/duración/capacidad en fila, dropzone de imagen, toggle "Destacar"). Footer con Cancelar (ghost) + Guardar (primary). Mismo patrón sirve para crear Producto.

### Gráfica (Overview)
Barras verticales simples (CSS, sin librería en el proto): barra con gradiente `#D51312→#EA5B0C`, valor arriba, label de semana abajo, altura proporcional al máximo. En producción usar una lib de charts (Recharts/Chart.js) respetando estos colores.

---

## Módulos / Pantallas

### 1. Overview  `/admin`
Saludo + selector de mes. **4 StatCards**: Reservas del mes, Pedidos del mes, Ingresos estimados, Stock bajo (variante alerta). **Gráfica** de reservas por semana (8 barras). **Dos listas** lado a lado: Últimas 5 reservas y Últimos 5 pedidos (fila compacta: nombre/id + meta + monto/fecha + StatusBadge), cada una con link "Ver todas/todos →" al módulo.

### 2. Reservas  `/admin/reservas`
Encabezado con conteo. **Filtros**: select de experiencia + rango de fechas (date → date) + pills de estado (Todas/Pendientes/Confirmadas). **Tabla**: Fecha · Experiencia · Visitante · Personas · Estado (badge) · Acciones. **Acción inline**: `select` "Cambiar estado" (Confirmar/Cancelar) + botón "Detalle". **Detalle** abre drawer con experiencia, fecha, personas, contacto (tel + email) y notas, con botones Confirmar / Cancelar reserva.

### 3. Experiencias  `/admin/experiencias`
Encabezado + "+ Nueva experiencia" (abre modal). **Tabla**: thumbnail + nombre · Precio · Duración · Capacidad · **Destacada** (toggle inline para featured) · Acciones (Editar / Archivar). El **modal CRUD** crea/edita: nombre, descripción, precio, duración, capacidad, imagen (dropzone) y toggle de destacar.

### 4. Productos  `/admin/productos`
Encabezado (con conteo de stock bajo en `#B45309`) + "+ Nuevo producto". **Filtros** por categoría (pills: Todos/Cacao/Chocolates/Kits). **Tabla**: nombre · Categoría (chip) · Precio · **Stock editable inline** (input numérico; `<5` → fondo amber + ⚠️; `0` → chip "Agotado") · Acciones (Editar / Eliminar). Nota al pie explicando la edición inline.

### 5. Pedidos  `/admin/pedidos`
Encabezado + filtros de estado (pills: Todos/Pendientes/Enviados/Entregados). **Tabla**: # Pedido · Fecha · Cliente · Items · Total · Estado (badge) · "Ver detalle". El **detalle** abre drawer con fecha, dirección de envío, lista de items (thumbnail + nombre + cantidad + precio), total, y `select` de cambio de estado + Aplicar.

### 6. Configuración  `/admin/config`  *(v2 — marcada "Próximamente")*
Formulario de info general: datos del sitio (nombre, email, teléfono) y redes sociales (Instagram, WhatsApp), con botón Guardar.

---

## Gestión de estado / datos (sugerida)

Entidades y campos que el backend debe exponer (derivados del prototipo):

- **Reserva**: `fecha`, `experienciaId`, `visitante`, `personas`, `estado` (pendiente|confirmada|cancelada), `telefono`, `email`, `notas`.
- **Experiencia**: `nombre`, `descripcion`, `precio`, `duracion`, `capacidad`, `destacada` (bool), `imagen`, `archivada` (bool).
- **Producto**: `nombre`, `categoria` (Cacao|Chocolates|Kits), `precio`, `stock` (int).
- **Pedido**: `id`, `fecha`, `cliente`, `items[]` ({nombre, cantidad, precio}), `total`, `estado` (pendiente|enviado|entregado|cancelado), `direccion`.
- **Overview**: métricas agregadas del mes + serie de reservas por semana + las 5 más recientes de reservas y pedidos.

Acciones: cambiar estado de reserva/pedido (inline y desde drawer), CRUD de experiencias y productos, edición inline de stock, toggle de destacada. Considerar paginación/búsqueda en las tablas a futuro.

> Las experiencias y productos del admin son **las mismas entidades** que consume el sitio público — compartir el modelo de datos y la API. Cambiar "destacada" o stock acá debe reflejarse en el front-end.

---

## Responsive

Diseñado para desktop (uso de escritorio del negocio). Para pantallas chicas: la sidebar colapsa a un menú (hamburguesa / off-canvas), las tablas mantienen scroll horizontal (ya previsto con `min-width` + contenedor scrolleable), y los drawers/modales pasan a ancho casi completo (`max-width:92vw` ya aplicado en el proto).

---

## Archivos en este bundle

- `Admin Vuelo Carmesi.dc.html` — prototipo navegable del panel (sidebar → 6 módulos; drawers y modal interactivos).
- `fonts/` — Honey Lips (solo logo) + Bellota (Bold/Regular).
- `screenshots/` — referencia visual de cada módulo y de los estados de detalle/form.
- `README.md` — este documento.

| Screenshot | Pantalla |
|------------|----------|
| `01-overview.png` | Overview (métricas + gráfica + recientes) |
| `02-reservas.png` | Reservas (tabla + filtros) |
| `03-reserva-detalle.png` | Drawer de detalle de reserva |
| `04-experiencias.png` | Experiencias (tabla + toggle featured) |
| `05-experiencia-form.png` | Modal de CRUD de experiencia |
| `06-productos.png` | Productos (stock inline + alerta) |
| `07-pedidos.png` | Pedidos (tabla) |
| `08-pedido-detalle.png` | Drawer de detalle de pedido |
| `09-configuracion.png` | Configuración (v2) |

---

## Stack y estructura sugerida

> Respetá el stack del proyecto base si ya existe (idealmente el mismo del sitio público). Punto de partida si arrancás de cero:

- **Framework**: el mismo del front público (p. ej. Next.js + React + TS), bajo una ruta `/admin` protegida por autenticación.
- **Tablas**: `<table>` semántica + un componente `DataTable` reutilizable; a futuro TanStack Table para sort/paginación/filtros.
- **Estado de servidor**: React Query / SWR para fetch + mutaciones (cambiar estado, CRUD, stock).
- **Gráficas**: Recharts o Chart.js con los colores de marca.
- **Tokens compartidos**: reutilizar el `tokens.css` del sitio público y **extenderlo** con los colores semánticos de estado (verde/azul/alerta) — un solo origen de verdad para ambas apps.

```
src/
├─ app/admin/
│  ├─ layout.tsx                 # Sidebar + Header + guard de auth
│  ├─ page.tsx                   # Overview
│  ├─ reservas/page.tsx
│  ├─ experiencias/page.tsx
│  ├─ productos/page.tsx
│  ├─ pedidos/page.tsx
│  └─ config/page.tsx
├─ components/admin/
│  ├─ Sidebar.tsx · Header.tsx
│  ├─ StatCard.tsx · DataTable.tsx · StatusBadge.tsx · Toggle.tsx
│  ├─ Drawer.tsx                 # detalle de reserva / pedido
│  ├─ ExperienciaFormModal.tsx · ProductoFormModal.tsx
│  └─ ReservasChart.tsx
├─ lib/admin/                    # fetchers + mutaciones por entidad
└─ styles/tokens.css             # compartido con el sitio público (+ estados)
```

### Orden de implementación
1. Tokens (extender con estados) + layout (Sidebar + Header + guard).
2. Componentes base: StatCard, DataTable, StatusBadge, Toggle, Drawer, Modal.
3. Módulos por orden de valor: **Reservas** y **Pedidos** (operación diaria) → **Productos** (stock) → **Experiencias** (CRUD) → **Overview** (depende de datos de los demás) → **Configuración** (v2).
4. Conexión a la API + estados de carga/vacío/error en cada tabla.
