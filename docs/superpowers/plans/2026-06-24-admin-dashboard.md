# Admin Dashboard Vuelo Carmesí — Plan de Implementación

> **Para agentes:** SKILL REQUERIDO: Usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar tarea por tarea. Los pasos usan sintaxis de checkbox (`- [ ]`) para tracking.

**Goal:** Construir el panel de administración completo de Vuelo Carmesí: 6 módulos (Overview, Reservas, Experiencias, Productos, Pedidos, Configuración) bajo `/admin`, protegido por auth, conectado al mismo backend NestJS del sitio público.

**Architecture:** El admin vive en `front/app/admin/` como un route segment separado con su propio `layout.tsx` (Sidebar + Header, sin Navbar/Footer del sitio público). Las páginas son Client Components que fetchen datos al montar. Las mutaciones van directo contra la API REST en `localhost:3001`. El root layout se refactoriza para ser un shell mínimo, moviendo Navbar/Footer a un `(public)` route group.

**Tech Stack:** Next.js 16.2.9 (App Router), React 19, TypeScript, NestJS 11, Prisma 7, PostgreSQL. CSS con variables CSS (sin Tailwind). Fuente: Bellota Bold. Sin librerías de gráficas (barras CSS puras). Sin React Query (fetch nativo en useEffect).

## Constraints Globales

- **LEER PRIMERO:** Antes de escribir cualquier código Next.js, leer `front/node_modules/next/dist/docs/` — esta versión tiene breaking changes respecto a Next.js 14.
- Backend en `http://localhost:3001`. Frontend en `http://localhost:3000`.
- Variable de entorno: `NEXT_PUBLIC_API_URL=http://localhost:3001` en `front/.env.local`.
- CSS: variables CSS desde `front/styles/tokens.css` — NO Tailwind, NO CSS modules. Inline styles con `var(--token)`.
- Fuente de trabajo del admin: `Bellota Bold (700)` para todo. No usar Honey Lips en datos.
- Idioma: español en toda la UI.
- Tablas: `<table>` semántica con `<thead>`/`<tbody>` (el prototipo usó divs, en producción usar table real).
- Referencia visual: `handoff/design_handoff_admin/Admin Vuelo Carmesi.dc.html` (abrirlo en el browser para navegar los 6 módulos, drawers y modal).

---

## Task 1: Refactorizar root layout para aislar /admin

**Archivos:**
- Modificar: `front/app/layout.tsx` — quitar Navbar/Footer, dejar solo html/body shell
- Crear: `front/app/(public)/layout.tsx` — agregar Navbar + Footer
- Mover directorio: `front/app/(booking)/` → `front/app/(public)/(booking)/`
- Mover directorio: `front/app/(landing)/` → `front/app/(public)/(landing)/`
- Mover directorio: `front/app/(shop)/` → `front/app/(public)/(shop)/`

**Interfaces:**
- Produce: root layout mínimo sin Navbar/Footer; rutas públicas intactas en sus mismas URLs (los route groups no afectan URLs)

- [ ] **Paso 1: Modificar root layout — solo html/body**

Reemplazar `front/app/layout.tsx` con:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vuelo Carmesí',
  description: 'Experiencias agroecológicas con sabor a cacao',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Paso 2: Crear `front/app/(public)/layout.tsx`**

```tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

- [ ] **Paso 3: Mover route groups al grupo (public)**

En PowerShell (desde `front/app/`):
```powershell
Move-Item "(booking)" "(public)/(booking)"
Move-Item "(landing)" "(public)/(landing)"
Move-Item "(shop)"    "(public)/(shop)"
```

- [ ] **Paso 4: Verificar que las rutas públicas siguen funcionando**

```bash
# Desde la raíz del monorepo
npm run dev:front
```

Abrir en el browser:
- `http://localhost:3000/` → landing page con Navbar y Footer ✓
- `http://localhost:3000/experiencias` → lista de experiencias ✓
- `http://localhost:3000/tienda` → tienda ✓

Si algo falla, verificar que los `import` de Navbar/Footer en el nuevo `(public)/layout.tsx` resuelven correctamente.

- [ ] **Paso 5: Commit**

```bash
git add front/app/layout.tsx front/app/(public)/
git commit -m "refactor: move public Navbar/Footer to (public) group, free root layout for admin isolation"
```

---

## Task 2: Back-end — agregar campos `estado` y `archivada`

El schema Prisma actual no tiene `estado` en `Reserva` ni en `Pedido`, ni `archivada` en `Experiencia`. El admin necesita estos campos para gestionar el ciclo de vida.

**Archivos:**
- Modificar: `back/prisma/schema.prisma`
- Modificar: `back/src/reservas/dto/create-reserva.dto.ts`
- Crear: `back/src/pedidos/dto/update-pedido.dto.ts`
- Modificar: `back/src/pedidos/pedidos.controller.ts` — agregar `@Patch`
- Modificar: `back/src/pedidos/pedidos.service.ts` — agregar `update()`
- Modificar: `back/src/experiencias/dto/create-experiencia.dto.ts` — agregar `archivada`
- Modificar: `back/src/lib/types/index.ts` — actualizar tipos front (Tarea 3 también los necesita)

**Interfaces:**
- Produce: `PATCH /reservas/:id { estado }`, `PATCH /pedidos/:id { estado }`, `PATCH /experiencias/:id { archivada }`

- [ ] **Paso 1: Actualizar schema.prisma**

En `back/prisma/schema.prisma`, reemplazar los modelos `Reserva`, `Pedido` y `Experiencia`:

```prisma
model Reserva {
  id               String      @id @default(cuid())
  experienciaId    String
  experiencia      Experiencia @relation(fields: [experienciaId], references: [id])
  fecha            DateTime
  cantidadPersonas Int
  nombre           String
  email            String
  telefono         String
  notas            String?
  estado           String      @default("pendiente")
  createdAt        DateTime    @default(now())
}

model Experiencia {
  id          String    @id @default(cuid())
  slug        String    @unique
  nombre      String
  descripcion String
  duracion    String
  precio      Float
  capacidad   Int
  imagen      String    @default("")
  destacada   Boolean   @default(false)
  archivada   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  reservas    Reserva[]
}

model Pedido {
  id        String       @id @default(cuid())
  nombre    String
  email     String
  direccion String
  total     Float
  estado    String       @default("pendiente")
  createdAt DateTime     @default(now())
  items     ItemPedido[]
}
```

- [ ] **Paso 2: Correr migración**

```bash
# Desde back/
npx prisma migrate dev --name add_estado_archivada
```

Esperado: `Your database is now in sync with your schema.`

- [ ] **Paso 3: Actualizar DTO de Reserva**

En `back/src/reservas/dto/create-reserva.dto.ts`, agregar el campo opcional `estado`:

```typescript
import { IsString, IsNumber, IsDateString, IsOptional, Min, IsIn } from 'class-validator'

export class CreateReservaDto {
  @IsString() experienciaId: string
  @IsDateString() fecha: string
  @IsNumber() @Min(1) cantidadPersonas: number
  @IsString() nombre: string
  @IsString() email: string
  @IsString() telefono: string
  @IsOptional() @IsString() notas?: string
  @IsOptional() @IsIn(['pendiente', 'confirmada', 'cancelada']) estado?: string
}
```

- [ ] **Paso 4: Crear DTO de actualización de Pedido**

Crear `back/src/pedidos/dto/update-pedido.dto.ts`:

```typescript
import { IsIn } from 'class-validator'

export class UpdatePedidoDto {
  @IsIn(['pendiente', 'enviado', 'entregado', 'cancelado']) estado: string
}
```

- [ ] **Paso 5: Agregar `update()` al PedidosService**

En `back/src/pedidos/pedidos.service.ts`, agregar al final de la clase:

```typescript
async update(id: string, dto: UpdatePedidoDto) {
  await this.findById(id)
  return this.prisma.pedido.update({ where: { id }, data: { estado: dto.estado } })
}
```

