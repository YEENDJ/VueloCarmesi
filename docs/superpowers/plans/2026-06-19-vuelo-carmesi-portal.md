# Vuelo Carmesí — Portal Web: Plan de Implementación

> **Para agentes:** SKILL REQUERIDO: Usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar tarea por tarea. Los pasos usan sintaxis de checkbox (`- [ ]`) para tracking.

**Goal:** Construir el portal completo de Vuelo Carmesí: landing institucional + plataforma de reservas + tienda online.

**Architecture:** Monorepo con `front/` (Next.js 14 App Router) y `back/` (NestJS REST API). El frontend consume el backend vía HTTP usando `NEXT_PUBLIC_API_URL`. La estructura de rutas está scaffoldeada; la mayoría de archivos son stubs vacíos que necesitan implementación real.

**Tech Stack:** Next.js 14, NestJS, TypeScript, Prisma + PostgreSQL, npm workspaces.

## Estado actual del repo

Ya existe (no recrear):
- `front/styles/tokens.css` — colores + fuentes ✅
- `front/components/layout/Navbar.tsx` — funcional ✅
- `front/app/(landing)/page.tsx` — stub con inline styles
- `front/app/(booking)/experiencias/page.tsx` — stub vacío
- `front/app/(shop)/tienda/page.tsx`, `carrito/page.tsx`, `checkout/page.tsx` — stubs
- `back/src/experiencias/`, `reservas/`, `productos/`, `pedidos/` — módulos NestJS sin implementar

Falta crear:
- Todos los componentes UI, layout y de dominio
- Páginas `[slug]` dinámicas
- Capa `lib/api/` con tipos y clientes HTTP
- Backend: DTOs, Prisma schema, implementación real de services

## Global Constraints

- Next.js: `^14` con App Router (no Pages Router)
- NestJS: `^10`
- TypeScript en ambos paquetes
- Variables de entorno: `NEXT_PUBLIC_API_URL` en `front/.env.local`
- CSS: variables CSS con tokens de `front/styles/tokens.css` — NO Tailwind
- Fuentes: `Honey Lips` para headings, `Bellota Bold` para cuerpo
- Paleta: `--color-cream #ffeaca`, `--color-crimson #d51312`, `--color-orange #ea5b0c`, `--color-brown #872b13`, `--color-amber #f59c00`, `--color-gold #fdc300`
- Slugs en URLs: kebab-case, derivado del nombre del recurso
- Idioma: español en toda la UI

---

## FASE 1 — Frontend

### Task 1: Root Layout + globals.css

**Archivos:**
- Modificar: `front/app/layout.tsx`
- Modificar: `front/app/globals.css`

**Por qué:** `tokens.css` no se importa desde ningún lado, por eso las variables CSS no están disponibles globalmente.

- [ ] **Paso 1: Importar tokens.css desde globals.css**

```css
/* front/app/globals.css */
@import '../styles/tokens.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-cream);
  color: var(--color-brown);
}

h1, h2, h3 {
  font-family: var(--font-display);
}
```

- [ ] **Paso 2: Actualizar root layout para importar globals.css y agregar Navbar/Footer**

```tsx
// front/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Vuelo Carmesí — Experiencias Agroecológicas',
  description: 'Experiencias agroecológicas con sabor a cacao',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Paso 3: Verificar** — `cd front && npm run dev`, abrir `http://localhost:3000`, confirmar que el fondo es `#ffeaca` y Honey Lips carga en headings.

- [ ] **Paso 4: Commit**
```bash
git add front/app/layout.tsx front/app/globals.css
git commit -m "feat: wire globals.css + tokens, add Navbar/Footer to root layout"
```

---

### Task 2: Tipos compartidos

**Archivos:**
- Crear: `front/lib/types/index.ts`

**Por qué:** Las páginas y componentes necesitan tipos TypeScript consistentes. Definirlos antes de los componentes evita inconsistencias.

- [ ] **Paso 1: Crear tipos**

```ts
// front/lib/types/index.ts

export interface Experiencia {
  id: string
  slug: string
  nombre: string
  descripcion: string
  duracion: string       // ej: "4 horas"
  precio: number
  capacidad: number
  imagen: string         // URL relativa o absoluta
  destacada: boolean
}

export interface Producto {
  id: string
  slug: string
  nombre: string
  descripcion: string
  precio: number
  stock: number
  imagen: string
  categoria: 'cacao' | 'chocolate' | 'otro'
}

export interface Reserva {
  experienciaId: string
  fecha: string          // ISO date string
  cantidadPersonas: number
  nombre: string
  email: string
  telefono: string
  notas?: string
}

export interface ItemCarrito {
  producto: Producto
  cantidad: number
}

export interface Pedido {
  items: ItemCarrito[]
  total: number
  nombre: string
  email: string
  direccion: string
}
```

