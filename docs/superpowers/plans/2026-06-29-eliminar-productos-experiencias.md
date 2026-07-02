# Eliminar productos y experiencias — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el `confirm()` nativo en productos y agregar eliminación definitiva en experiencias, ambos con un modal de confirmación estilizado.

**Architecture:** Se crea un componente `ConfirmModal` reutilizable con un `TrashIcon` exportado. Productos reemplaza su `confirm()` por ese modal. Experiencias agrega el botón de eliminar (con ícono) en filas activas y archivadas, usando el mismo modal.

**Tech Stack:** Next.js (App Router), React 18, TypeScript, CSS clases existentes del admin (`.admin-modal-overlay`, `.admin-modal`, `.btn-ghost`, `.btn-primary`)

## Global Constraints

- No agregar librerías de iconos — usar SVG inline.
- No agregar clases CSS nuevas — usar únicamente las clases existentes en `front/app/admin/admin.css`.
- No modificar backend ni `front/lib/admin/api.ts` — los endpoints y funciones ya existen.
- No agregar estado de loading/spinner — el resto del admin no los usa en operaciones de este tipo.
- La lógica de archivar/restaurar en experiencias no cambia.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `front/components/admin/ConfirmModal.tsx` | Crear | Modal genérico de confirmación + `TrashIcon` exportado |
| `front/app/admin/(protected)/productos/page.tsx` | Modificar | Reemplazar `confirm()` por `ConfirmModal` |
| `front/app/admin/(protected)/experiencias/page.tsx` | Modificar | Agregar botón eliminar + `ConfirmModal` |

---

## Task 1: Crear `ConfirmModal.tsx`

**Files:**
- Create: `front/components/admin/ConfirmModal.tsx`

**Interfaces:**
- Produces:
  - `export const TrashIcon: () => JSX.Element`
  - `export default ConfirmModal(props: ConfirmModalProps): JSX.Element`
  - Props: `{ title: string, message: string, confirmLabel?: string, danger?: boolean, onConfirm: () => void, onCancel: () => void }`

- [ ] **Step 1: Crear el archivo**

Crear `front/components/admin/ConfirmModal.tsx` con el siguiente contenido exacto:

```tsx
'use client'

export const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Eliminar',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div
        className="admin-modal"
        style={{ maxWidth: 400 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{title}</div>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
          <button
            className="btn-primary"
            style={danger ? { background: 'var(--color-crimson)' } : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que TypeScript no reporta errores**

```bash
cd front && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sin errores en `ConfirmModal.tsx`.

- [ ] **Step 3: Commit**

```bash
git add front/components/admin/ConfirmModal.tsx
git commit -m "feat(admin): componente ConfirmModal reutilizable con TrashIcon"
```

---

## Task 2: Actualizar `productos/page.tsx`

**Files:**
- Modify: `front/app/admin/(protected)/productos/page.tsx`

**Interfaces:**
- Consumes:
  - `ConfirmModal` (default export de `@/components/admin/ConfirmModal`)
  - `TrashIcon` (named export de `@/components/admin/ConfirmModal`)
  - `deleteProducto(id: string): Promise<void>` — ya importado desde `@/lib/admin/api`
  - `AdminProducto` — ya importado desde `@/lib/admin/types`

- [ ] **Step 1: Agregar el import de `ConfirmModal` y `TrashIcon`**

En `front/app/admin/(protected)/productos/page.tsx`, reemplazar la línea de import de `ProductoFormModal`:

```tsx
// antes
import ProductoFormModal from '@/components/admin/ProductoFormModal'

// después
import ProductoFormModal from '@/components/admin/ProductoFormModal'
import ConfirmModal, { TrashIcon } from '@/components/admin/ConfirmModal'
```

- [ ] **Step 2: Agregar el estado `productoAEliminar`**

Justo debajo de la línea `const [modal, setModal] = useState<AdminProducto | null | 'new'>()`, agregar:

```tsx
const [productoAEliminar, setProductoAEliminar] = useState<AdminProducto | null>(null)
```

- [ ] **Step 3: Reemplazar la función `eliminar`**

Reemplazar la función `eliminar` existente (líneas 38-42 aprox):

```tsx
// eliminar — reemplazar esto:
async function eliminar(id: string) {
  if (!confirm('¿Eliminar este producto?')) return
  await deleteProducto(id)
  setProductos(prev => prev.filter(p => p.id !== id))
}

// por esto:
async function confirmarEliminar() {
  if (!productoAEliminar) return
  await deleteProducto(productoAEliminar.id)
  setProductos(prev => prev.filter(p => p.id !== productoAEliminar.id))
  setProductoAEliminar(null)
}
```

- [ ] **Step 4: Actualizar el botón en la tabla**

Reemplazar el botón "Eliminar" en la columna Acciones:

```tsx
// antes:
<button className="btn-ghost btn-sm" onClick={() => eliminar(p.id)}>Eliminar</button>

// después:
<button
  className="btn-ghost btn-sm"
  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
  onClick={() => setProductoAEliminar(p)}
>
  <TrashIcon /> Eliminar
</button>
```

- [ ] **Step 5: Renderizar `ConfirmModal`**

Justo antes del cierre `</>` del return (después del bloque `{modal !== undefined && <ProductoFormModal ...`), agregar:

```tsx
{productoAEliminar && (
  <ConfirmModal
    title={`¿Eliminar "${productoAEliminar.nombre}"?`}
    message="Esta acción es permanente y no se puede deshacer."
    onConfirm={confirmarEliminar}
    onCancel={() => setProductoAEliminar(null)}
  />
)}
```

- [ ] **Step 6: Verificar TypeScript**

```bash
cd front && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sin errores nuevos.

- [ ] **Step 7: Verificar manualmente en el browser**

1. Iniciar el servidor de desarrollo: `cd front && npm run dev`
2. Navegar a `/admin/productos`
3. Hacer click en "Eliminar" en cualquier producto
4. Verificar que aparece el modal estilizado (no el `confirm()` nativo del browser)
5. Verificar que "Cancelar" cierra el modal sin eliminar
6. Verificar que "Eliminar" elimina el producto y lo quita de la tabla
7. Verificar que el ícono de basura aparece junto al texto del botón

- [ ] **Step 8: Commit**

```bash
git add front/app/admin/\(protected\)/productos/page.tsx
git commit -m "feat(admin): reemplazar confirm() nativo por ConfirmModal en productos"
```

---

## Task 3: Actualizar `experiencias/page.tsx`

**Files:**
- Modify: `front/app/admin/(protected)/experiencias/page.tsx`

**Interfaces:**
- Consumes:
  - `ConfirmModal` (default export de `@/components/admin/ConfirmModal`)
  - `TrashIcon` (named export de `@/components/admin/ConfirmModal`)
  - `deleteExperiencia(id: string): Promise<void>` — en `@/lib/admin/api` (ya existe, falta importar)
  - `AdminExperiencia` — ya importado desde `@/lib/admin/types`

- [ ] **Step 1: Actualizar los imports**

Reemplazar las líneas de import en la parte superior del archivo:

```tsx
// antes:
import { getExperienciasAdmin, updateExperiencia } from '@/lib/admin/api'
import Toggle from '@/components/admin/Toggle'
import ExperienciaFormModal from '@/components/admin/ExperienciaFormModal'