Y agregar el import: `import { UpdatePedidoDto } from './dto/update-pedido.dto'`

- [ ] **Paso 6: Agregar `@Patch` al PedidosController**

En `back/src/pedidos/pedidos.controller.ts`, agregar `Patch` al import de `@nestjs/common` y agregar el método:

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { PedidosService } from './pedidos.service'
import { CreatePedidoDto } from './dto/create-pedido.dto'
import { UpdatePedidoDto } from './dto/update-pedido.dto'

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly service: PedidosService) {}

  @Get()         findAll()                                         { return this.service.findAll() }
  @Get(':id')    findOne(@Param('id') id: string)                  { return this.service.findById(id) }
  @Post()        create(@Body() dto: CreatePedidoDto)              { return this.service.create(dto) }
  @Patch(':id')  update(@Param('id') id: string, @Body() dto: UpdatePedidoDto) { return this.service.update(id, dto) }
  @Delete(':id') remove(@Param('id') id: string)                  { return this.service.remove(id) }
}
```

- [ ] **Paso 7: Actualizar DTO de Experiencia**

En `back/src/experiencias/dto/create-experiencia.dto.ts`, agregar campo opcional `archivada`:

```typescript
import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator'

export class CreateExperienciaDto {
  @IsString() slug: string
  @IsString() nombre: string
  @IsString() descripcion: string
  @IsString() duracion: string
  @IsNumber() @Min(0) precio: number
  @IsNumber() @Min(1) capacidad: number
  @IsOptional() @IsString() imagen?: string
  @IsOptional() @IsBoolean() destacada?: boolean
  @IsOptional() @IsBoolean() archivada?: boolean
}
```

- [ ] **Paso 8: Verificar back-end compilay responde**

```bash
# Desde back/
npm run start:dev
```

Probar:
```bash
curl -X PATCH http://localhost:3001/pedidos/<ID_EXISTENTE> \
  -H "Content-Type: application/json" \
  -d '{"estado":"enviado"}'
# Esperado: objeto pedido con estado: "enviado"

curl -X PATCH http://localhost:3001/reservas/<ID_EXISTENTE> \
  -H "Content-Type: application/json" \
  -d '{"estado":"confirmada"}'
# Esperado: objeto reserva con estado: "confirmada"
```

- [ ] **Paso 9: Commit**

```bash
git add back/prisma/ back/src/pedidos/ back/src/reservas/dto/ back/src/experiencias/dto/
git commit -m "feat(back): add estado to Reserva/Pedido, archivada to Experiencia, PATCH /pedidos/:id"
```

---

## Task 3: Tokens admin + layout admin + auth básica

El admin tiene su propio layout con Sidebar y Header. La auth es simple: login page con password hardcodeado en `.env`, cookie `admin_session`, middleware/guard en el layout.

**Archivos:**
- Modificar: `front/styles/tokens.css` — agregar tokens de estado y admin
- Crear: `front/app/admin/layout.tsx` — layout del admin (guard de auth + shell)
- Crear: `front/app/admin/admin.css` — estilos base del admin
- Crear: `front/components/admin/Sidebar.tsx`
- Crear: `front/components/admin/AdminHeader.tsx`
- Crear: `front/app/admin/login/page.tsx`
- Crear: `front/app/api/admin/login/route.ts`
- Crear: `front/app/api/admin/logout/route.ts`
- Modificar: `front/.env.local` — agregar `ADMIN_PASSWORD`

**Interfaces:**
- Produce: `/admin/login` funcional; navegación sidebar → 6 rutas; cookie `admin_session` usada como guard

- [ ] **Paso 1: Extender tokens.css con variables del admin**

Agregar al final de `front/styles/tokens.css`:

```css
/* Admin — colores semánticos de estado */
--admin-bg:          #FBF6EC;
--admin-surface:     #FFFFFF;
--admin-sidebar:     #872B13;
--admin-border:      rgba(135, 43, 19, 0.12);
--admin-border-row:  rgba(135, 43, 19, 0.08);
--admin-text-muted:  rgba(135, 43, 19, 0.55);
--admin-hover-row:   #FBF6EC;

--status-confirmada-bg:  rgba(31, 138, 91, 0.12);
--status-confirmada-txt: #1F8A5B;
--status-pendiente-bg:   rgba(245, 156, 0, 0.15);
--status-pendiente-txt:  #B45309;
--status-enviado-bg:     rgba(42, 111, 219, 0.12);
--status-enviado-txt:    #2A6FDB;
--status-cancelada-bg:   rgba(135, 43, 19, 0.12);
--status-cancelada-txt:  rgba(135, 43, 19, 0.6);
--status-entregado-bg:   rgba(31, 138, 91, 0.12);
--status-entregado-txt:  #1F8A5B;
--status-activa-bg:      rgba(31, 138, 91, 0.12);
--status-activa-txt:     #1F8A5B;