- [ ] **Paso 2: Commit**
```bash
git add front/lib/types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 3: Componentes UI Base

**Archivos:**
- Crear: `front/components/ui/Button.tsx`
- Crear: `front/components/ui/Card.tsx`
- Crear: `front/components/ui/Badge.tsx`
- Crear: `front/components/ui/Input.tsx`

**Interfaces producidas:**
- `Button`: `{ children, variant?: 'primary'|'secondary'|'outline', href?: string, onClick?: () => void, disabled?: boolean, type?: 'button'|'submit' }`
- `Card`: `{ children, className?: string }`
- `Badge`: `{ children, color?: 'crimson'|'amber'|'orange' }`
- `Input`: `{ label, name, type?, required?, placeholder?, value, onChange }`

- [ ] **Paso 1: Button.tsx**

```tsx
// front/components/ui/Button.tsx
import Link from 'next/link'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  href?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    display: 'inline-block',
    padding: '0.75rem 1.75rem',
    borderRadius: '4px',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    textDecoration: 'none',
    border: 'none',
    transition: 'opacity 0.2s',
  },
  primary: {
    backgroundColor: 'var(--color-crimson)',
    color: 'var(--color-cream)',
  },
  secondary: {
    backgroundColor: 'var(--color-orange)',
    color: 'var(--color-cream)',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--color-crimson)',
    border: '2px solid var(--color-crimson)',
  },
}

export default function Button({
  children, variant = 'primary', href, onClick, disabled, type = 'button',
}: ButtonProps) {
  const style = { ...styles.base, ...styles[variant], opacity: disabled ? 0.5 : 1 }
  if (href) return <Link href={href} style={style}>{children}</Link>
  return <button type={type} onClick={onClick} disabled={disabled} style={style}>{children}</button>
}
```

- [ ] **Paso 2: Card.tsx**

```tsx
// front/components/ui/Card.tsx
export default function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      {children}
    </div>
  )
}
```

- [ ] **Paso 3: Badge.tsx**

```tsx
// front/components/ui/Badge.tsx
const colorMap = {
  crimson: { bg: 'var(--color-crimson)', text: 'var(--color-cream)' },
  amber:   { bg: 'var(--color-amber)',   text: 'var(--color-brown)' },
  orange:  { bg: 'var(--color-orange)',  text: 'var(--color-cream)' },
}

export default function Badge({ children, color = 'crimson' }: { children: React.ReactNode; color?: 'crimson'|'amber'|'orange' }) {
  const { bg, text } = colorMap[color]
  return (
    <span style={{
      backgroundColor: bg, color: text,
      padding: '0.25rem 0.75rem', borderRadius: '999px',
      fontSize: '0.8rem', fontWeight: 700,
    }}>
      {children}
    </span>
  )
}
```

- [ ] **Paso 4: Input.tsx**

```tsx
// front/components/ui/Input.tsx
interface InputProps {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  multiline?: boolean
}

export default function Input({ label, name, type = 'text', required, placeholder, value, onChange, multiline }: InputProps) {
  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem', borderRadius: '4px',
    border: '1px solid var(--color-brown)', fontFamily: 'var(--font-body)',
    fontSize: '1rem', backgroundColor: '#fff',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label htmlFor={name} style={{ fontWeight: 700, color: 'var(--color-brown)' }}>
        {label}{required && ' *'}
      </label>
      {multiline
        ? <textarea id={name} name={name} required={required} placeholder={placeholder} value={value} onChange={onChange} rows={4} style={fieldStyle} />
        : <input id={name} name={name} type={type} required={required} placeholder={placeholder} value={value} onChange={onChange} style={fieldStyle} />
      }
    </div>
  )
}
```

- [ ] **Paso 5: Verificar** — `npm run build` en `front/`, 0 errores TypeScript.

- [ ] **Paso 6: Commit**
```bash
git add front/components/ui/
git commit -m "feat: add Button, Card, Badge, Input UI components"
```

---

### Task 4: Componentes de Layout — Hero y Footer

**Archivos:**
- Crear: `front/components/layout/Hero.tsx`
- Modificar: `front/components/layout/Footer.tsx`

- [ ] **Paso 1: Hero.tsx**

```tsx
// front/components/layout/Hero.tsx
import Button from '@/components/ui/Button'

interface HeroProps {
  titulo: string
  subtitulo: string
  ctaTexto: string
  ctaHref: string
  imagen?: string
}

export default function Hero({ titulo, subtitulo, ctaTexto, ctaHref, imagen }: HeroProps) {
  return (
    <section style={{
      minHeight: '80vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: imagen ? `linear-gradient(rgba(135,43,19,0.5), rgba(135,43,19,0.5)), url(${imagen})` : 'none',
      backgroundColor: imagen ? undefined : 'var(--color-brown)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      padding: '4rem 2rem', textAlign: 'center',
    }}>
      <div style={{ maxWidth: '800px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 8vw, 6rem)',
          color: 'var(--color-cream)', lineHeight: 1.1, marginBottom: '1rem',
        }}>
          {titulo}
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
          color: 'var(--color-gold)', marginBottom: '2rem',
        }}>
          {subtitulo}
        </p>
        <Button href={ctaHref} variant="secondary">{ctaTexto}</Button>
      </div>
    </section>
  )
}
```

- [ ] **Paso 2: Footer.tsx**

```tsx
// front/components/layout/Footer.tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--color-brown)', color: 'var(--color-cream)',
      padding: '3rem 2rem', marginTop: '4rem',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-gold)' }}>
            Vuelo Carmesí
          </h3>
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Experiencias agroecológicas con sabor a cacao.</p>
        </div>
        <div>
          <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-amber)' }}>Navegación</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[['Experiencias', '/experiencias'], ['Tienda', '/tienda'], ['Contacto', '/contacto']].map(([label, href]) => (
              <li key={href}><Link href={href} style={{ color: 'var(--color-cream)', opacity: 0.8, textDecoration: 'none' }}>{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-amber)' }}>Contacto</h4>
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>hola@vuelocarmesi.com</p>
        </div>
      </div>
      <p style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.5, fontSize: '0.8rem' }}>
        © {new Date().getFullYear()} Vuelo Carmesí. Todos los derechos reservados.
      </p>
    </footer>
  )
}
```

- [ ] **Paso 3: Commit**
```bash
git add front/components/layout/
git commit -m "feat: add Hero component, implement Footer"
```

---

### Task 5: Landing Page completa

**Archivos:**
- Modificar: `front/app/(landing)/page.tsx`
- Modificar: `front/app/(landing)/layout.tsx`
- Modificar: `front/app/(landing)/contacto/page.tsx`

**Secciones de la landing:** Hero, Experiencias preview (3 cards), Sobre nosotros, CTA reserva.

- [ ] **Paso 1: Verificar/ajustar (landing)/layout.tsx**

```tsx
// front/app/(landing)/layout.tsx
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Paso 2: Implementar landing page con todas las secciones**

