# Vuelo Carmesí — Monorepo Scaffold

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffoldear el monorepo con Next.js 14+ (frontend) y NestJS (backend), aplicar la identidad visual de marca como tokens CSS globales y dejar todas las rutas del portal como páginas stub funcionales.

**Architecture:** npm workspaces monorepo en `c:\Users\YEEND\Desktop\Vuelo carmesi\`. Frontend Next.js 14+ App Router con route groups `(landing)`, `(booking)`, `(shop)`. Backend NestJS como API REST independiente con módulos skeleton. Brand tokens en `front/styles/tokens.css` importados globalmente. Comunicación vía `NEXT_PUBLIC_API_URL`.

**Tech Stack:** Next.js 14+ · NestJS 10+ · TypeScript · npm workspaces · CSS custom properties

---

## File Map

| Archivo | Responsabilidad |
|---------|----------------|
| `package.json` | Workspaces root, scripts de dev |
| `.gitignore` | Ignorados del repo |
| `front/` | App Next.js generada por create-next-app |
| `front/styles/tokens.css` | CSS custom properties de marca (colores + @font-face) |
| `front/app/globals.css` | Importa tokens, reset base |
| `front/app/layout.tsx` | Root layout, aplica font-body |
| `front/app/(landing)/layout.tsx` | Layout de la sección landing |
| `front/app/(landing)/page.tsx` | Página raíz `/` |
| `front/app/(landing)/contacto/page.tsx` | Página `/contacto` |
| `front/app/(booking)/layout.tsx` | Layout de reservas |
| `front/app/(booking)/experiencias/page.tsx` | `/experiencias` |
| `front/app/(booking)/experiencias/[slug]/page.tsx` | `/experiencias/:slug` |
| `front/app/(booking)/reservar/[slug]/page.tsx` | `/reservar/:slug` |
| `front/app/(booking)/reservar/confirmacion/page.tsx` | `/reservar/confirmacion` |
| `front/app/(shop)/layout.tsx` | Layout de tienda |
| `front/app/(shop)/tienda/page.tsx` | `/tienda` |
| `front/app/(shop)/tienda/[slug]/page.tsx` | `/tienda/:slug` |
| `front/app/(shop)/carrito/page.tsx` | `/carrito` |
| `front/app/(shop)/checkout/page.tsx` | `/checkout` |
| `front/components/layout/Navbar.tsx` | Navegación global |
| `front/components/layout/Footer.tsx` | Pie de página global |
| `front/components/ui/Button.tsx` | Componente botón con variantes de marca |
| `front/public/fonts/` | Archivos de fuente copiados desde Material de apoyo |
| `back/` | App NestJS generada por CLI |
| `back/src/experiencias/` | Módulo, controller, service skeleton |
| `back/src/reservas/` | Módulo, controller, service skeleton |
| `back/src/productos/` | Módulo, controller, service skeleton |
| `back/src/pedidos/` | Módulo, controller, service skeleton |
| `back/src/main.ts` | Bootstrap con CORS configurado |
| `front/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:3001` |

---

## Task 1: Inicializar monorepo root

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Crear `package.json` raíz**

```json
{
  "name": "vuelo-carmesi",
  "private": true,
  "workspaces": ["front", "back"],
  "scripts": {
    "dev:front": "npm run dev --workspace=front",
    "dev:back": "npm run start:dev --workspace=back",
    "build:front": "npm run build --workspace=front",
    "build:back": "npm run build --workspace=back",
    "dev": "npm run dev:front & npm run dev:back"
  }
}
```

- [ ] **Step 2: Crear `.gitignore`**

```
node_modules/
.next/
dist/
.env.local
.env
.superpowers/
```

- [ ] **Step 3: Commit**

```bash
git init
git add package.json .gitignore
git commit -m "chore: init monorepo root"
```

---

## Task 2: Scaffold Next.js frontend

**Files:**
- Create: `front/` (via create-next-app)

- [ ] **Step 1: Ejecutar create-next-app**

Desde `c:\Users\YEEND\Desktop\Vuelo carmesi\`:

```powershell
npx create-next-app@latest front --typescript --app --eslint --no-tailwind --import-alias "@/*" --no-src-dir --no-git
```

Cuando pregunte interactivamente, confirmar todas las opciones por defecto.

- [ ] **Step 2: Verificar que el servidor inicia**

```powershell
cd front
npm run dev
```

Esperado: servidor corriendo en `http://localhost:3000`. Abrir en el browser y ver la página default de Next.js.

- [ ] **Step 3: Detener el servidor** (`Ctrl+C`) y volver a la raíz

```powershell
cd ..
```

- [ ] **Step 4: Commit**

```bash
git add front/
git commit -m "feat: scaffold Next.js frontend"
```

---

## Task 3: Instalar fuentes de marca