--stock-alert-bg:    rgba(245, 156, 0, 0.18);
--stock-alert-txt:   #B45309;
```

- [ ] **Paso 2: Agregar `ADMIN_PASSWORD` a `.env.local`**

Agregar en `front/.env.local`:
```
ADMIN_PASSWORD=vuelo2024
```

- [ ] **Paso 3: Crear API route de login**

Crear `front/app/api/admin/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', 'authenticated', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    sameSite: 'lax',
  })
  return res
}
```

- [ ] **Paso 4: Crear API route de logout**

Crear `front/app/api/admin/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.redirect(new URL('/admin/login', 'http://localhost:3000'))
  res.cookies.delete('admin_session')
  return res
}
```

- [ ] **Paso 5: Crear página de login**

Crear `front/app/admin/login/page.tsx`:

```tsx
'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Contraseña incorrecta')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--admin-bg)', fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '40px 48px',
        boxShadow: '0 2px 8px rgba(135,43,19,.06)', width: '100%', maxWidth: 380,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-crimson)' }}>
            Vuelo Carmesí
          </div>
          <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            Panel de administración
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--admin-border)',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                color: 'var(--color-brown)', background: 'var(--admin-bg)', outline: 'none',
              }}
            />
          </div>
          {error && (
            <div style={{ fontSize: 13, color: 'var(--color-crimson)', textAlign: 'center' }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'var(--color-crimson)', color: 'var(--color-cream)',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Paso 6: Crear admin.css**

Crear `front/app/admin/admin.css` (importado por el layout):

```css
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: var(--admin-bg);
  font-family: var(--font-body);
  color: var(--color-brown);
}

.admin-sidebar {
  width: 248px;
  min-width: 248px;
  background: var(--admin-sidebar);
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid var(--admin-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.admin-content {
  padding: 28px;
  flex: 1;
}

/* Nav item */
.admin-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 20px;
  color: rgba(255, 234, 202, 0.8);
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  border-radius: 0;
  cursor: pointer;
  transition: background 150ms;
  position: relative;
}
.admin-nav-item:hover { background: rgba(255, 234, 202, 0.06); }
.admin-nav-item.active { background: var(--color-crimson); color: var(--color-cream); }

/* Page header */
.admin-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}
.admin-page-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-brown);
  line-height: 1.2;
}
.admin-page-subtitle {
  font-size: 14px;
  color: var(--admin-text-muted);
  margin-top: 4px;
}

/* Table container */
.admin-table-wrap {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(135,43,19,.06);
  overflow-x: auto;
}
.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}
.admin-table thead th {
  background: var(--admin-bg);
  padding: 13px 20px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--admin-text-muted);
  white-space: nowrap;
}
.admin-table tbody td {
  padding: 13px 20px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-brown);
  border-top: 1px solid var(--admin-border-row);
}
.admin-table tbody tr:hover td { background: var(--admin-hover-row); }

/* Filtros pills */
.admin-pills { display: flex; gap: 8px; flex-wrap: wrap; }
.admin-pill {
  padding: 7px 16px; border-radius: 100px; font-size: 13px; font-weight: 700;
  cursor: pointer; border: 1.5px solid var(--admin-border); background: #fff;
  color: var(--color-brown); transition: all 150ms;
}
.admin-pill.active { background: var(--color-crimson); color: var(--color-cream); border-color: var(--color-crimson); }

/* Botones */
.btn-primary {
  padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer;
  background: var(--color-crimson); color: var(--color-cream);
  font-family: var(--font-body); font-weight: 700; font-size: 14px;
}
.btn-secondary {
  padding: 10px 18px; border-radius: 8px; cursor: pointer;
  background: transparent; border: 1.5px solid var(--color-orange); color: var(--color-orange);
  font-family: var(--font-body); font-weight: 700; font-size: 14px;
}
.btn-ghost {
  padding: 10px 18px; border-radius: 8px; cursor: pointer;
  background: transparent; border: 1.5px solid var(--admin-border); color: var(--admin-text-muted);
  font-family: var(--font-body); font-weight: 700; font-size: 14px;
}
.btn-sm { padding: 6px 12px; font-size: 12px; }

/* Input / select */
.admin-input {
  padding: 9px 12px; border-radius: 6px; border: 1.5px solid var(--admin-border);
  background: var(--admin-bg); font-family: var(--font-body); font-weight: 700;
  font-size: 14px; color: var(--color-brown); outline: none; width: 100%;
}
.admin-select {
  padding: 9px 12px; border-radius: 6px; border: 1.5px solid var(--admin-border);
  background: var(--admin-bg); font-family: var(--font-body); font-weight: 700;
  font-size: 14px; color: var(--color-brown); outline: none; cursor: pointer;
}

/* Overlay */
.admin-overlay {
  position: fixed; inset: 0; background: rgba(92,29,13,.4); z-index: 100;
  display: flex; justify-content: flex-end;
}

/* Drawer */
.admin-drawer {
  width: 440px; max-width: 92vw; background: #fff; height: 100%;
  display: flex; flex-direction: column;
  box-shadow: -8px 0 40px rgba(0,0,0,.2);
}
.admin-drawer-header {
  padding: 22px 24px; background: var(--admin-sidebar); display: flex;
  align-items: center; justify-content: space-between;
}
.admin-drawer-body { padding: 24px; flex: 1; overflow-y: auto; }
.admin-drawer-footer { padding: 20px 24px; border-top: 1px solid var(--admin-border); display: flex; gap: 12px; }

/* Modal */
.admin-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.admin-modal {
  background: #fff; border-radius: 14px; width: 560px; max-width: 92vw;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,.3);
}
.admin-modal-header {
  padding: 22px 24px; border-bottom: 1px solid var(--admin-border);
  display: flex; align-items: center; justify-content: space-between;
}
.admin-modal-body { padding: 24px; display: flex; flex-direction: column; gap: 18px; }
.admin-modal-footer {
  padding: 20px 24px; border-top: 1px solid var(--admin-border);
  display: flex; justify-content: flex-end; gap: 12px;
}

/* Field label */
.admin-field-label {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: var(--admin-text-muted); margin-bottom: 6px;
}
.admin-field-value { font-size: 14px; font-weight: 700; color: var(--color-brown); }
```

- [ ] **Paso 7: Crear Sidebar.tsx**

Crear `front/components/admin/Sidebar.tsx`:

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin',            label: 'Overview',     icon: '📊' },
  { href: '/admin/reservas',   label: 'Reservas',     icon: '📅' },
  { href: '/admin/experiencias', label: 'Experiencias', icon: '🌿' },
  { href: '/admin/productos',  label: 'Productos',    icon: '🍫' },
  { href: '/admin/pedidos',    label: 'Pedidos',      icon: '📦' },
  { href: '/admin/config',     label: 'Configuración', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,234,202,.12)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--color-gold)', lineHeight: 1.1 }}>
          Vuelo Carmesí
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,234,202,.55)', marginTop: 4, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase' }}>
          Panel de administración
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 12 }}>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav-item${isActive(item.href) ? ' active' : ''}`}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User card */}
      <div style={{
        padding: '16px 20px', borderTop: '1px solid rgba(255,234,202,.12)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: 'var(--color-crimson)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff',
        }}>A</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-cream)' }}>Admin</div>
          <div style={{ fontSize: 11, color: 'rgba(255,234,202,.6)' }}>Vuelo Carmesí</div>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Paso 8: Crear AdminHeader.tsx**

Crear `front/components/admin/AdminHeader.tsx`:

```tsx
'use client'
import { usePathname, useRouter } from 'next/navigation'

const BREADCRUMBS: Record<string, string> = {
  '/admin':               'Overview',
  '/admin/reservas':      'Reservas',
  '/admin/experiencias':  'Experiencias',
  '/admin/productos':     'Productos',
  '/admin/pedidos':       'Pedidos',
  '/admin/config':        'Configuración',
}

export default function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const section = BREADCRUMBS[pathname] ?? ''

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <header className="admin-header">
      <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 700 }}>
        Admin <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: 'var(--color-brown)' }}>{section}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-muted)' }}>Admin</div>
        <button
          onClick={handleLogout}
          style={{
            padding: '7px 14px', borderRadius: 6, border: '1.5px solid var(--admin-border)',
            background: 'transparent', cursor: 'pointer', fontSize: 12,
            fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--admin-text-muted)',
          }}
        >
          Salir
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Paso 9: Crear admin layout.tsx**

Crear `front/app/admin/layout.tsx`:

```tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import './admin.css'
import Sidebar from '@/components/admin/Sidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <AdminHeader />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  )
}
```

> **Nota:** Si la API de `cookies()` difiere en Next.js 16, consultar `front/node_modules/next/dist/docs/` — en versiones recientes puede ser `cookies()` sync o async.

- [ ] **Paso 10: Crear página stub de Overview**

Crear `front/app/admin/page.tsx` (stub temporal para verificar layout):

```tsx
export default function AdminOverviewPage() {
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Overview</div>
          <div className="admin-page-subtitle">Resumen del mes</div>
        </div>
      </div>
      <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando métricas…</p>
    </div>
  )
}
```

- [ ] **Paso 11: Verificar layout del admin**

```bash
npm run dev:front
```

- Ir a `http://localhost:3000/admin` → redirige a `/admin/login` ✓
- Ingresar password `vuelo2024` → redirige a `/admin` con Sidebar y Header ✓
- Clic en "Salir" → vuelve a `/admin/login` ✓
- Sidebar: 6 items de navegación, item activo resaltado en crimson ✓

- [ ] **Paso 12: Commit**

```bash
git add front/styles/tokens.css front/app/admin/ front/components/admin/ front/.env.local
git commit -m "feat(admin): layout con sidebar, header, auth por cookie y login page"
```

---

## Task 4: Componentes base del admin

**Archivos:**
- Crear: `front/components/admin/StatusBadge.tsx`
- Crear: `front/components/admin/Toggle.tsx`
- Crear: `front/components/admin/StatCard.tsx`
- Crear: `front/lib/admin/types.ts`
- Crear: `front/lib/admin/api.ts`

**Interfaces:**
- `StatusBadge`: `({ estado, tipo? })` → `<span>` con colores semánticos
- `Toggle`: `({ checked, onChange })` → switch 42×24px
- `StatCard`: `({ label, value, icon, delta?, alerta? })` → card de métrica
- `api.ts`: funciones tipadas para las 4 entidades

- [ ] **Paso 1: Crear tipos del admin**

Crear `front/lib/admin/types.ts`:

