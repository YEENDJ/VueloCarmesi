# Spec: Cache invalidation on-demand via Server Actions y cache tags

**Fecha:** 2026-06-29
**Estado:** Aprobado

---

## Problema

Las páginas públicas de Vuelo Carmesí usan ISR (Incremental Static Regeneration) con `revalidate: 60` o `revalidate: 300`. Cuando el admin modifica una experiencia, un producto o la configuración del sitio, el cambio tarda hasta 60–300 segundos en reflejarse en el sitio público.

---

## Objetivo

Que los cambios del admin se reflejen en el sitio público de forma inmediata (< 2 segundos) sin reemplazar el sistema de caché existente.

---

## Solución

Cache tags en cada `fetch()` + Server Actions que llaman `revalidateTag()` tras cada mutación exitosa en el admin.

---

## Cambios

### 1. Tags en los helpers de API (`front/lib/api/`)

Cada `fetch()` recibe un campo `tags` dentro de `next: {}`:

**`front/lib/api/experiencias.ts`** — todos los fetches existentes:
- `getExperiencias()` → `tags: ['experiencias']`
- `getExperienciaBySlug(slug)` → `tags: ['experiencias']`
- `getExperienciasDestacadas()` → `tags: ['experiencias']`

**`front/lib/api/productos.ts`**:
- `getProductos()` → `tags: ['productos']`
- `getProductoBySlug(slug)` → `tags: ['productos']`

**`front/lib/api/site-config.ts`**:
- `getSiteConfig()` → `tags: ['site-config']`

El `revalidate` existente no cambia — sigue siendo la red de seguridad si la revalidación on-demand falla.

### 2. Server Actions (`front/app/actions/revalidate.ts`)

Archivo nuevo con directiva `'use server'`:

```typescript
'use server'
import { revalidateTag } from 'next/cache'

export async function revalidateExperiencias() {
  revalidateTag('experiencias')
}

export async function revalidateProductos() {
  revalidateTag('productos')
}

export async function revalidateSiteConfig() {
  revalidateTag('site-config')
}
```

Corre en el servidor — sin secret keys, sin HTTP extra, sin variables de entorno adicionales.

### 3. Llamadas desde los componentes admin

Cada función de mutación existente agrega un `await` a la server action correspondiente **después** del éxito:

**`front/app/admin/(protected)/experiencias/page.tsx`**
- `toggleDestacada` → `revalidateExperiencias()` tras `updateExperiencia()`
- `handleSave` (crear/editar) → `revalidateExperiencias()` tras `createExperiencia()` / `updateExperiencia()`
- `handleDelete` (confirmar modal) → `revalidateExperiencias()` tras `deleteExperiencia()`

**`front/app/admin/(protected)/productos/page.tsx`**
- `handleDelete` → `revalidateProductos()` tras `deleteProducto()`
- `handleSave` (crear/editar) → `revalidateProductos()` tras create/update

**`front/app/admin/(protected)/config/page.tsx` (o equivalente)**
- `handleSave` → `revalidateSiteConfig()` tras `updateSiteConfig()`

**Reservas:** cambios de estado no afectan páginas públicas — sin revalidación.

---

## Comportamiento esperado

| Acción en admin | Caché invalidado | Páginas actualizadas |
|---|---|---|
| Toggle destacada en experiencia | `'experiencias'` | `/`, `/experiencias`, `/experiencias/[slug]`, `/reservar/[slug]` |
| Editar / eliminar experiencia | `'experiencias'` | ídem |
| Editar / eliminar producto | `'productos'` | `/tienda`, `/tienda/[slug]` |
| Guardar site config | `'site-config'` | `/` |
| Cambiar estado de reserva | — | (ninguna) |

---

## Fuera de alcance

- Auth/secret en el endpoint de revalidación (no hay route handler, Server Actions son server-only por diseño)
- Revalidación granular por slug individual (se invalida toda la entidad — correcto para MVP)
- Feedback visual en el admin ("caché limpiado") — el guardado exitoso existente es suficiente