```tsx
// front/app/(landing)/page.tsx
import Hero from '@/components/layout/Hero'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const experienciasPreview = [
  { slug: 'cacao-intenso', nombre: 'Cacao Intenso', descripcion: 'Recorrido por plantaciones y degustación guiada.', duracion: '4 horas', precio: 8500 },
  { slug: 'cacao-y-arte', nombre: 'Cacao & Arte', descripcion: 'Taller de chocolatería artesanal con artistas locales.', duracion: '3 horas', precio: 7000 },
  { slug: 'amanecer-agroecologico', nombre: 'Amanecer Agroecológico', descripcion: 'Tour al amanecer con desayuno orgánico incluido.', duracion: '5 horas', precio: 9500 },
]

export default function HomePage() {
  return (
    <>
      <Hero
        titulo="Vuelo Carmesí"
        subtitulo="Experiencias agroecológicas con sabor a cacao"
        ctaTexto="Explorar experiencias"
        ctaHref="/experiencias"
        imagen="/images/hero-bg.jpg"
      />

      {/* Sección: Experiencias preview */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: 'var(--color-brown)' }}>
          Nuestras Experiencias
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {experienciasPreview.map((exp) => (
            <Card key={exp.slug}>
              <div style={{ height: '200px', backgroundColor: 'var(--color-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '3rem' }}>🍫</span>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>{exp.nombre}</h3>
                <p style={{ opacity: 0.8, marginBottom: '1rem', fontSize: '0.95rem' }}>{exp.descripcion}</p>
                <p style={{ fontWeight: 700, color: 'var(--color-crimson)', marginBottom: '1rem' }}>
                  ${exp.precio.toLocaleString('es-AR')} — {exp.duracion}
                </p>
                <Button href={`/experiencias/${exp.slug}`} variant="outline">Ver detalle</Button>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button href="/experiencias">Ver todas las experiencias</Button>
        </div>
      </section>

      {/* Sección: Sobre nosotros */}
      <section style={{ backgroundColor: 'var(--color-brown)', color: 'var(--color-cream)', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--color-gold)' }}>Sobre Vuelo Carmesí</h2>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, opacity: 0.9 }}>
            Somos un proyecto agroecológico dedicado a rescatar y celebrar la cultura del cacao.
            Ofrecemos experiencias inmersivas donde los visitantes conectan con la tierra,
            los productores y el proceso artesanal detrás de cada pieza de chocolate.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', backgroundColor: 'var(--color-cream)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-brown)' }}>¿Listo para vivir la experiencia?</h2>
        <Button href="/experiencias" variant="primary">Reservar ahora</Button>
      </section>
    </>
  )
}
```

- [ ] **Paso 3: Implementar página de contacto**

```tsx
// front/app/(landing)/contacto/page.tsx
'use client'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' })
  const [enviado, setEnviado] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO conectar con endpoint POST /contacto cuando exista
    setEnviado(true)
  }

  return (
    <section style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--color-brown)' }}>Contacto</h1>
      {enviado ? (
        <p style={{ color: 'var(--color-crimson)', fontSize: '1.1rem' }}>
          ¡Gracias! Te respondemos a la brevedad.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input label="Nombre" name="nombre" required value={form.nombre} onChange={handleChange} />
          <Input label="Email" name="email" type="email" required value={form.email} onChange={handleChange} />
          <Input label="Mensaje" name="mensaje" required value={form.mensaje} onChange={handleChange} multiline />
          <Button type="submit">Enviar mensaje</Button>
        </form>
      )}
    </section>
  )
}
```

- [ ] **Paso 4: Verificar en browser** — navegar `/` y `/contacto`, confirmar secciones visibles y formulario funcional.

- [ ] **Paso 5: Commit**
```bash
git add front/app/(landing)/
git commit -m "feat: implement landing page sections and contact form"
```

---

### Task 6: Cliente HTTP + datos mock del back

**Archivos:**
- Crear: `front/lib/api/experiencias.ts`
- Crear: `front/lib/api/productos.ts`
- Crear: `front/.env.local`

**Por qué:** Las páginas de reservas y tienda necesitan datos. Creamos el cliente HTTP con fallback a datos mock mientras el back no está desplegado.

- [ ] **Paso 1: Crear .env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