```typescript
export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada'
export type EstadoPedido  = 'pendiente' | 'enviado' | 'entregado' | 'cancelado'

export interface AdminReserva {
  id: string
  experienciaId: string
  fecha: string
  cantidadPersonas: number
  nombre: string
  email: string
  telefono: string
  notas?: string
  estado: EstadoReserva
  createdAt: string
  experiencia?: { id: string; nombre: string }
}

export interface AdminExperiencia {
  id: string
  slug: string
  nombre: string
  descripcion: string
  duracion: string
  precio: number
  capacidad: number
  imagen: string
  destacada: boolean
  archivada: boolean
  createdAt: string
}

export interface AdminProducto {
  id: string
  slug: string
  nombre: string
  descripcion: string
  precio: number
  stock: number
  imagen: string
  categoria: string
  createdAt: string
}

export interface ItemPedido {
  id: string
  cantidad: number
  precio: number
  producto: { id: string; nombre: string; imagen: string }
}

export interface AdminPedido {
  id: string
  nombre: string
  email: string
  direccion: string
  total: number
  estado: EstadoPedido
  createdAt: string
  items: ItemPedido[]
}

export interface OverviewData {
  reservasMes: number
  pedidosMes: number
  ingresosMes: number
  stockBajo: number
  reservasPorSemana: { semana: string; cantidad: number }[]
  ultimasReservas: AdminReserva[]
  ultimosPedidos: AdminPedido[]
}
```

- [ ] **Paso 2: Crear capa API del admin**

Crear `front/lib/admin/api.ts`:

```typescript
import type {
  AdminReserva, AdminExperiencia, AdminProducto, AdminPedido,
  EstadoReserva, EstadoPedido,
} from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ── Reservas ───────────────────────────────────────────────
export function getReservas(): Promise<AdminReserva[]> {
  return fetch(`${BASE}/reservas`).then(r => r.json())
}
export function getReserva(id: string): Promise<AdminReserva> {
  return fetch(`${BASE}/reservas/${id}`).then(r => r.json())
}
export function updateEstadoReserva(id: string, estado: EstadoReserva): Promise<AdminReserva> {
  return fetch(`${BASE}/reservas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  }).then(r => r.json())
}

// ── Experiencias ───────────────────────────────────────────
export function getExperienciasAdmin(): Promise<AdminExperiencia[]> {
  return fetch(`${BASE}/experiencias`).then(r => r.json())
}
export function createExperiencia(data: Partial<AdminExperiencia>): Promise<AdminExperiencia> {
  return fetch(`${BASE}/experiencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json())
}
export function updateExperiencia(id: string, data: Partial<AdminExperiencia>): Promise<AdminExperiencia> {
  return fetch(`${BASE}/experiencias/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json())
}
export function deleteExperiencia(id: string): Promise<void> {
  return fetch(`${BASE}/experiencias/${id}`, { method: 'DELETE' }).then(() => undefined)
}

// ── Productos ──────────────────────────────────────────────
export function getProductosAdmin(): Promise<AdminProducto[]> {
  return fetch(`${BASE}/productos`).then(r => r.json())
}
export function createProducto(data: Partial<AdminProducto>): Promise<AdminProducto> {
  return fetch(`${BASE}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json())
}
export function updateProducto(id: string, data: Partial<AdminProducto>): Promise<AdminProducto> {
  return fetch(`${BASE}/productos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json())
}
export function deleteProducto(id: string): Promise<void> {
  return fetch(`${BASE}/productos/${id}`, { method: 'DELETE' }).then(() => undefined)
}

// ── Pedidos ────────────────────────────────────────────────
export function getPedidos(): Promise<AdminPedido[]> {
  return fetch(`${BASE}/pedidos`).then(r => r.json())
}
export function getPedido(id: string): Promise<AdminPedido> {
  return fetch(`${BASE}/pedidos/${id}`).then(r => r.json())
}
export function updateEstadoPedido(id: string, estado: EstadoPedido): Promise<AdminPedido> {
  return fetch(`${BASE}/pedidos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  }).then(r => r.json())
}
```

- [ ] **Paso 3: Crear StatusBadge**

Crear `front/components/admin/StatusBadge.tsx`:

```tsx
type Estado = string

const CONFIG: Record<string, { bg: string; txt: string; label: string }> = {
  pendiente:   { bg: 'var(--status-pendiente-bg)',  txt: 'var(--status-pendiente-txt)',  label: 'Pendiente' },
  confirmada:  { bg: 'var(--status-confirmada-bg)', txt: 'var(--status-confirmada-txt)', label: 'Confirmada' },
  cancelada:   { bg: 'var(--status-cancelada-bg)',  txt: 'var(--status-cancelada-txt)',  label: 'Cancelada' },
  enviado:     { bg: 'var(--status-enviado-bg)',    txt: 'var(--status-enviado-txt)',    label: 'Enviado' },
  entregado:   { bg: 'var(--status-entregado-bg)',  txt: 'var(--status-entregado-txt)',  label: 'Entregado' },
  activa:      { bg: 'var(--status-activa-bg)',     txt: 'var(--status-activa-txt)',     label: 'Activa' },
  archivada:   { bg: 'var(--status-cancelada-bg)',  txt: 'var(--status-cancelada-txt)',  label: 'Archivada' },
}

export default function StatusBadge({ estado }: { estado: Estado }) {
  const cfg = CONFIG[estado] ?? { bg: 'var(--admin-bg)', txt: 'var(--admin-text-muted)', label: estado }
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: 100,
      background: cfg.bg,
      color: cfg.txt,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}
```

- [ ] **Paso 4: Crear Toggle**

Crear `front/components/admin/Toggle.tsx`:

```tsx
'use client'
export default function Toggle({ checked, onChange, disabled }: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 42, height: 24, borderRadius: 100, border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: checked ? '#1F8A5B' : 'rgba(135,43,19,.2)',
        position: 'relative', transition: 'background 200ms', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </button>
  )
}
```

- [ ] **Paso 5: Crear StatCard**

Crear `front/components/admin/StatCard.tsx`:

```tsx
export default function StatCard({
  label, value, icon, delta, alerta,
}: {
  label: string
  value: string | number
  icon: string
  delta?: string
  alerta?: boolean
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '22px 24px',
      boxShadow: '0 2px 8px rgba(135,43,19,.06)',
      border: alerta ? '1.5px solid rgba(245,156,0,.5)' : '1.5px solid transparent',
      flex: 1, minWidth: 180,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--admin-text-muted)' }}>
          {label}
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: alerta ? 'rgba(245,156,0,.15)' : 'rgba(213,19,18,.08)', fontSize: 16,
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        fontSize: 34, fontWeight: 700, lineHeight: 1,
        color: alerta ? '#B45309' : 'var(--color-brown)',
      }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', marginTop: 8 }}>
          {delta}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Paso 6: Verificar TypeScript**

```bash
# Desde front/
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Paso 7: Commit**

```bash
git add front/lib/admin/ front/components/admin/
git commit -m "feat(admin): tipos, capa API, StatusBadge, Toggle, StatCard"
```

---

## Task 5: Módulo Reservas

**Archivos:**
- Crear: `front/app/admin/reservas/page.tsx`
- Crear: `front/components/admin/ReservaDrawer.tsx`

**Interfaces:**
- Consume: `getReservas()`, `updateEstadoReserva()` de `lib/admin/api.ts`
- Produce: tabla con filtros por estado + cambio de estado inline + drawer de detalle

- [ ] **Paso 1: Crear ReservaDrawer**

Crear `front/components/admin/ReservaDrawer.tsx`:

```tsx
'use client'
import { useState } from 'react'
import type { AdminReserva, EstadoReserva } from '@/lib/admin/types'
import StatusBadge from './StatusBadge'
import { updateEstadoReserva } from '@/lib/admin/api'

export default function ReservaDrawer({
  reserva,
  onClose,
  onUpdated,
  experienciaNombre,
}: {
  reserva: AdminReserva
  onClose: () => void
  onUpdated: (r: AdminReserva) => void
  experienciaNombre: string
}) {
  const [saving, setSaving] = useState(false)

  async function cambiarEstado(estado: EstadoReserva) {
    setSaving(true)
    const updated = await updateEstadoReserva(reserva.id, estado)
    onUpdated(updated)
    setSaving(false)
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-drawer" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-drawer-header">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-gold)', marginBottom: 4 }}>
              Detalle de Reserva
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-cream)' }}>
              {reserva.nombre}
            </div>
            <div style={{ marginTop: 6 }}>
              <StatusBadge estado={reserva.estado} />
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,234,202,.7)', fontSize: 20, cursor: 'pointer', padding: 4 }}
          >✕</button>
        </div>

        {/* Body */}
        <div className="admin-drawer-body">
          <Field label="Experiencia">{experienciaNombre}</Field>
          <Field label="Fecha">{new Date(reserva.fecha).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Field>
          <Field label="Personas">{reserva.cantidadPersonas}</Field>
          <div style={{ height: 1, background: 'var(--admin-border)', margin: '16px 0' }} />
          <Field label="Teléfono">{reserva.telefono}</Field>
          <Field label="Email">{reserva.email}</Field>
          {reserva.notas && <Field label="Notas">{reserva.notas}</Field>}
        </div>

        {/* Footer */}
        <div className="admin-drawer-footer">
          {reserva.estado !== 'confirmada' && (
            <button
              className="btn-primary"
              disabled={saving}
              onClick={() => cambiarEstado('confirmada')}
            >
              {saving ? '…' : 'Confirmar'}
            </button>
          )}
          {reserva.estado !== 'cancelada' && (
            <button
              className="btn-ghost"
              disabled={saving}
              onClick={() => cambiarEstado('cancelada')}
            >
              Cancelar reserva
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="admin-field-label">{label}</div>
      <div className="admin-field-value">{children}</div>
    </div>
  )
}
```

- [ ] **Paso 2: Crear página de Reservas**

Crear `front/app/admin/reservas/page.tsx`:

```tsx
'use client'
import { useState, useEffect, useMemo } from 'react'
import type { AdminReserva, EstadoReserva } from '@/lib/admin/types'
import { getReservas, updateEstadoReserva } from '@/lib/admin/api'
import StatusBadge from '@/components/admin/StatusBadge'
import ReservaDrawer from '@/components/admin/ReservaDrawer'

const FILTROS = ['todas', 'pendientes', 'confirmadas', 'canceladas'] as const
type Filtro = typeof FILTROS[number]

const FILTRO_ESTADO: Record<Filtro, EstadoReserva | null> = {
  todas: null, pendientes: 'pendiente', confirmadas: 'confirmada', canceladas: 'cancelada',
}

export default function ReservasPage() {
  const [reservas, setReservas] = useState<AdminReserva[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [selected, setSelected] = useState<AdminReserva | null>(null)
  const [changing, setChanging] = useState<string | null>(null)

  useEffect(() => {
    getReservas().then(data => { setReservas(data); setLoading(false) })
  }, [])

  const lista = useMemo(() => {
    const estado = FILTRO_ESTADO[filtro]
    return estado ? reservas.filter(r => r.estado === estado) : reservas
  }, [reservas, filtro])

  function handleUpdated(updated: AdminReserva) {
    setReservas(prev => prev.map(r => r.id === updated.id ? updated : r))
    setSelected(updated)
  }

  async function cambiarEstadoInline(id: string, estado: EstadoReserva) {
    setChanging(id)
    const updated = await updateEstadoReserva(id, estado)
    handleUpdated(updated)
    setChanging(null)
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Reservas</div>
          <div className="admin-page-subtitle">{reservas.length} reservas en total</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="admin-pills" style={{ marginBottom: 20 }}>
        {FILTROS.map(f => (
          <button key={f} className={`admin-pill${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>
      ) : lista.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 14 }}>
          Sin reservas {filtro !== 'todas' ? `con estado "${filtro}"` : ''}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Visitante</th>
                <th>Experiencia</th>
                <th style={{ textAlign: 'center' }}>Personas</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(r => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{r.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{r.telefono}</div>
                  </td>
                  <td style={{ minWidth: 140, maxWidth: 200 }}>{r.experiencia?.nombre ?? r.experienciaId}</td>
                  <td style={{ textAlign: 'center' }}>{r.cantidadPersonas}</td>
                  <td><StatusBadge estado={r.estado} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <select
                        className="admin-select"
                        style={{ fontSize: 12, padding: '5px 8px', width: 'auto' }}
                        value={r.estado}
                        disabled={changing === r.id}
                        onChange={e => cambiarEstadoInline(r.id, e.target.value as EstadoReserva)}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                      <button className="btn-secondary btn-sm" onClick={() => setSelected(r)}>Detalle</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ReservaDrawer
          reserva={selected}
          experienciaNombre={selected.experiencia?.nombre ?? selected.experienciaId}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  )
}
```

- [ ] **Paso 3: Verificar módulo Reservas**

```bash
npm run dev:front && npm run dev:back  # o: npm run dev desde raíz
```

Ir a `http://localhost:3000/admin/reservas`:
- Tabla muestra reservas con fecha, visitante, estado ✓
- Pills filtran correctamente ✓
- Select de estado cambia el estado y actualiza badge ✓
- Botón "Detalle" abre drawer lateral con datos completos ✓
- Botones "Confirmar" / "Cancelar reserva" en drawer actualizan estado ✓

