# Cache Invalidation On-Demand — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que los cambios del admin (experiencias, productos, site-config) se reflejen en el sitio público de forma inmediata usando cache tags de Next.js e Server Actions.

**Architecture:** Cada `fetch()` en `lib/api/` recibe un `tag` nombrado por entidad. Un archivo de Server Actions (`app/actions/revalidate.ts`) llama `revalidateTag()` para cada entidad. Los componentes admin importan y `await` la server action correspondiente después de cada mutación exitosa.

**Tech Stack:** Next.js 15 App Router, `revalidateTag` de `next/cache`, Server Actions (`'use server'`).

## Global Constraints

- Solo tocar los archivos listados en cada tarea — sin refactoring adicional
- Server Actions: directiva `'use server'` al tope del archivo, sin lógica extra
- Los `revalidate` numéricos existentes NO se modifican — siguen siendo fallback
- Commits en español con prefijo `feat:`
- Verificación de tipos: `cd front && npx tsc --noEmit` sin errores

---

### Task 1: Cache tags en fetches y Server Actions

**Files:**
- Modify: `front/lib/api/experiencias.ts:61,71,81`
- Modify: `front/lib/api/productos.ts:43,53`
- Modify: `front/lib/api/site-config.ts:5`
- Create: `front/app/actions/revalidate.ts`

**Interfaces:**
- Produces:
  - `revalidateExperiencias(): Promise<void>` — invalidar tag `'experiencias'`
  - `revalidateProductos(): Promise<void>` — invalidar tag `'productos'`
  - `revalidateSiteConfig(): Promise<void>` — invalidar tag `'site-config'`

- [ ] **Step 1: Agregar tags en `front/lib/api/experiencias.ts`**

Los tres fetches quedan así (solo se agrega `tags` dentro de `next: {}`):

```typescript
// getExperiencias — línea 61
const res = await fetch(`${BASE}/experiencias`, { next: { revalidate: 60, tags: ['experiencias'] } })

// getExperienciaBySlug — línea 71
const res = await fetch(`${BASE}/experiencias/slug/${slug}`, { next: { revalidate: 60, tags: ['experiencias'] } })

// getExperienciasDestacadas — línea 81
const res = await fetch(`${BASE}/experiencias?destacadas=true`, { next: { revalidate: 60, tags: ['experiencias'] } })
```

- [ ] **Step 2: Agregar tags en `front/lib/api/productos.ts`**

```typescript
// getProductos — línea 43
const res = await fetch(`${BASE}/productos`, { next: { revalidate: 60, tags: ['productos'] } })

// getProductoBySlug — línea 53
const res = await fetch(`${BASE}/productos/slug/${slug}`, { next: { revalidate: 60, tags: ['productos'] } })
```

- [ ] **Step 3: Agregar tag en `front/lib/api/site-config.ts`**

```typescript
// getSiteConfig — línea 5
const res = await fetch(`${BASE}/site-config`, { next: { revalidate: 300, tags: ['site-config'] } })
```

- [ ] **Step 4: Crear `front/app/actions/revalidate.ts`**

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

- [ ] **Step 5: Verificar tipos**