- [ ] **Paso 2: Cliente de experiencias con mock**

```ts
// front/lib/api/experiencias.ts
import type { Experiencia } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL

export const MOCK_EXPERIENCIAS: Experiencia[] = [
  { id: '1', slug: 'cacao-intenso', nombre: 'Cacao Intenso', descripcion: 'Recorrido por plantaciones y degustación guiada de variedades de cacao.', duracion: '4 horas', precio: 8500, capacidad: 12, imagen: '', destacada: true },
  { id: '2', slug: 'cacao-y-arte', nombre: 'Cacao & Arte', descripcion: 'Taller de chocolatería artesanal con artistas locales.', duracion: '3 horas', precio: 7000, capacidad: 8, imagen: '', destacada: false },
  { id: '3', slug: 'amanecer-agroecologico', nombre: 'Amanecer Agroecológico', descripcion: 'Tour al amanecer con desayuno orgánico incluido.', duracion: '5 horas', precio: 9500, capacidad: 10, imagen: '', destacada: true },
]

export async function getExperiencias(): Promise<Experiencia[]> {
  try {
    const res = await fetch(`${BASE}/experiencias`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_EXPERIENCIAS
  }
}

export async function getExperienciaBySlug(slug: string): Promise<Experiencia | null> {
  try {
    const res = await fetch(`${BASE}/experiencias/slug/${slug}`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_EXPERIENCIAS.find(e => e.slug === slug) ?? null
  }
}
```

- [ ] **Paso 3: Cliente de productos con mock**

```ts
// front/lib/api/productos.ts
import type { Producto } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL

export const MOCK_PRODUCTOS: Producto[] = [
  { id: '1', slug: 'cacao-en-polvo-500g', nombre: 'Cacao en Polvo 500g', descripcion: 'Cacao puro sin azúcar, ideal para recetas.', precio: 2800, stock: 50, imagen: '', categoria: 'cacao' },
  { id: '2', slug: 'chocolate-oscuro-70', nombre: 'Chocolate Oscuro 70%', descripcion: 'Tableta artesanal 100g.', precio: 1500, stock: 30, imagen: '', categoria: 'chocolate' },
  { id: '3', slug: 'nibs-de-cacao', nombre: 'Nibs de Cacao', descripcion: 'Trozos crujientes de cacao tostado, 200g.', precio: 1800, stock: 40, imagen: '', categoria: 'cacao' },
]

export async function getProductos(): Promise<Producto[]> {
  try {
    const res = await fetch(`${BASE}/productos`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_PRODUCTOS
  }
}

export async function getProductoBySlug(slug: string): Promise<Producto | null> {
  try {
    const res = await fetch(`${BASE}/productos/slug/${slug}`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_PRODUCTOS.find(p => p.slug === slug) ?? null
  }
}
```

- [ ] **Paso 4: Commit**
```bash
git add front/lib/ front/.env.local
git commit -m "feat: add HTTP clients for experiencias and productos with mock fallback"
```

---

### Task 7: Sección Booking — Catálogo y Detalle de Experiencias

**Archivos:**
- Crear: `front/components/booking/ExperienciaCard.tsx`
- Modificar: `front/app/(booking)/experiencias/page.tsx`
- Crear: `front/app/(booking)/experiencias/[slug]/page.tsx`
- Modificar: `front/app/(booking)/layout.tsx`

- [ ] **Paso 1: ExperienciaCard.tsx**

```tsx
// front/components/booking/ExperienciaCard.tsx
import type { Experiencia } from '@/lib/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

export default function ExperienciaCard({ experiencia }: { experiencia: Experiencia }) {
  return (
    <Card>
      <div style={{ height: '220px', backgroundColor: 'var(--color-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {experiencia.imagen
          ? <img src={experiencia.imagen} alt={experiencia.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '4rem' }}>🍫</span>
        }
      </div>
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {experiencia.destacada && <Badge color="crimson">Destacada</Badge>}
          <Badge color="amber">{experiencia.duracion}</Badge>
        </div>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>{experiencia.nombre}</h3>
        <p style={{ opacity: 0.8, marginBottom: '1rem', fontSize: '0.95rem', lineHeight: 1.6 }}>{experiencia.descripcion}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-crimson)' }}>
            ${experiencia.precio.toLocaleString('es-AR')}
          </span>
          <Button href={`/experiencias/${experiencia.slug}`} variant="outline">Ver más</Button>
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Paso 2: Catálogo de experiencias**

```tsx
// front/app/(booking)/experiencias/page.tsx
import ExperienciaCard from '@/components/booking/ExperienciaCard'
import { getExperiencias } from '@/lib/api/experiencias'

export default async function ExperienciasPage() {
  const experiencias = await getExperiencias()

  return (
    <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
      <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>Nuestras Experiencias</h1>
      <p style={{ marginBottom: '3rem', opacity: 0.7 }}>Viví el cacao desde adentro.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        {experiencias.map(exp => <ExperienciaCard key={exp.id} experiencia={exp} />)}
      </div>
    </section>
  )
}
```

- [ ] **Paso 3: Detalle de experiencia**

```tsx
// front/app/(booking)/experiencias/[slug]/page.tsx
import { getExperienciaBySlug, getExperiencias } from '@/lib/api/experiencias'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const experiencias = await getExperiencias()
  return experiencias.map(e => ({ slug: e.slug }))
}