- [ ] **Paso 4: Commit**

```bash
git add front/app/admin/reservas/ front/components/admin/ReservaDrawer.tsx
git commit -m "feat(admin): módulo Reservas con tabla, filtros, cambio de estado y drawer"
```

---

## Task 6: Módulo Pedidos

**Archivos:**
- Crear: `front/app/admin/pedidos/page.tsx`
- Crear: `front/components/admin/PedidoDrawer.tsx`

**Interfaces:**
- Consume: `getPedidos()`, `updateEstadoPedido()` de `lib/admin/api.ts`
- Produce: tabla con filtros por estado + drawer con items del pedido + cambio de estado

- [ ] **Paso 1: Crear PedidoDrawer**

Crear `front/components/admin/PedidoDrawer.tsx`:

```tsx
'use client'
import { useState } from 'react'
import type { AdminPedido, EstadoPedido } from '@/lib/admin/types'
import StatusBadge from './StatusBadge'
import { updateEstadoPedido } from '@/lib/admin/api'

const ESTADOS: EstadoPedido[] = ['pendiente', 'enviado', 'entregado', 'cancelado']

export default function PedidoDrawer({
  pedido, onClose, onUpdated,
}: {
  pedido: AdminPedido
  onClose: () => void
  onUpdated: (p: AdminPedido) => void
}) {
  const [estado, setEstado] = useState<EstadoPedido>(pedido.estado)
  const [saving, setSaving] = useState(false)

  async function aplicar() {
    if (estado === pedido.estado) return
    setSaving(true)
    const updated = await updateEstadoPedido(pedido.id, estado)
    onUpdated(updated)
    setSaving(false)
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-drawer" onClick={e => e.stopPropagation()}>
        <div className="admin-drawer-header">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-gold)', marginBottom: 4 }}>
              Pedido #{pedido.id.slice(-6).toUpperCase()}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-cream)' }}>{pedido.nombre}</div>
            <div style={{ marginTop: 6 }}><StatusBadge estado={pedido.estado} /></div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,234,202,.7)', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div className="admin-drawer-body">
          <Field label="Fecha">{new Date(pedido.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</Field>
          <Field label="Dirección de envío">{pedido.direccion}</Field>
          <div style={{ height: 1, background: 'var(--admin-border)', margin: '16px 0' }} />

          <div className="admin-field-label" style={{ marginBottom: 10 }}>Items</div>
          {pedido.items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--admin-border-row)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{item.producto.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>× {item.cantidad}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-amber)' }}>
                ${(item.precio * item.cantidad).toLocaleString('es-CO')}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '2px solid var(--admin-border)' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-amber)' }}>
              ${pedido.total.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        <div className="admin-drawer-footer">
          <select
            className="admin-select"
            value={estado}
            onChange={e => setEstado(e.target.value as EstadoPedido)}
            style={{ flex: 1 }}
          >
            {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
          </select>
          <button className="btn-primary" onClick={aplicar} disabled={saving || estado === pedido.estado}>
            {saving ? '…' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="admin-field-label">{label}</div>
      <div className="admin-field-value">{children}</div>
    </div>
  )
}
```

- [ ] **Paso 2: Crear página de Pedidos**

