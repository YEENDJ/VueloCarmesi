# Spec: Páginas de Detalle — Experiencia y Producto

**Fecha:** 2026-06-23
**Proyecto:** Vuelo Carmesí
**Alcance:** Rediseño de `/experiencias/[slug]` y `/tienda/[slug]` para alinearlos con el design handoff.

---

## Contexto

Ambas páginas existen como MVPs mínimos que no reflejan el design handoff. La estructura de rutas, el sistema de diseño (tokens CSS, componentes base) y el mock data ya están establecidos. Esta spec cubre el rediseño completo de las dos páginas y los nuevos componentes compartidos necesarios.

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Inline styles + CSS custom properties  
**Sin** Tailwind ni UI library externa.

---

## Approach

**Opción C — Híbrido**: Extraer solo los primitivos genuinamente reutilizables (`ImageGallery`, `QuantitySelector`) y componer el layout directamente en los `page.tsx`. Sin abstracciones de componente por página completa.

---

## 1. Nuevos componentes compartidos

### `front/components/ui/ImageGallery.tsx`

**Props:**
```ts
interface ImageGalleryProps {
  images: string[]
  alt: string
  aspectRatio?: '1/1' | '4/3'  // default '1/1'
}
```

**Comportamiento:**
- Estado interno `activeIndex: number` (useState, default 0)
- Imagen principal: aspect-ratio según prop, `object-fit: cover`, `border-radius: 8px`
- Thumbnails: hasta 4, 64×64px, `border-radius: 6px`, borde `2px solid transparent`; activo: borde `var(--color-crimson)`
- Si `images.length <= 1`: no renderiza thumbnails
- Si `images` vacío: renderiza un div placeholder con fondo `var(--color-cream)` y borde punteado

**Responsive:** thumbnails ocultos en mobile (`@media (max-width: 767px)`)

---

### `front/components/ui/QuantitySelector.tsx`

**Props:**
```ts
interface QuantitySelectorProps {
  value: number
  onChange: (n: number) => void
  min?: number  // default 1
  max?: number  // default Infinity
}
```

**Comportamiento:**
- Tres elementos en fila: botón `−`, número centrado, botón `+`
- Botón `−` deshabilitado si `value === min`: opacity 0.4, cursor not-allowed
- Botón `+` deshabilitado si `value === max`: opacity 0.4, cursor not-allowed
- Estilos: borde `1px solid var(--color-brown)`, border-radius 6px, padding 8px 16px

---

## 2. Mock data — extensiones necesarias

### `front/lib/api/experiencias.ts`
Agregar a cada experiencia del mock:
```ts
images: string[]   // array de 4 URLs placeholder (ej: Unsplash estáticas o /placeholder-N.jpg)
incluye: string[]  // ["Guía bilingüe", "Traslado", ...]  — si no existe
queTraer: string[] // ["Ropa cómoda", "Protector solar", ...]  — si no existe
```
Los tipos en `lib/types/index.ts` deben reflejar estos campos como opcionales (`images?: string[]`) para no romper el resto del codebase.

### `front/lib/api/productos.ts`
Agregar a cada producto:
```ts
images: string[]    // array de 4 URLs placeholder
categoria: string   // para filtrar productos relacionados (verificar si ya existe en el tipo; si sí, no duplicar)
```

---

## 3. Página Detalle de Experiencia — `/experiencias/[slug]`

**Archivo:** `front/app/(booking)/experiencias/[slug]/page.tsx`  
**Tipo:** Server Component (no cambiar, ya es server component)

### 3.1 Hero

| Propiedad | Desktop | Mobile |
|-----------|---------|--------|
| Altura | 480px | 300px |
| Imagen | `experiencia.images[0]` como `background-image` | igual |
| Overlay | `rgba(0,0,0,0.45)` | igual |
| Título | H1 Honey Lips 56px cream centrado | 36px |
| Badge | Absolute top-right: `"Disponible"` (amber) / `"Agotado"` (brown) | igual |

### 3.2 Layout principal

Contenedor max-width 1200px, margin auto, padding 48px 24px.  
**Desktop:** `display: grid; grid-template-columns: 65fr 35fr; gap: 48px`  
**Mobile:** `grid-template-columns: 1fr` (sidebar pasa debajo)

### 3.3 Columna izquierda — contenido