export default async function ExperienciaDetallePage({ params }: { params: { slug: string } }) {
  const exp = await getExperienciaBySlug(params.slug)
  if (!exp) notFound()

  return (
    <section style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>
      <div style={{ height: '400px', backgroundColor: 'var(--color-amber)', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '6rem' }}>🍫</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {exp.destacada && <Badge color="crimson">Destacada</Badge>}
        <Badge color="amber">{exp.duracion}</Badge>
        <Badge color="orange">Hasta {exp.capacidad} personas</Badge>
      </div>
      <h1 style={{ marginBottom: '1rem', color: 'var(--color-brown)' }}>{exp.nombre}</h1>
      <p style={{ fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '2rem', opacity: 0.85 }}>{exp.descripcion}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <span style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-crimson)' }}>
          ${exp.precio.toLocaleString('es-AR')}
        </span>
        <Button href={`/reservar/${exp.slug}`}>Reservar ahora</Button>
      </div>
    </section>
  )
}
```

- [ ] **Paso 4: Verificar** — navegar `/experiencias` y click en una card, confirmar detalle carga correctamente.

- [ ] **Paso 5: Commit**
```bash
git add front/components/booking/ExperienciaCard.tsx front/app/(booking)/
git commit -m "feat: booking section — experiencias catalog and detail page"
```

---

### Task 8: Flujo de Reserva

**Archivos:**
- Crear: `front/components/booking/ReservaForm.tsx`
- Crear: `front/app/(booking)/reservar/[slug]/page.tsx`
- Crear: `front/app/(booking)/reservar/confirmacion/page.tsx`

- [ ] **Paso 1: ReservaForm.tsx**

```tsx
// front/components/booking/ReservaForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Experiencia, Reserva } from '@/lib/types'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ReservaForm({ experiencia }: { experiencia: Experiencia }) {
  const router = useRouter()
  const [form, setForm] = useState<Omit<Reserva, 'experienciaId'>>({
    fecha: '', cantidadPersonas: 1, nombre: '', email: '', telefono: '', notas: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.name === 'cantidadPersonas' ? Number(e.target.value) : e.target.value
    setForm(prev => ({ ...prev, [e.target.name]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, experienciaId: experiencia.id }),
      })
    } catch {
      // continuar a confirmacion aunque el back falle (demo)
    }
    router.push('/reservar/confirmacion')
  }

  const total = experiencia.precio * form.cantidadPersonas

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Input label="Fecha" name="fecha" type="date" required value={form.fecha} onChange={handleChange} />
      <Input label="Cantidad de personas" name="cantidadPersonas" type="number" required value={String(form.cantidadPersonas)} onChange={handleChange} />
      <Input label="Nombre completo" name="nombre" required value={form.nombre} onChange={handleChange} />
      <Input label="Email" name="email" type="email" required value={form.email} onChange={handleChange} />
      <Input label="Teléfono" name="telefono" type="tel" required value={form.telefono} onChange={handleChange} />
      <Input label="Notas adicionales" name="notas" value={form.notas ?? ''} onChange={handleChange} multiline />
      <div style={{ padding: '1rem', backgroundColor: 'var(--color-cream)', borderRadius: '4px', border: '1px solid var(--color-amber)' }}>
        <p style={{ fontWeight: 700, color: 'var(--color-brown)' }}>
          Total: ${total.toLocaleString('es-AR')} ({form.cantidadPersonas} persona{form.cantidadPersonas !== 1 ? 's' : ''})
        </p>
      </div>
      <Button type="submit" disabled={loading}>{loading ? 'Procesando...' : 'Confirmar reserva'}</Button>
    </form>
  )
}
```

- [ ] **Paso 2: Página de reserva**

```tsx
// front/app/(booking)/reservar/[slug]/page.tsx
import { getExperienciaBySlug } from '@/lib/api/experiencias'
import ReservaForm from '@/components/booking/ReservaForm'
import { notFound } from 'next/navigation'

export default async function ReservarPage({ params }: { params: { slug: string } }) {
  const exp = await getExperienciaBySlug(params.slug)
  if (!exp) notFound()

  return (
    <section style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem' }}>
      <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>Reservar: {exp.nombre}</h1>
      <p style={{ marginBottom: '2rem', opacity: 0.7 }}>${exp.precio.toLocaleString('es-AR')} por persona · {exp.duracion}</p>
      <ReservaForm experiencia={exp} />
    </section>
  )
}
```

- [ ] **Paso 3: Pantalla de confirmación**

```tsx
// front/app/(booking)/reservar/confirmacion/page.tsx
import Button from '@/components/ui/Button'