// después:
import { getExperienciasAdmin, updateExperiencia, deleteExperiencia } from '@/lib/admin/api'
import Toggle from '@/components/admin/Toggle'
import ExperienciaFormModal from '@/components/admin/ExperienciaFormModal'
import ConfirmModal, { TrashIcon } from '@/components/admin/ConfirmModal'
```

- [ ] **Step 2: Agregar el estado `experienciaAEliminar`**

Justo debajo de la línea `const [togglingId, setTogglingId] = useState<string | null>(null)`, agregar:

```tsx
const [experienciaAEliminar, setExperienciaAEliminar] = useState<AdminExperiencia | null>(null)
```

- [ ] **Step 3: Agregar la función `eliminar`**

Agregar después de la función `restaurar`:

```tsx
async function eliminar() {
  if (!experienciaAEliminar) return
  await deleteExperiencia(experienciaAEliminar.id)
  setExperiencias(prev => prev.filter(e => e.id !== experienciaAEliminar.id))
  setExperienciaAEliminar(null)
}
```

- [ ] **Step 4: Actualizar los botones de filas activas**

Reemplazar el bloque de acciones en filas activas (el `<td>` con "Editar" y "Archivar"):

```tsx
// antes:
<td style={{ textAlign: 'right' }}>
  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
    <button className="btn-secondary btn-sm" onClick={() => setModal(exp)}>Editar</button>
    <button className="btn-ghost btn-sm" onClick={() => archivar(exp)}>Archivar</button>
  </div>
</td>

// después:
<td style={{ textAlign: 'right' }}>
  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
    <button className="btn-secondary btn-sm" onClick={() => setModal(exp)}>Editar</button>
    <button className="btn-ghost btn-sm" onClick={() => archivar(exp)}>Archivar</button>
    <button
      className="btn-ghost btn-sm"
      style={{ display: 'flex', alignItems: 'center', gap: 5 }}
      onClick={() => setExperienciaAEliminar(exp)}
    >
      <TrashIcon /> Eliminar
    </button>
  </div>
</td>
```

- [ ] **Step 5: Actualizar los botones de filas archivadas**

Reemplazar el `<td>` de acciones en la sección de archivadas:

```tsx
// antes:
<td style={{ textAlign: 'right' }}>
  <button className="btn-ghost btn-sm" onClick={() => restaurar(exp)}>
    Restaurar
  </button>
</td>

// después:
<td style={{ textAlign: 'right' }}>
  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
    <button className="btn-ghost btn-sm" onClick={() => restaurar(exp)}>Restaurar</button>
    <button
      className="btn-ghost btn-sm"
      style={{ display: 'flex', alignItems: 'center', gap: 5 }}
      onClick={() => setExperienciaAEliminar(exp)}
    >
      <TrashIcon /> Eliminar
    </button>
  </div>
</td>
```

- [ ] **Step 6: Renderizar `ConfirmModal`**

Justo antes del cierre `</>` del return (después del bloque `{modal !== undefined && <ExperienciaFormModal ...`), agregar:

```tsx
{experienciaAEliminar && (
  <ConfirmModal
    title={`¿Eliminar "${experienciaAEliminar.nombre}"?`}
    message="Esta acción es permanente y no se puede deshacer. La experiencia no se podrá recuperar."
    onConfirm={eliminar}
    onCancel={() => setExperienciaAEliminar(null)}
  />
)}
```

- [ ] **Step 7: Verificar TypeScript**

```bash
cd front && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sin errores nuevos.

- [ ] **Step 8: Verificar manualmente en el browser**

1. Navegar a `/admin/experiencias`
2. Verificar que en cada fila activa aparecen 3 botones: "Editar", "Archivar", "🗑️ Eliminar"
3. Verificar que en filas archivadas aparecen 2 botones: "Restaurar", "🗑️ Eliminar"
4. Hacer click en "Eliminar" en una experiencia activa → verificar modal con mensaje sobre recuperación
5. Verificar "Cancelar" cierra sin eliminar
6. Verificar "Eliminar" en modal elimina la experiencia definitivamente (desaparece de activas y archivadas)
7. Hacer click en "Eliminar" en una experiencia archivada → mismo flujo
8. Verificar que "Archivar" sigue funcionando igual que antes

- [ ] **Step 9: Commit**

```bash
git add front/app/admin/\(protected\)/experiencias/page.tsx
git commit -m "feat(admin): agregar eliminación definitiva de experiencias con ConfirmModal"
```