```bash
cd front && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sin errores.

- [ ] **Step 6: Commit**

```bash
git add front/lib/api/experiencias.ts front/lib/api/productos.ts front/lib/api/site-config.ts front/app/actions/revalidate.ts
git commit -m "feat: cache tags en fetches + Server Actions de revalidación on-demand"
```

---

### Task 2: Revalidación en admin de Experiencias

**Files:**
- Modify: `front/app/admin/(protected)/experiencias/page.tsx`

**Interfaces:**
- Consumes: `revalidateExperiencias(): Promise<void>` (Task 1)

Funciones a modificar:
- `toggleDestacada` — tras `updateExperiencia`
- `archivar` — tras `updateExperiencia`
- `restaurar` — tras `updateExperiencia`
- `eliminar` — tras `deleteExperiencia` (dentro del `try`)
- `handleSaved` — convertir a `async`, llamar tras `setModal(undefined)`

- [ ] **Step 1: Agregar el import de la server action**

En la línea 1 del archivo (después de `'use client'`), agregar el import:

```typescript
import { revalidateExperiencias } from '@/app/actions/revalidate'
```

- [ ] **Step 2: Modificar `toggleDestacada`**

```typescript
async function toggleDestacada(exp: AdminExperiencia) {
  setTogglingId(exp.id)
  const updated = await updateExperiencia(exp.id, { destacada: !exp.destacada })
  setExperiencias(prev => prev.map(e => e.id === updated.id ? updated : e))
  setTogglingId(null)
  await revalidateExperiencias()
}
```

- [ ] **Step 3: Modificar `archivar`**

```typescript
async function archivar(exp: AdminExperiencia) {
  if (!confirm(`¿Archivar "${exp.nombre}"? Dejará de aparecer en el sitio.`)) return
  const updated = await updateExperiencia(exp.id, { archivada: true })
  setExperiencias(prev => prev.map(e => e.id === updated.id ? updated : e))
  await revalidateExperiencias()
}
```

- [ ] **Step 4: Modificar `restaurar`**

```typescript
async function restaurar(exp: AdminExperiencia) {
  const updated = await updateExperiencia(exp.id, { archivada: false })
  setExperiencias(prev => prev.map(e => e.id === updated.id ? updated : e))
  await revalidateExperiencias()
}
```

- [ ] **Step 5: Modificar `eliminar`**

```typescript
async function eliminar() {
  if (!experienciaAEliminar) return
  try {
    await deleteExperiencia(experienciaAEliminar.id)
    setExperiencias(prev => prev.filter(e => e.id !== experienciaAEliminar.id))
    await revalidateExperiencias()
  } finally {
    setExperienciaAEliminar(null)
  }
}
```

- [ ] **Step 6: Modificar `handleSaved`**

```typescript
async function handleSaved(saved: AdminExperiencia) {
  setExperiencias(prev => {
    const idx = prev.findIndex(e => e.id === saved.id)
    return idx >= 0 ? prev.map(e => e.id === saved.id ? saved : e) : [saved, ...prev]
  })
  setModal(undefined)
  await revalidateExperiencias()
}
```

- [ ] **Step 7: Verificar tipos**

```bash
cd front && npx tsc --noEmit 2>&1 | grep experiencias
```

Esperado: sin errores.

- [ ] **Step 8: Commit**

```bash
git add "front/app/admin/(protected)/experiencias/page.tsx"
git commit -m "feat: revalidar caché de experiencias tras mutaciones en admin"
```

---

### Task 3: Revalidación en admin de Productos

**Files:**
- Modify: `front/app/admin/(protected)/productos/page.tsx`

**Interfaces:**
- Consumes: `revalidateProductos(): Promise<void>` (Task 1)

Funciones a modificar:
- `guardarStock` — tras `updateProducto`
- `confirmarEliminar` — dentro del `try` tras `deleteProducto`
- Callback `onSaved` del `ProductoFormModal` — convertir a async

- [ ] **Step 1: Agregar el import**

```typescript
import { revalidateProductos } from '@/app/actions/revalidate'
```

- [ ] **Step 2: Modificar `guardarStock`**

```typescript
async function guardarStock(id: string) {
  const newStock = stockEdit[id]
  if (newStock === undefined) return
  setSavingStock(id)
  const updated = await updateProducto(id, { stock: newStock })
  setProductos(prev => prev.map(p => p.id === updated.id ? updated : p))
  setStockEdit(prev => { const n = { ...prev }; delete n[id]; return n })
  setSavingStock(null)
  await revalidateProductos()
}
```

- [ ] **Step 3: Modificar `confirmarEliminar`**

```typescript
async function confirmarEliminar() {
  if (!productoAEliminar) return
  try {
    await deleteProducto(productoAEliminar.id)
    setProductos(prev => prev.filter(p => p.id !== productoAEliminar.id))
    await revalidateProductos()
  } finally {
    setProductoAEliminar(null)
  }
}
```

- [ ] **Step 4: Modificar el callback `onSaved` del modal**

```typescript
onSaved={async saved => {
  setProductos(prev => {
    const idx = prev.findIndex(p => p.id === saved.id)
    return idx >= 0 ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]
  })
  setModal(undefined)
  await revalidateProductos()
}}
```

- [ ] **Step 5: Verificar tipos**

```bash
cd front && npx tsc --noEmit 2>&1 | grep productos
```

Esperado: sin errores.

- [ ] **Step 6: Commit**

```bash
git add "front/app/admin/(protected)/productos/page.tsx"
git commit -m "feat: revalidar caché de productos tras mutaciones en admin"
```

---

### Task 4: Revalidación en admin de Config

**Files:**
- Modify: `front/app/admin/(protected)/config/page.tsx`

**Interfaces:**
- Consumes: `revalidateSiteConfig(): Promise<void>` (Task 1)

Función a modificar:
- `guardar` — agregar `await revalidateSiteConfig()` dentro del `try`, tras `await patchSiteConfig(data)`

- [ ] **Step 1: Agregar el import**

```typescript
import { revalidateSiteConfig } from '@/app/actions/revalidate'
```

- [ ] **Step 2: Modificar `guardar`**

```typescript
async function guardar(keys: string[]) {
  const sección = keys[0].replace('_', ' ')
  setSaving(sección)
  try {
    const data = Object.fromEntries(keys.map(k => [k, config[k] ?? '']))
    await patchSiteConfig(data)
    await revalidateSiteConfig()
    setToast('Guardado correctamente')
    setTimeout(() => setToast(''), 3000)
  } catch {
    setToast('Error al guardar')
    setTimeout(() => setToast(''), 3000)
  } finally {
    setSaving(null)
  }
}
```

- [ ] **Step 3: Verificar tipos y build final**

```bash
cd front && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add "front/app/admin/(protected)/config/page.tsx"
git commit -m "feat: revalidar caché de site-config tras guardar en admin"
```