export default function ConfirmacionPage() {
  return (
    <section style={{ maxWidth: '600px', margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
      <h1 style={{ color: 'var(--color-brown)', marginBottom: '1rem' }}>¡Reserva confirmada!</h1>
      <p style={{ opacity: 0.8, marginBottom: '2rem', lineHeight: 1.7 }}>
        Te enviamos un email con los detalles. ¡Nos vemos pronto!
      </p>
      <Button href="/experiencias">Ver más experiencias</Button>
    </section>
  )
}
```

- [ ] **Paso 4: Commit**
```bash
git add front/components/booking/ReservaForm.tsx front/app/(booking)/reservar/
git commit -m "feat: booking flow — reserva form and confirmation page"
```

---

### Task 9: Sección Tienda

**Archivos:**
- Crear: `front/components/shop/ProductoCard.tsx`
- Modificar: `front/app/(shop)/tienda/page.tsx`
- Crear: `front/app/(shop)/tienda/[slug]/page.tsx`
- Modificar: `front/app/(shop)/carrito/page.tsx`
- Modificar: `front/app/(shop)/checkout/page.tsx`

**Nota:** El carrito necesita estado global. Usar `localStorage` + un hook custom para MVP (sin Redux/Zustand).

- [ ] **Paso 1: Hook de carrito con localStorage**

```ts
// front/lib/useCarrito.ts
'use client'
import { useState, useEffect } from 'react'
import type { ItemCarrito, Producto } from '@/lib/types'

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('carrito')
    if (stored) setItems(JSON.parse(stored))
  }, [])

  const guardar = (nuevos: ItemCarrito[]) => {
    setItems(nuevos)
    localStorage.setItem('carrito', JSON.stringify(nuevos))
  }

  const agregar = (producto: Producto) => {
    const existente = items.find(i => i.producto.id === producto.id)
    if (existente) {
      guardar(items.map(i => i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i))
    } else {
      guardar([...items, { producto, cantidad: 1 }])
    }
  }

  const quitar = (productoId: string) => guardar(items.filter(i => i.producto.id !== productoId))

  const total = items.reduce((sum, i) => sum + i.producto.precio * i.cantidad, 0)

  return { items, agregar, quitar, total }
}
```

- [ ] **Paso 2: ProductoCard.tsx**

```tsx
// front/components/shop/ProductoCard.tsx
'use client'
import type { Producto } from '@/lib/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useCarrito } from '@/lib/useCarrito'

export default function ProductoCard({ producto }: { producto: Producto }) {
  const { agregar } = useCarrito()

  return (
    <Card>
      <div style={{ height: '200px', backgroundColor: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '3rem' }}>🍫</span>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <Badge color="amber">{producto.categoria}</Badge>
        <h3 style={{ margin: '0.75rem 0 0.5rem', color: 'var(--color-brown)' }}>{producto.nombre}</h3>
        <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem' }}>{producto.descripcion}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-crimson)', fontSize: '1.2rem' }}>
            ${producto.precio.toLocaleString('es-AR')}
          </span>
          <Button onClick={() => agregar(producto)} variant="secondary">Agregar</Button>
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Paso 3: Catálogo de tienda**

```tsx
// front/app/(shop)/tienda/page.tsx
import ProductoCard from '@/components/shop/ProductoCard'
import { getProductos } from '@/lib/api/productos'

export default async function TiendaPage() {
  const productos = await getProductos()
  return (
    <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
      <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>Tienda</h1>
      <p style={{ marginBottom: '3rem', opacity: 0.7 }}>Llevate el sabor a casa.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
        {productos.map(p => <ProductoCard key={p.id} producto={p} />)}
      </div>
    </section>
  )
}
```

- [ ] **Paso 4: Detalle de producto** — `front/app/(shop)/tienda/[slug]/page.tsx`

Mismo patrón que detalle de experiencia: `getProductoBySlug(params.slug)`, mostrar imagen, descripcion, precio, botón "Agregar al carrito" que llama `useCarrito().agregar(producto)` (necesita `'use client'`).

- [ ] **Paso 5: Carrito page**

```tsx
// front/app/(shop)/carrito/page.tsx
'use client'
import { useCarrito } from '@/lib/useCarrito'
import Button from '@/components/ui/Button'

export default function CarritoPage() {
  const { items, quitar, total } = useCarrito()

  if (items.length === 0) return (
    <section style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 2rem', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '1rem', color: 'var(--color-brown)' }}>Tu carrito está vacío</h1>
      <Button href="/tienda">Ir a la tienda</Button>
    </section>
  )

  return (
    <section style={{ maxWidth: '700px', margin: '0 auto', padding: '4rem 2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--color-brown)' }}>Carrito</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {items.map(({ producto, cantidad }) => (
          <div key={producto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div>
              <p style={{ fontWeight: 700 }}>{producto.nombre}</p>
              <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{cantidad} × ${producto.precio.toLocaleString('es-AR')}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>${(producto.precio * cantidad).toLocaleString('es-AR')}</span>
              <button onClick={() => quitar(producto.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-crimson)', fontSize: '1.2rem' }}>✕</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '1.3rem', fontWeight: 700 }}>Total: ${total.toLocaleString('es-AR')}</p>
        <Button href="/checkout">Ir al checkout</Button>
      </div>
    </section>
  )
}
```

- [ ] **Paso 6: Checkout page** — formulario con nombre, email, dirección + botón "Confirmar pedido". Mismo patrón que ReservaForm. POST a `/pedidos`.

- [ ] **Paso 7: Commit**
```bash
git add front/components/shop/ front/app/(shop)/ front/lib/useCarrito.ts
git commit -m "feat: shop section — catalog, product detail, cart and checkout"
```

---

## FASE 2 — Backend

### Task 10: Setup Prisma + Esquema DB

**Archivos:**
- Modificar: `back/package.json` (agregar Prisma)
- Crear: `back/prisma/schema.prisma`
- Crear: `back/.env`

- [ ] **Paso 1: Instalar Prisma**
```bash
cd back
npm install prisma @prisma/client
npx prisma init
```