**Files:**
- Create: `front/public/fonts/Honey Lips Personal Use.ttf`
- Create: `front/public/fonts/Bellota-Bold.otf`
- Create: `front/public/fonts/Bellota-Bold.ttf`

- [ ] **Step 1: Crear el directorio y copiar fuentes**

```powershell
New-Item -ItemType Directory -Force "front\public\fonts"
Copy-Item "Material de apoyo\Fonts\Honey Lips Personal Use.ttf" "front\public\fonts\"
Copy-Item "Material de apoyo\Fonts\Bellota-Bold.otf" "front\public\fonts\"
Copy-Item "Material de apoyo\Fonts\Bellota-Bold.ttf" "front\public\fonts\"
```

- [ ] **Step 2: Verificar que los archivos existen**

```powershell
Get-ChildItem "front\public\fonts\"
```

Esperado: 3 archivos listados.

- [ ] **Step 3: Commit**

```bash
git add front/public/fonts/
git commit -m "feat: add brand fonts to public/fonts"
```

---

## Task 4: Crear tokens CSS de marca

**Files:**
- Create: `front/styles/tokens.css`
- Modify: `front/app/globals.css`
- Modify: `front/app/layout.tsx`

- [ ] **Step 1: Crear directorio `front/styles/`**

```powershell
New-Item -ItemType Directory -Force "front\styles"
```

- [ ] **Step 2: Crear `front/styles/tokens.css`**

```css
@font-face {
  font-family: 'Honey Lips';
  src: url('/fonts/Honey Lips Personal Use.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Bellota';
  src: url('/fonts/Bellota-Bold.otf') format('opentype'),
       url('/fonts/Bellota-Bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  /* Colores de marca — Manual de Marca Vuelo Carmesí */
  --color-cream:   #ffeaca;
  --color-crimson: #d51312;
  --color-orange:  #ea5b0c;
  --color-brown:   #872b13;
  --color-amber:   #f59c00;
  --color-gold:    #fdc300;

  /* Tipografías */
  --font-display: 'Honey Lips', cursive;
  --font-body:    'Bellota', sans-serif;
}
```

- [ ] **Step 3: Reemplazar `front/app/globals.css`**

```css
@import '../styles/tokens.css';

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-cream);
  color: var(--color-brown);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 4: Actualizar `front/app/layout.tsx`**

Reemplazar el contenido generado con:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vuelo Carmesí — Experiencias Agroecológicas',
  description: 'Experiencias agroecológicas con sabor a cacao',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Verificar tokens en el browser**

```powershell
cd front && npm run dev
```

Abrir `http://localhost:3000`. Abrir DevTools → Elements → `:root`. Verificar que las variables `--color-cream`, `--color-crimson`, etc. están presentes. Verificar que el fondo es `#ffeaca`.

- [ ] **Step 6: Detener servidor y commit**

```bash
cd ..
git add front/styles/ front/app/globals.css front/app/layout.tsx
git commit -m "feat: add brand design tokens and custom fonts"
```

---

## Task 5: Crear componentes base de layout

**Files:**
- Create: `front/components/layout/Navbar.tsx`
- Create: `front/components/layout/Footer.tsx`

- [ ] **Step 1: Crear directorios**

```powershell
New-Item -ItemType Directory -Force "front\components\layout"
```

- [ ] **Step 2: Crear `front/components/layout/Navbar.tsx`**

```tsx
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: 'var(--color-crimson)',
      color: 'var(--color-cream)',
    }}>
      <Link href="/" style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.5rem',
        color: 'var(--color-cream)',
        textDecoration: 'none',
      }}>
        Vuelo Carmesí
      </Link>
      <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none' }}>
        <li><Link href="/experiencias" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Experiencias</Link></li>
        <li><Link href="/tienda" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Tienda</Link></li>
        <li><Link href="/contacto" style={{ color: 'var(--color-cream)', textDecoration: 'none' }}>Contacto</Link></li>
      </ul>
    </nav>
  )
}
```

- [ ] **Step 3: Crear `front/components/layout/Footer.tsx`**

```tsx
export default function Footer() {
  return (
    <footer style={{
      padding: '2rem',
      backgroundColor: 'var(--color-brown)',
      color: 'var(--color-cream)',
      textAlign: 'center',
      fontFamily: 'var(--font-body)',
    }}>
      <p>© {new Date().getFullYear()} Vuelo Carmesí — Experiencias Agroecológicas con sabor a cacao</p>
    </footer>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add front/components/
git commit -m "feat: add Navbar and Footer layout components"
```

---

## Task 6: Crear App Router route groups y páginas stub

**Files:**
- Delete: `front/app/page.tsx` (reemplazado por route group)
- Create: todos los archivos de route groups listados en el File Map

- [ ] **Step 1: Eliminar la página raíz default**