```
[H2 crimson] Sobre esta experiencia
[p brown]    experiencia.descripcion

[H3 brown]   ¿Qué incluye?
[list]        ✓ amber  ·  cada ítem de experiencia.incluye[]

[H3 brown]   ¿Qué traer?
[list]        • brown  ·  cada ítem de experiencia.queTraer[]

[separador gold]

[ImageGallery images={experiencia.images} alt={experiencia.nombre} aspectRatio="4/3"]
```

### 3.4 Columna derecha — sidebar sticky

`position: sticky; top: 88px` (88px = altura del navbar)

```
Card (cream bg, border brown/10, border-radius 12px, padding 28px):
  [span amber 32px Bellota Bold]  ${ experiencia.precio }
  [fila]  ⏱ { experiencia.duracion }   👥 { experiencia.capacidad } personas   // verificar que estos campos existen en el tipo; agregar al mock si faltan
  [separador gold]
  [Button variant=primary full-width]  "Reservar ahora"  → href="/reservar/[slug]"
  [caption 12px brown/60]  "Sin compromiso · Cancelación flexible"
```

**Mobile:** `position: static`, ocupa 100% ancho.

---

## 4. Página Detalle de Producto — `/tienda/[slug]`

**Archivo:** `front/app/(shop)/tienda/[slug]/page.tsx`  
**Cambio de tipo:** Convertir de Client Component (`"use client"`) a **Server Component**. Los `params` se reciben como prop directamente. El `useCarrito` se mueve a un subcomponente client `AddToCartSection`.

### 4.1 Layout principal

Contenedor max-width 1200px, padding 48px 24px.  
**Desktop:** `display: grid; grid-template-columns: 55fr 45fr; gap: 64px`  
**Mobile:** `grid-template-columns: 1fr`

### 4.2 Columna izquierda — galería

```
<ImageGallery
  images={producto.images}
  alt={producto.nombre}
  aspectRatio="1/1"
/>
```

### 4.3 Columna derecha — info y acciones

```
[Badge categoria]
[H1 Honey Lips 40px/28px brown]  producto.nombre
[span amber 32px]                $ producto.precio
[p brown 16px]                   producto.descripcion
[separador gold]

// Client subcomponent "AddToCartSection":
[QuantitySelector value min=1 max=producto.stock]
[caption 14px brown/60]  "{ producto.stock } unidades disponibles"
[Button variant=primary large full-width]  "Agregar al carrito"
  → llama useCarrito.agregarItem({ producto, cantidad })
  → si stock === 0: disabled, caption "Sin stock disponible"
```

### 4.4 Sección productos relacionados

Debajo del layout principal, full-width:

```
[separador gold]
[H2 crimson]  "También te puede gustar"

[Grid 4 cols / 2 cols mobile]
  ProductoCard × máximo 4
  Filtro: misma categoria, excluir slug actual
```

Lógica de filtrado en el Server Component (sin estado, sin fetch adicional — reutiliza `getProductos()`).

---

## 5. Responsividad — breakpoints

| Elemento | Desktop (≥1024px) | Mobile (<768px) |
|----------|-------------------|-----------------|
| Hero experiencia | 480px | 300px |
| H1 hero | 56px | 36px |
| Layout grids | 2 columnas | 1 columna |
| Sidebar experiencia | sticky | static, abajo |
| H1 producto | 40px | 28px |
| Thumbnails galería | visibles | ocultos |
| Related products grid | 4 columnas | 2 columnas |

---

## 6. Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| CREAR | `front/components/ui/ImageGallery.tsx` |
| CREAR | `front/components/ui/QuantitySelector.tsx` |
| CREAR | `front/app/(shop)/tienda/[slug]/AddToCartSection.tsx` (client subcomponent) |
| MODIFICAR | `front/lib/types/index.ts` — agregar `images`, `incluye`, `queTraer` a tipos |
| MODIFICAR | `front/lib/api/experiencias.ts` — ampliar mock con campos nuevos |
| MODIFICAR | `front/lib/api/productos.ts` — ampliar mock con `images` |
| REESCRIBIR | `front/app/(booking)/experiencias/[slug]/page.tsx` |
| REESCRIBIR | `front/app/(shop)/tienda/[slug]/page.tsx` |

---

## 7. Fuera de alcance

- Animaciones de hover en cards (Card lift, Button transitions) — mejora separada
- Swipe gesture en galería mobile — puede agregarse después con un hook
- Integración con API real (se usa el mismo patrón mock → API que el resto del proyecto)
- Tests automatizados de las páginas nuevas