- [ ] **Paso 2: Configurar .env**
```
DATABASE_URL="postgresql://user:password@localhost:5432/vuelocarmesi"
```

- [ ] **Paso 3: Definir schema**

```prisma
// back/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Experiencia {
  id          String     @id @default(cuid())
  slug        String     @unique
  nombre      String
  descripcion String
  duracion    String
  precio      Float
  capacidad   Int
  imagen      String     @default("")
  destacada   Boolean    @default(false)
  createdAt   DateTime   @default(now())
  reservas    Reserva[]
}

model Reserva {
  id                String      @id @default(cuid())
  experienciaId     String
  experiencia       Experiencia @relation(fields: [experienciaId], references: [id])
  fecha             DateTime
  cantidadPersonas  Int
  nombre            String
  email             String
  telefono          String
  notas             String?
  createdAt         DateTime    @default(now())
}

model Producto {
  id          String   @id @default(cuid())
  slug        String   @unique
  nombre      String
  descripcion String
  precio      Float
  stock       Int
  imagen      String   @default("")
  categoria   String
  createdAt   DateTime @default(now())
  itemsPedido ItemPedido[]
}

model Pedido {
  id        String       @id @default(cuid())
  nombre    String
  email     String
  direccion String
  total     Float
  createdAt DateTime     @default(now())
  items     ItemPedido[]
}

model ItemPedido {
  id         String   @id @default(cuid())
  pedidoId   String
  pedido     Pedido   @relation(fields: [pedidoId], references: [id])
  productoId String
  producto   Producto @relation(fields: [productoId], references: [id])
  cantidad   Int
  precio     Float
}
```

- [ ] **Paso 4: Crear y correr migración**
```bash
npx prisma migrate dev --name init
```

- [ ] **Paso 5: Commit**
```bash
git add back/prisma/ back/.env.example
git commit -m "feat: add Prisma schema with all domain models"
```

---

### Task 11: DTOs del Backend

**Archivos:**
- Crear: `back/src/experiencias/dto/create-experiencia.dto.ts`
- Crear: `back/src/reservas/dto/create-reserva.dto.ts`
- Crear: `back/src/productos/dto/create-producto.dto.ts`
- Crear: `back/src/pedidos/dto/create-pedido.dto.ts`

- [ ] **Paso 1: Instalar class-validator**
```bash
cd back && npm install class-validator class-transformer
```

- [ ] **Paso 2: DTOs de experiencias**

```ts
// back/src/experiencias/dto/create-experiencia.dto.ts
import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator'

export class CreateExperienciaDto {
  @IsString() nombre: string
  @IsString() slug: string
  @IsString() descripcion: string
  @IsString() duracion: string
  @IsNumber() @Min(0) precio: number
  @IsNumber() @Min(1) capacidad: number
  @IsOptional() @IsString() imagen?: string
  @IsOptional() @IsBoolean() destacada?: boolean
}
```

- [ ] **Paso 3: DTO de reserva**

```ts
// back/src/reservas/dto/create-reserva.dto.ts
import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator'

export class CreateReservaDto {
  @IsString() experienciaId: string
  @IsDateString() fecha: string
  @IsNumber() @Min(1) cantidadPersonas: number
  @IsString() nombre: string
  @IsString() email: string
  @IsString() telefono: string
  @IsOptional() @IsString() notas?: string
}
```

- [ ] **Paso 4: DTO de producto** — mismo patrón que experiencia (nombre, slug, descripcion, precio, stock, categoria).

- [ ] **Paso 5: DTO de pedido**

```ts
// back/src/pedidos/dto/create-pedido.dto.ts
import { IsString, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class ItemPedidoDto {
  @IsString() productoId: string
  @IsNumber() cantidad: number
}

export class CreatePedidoDto {
  @IsString() nombre: string
  @IsString() email: string
  @IsString() direccion: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => ItemPedidoDto) items: ItemPedidoDto[]
}
```

- [ ] **Paso 6: Habilitar ValidationPipe global en main.ts**

```ts
// back/src/main.ts
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
  app.enableCors({ origin: 'http://localhost:3000' })
  await app.listen(3001)
}
bootstrap()
```

- [ ] **Paso 7: Commit**
```bash
git add back/src/
git commit -m "feat: add DTOs, ValidationPipe, CORS config"
```

---

### Task 12: Implementar Services con Prisma

**Archivos:**
- Crear: `back/src/prisma.service.ts`
- Modificar: `back/src/experiencias/experiencias.service.ts`
- Modificar: `back/src/experiencias/experiencias.controller.ts`
- Modificar: `back/src/reservas/reservas.service.ts` + controller
- Modificar: `back/src/productos/productos.service.ts` + controller
- Modificar: `back/src/pedidos/pedidos.service.ts` + controller
- Modificar: `back/src/app.module.ts`

- [ ] **Paso 1: PrismaService**

```ts
// back/src/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()
  }
}
```

- [ ] **Paso 2: ExperienciasService**

