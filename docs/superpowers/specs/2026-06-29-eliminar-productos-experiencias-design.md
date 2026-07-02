# Spec: Eliminar productos y experiencias con modal de confirmación

**Fecha:** 2026-06-29  
**Estado:** Aprobado

---

## Contexto

El admin dashboard de Vuelo Carmesí tiene dos secciones con gestión de contenido:

- **Productos** (`/admin/productos`): ya existe un botón "Eliminar" pero usa el `confirm()` nativo del browser — sin estilos, fuera de la UI del admin.
- **Experiencias** (`/admin/experiencias`): solo tiene archivar/restaurar (soft delete). No hay opción de eliminación definitiva en la UI, aunque el endpoint `DELETE /experiencias/:id` existe en el backend.

El backend ya expone `DELETE /productos/:id` y `DELETE /experiencias/:id` como hard delete. El API client (`front/lib/admin/api.ts`) ya tiene `deleteProducto(id)` y `deleteExperiencia(id)`.

---

## Objetivo

1. Reemplazar el `confirm()` nativo de productos por un modal de confirmación estilizado.
2. Agregar la opción de eliminar definitivamente una experiencia (manteniendo archivar/restaurar), con el mismo modal y un ícono de basura en la tabla.

---

## Diseño

### Componente `ConfirmModal`

**Archivo:** `front/components/admin/ConfirmModal.tsx`

Componente reutilizable para confirmaciones destructivas. Props:

```ts
interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string   // default: "Eliminar"
  danger?: boolean        // default: true — botón confirmar en rojo
  onConfirm: () => void
  onCancel: () => void
}
```

**Estructura visual:**

```
┌─────────────────────────────────────┐
│  ¿Eliminar "Tableta 70% cacao"?     │
│                                     │
│  Esta acción es permanente y no     │
│  se puede deshacer.                 │
│                                     │
│         [Cancelar]  [Eliminar]      │
└─────────────────────────────────────┘
```

- Overlay: `.admin-modal-overlay` (z-index: 200, existente)
- Contenedor: `.admin-modal` (560px, existente) — con `max-width: 400px` para que no sea tan ancho como los form modals
- Botón cancelar: `.btn-ghost`
- Botón confirmar: `.btn-primary` con color rojo crimson cuando `danger=true`
- Sin estado de loading — la operación es inmediata y el componente se desmonta al confirmar

### Ícono de basura

SVG inline de basura (trash), consistente con el estilo del proyecto (sin dependencia de icon library). Se usa en:
- El botón "Eliminar" de productos (agrega ícono al texto existente)
- El botón "Eliminar" nuevo en experiencias

```tsx
// Inline SVG reutilizable (dentro del mismo archivo o exportado de ConfirmModal.tsx)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)
```

---

### Cambios en `productos/page.tsx`

1. Importar `ConfirmModal` y `deleteProducto`
2. Agregar estado: `const [productoAEliminar, setProductoAEliminar] = useState<AdminProducto | null>(null)`
3. Eliminar la función `eliminar()` que usa `confirm()` y reemplazarla por:
   - Click en botón → `setProductoAEliminar(p)`
   - `onConfirm` → `await deleteProducto(productoAEliminar.id)` → filtrar estado local → `setProductoAEliminar(null)`
   - `onCancel` → `setProductoAEliminar(null)`
4. Botón en tabla: agregar `<TrashIcon />` junto al texto "Eliminar"
5. Renderizar `<ConfirmModal>` cuando `productoAEliminar !== null`

**Mensaje del modal:**
- Title: `¿Eliminar "${producto.nombre}"?`
- Message: `Esta acción es permanente y no se puede deshacer.`

---

### Cambios en `experiencias/page.tsx`

1. Importar `ConfirmModal`, `deleteExperiencia`
2. Agregar estado: `const [experienciaAEliminar, setExperienciaAEliminar] = useState<AdminExperiencia | null>(null)`
3. Agregar función `eliminar(exp)`:
   ```ts
   async function eliminar(exp: AdminExperiencia) {
     await deleteExperiencia(exp.id)
     setExperiencias(prev => prev.filter(e => e.id !== exp.id))
     setExperienciaAEliminar(null)
   }
   ```
4. **Filas activas** — agregar botón "Eliminar" con `<TrashIcon />` junto a "Editar" y "Archivar":
   ```tsx
   <button className="btn-ghost btn-sm" onClick={() => setExperienciaAEliminar(exp)}>
     <TrashIcon /> Eliminar
   </button>
   ```
5. **Filas archivadas** — agregar botón "Eliminar" con `<TrashIcon />` junto a "Restaurar"
6. Renderizar `<ConfirmModal>` cuando `experienciaAEliminar !== null`

**Mensaje del modal:**
- Title: `¿Eliminar "${experiencia.nombre}"?`
- Message: `Esta acción es permanente y no se puede deshacer. La experiencia no se podrá recuperar.`

---

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `front/components/admin/ConfirmModal.tsx` | **Nuevo** — componente reutilizable |
| `front/app/admin/(protected)/productos/page.tsx` | Reemplazar `confirm()` por `ConfirmModal` |
| `front/app/admin/(protected)/experiencias/page.tsx` | Agregar botón eliminar + `ConfirmModal` |

No se requieren cambios en backend ni en `api.ts` — los endpoints ya existen.

---

## Lo que NO cambia

- La lógica de archivar/restaurar en experiencias permanece idéntica.
- No se agrega manejo de loading/spinner — la UX actual del admin no los usa en operaciones similares.
- No se modifica el backend ni los endpoints.
- Los estilos CSS del admin no requieren nuevas clases — se usan las existentes (`.admin-modal-overlay`, `.admin-modal`, `.btn-ghost`, `.btn-primary`).