```powershell
Remove-Item "front\app\page.tsx"
```

- [ ] **Step 2: Crear estructura de directorios**

```powershell
New-Item -ItemType Directory -Force "front\app\(landing)\contacto"
New-Item -ItemType Directory -Force "front\app\(booking)\experiencias\[slug]"
New-Item -ItemType Directory -Force "front\app\(booking)\reservar\[slug]"
New-Item -ItemType Directory -Force "front\app\(booking)\reservar\confirmacion"
New-Item -ItemType Directory -Force "front\app\(shop)\tienda\[slug]"
New-Item -ItemType Directory -Force "front\app\(shop)\carrito"
New-Item -ItemType Directory -Force "front\app\(shop)\checkout"
```

- [ ] **Step 3: Crear `front/app/(landing)/layout.tsx`**

```tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 4: Crear `front/app/(landing)/page.tsx`**

```tsx
export default function HomePage() {
  return (
    <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '4rem', color: 'var(--color-crimson)' }}>
        Vuelo Carmesí
      </h1>
      <p style={{ fontSize: '1.25rem', marginTop: '1rem', color: 'var(--color-brown)' }}>
        Experiencias Agroecológicas con sabor a cacao
      </p>
    </section>
  )
}
```

- [ ] **Step 5: Crear `front/app/(landing)/contacto/page.tsx`**

```tsx
export default function ContactoPage() {
  return (
    <section style={{ padding: '4rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-crimson)' }}>Contacto</h1>
    </section>
  )
}
```

- [ ] **Step 6: Crear `front/app/(booking)/layout.tsx`**

```tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 7: Crear páginas stub de booking**

`front/app/(booking)/experiencias/page.tsx`:
```tsx
export default function ExperienciasPage() {
  return (
    <section style={{ padding: '4rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-crimson)' }}>Experiencias</h1>
    </section>
  )
}
```

`front/app/(booking)/experiencias/[slug]/page.tsx`:
```tsx
export default function ExperienciaPage({ params }: { params: { slug: string } }) {
  return (
    <section style={{ padding: '4rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-crimson)' }}>{params.slug}</h1>
    </section>
  )
}
```

`front/app/(booking)/reservar/[slug]/page.tsx`:
```tsx
export default function ReservarPage({ params }: { params: { slug: string } }) {
  return (
    <section style={{ padding: '4rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-crimson)' }}>Reservar: {params.slug}</h1>
    </section>
  )
}
```

`front/app/(booking)/reservar/confirmacion/page.tsx`:
```tsx
export default function ConfirmacionPage() {
  return (
    <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-crimson)' }}>¡Reserva confirmada!</h1>
    </section>
  )
}
```

- [ ] **Step 8: Crear `front/app/(shop)/layout.tsx`**

```tsx
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 9: Crear páginas stub de shop**

`front/app/(shop)/tienda/page.tsx`:
```tsx
export default function TiendaPage() {
  return (
    <section style={{ padding: '4rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-crimson)' }}>Tienda</h1>
    </section>
  )
}
```

`front/app/(shop)/tienda/[slug]/page.tsx`:
```tsx
export default function ProductoPage({ params }: { params: { slug: string } }) {
  return (
    <section style={{ padding: '4rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-crimson)' }}>{params.slug}</h1>
    </section>
  )
}
```

`front/app/(shop)/carrito/page.tsx`:
```tsx
export default function CarritoPage() {
  return (
    <section style={{ padding: '4rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-crimson)' }}>Carrito</h1>
    </section>
  )
}
```

`front/app/(shop)/checkout/page.tsx`:
```tsx
export default function CheckoutPage() {
  return (
    <section style={{ padding: '4rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-crimson)' }}>Checkout</h1>
    </section>
  )
}
```

- [ ] **Step 10: Verificar todas las rutas**

```powershell
cd front && npm run dev
```

Abrir en browser y verificar que estas URLs responden (sin error 404):
- `http://localhost:3000/` → muestra "Vuelo Carmesí" con fuente display
- `http://localhost:3000/experiencias`
- `http://localhost:3000/tienda`
- `http://localhost:3000/contacto`
- `http://localhost:3000/carrito`

- [ ] **Step 11: Detener servidor y commit**

```bash
cd ..
git add front/app/
git commit -m "feat: add App Router route groups and stub pages"
```

---

## Task 7: Scaffold NestJS backend

**Files:**
- Create: `back/` (via @nestjs/cli)

- [ ] **Step 1: Instalar NestJS CLI globalmente si no está**

```powershell
npm list -g @nestjs/cli 2>$null
```

Si no aparece `@nestjs/cli`, instalarlo:

```powershell
npm install -g @nestjs/cli
```

- [ ] **Step 2: Crear app NestJS**

Desde la raíz del monorepo:

```powershell
nest new back --package-manager npm --skip-git --strict
```

Cuando pregunte el package manager, confirmar `npm`.

- [ ] **Step 3: Verificar que el servidor inicia**

```powershell
cd back && npm run start:dev
```

Esperado: `Application is running on: http://[::1]:3000` (o similar). Abrir `http://localhost:3000` → debe retornar `"Hello World!"`.

- [ ] **Step 4: Detener servidor y commit**

```bash
cd ..
git add back/
git commit -m "feat: scaffold NestJS backend"
```

---

## Task 8: Crear módulos NestJS skeleton

**Files:**
- Create: `back/src/experiencias/experiencias.module.ts`
- Create: `back/src/experiencias/experiencias.controller.ts`
- Create: `back/src/experiencias/experiencias.service.ts`
- Create: `back/src/reservas/reservas.module.ts`
- Create: `back/src/reservas/reservas.controller.ts`
- Create: `back/src/reservas/reservas.service.ts`
- Create: `back/src/productos/productos.module.ts`
- Create: `back/src/productos/productos.controller.ts`
- Create: `back/src/productos/productos.service.ts`
- Create: `back/src/pedidos/pedidos.module.ts`
- Create: `back/src/pedidos/pedidos.controller.ts`
- Create: `back/src/pedidos/pedidos.service.ts`
- Modify: `back/src/app.module.ts`

- [ ] **Step 1: Generar módulos con NestJS CLI**

```powershell
cd back
nest generate module experiencias
nest generate controller experiencias --no-spec
nest generate service experiencias --no-spec

nest generate module reservas
nest generate controller reservas --no-spec
nest generate service reservas --no-spec

nest generate module productos
nest generate controller productos --no-spec
nest generate service productos --no-spec

nest generate module pedidos
nest generate controller pedidos --no-spec
nest generate service pedidos --no-spec
cd ..
```

- [ ] **Step 2: Verificar `back/src/app.module.ts` importa todos los módulos**

El CLI los agrega automáticamente. Verificar que el archivo contiene:

```typescript
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ExperienciasModule } from './experiencias/experiencias.module'
import { ReservasModule } from './reservas/reservas.module'
import { ProductosModule } from './productos/productos.module'
import { PedidosModule } from './pedidos/pedidos.module'

@Module({
  imports: [ExperienciasModule, ReservasModule, ProductosModule, PedidosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 3: Verificar que el backend compila y corre**

```powershell
cd back && npm run start:dev
```

Esperado: compila sin errores. 

- [ ] **Step 4: Detener servidor y commit**

```bash
cd ..
git add back/src/
git commit -m "feat: add NestJS skeleton modules (experiencias, reservas, productos, pedidos)"
```

---

## Task 9: Configurar CORS y variables de entorno

**Files:**
- Modify: `back/src/main.ts`
- Create: `front/.env.local`
- Create: `front/.env.example`

- [ ] **Step 1: Actualizar `back/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })

  app.setGlobalPrefix('api')

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  console.log(`Backend running on: http://localhost:${port}`)
}
bootstrap()
```

- [ ] **Step 2: Crear `front/.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

- [ ] **Step 3: Crear `front/.env.example`**

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

- [ ] **Step 4: Verificar CORS funciona**

```powershell
cd back && npm run start:dev
```

En otra terminal:

```powershell
cd front && npm run dev
```

Abrir `http://localhost:3000`. Abrir DevTools → Console. Ejecutar:

```javascript
fetch('http://localhost:3001/api').then(r => r.json()).then(console.log)
```

Esperado: respuesta JSON sin error CORS.

- [ ] **Step 5: Detener servidores y commit**

```bash
git add back/src/main.ts front/.env.example
git commit -m "feat: configure CORS and environment variables"
```

---

## Task 10: Actualizar scripts root del monorepo

**Files:**
- Modify: `package.json` (raíz)

- [ ] **Step 1: Actualizar `package.json` con puerto correcto para back**

El backend corre en el puerto 3001. Verificar que el script `dev` del backend no usa 3000. En `back/src/main.ts` ya está configurado el puerto 3001 (Task 9).

- [ ] **Step 2: Verificar que el script `dev:front` usa puerto diferente**

En `front/package.json`, el script `dev` de Next.js usa 3000 por defecto. Actualizar para evitar conflictos:

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

- [ ] **Step 3: Verificar arranque completo del monorepo**

Desde la raíz, abrir dos terminales:

Terminal 1:
```powershell
npm run dev:front
```

Terminal 2:
```powershell
npm run dev:back
```

Verificar:
- `http://localhost:3000` → frontend con Navbar carmesí, tipografías y fondo crema
- `http://localhost:3001/api` → `{"message":"Hello World!"}`

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "chore: finalize monorepo scaffold — front + back running"
```