```ts
// back/src/experiencias/experiencias.service.ts
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateExperienciaDto } from './dto/create-experiencia.dto'

@Injectable()
export class ExperienciasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.experiencia.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async findBySlug(slug: string) {
    const exp = await this.prisma.experiencia.findUnique({ where: { slug } })
    if (!exp) throw new NotFoundException(`Experiencia '${slug}' no encontrada`)
    return exp
  }

  async findById(id: string) {
    const exp = await this.prisma.experiencia.findUnique({ where: { id } })
    if (!exp) throw new NotFoundException()
    return exp
  }

  create(dto: CreateExperienciaDto) {
    return this.prisma.experiencia.create({ data: dto })
  }

  async update(id: string, dto: Partial<CreateExperienciaDto>) {
    await this.findById(id)
    return this.prisma.experiencia.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.experiencia.delete({ where: { id } })
  }
}
```

- [ ] **Paso 3: ExperienciasController**

```ts
// back/src/experiencias/experiencias.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { ExperienciasService } from './experiencias.service'
import { CreateExperienciaDto } from './dto/create-experiencia.dto'

@Controller('experiencias')
export class ExperienciasController {
  constructor(private readonly service: ExperienciasService) {}

  @Get()           findAll()                      { return this.service.findAll() }
  @Get('slug/:slug') findBySlug(@Param('slug') slug: string) { return this.service.findBySlug(slug) }
  @Get(':id')      findOne(@Param('id') id: string)          { return this.service.findById(id) }
  @Post()          create(@Body() dto: CreateExperienciaDto) { return this.service.create(dto) }
  @Patch(':id')    update(@Param('id') id: string, @Body() dto: Partial<CreateExperienciaDto>) { return this.service.update(id, dto) }
  @Delete(':id')   remove(@Param('id') id: string)           { return this.service.remove(id) }
}
```

- [ ] **Paso 4: Repetir patrón para Reservas, Productos, Pedidos**

Todos siguen el mismo patrón de service + controller. Diferencias clave:
- `ReservasService.create()` → convertir `fecha` string a `Date`
- `PedidosService.create()` → calcular `total` sumando precios de productos, crear `ItemPedido` para cada item
- `ProductosService.update()` → validar que stock no quede negativo

- [ ] **Paso 5: Actualizar app.module.ts**

```ts
// back/src/app.module.ts
import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { ExperienciasModule } from './experiencias/experiencias.module'
import { ReservasModule } from './reservas/reservas.module'
import { ProductosModule } from './productos/productos.module'
import { PedidosModule } from './pedidos/pedidos.module'

@Module({
  imports: [ExperienciasModule, ReservasModule, ProductosModule, PedidosModule],
  providers: [PrismaService],
})
export class AppModule {}
```

Cada módulo debe importar `PrismaService` en su providers array.

- [ ] **Paso 6: Smoke test manual**
```bash
cd back && npm run start:dev
# En otra terminal:
curl http://localhost:3001/experiencias
# Esperar: []
curl -X POST http://localhost:3001/experiencias \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Cacao Test","slug":"cacao-test","descripcion":"desc","duracion":"2h","precio":5000,"capacidad":10}'
curl http://localhost:3001/experiencias
# Esperar: array con 1 elemento
```

- [ ] **Paso 7: Commit**
```bash
git add back/src/
git commit -m "feat: implement all NestJS services with Prisma"
```

---

### Task 13: Tests del Backend

**Archivos:**
- Modificar: `back/src/experiencias/experiencias.controller.spec.ts` (crear si no existe)
- Crear: `back/src/reservas/reservas.controller.spec.ts`

- [ ] **Paso 1: Test de ExperienciasController**

```ts
// back/src/experiencias/experiencias.controller.spec.ts
import { Test } from '@nestjs/testing'
import { ExperienciasController } from './experiencias.controller'
import { ExperienciasService } from './experiencias.service'

const mockService = {
  findAll: jest.fn().mockResolvedValue([]),
  findBySlug: jest.fn().mockResolvedValue({ id: '1', slug: 'test' }),
  create: jest.fn().mockResolvedValue({ id: '1' }),
}

describe('ExperienciasController', () => {
  let controller: ExperienciasController

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ExperienciasController],
      providers: [{ provide: ExperienciasService, useValue: mockService }],
    }).compile()
    controller = module.get(ExperienciasController)
  })

  it('findAll returns array', async () => {
    expect(await controller.findAll()).toEqual([])
  })

  it('findBySlug delegates to service', async () => {
    const result = await controller.findBySlug('test')
    expect(mockService.findBySlug).toHaveBeenCalledWith('test')
    expect(result).toEqual({ id: '1', slug: 'test' })
  })
})
```

- [ ] **Paso 2: Correr tests**
```bash
cd back && npm run test
# Esperar: PASS
```

- [ ] **Paso 3: Commit**
```bash
git add back/src/
git commit -m "test: add controller unit tests"
```

---

## Verificación final

- [ ] `cd front && npm run build` — 0 errores
- [ ] `cd back && npm run build` — 0 errores
- [ ] Navegar todas las rutas en browser con `npm run dev`
- [ ] POST a `/reservas` desde el formulario llega al back y persiste en DB
- [ ] POST a `/pedidos` desde checkout llega al back y persiste en DB

---

## Plan completo y guardado en `docs/superpowers/plans/2026-06-19-vuelo-carmesi-portal.md`.

**Opciones de ejecución:**

**1. Subagent-Driven (recomendado)** — Despacha un subagente por tarea, revisión entre tareas, iteración rápida.
Usar skill: `superpowers:subagent-driven-development`

**2. Ejecución inline** — Ejecutar tareas en esta sesión con checkpoints.
Usar skill: `superpowers:executing-plans`

¿Cuál preferís?