Crear `front/app/admin/pedidos/page.tsx`:

```tsx
'use client'
import { useState, useEffect, useMemo } from 'react'
import type { AdminPedido, EstadoPedido } from '@/lib/admin/types'
import { getPedidos } from '@/lib/admin/api'
import StatusBadge from '@/components/admin/StatusBadge'
import PedidoDrawer from '@/components/admin/PedidoDrawer'

const FILTROS = ['todos', 'pendientes', 'enviados', 'entregados', 'cancelados'] as const
type Filtro = typeof FILTROS[number]

const FILTRO_ESTADO: Record<Filtro, EstadoPedido | null> = {
  todos: null, pendientes: 'pendiente', enviados: 'enviado', entregados: 'entregado', cancelados: 'cancelado',
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<AdminPedido[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [selected, setSelected] = useState<AdminPedido | null>(null)

  useEffect(() => {
    getPedidos().then(data => { setPedidos(data); setLoading(false) })
  }, [])

  const lista = useMemo(() => {
    const estado = FILTRO_ESTADO[filtro]
    return estado ? pedidos.filter(p => p.estado === estado) : pedidos
  }, [pedidos, filtro])

  function handleUpdated(updated: AdminPedido) {
    setPedidos(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelected(updated)
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Pedidos</div>
          <div className="admin-page-subtitle">{pedidos.length} pedidos en total</div>
        </div>
      </div>

      <div className="admin-pills" style={{ marginBottom: 20 }}>
        {FILTROS.map(f => (
          <button key={f} className={`admin-pill${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>
      ) : lista.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 14 }}>
          Sin pedidos {filtro !== 'todos' ? `con estado "${filtro}"` : ''}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th># Pedido</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th style={{ textAlign: 'center' }}>Items</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    #{p.id.slice(-6).toUpperCase()}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(p.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{p.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{p.email}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{p.items.length}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-amber)', fontWeight: 700 }}>
                    ${p.total.toLocaleString('es-CO')}
                  </td>
                  <td><StatusBadge estado={p.estado} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-secondary btn-sm" onClick={() => setSelected(p)}>Ver detalle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <PedidoDrawer pedido={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}
    </>
  )
}
```

- [ ] **Paso 3: Verificar**

Ir a `http://localhost:3000/admin/pedidos`:
- Tabla con columnas # / Fecha / Cliente / Items / Total / Estado ✓
- Pills filtran por estado ✓
- "Ver detalle" abre drawer con items (nombre × cantidad) y total ✓
- Select + Aplicar cambia el estado del pedido ✓

- [ ] **Paso 4: Commit**

```bash
git add front/app/admin/pedidos/ front/components/admin/PedidoDrawer.tsx
git commit -m "feat(admin): módulo Pedidos con tabla, filtros y drawer de detalle"
```

---

## Task 7: Módulo Productos

**Archivos:**
- Crear: `front/app/admin/productos/page.tsx`

**Interfaces:**
- Consume: `getProductosAdmin()`, `updateProducto()`, `createProducto()`, `deleteProducto()`
- Produce: tabla con filtros de categoría, stock editable inline, alerta visual stock bajo

- [ ] **Paso 1: Crear página de Productos**

Crear `front/app/admin/productos/page.tsx`:

```tsx
'use client'
import { useState, useEffect, useMemo } from 'react'
import type { AdminProducto } from '@/lib/admin/types'
import { getProductosAdmin, updateProducto, deleteProducto } from '@/lib/admin/api'

const CATEGORIAS = ['Todos', 'Cacao', 'Chocolates', 'Kits']

export default function ProductosPage() {
  const [productos, setProductos] = useState<AdminProducto[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('Todos')
  const [stockEdit, setStockEdit] = useState<Record<string, number>>({})
  const [savingStock, setSavingStock] = useState<string | null>(null)

  useEffect(() => {
    getProductosAdmin().then(data => { setProductos(data); setLoading(false) })
  }, [])

  const lista = useMemo(() => {
    if (cat === 'Todos') return productos
    return productos.filter(p => p.categoria.toLowerCase() === cat.toLowerCase())
  }, [productos, cat])

  const stockBajoCount = productos.filter(p => p.stock > 0 && p.stock < 5).length

  async function guardarStock(id: string) {
    const newStock = stockEdit[id]
    if (newStock === undefined) return
    setSavingStock(id)
    const updated = await updateProducto(id, { stock: newStock })
    setProductos(prev => prev.map(p => p.id === updated.id ? updated : p))
    setStockEdit(prev => { const n = { ...prev }; delete n[id]; return n })
    setSavingStock(null)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    await deleteProducto(id)
    setProductos(prev => prev.filter(p => p.id !== id))
  }

  function stockStyle(stock: number): React.CSSProperties {
    if (stock === 0) return { background: 'var(--status-cancelada-bg)', color: 'var(--status-cancelada-txt)' }
    if (stock < 5) return { background: 'var(--stock-alert-bg)', color: 'var(--stock-alert-txt)' }
    return {}
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Productos</div>
          <div className="admin-page-subtitle">
            {productos.length} productos
            {stockBajoCount > 0 && (
              <span style={{ color: '#B45309', marginLeft: 8 }}>⚠️ {stockBajoCount} con stock bajo</span>
            )}
          </div>
        </div>
        <button className="btn-primary" onClick={() => alert('Modal de nuevo producto — Task 8')}>
          + Nuevo producto
        </button>
      </div>

      <div className="admin-pills" style={{ marginBottom: 20 }}>
        {CATEGORIAS.map(c => (
          <button key={c} className={`admin-pill${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Precio</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(p => {
                const currentStock = stockEdit[p.id] ?? p.stock
                const editado = stockEdit[p.id] !== undefined
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{p.descripcion.slice(0, 50)}{p.descripcion.length > 50 ? '…' : ''}</div>
                    </td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--admin-bg)', fontSize: 12, fontWeight: 700 }}>
                        {p.categoria}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--color-amber)', fontWeight: 700 }}>
                      ${p.precio.toLocaleString('es-CO')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.stock === 0 ? (
                        <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, ...stockStyle(p.stock) }}>
                          Agotado
                        </span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {p.stock < 5 && <span title="Stock bajo">⚠️</span>}
                          <input
                            type="number"
                            min={0}
                            value={currentStock}
                            onChange={e => setStockEdit(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                            onBlur={() => editado && guardarStock(p.id)}
                            onKeyDown={e => e.key === 'Enter' && guardarStock(p.id)}
                            disabled={savingStock === p.id}
                            style={{
                              width: 64, textAlign: 'center', borderRadius: 6, padding: '5px 4px',
                              border: '1.5px solid var(--admin-border)',
                              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                              ...stockStyle(currentStock),
                            }}
                          />
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn-secondary btn-sm" onClick={() => alert(`Editar ${p.nombre}`)}>Editar</button>
                        <button className="btn-ghost btn-sm" onClick={() => eliminar(p.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 10 }}>
        El stock se guarda al salir del campo (Tab) o presionar Enter.
      </p>
    </>
  )
}
```

- [ ] **Paso 2: Verificar**

Ir a `http://localhost:3000/admin/productos`:
- Tabla con productos, categoría, precio y stock editable ✓
- Stock &lt; 5: fondo amber + ícono ⚠️ ✓
- Stock = 0: chip "Agotado" ✓
- Editar un número de stock y presionar Enter → guarda y actualiza ✓

- [ ] **Paso 3: Commit**

```bash
git add front/app/admin/productos/
git commit -m "feat(admin): módulo Productos con stock inline y alertas"
```

---

## Task 8: Módulo Experiencias

**Archivos:**
- Crear: `front/app/admin/experiencias/page.tsx`
- Crear: `front/components/admin/ExperienciaFormModal.tsx`

**Interfaces:**
- Consume: `getExperienciasAdmin()`, `createExperiencia()`, `updateExperiencia()`, `deleteExperiencia()`
- Produce: tabla con toggle "Destacada" inline + modal de CRUD

- [ ] **Paso 1: Crear ExperienciaFormModal**

Crear `front/components/admin/ExperienciaFormModal.tsx`:

```tsx
'use client'
import { useState } from 'react'
import type { AdminExperiencia } from '@/lib/admin/types'
import { createExperiencia, updateExperiencia } from '@/lib/admin/api'
import Toggle from './Toggle'

type FormData = {
  nombre: string; descripcion: string; slug: string
  precio: string; duracion: string; capacidad: string
  destacada: boolean
}

const EMPTY: FormData = { nombre: '', descripcion: '', slug: '', precio: '', duracion: '', capacidad: '', destacada: false }

function toSlug(nombre: string) {
  return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ExperienciaFormModal({
  experiencia,
  onClose,
  onSaved,
}: {
  experiencia: AdminExperiencia | null
  onClose: () => void
  onSaved: (e: AdminExperiencia) => void
}) {
  const isEdit = !!experiencia
  const [form, setForm] = useState<FormData>(
    experiencia
      ? {
          nombre: experiencia.nombre, descripcion: experiencia.descripcion,
          slug: experiencia.slug, precio: String(experiencia.precio),
          duracion: experiencia.duracion, capacidad: String(experiencia.capacidad),
          destacada: experiencia.destacada,
        }
      : EMPTY
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k: keyof FormData, v: string | boolean) {
    setForm(prev => {
      const next = { ...prev, [k]: v }
      if (k === 'nombre' && !isEdit) next.slug = toSlug(v as string)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.slug || !form.precio || !form.duracion || !form.capacidad) {
      setError('Completá todos los campos requeridos')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = {
        nombre: form.nombre, descripcion: form.descripcion, slug: form.slug,
        precio: Number(form.precio), duracion: form.duracion,
        capacidad: Number(form.capacidad), destacada: form.destacada,
      }
      const saved = isEdit
        ? await updateExperiencia(experiencia!.id, data)
        : await createExperiencia(data)
      onSaved(saved)
    } catch {
      setError('Error al guardar. Revisá que el slug sea único.')
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div style={{ fontSize: 17, fontWeight: 700 }}>{isEdit ? 'Editar experiencia' : 'Nueva experiencia'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--admin-text-muted)' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            <FormRow label="Nombre *">
              <input className="admin-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Cacao Intenso" />
            </FormRow>
            <FormRow label="Slug (URL) *">
              <input className="admin-input" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="cacao-intenso" />
            </FormRow>
            <FormRow label="Descripción">
              <textarea className="admin-input" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
            </FormRow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <FormRow label="Precio (COP) *">
                <input className="admin-input" type="number" min={0} value={form.precio} onChange={e => set('precio', e.target.value)} placeholder="8500" />
              </FormRow>
              <FormRow label="Duración *">
                <input className="admin-input" value={form.duracion} onChange={e => set('duracion', e.target.value)} placeholder="4 horas" />
              </FormRow>
              <FormRow label="Capacidad *">
                <input className="admin-input" type="number" min={1} value={form.capacidad} onChange={e => set('capacidad', e.target.value)} placeholder="12" />
              </FormRow>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Toggle checked={form.destacada} onChange={v => set('destacada', v)} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>Destacar en el sitio público</span>
            </div>
            {error && <div style={{ color: 'var(--color-crimson)', fontSize: 13 }}>{error}</div>}
          </div>
          <div className="admin-modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="admin-field-label">{label}</div>
      {children}
    </div>
  )
}
```

- [ ] **Paso 2: Crear página de Experiencias**

Crear `front/app/admin/experiencias/page.tsx`:

```tsx
'use client'
import { useState, useEffect } from 'react'
import type { AdminExperiencia } from '@/lib/admin/types'
import { getExperienciasAdmin, updateExperiencia, deleteExperiencia } from '@/lib/admin/api'
import Toggle from '@/components/admin/Toggle'
import ExperienciaFormModal from '@/components/admin/ExperienciaFormModal'

export default function ExperienciasPage() {
  const [experiencias, setExperiencias] = useState<AdminExperiencia[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<AdminExperiencia | null | 'new'>()
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    getExperienciasAdmin().then(data => { setExperiencias(data); setLoading(false) })
  }, [])

  async function toggleDestacada(exp: AdminExperiencia) {
    setTogglingId(exp.id)
    const updated = await updateExperiencia(exp.id, { destacada: !exp.destacada })
    setExperiencias(prev => prev.map(e => e.id === updated.id ? updated : e))
    setTogglingId(null)
  }

  async function archivar(exp: AdminExperiencia) {
    if (!confirm(`¿Archivar "${exp.nombre}"? Dejará de aparecer en el sitio.`)) return
    const updated = await updateExperiencia(exp.id, { archivada: true })
    setExperiencias(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  function handleSaved(saved: AdminExperiencia) {
    setExperiencias(prev => {
      const idx = prev.findIndex(e => e.id === saved.id)
      return idx >= 0 ? prev.map(e => e.id === saved.id ? saved : e) : [saved, ...prev]
    })
    setModal(undefined)
  }

  const visibles = experiencias.filter(e => !e.archivada)
  const archivadas = experiencias.filter(e => e.archivada)

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Experiencias</div>
          <div className="admin-page-subtitle">{visibles.length} activas · {archivadas.length} archivadas</div>
        </div>
        <button className="btn-primary" onClick={() => setModal('new')}>+ Nueva experiencia</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Experiencia</th>
                <th style={{ textAlign: 'right' }}>Precio</th>
                <th style={{ textAlign: 'center' }}>Duración</th>
                <th style={{ textAlign: 'center' }}>Capacidad</th>
                <th style={{ textAlign: 'center' }}>Destacada</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(exp => (
                <tr key={exp.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{exp.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{exp.slug}</div>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-amber)', fontWeight: 700 }}>
                    ${exp.precio.toLocaleString('es-CO')}
                  </td>
                  <td style={{ textAlign: 'center' }}>{exp.duracion}</td>
                  <td style={{ textAlign: 'center' }}>{exp.capacidad} personas</td>
                  <td style={{ textAlign: 'center' }}>
                    <Toggle
                      checked={exp.destacada}
                      onChange={() => toggleDestacada(exp)}
                      disabled={togglingId === exp.id}
                    />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn-secondary btn-sm" onClick={() => setModal(exp)}>Editar</button>
                      <button className="btn-ghost btn-sm" onClick={() => archivar(exp)}>Archivar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {archivadas.map(exp => (
                <tr key={exp.id} style={{ opacity: 0.45 }}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{exp.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Archivada</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>${exp.precio.toLocaleString('es-CO')}</td>
                  <td style={{ textAlign: 'center' }}>{exp.duracion}</td>
                  <td style={{ textAlign: 'center' }}>{exp.capacidad}</td>
                  <td />
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-ghost btn-sm" onClick={() => updateExperiencia(exp.id, { archivada: false }).then(u => setExperiencias(prev => prev.map(e => e.id === u.id ? u : e)))}>
                      Restaurar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== undefined && (
        <ExperienciaFormModal
          experiencia={modal === 'new' ? null : modal}
          onClose={() => setModal(undefined)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
```

- [ ] **Paso 3: Verificar**

Ir a `http://localhost:3000/admin/experiencias`:
- Tabla con toggle "Destacada" funcional ✓
- Toggle cambia `destacada` en BD y se refleja en el sitio público ✓
- "+ Nueva experiencia" abre modal con form completo ✓
- Guardar crea experiencia y aparece en la tabla ✓
- "Editar" abre modal con datos pre-cargados ✓
- "Archivar" oculta la fila (reducida a 45% opacity) ✓

- [ ] **Paso 4: Commit**

```bash
git add front/app/admin/experiencias/ front/components/admin/ExperienciaFormModal.tsx
git commit -m "feat(admin): módulo Experiencias con toggle destacada, CRUD modal y archivo"
```

---

## Task 9: Módulo Overview

**Archivos:**
- Crear: `front/app/admin/page.tsx`
- Crear: `front/components/admin/ReservasChart.tsx`

**Interfaces:**
- Consume: `getReservas()`, `getPedidos()`, `getProductosAdmin()` en paralelo
- Produce: 4 StatCards + gráfica de barras CSS + listas recientes

> No hay endpoint dedicado de overview en el backend. El front agrega los datos del lado del cliente con los mismos endpoints de entidades.

- [ ] **Paso 1: Crear ReservasChart**

Crear `front/components/admin/ReservasChart.tsx`:

```tsx
type Barra = { semana: string; cantidad: number }

export default function ReservasChart({ data }: { data: Barra[] }) {
  const max = Math.max(...data.map(d => d.cantidad), 1)

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '24px',
      boxShadow: '0 2px 8px rgba(135,43,19,.06)',
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Reservas por semana</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)' }}>{d.cantidad}</div>
            <div style={{
              width: '100%', borderRadius: '4px 4px 0 0',
              background: 'linear-gradient(to top, #D51312, #EA5B0C)',
              height: `${Math.max((d.cantidad / max) * 100, 4)}%`,
            }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>{d.semana}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Paso 2: Crear página Overview**

Reemplazar `front/app/admin/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import type { AdminReserva, AdminPedido, AdminProducto } from '@/lib/admin/types'
import { getReservas, getPedidos, getProductosAdmin } from '@/lib/admin/api'
import StatCard from '@/components/admin/StatCard'
import StatusBadge from '@/components/admin/StatusBadge'
import ReservasChart from '@/components/admin/ReservasChart'
import Link from 'next/link'

function semanaLabel(fecha: Date): string {
  const sem = Math.ceil(fecha.getDate() / 7)
  return `Sem ${sem}`
}

export default function AdminOverviewPage() {
  const [reservas, setReservas] = useState<AdminReserva[]>([])
  const [pedidos, setPedidos] = useState<AdminPedido[]>([])
  const [productos, setProductos] = useState<AdminProducto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getReservas(), getPedidos(), getProductosAdmin()]).then(([r, p, pr]) => {
      setReservas(r); setPedidos(p); setProductos(pr); setLoading(false)
    })
  }, [])

  const now = new Date()
  const mesActual = now.getMonth()
  const anioActual = now.getFullYear()

  const reservasMes = reservas.filter(r => {
    const d = new Date(r.fecha)
    return d.getMonth() === mesActual && d.getFullYear() === anioActual
  })
  const pedidosMes = pedidos.filter(p => {
    const d = new Date(p.createdAt)
    return d.getMonth() === mesActual && d.getFullYear() === anioActual
  })
  const ingresosMes = pedidosMes.reduce((s, p) => s + p.total, 0)
  const stockBajo = productos.filter(p => p.stock > 0 && p.stock < 5).length

  const reservasPorSemana = [1, 2, 3, 4].map(sem => ({
    semana: `Sem ${sem}`,
    cantidad: reservasMes.filter(r => Math.ceil(new Date(r.fecha).getDate() / 7) === sem).length,
  }))

  const ultimasReservas = [...reservas].slice(0, 5)
  const ultimosPedidos = [...pedidos].slice(0, 5)

  if (loading) return <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Overview</div>
          <div className="admin-page-subtitle">{now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* StatCards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label="Reservas del mes" value={reservasMes.length} icon="📅" />
        <StatCard label="Pedidos del mes" value={pedidosMes.length} icon="📦" />
        <StatCard label="Ingresos estimados" value={`$${ingresosMes.toLocaleString('es-CO')}`} icon="💰" />
        <StatCard label="Stock bajo" value={stockBajo} icon="⚠️" alerta={stockBajo > 0} />
      </div>

      {/* Gráfica */}
      <div style={{ marginBottom: 24 }}>
        <ReservasChart data={reservasPorSemana} />
      </div>

      {/* Listas recientes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Últimas reservas */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(135,43,19,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Últimas reservas</div>
            <Link href="/admin/reservas" style={{ fontSize: 12, color: 'var(--color-orange)', fontWeight: 700, textDecoration: 'none' }}>Ver todas →</Link>
          </div>
          {ultimasReservas.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--admin-border-row)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{r.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{new Date(r.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</div>
              </div>
              <StatusBadge estado={r.estado} />
            </div>
          ))}
        </div>

        {/* Últimos pedidos */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(135,43,19,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Últimos pedidos</div>
            <Link href="/admin/pedidos" style={{ fontSize: 12, color: 'var(--color-orange)', fontWeight: 700, textDecoration: 'none' }}>Ver todos →</Link>
          </div>
          {ultimosPedidos.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--admin-border-row)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>${p.total.toLocaleString('es-CO')}</div>
              </div>
              <StatusBadge estado={p.estado} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Paso 3: Verificar**

Ir a `http://localhost:3000/admin`:
- 4 StatCards con métricas del mes ✓
- StatCard "Stock bajo" con borde amber si hay productos críticos ✓
- Gráfica de barras con gradiente crimson→orange ✓
- Listas de últimas 5 reservas y pedidos con StatusBadge ✓
- Links "Ver todas →" navegan a los módulos ✓

- [ ] **Paso 4: Commit**

```bash
git add front/app/admin/page.tsx front/components/admin/ReservasChart.tsx
git commit -m "feat(admin): módulo Overview con StatCards, gráfica y recientes"
```

---

## Task 10: Configuración + sidebar con badges

**Archivos:**
- Crear: `front/app/admin/config/page.tsx`
- Modificar: `front/components/admin/Sidebar.tsx` — agregar badge de pendientes en Reservas/Pedidos

- [ ] **Paso 1: Crear página de Configuración**

Crear `front/app/admin/config/page.tsx`:

```tsx
export default function ConfigPage() {
  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Configuración</div>
          <div className="admin-page-subtitle">Ajustes generales de la finca</div>
        </div>
      </div>

      <div style={{
        background: '#fff', borderRadius: 14, padding: '48px',
        boxShadow: '0 2px 8px rgba(135,43,19,.06)',
        textAlign: 'center', maxWidth: 480, margin: '0 auto',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Próximamente</div>
        <div style={{ fontSize: 14, color: 'var(--admin-text-muted)', lineHeight: 1.6 }}>
          Esta sección permitirá configurar los datos del sitio: nombre de la finca, email de contacto,
          teléfono y redes sociales (Instagram, WhatsApp).
        </div>
      </div>
    </>
  )
}
```

- [ ] **Paso 2: Verificar tipo-check final**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Paso 3: Smoke test completo**

Con `npm run dev` corriendo:
1. `/admin` → login → ingresar password → Overview con métricas ✓
2. Sidebar → Reservas → tabla + filtros + drawer ✓
3. Sidebar → Experiencias → toggle + modal CRUD ✓
4. Sidebar → Productos → stock inline + alertas ✓
5. Sidebar → Pedidos → tabla + drawer con items ✓
6. Sidebar → Configuración → placeholder "Próximamente" ✓
7. Sitio público → `http://localhost:3000/` → Navbar/Footer presentes, sin cambios ✓
8. Cambiar "destacada" en una experiencia → verificar en el sitio público que se refleja ✓

- [ ] **Paso 4: Commit final**

```bash
git add front/app/admin/config/ front/components/admin/Sidebar.tsx
git commit -m "feat(admin): Configuración placeholder, smoke test pasado — admin dashboard completo"
```

---

## Checklist de Revisión Final

Antes de declarar la tarea completa:

- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] `npm run build --workspace=front` compila sin errores
- [ ] Las rutas públicas (`/`, `/experiencias`, `/tienda`) conservan Navbar y Footer
- [ ] `/admin` redirige a `/admin/login` si no hay cookie
- [ ] Los 6 módulos del admin son navegables y muestran datos reales del backend
- [ ] Cambiar `destacada` o `stock` en el admin se refleja en el sitio público
- [ ] `ADMIN_PASSWORD` está en `.env.local` y **no está en `.gitignore`-ignorado** — agregar a `.gitignore` antes de hacer push a un repo público
