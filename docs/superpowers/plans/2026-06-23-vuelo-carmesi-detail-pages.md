# Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `/experiencias/[slug]` and `/tienda/[slug]` to match the Vuelo Carmesí design handoff — hero, 2-column layouts, image gallery, sticky sidebar, quantity selector, and related products.

**Architecture:** Hybrid approach — create two reusable primitives (`ImageGallery`, `QuantitySelector`) used across both pages. Experiencia Detail is a pure Server Component; Producto Detail is a Server Component with a thin `AddToCartSection` client subcomponent for cart interaction. Layout responsiveness via CSS classes in globals.css; fluid sizing via `clamp()` in inline styles.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Inline styles + CSS custom properties

## Global Constraints

- `params` in page components is `Promise<{ slug: string }>` — always `const { slug } = await params` before using
- No Tailwind, no UI library — inline styles + CSS custom properties (`var(--color-*)`, `var(--font-*)`) only
- CSS classes for `@media` rules go in `front/app/globals.css`
- `clamp()` for fluid font sizes and heights (avoids needing extra media query rules)
- Placeholder images: `https://placehold.co/800x600/ffeaca/872b13?text=Foto` (easy to swap later)
- TypeScript strict — no `any`, no implicit undefined
- All `images` fields on types are optional (`images?: string[]`) to avoid breaking existing code

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| MODIFY | `front/lib/types/index.ts` | Add `images?`, `incluye?`, `queTraer?` fields |
| MODIFY | `front/lib/api/experiencias.ts` | Add placeholder images, incluye, queTraer to mock |
| MODIFY | `front/lib/api/productos.ts` | Add placeholder images to mock |
| MODIFY | `front/lib/useCarrito.ts` | Add optional `cantidad` param to `agregar()` |
| MODIFY | `front/components/ui/Button.tsx` | Add optional `style` prop |
| CREATE | `front/components/ui/ImageGallery.tsx` | Shared gallery: main image + up to 4 thumbnails |
| CREATE | `front/components/ui/QuantitySelector.tsx` | Quantity −/number/+ control |
| MODIFY | `front/app/globals.css` | Add `.detail-grid-exp`, `.detail-grid-prod`, `.related-grid`, `.gallery-thumbnails`, `.sidebar-sticky` with `@media` |
| REWRITE | `front/app/(booking)/experiencias/[slug]/page.tsx` | Hero + 2-col layout + sticky sidebar |
| CREATE | `front/app/(shop)/tienda/[slug]/AddToCartSection.tsx` | Client: qty selector + add-to-cart CTA |
| REWRITE | `front/app/(shop)/tienda/[slug]/page.tsx` | 2-col layout + related products (server) |

---

### Task 1: Foundation — types, mock data, Button style prop, useCarrito cantidad

**Files:**
- Modify: `front/lib/types/index.ts`
- Modify: `front/lib/api/experiencias.ts`
- Modify: `front/lib/api/productos.ts`
- Modify: `front/lib/useCarrito.ts`
- Modify: `front/components/ui/Button.tsx`

**Interfaces:**
- Produces: `Experiencia` with optional `images`, `incluye`, `queTraer`; `Producto` with optional `images`; `useCarrito.agregar(producto, cantidad?)` accepting optional quantity; `Button` accepting optional `style` prop

---

- [ ] **Step 1: Update types**

Replace the contents of `front/lib/types/index.ts` with:

```typescript
export interface Experiencia {
  id: string
  slug: string
  nombre: string
  descripcion: string
  duracion: string
  precio: number
  capacidad: number
  imagen: string
  destacada: boolean
  images?: string[]
  incluye?: string[]
  queTraer?: string[]
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
  images?: string[]
}

export interface Reserva {
  experienciaId: string
  fecha: string
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

- [ ] **Step 2: Update experiencias mock**

Replace the contents of `front/lib/api/experiencias.ts` with:

```typescript
import type { Experiencia } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL

export const MOCK_EXPERIENCIAS: Experiencia[] = [
  {
    id: '1',
    slug: 'cacao-intenso',
    nombre: 'Cacao Intenso',
    descripcion: 'Recorrido por plantaciones y degustación guiada de variedades de cacao. Conocé de primera mano el origen del chocolate artesanal junto a productores locales.',
    duracion: '4 horas',
    precio: 8500,
    capacidad: 12,
    imagen: '',
    destacada: true,
    images: [
      'https://placehold.co/800x600/d51312/ffeaca?text=Cacao+Intenso+1',
      'https://placehold.co/800x600/872b13/ffeaca?text=Cacao+Intenso+2',
      'https://placehold.co/800x600/ea5b0c/ffeaca?text=Cacao+Intenso+3',
      'https://placehold.co/800x600/f59c00/ffeaca?text=Cacao+Intenso+4',
    ],
    incluye: ['Guía bilingüe especializado', 'Degustación de 6 variedades de cacao', 'Traslado ida y vuelta', 'Cuaderno de cata'],
    queTraer: ['Ropa cómoda', 'Calzado cerrado', 'Protector solar', 'Cámara de fotos'],
  },
  {
    id: '2',
    slug: 'cacao-y-arte',
    nombre: 'Cacao & Arte',
    descripcion: 'Taller de chocolatería artesanal con artistas locales. Creá tu propia tableta de chocolate y aprendé técnicas de decoración.',
    duracion: '3 horas',
    precio: 7000,
    capacidad: 8,
    imagen: '',
    destacada: false,
    images: [
      'https://placehold.co/800x600/d51312/ffeaca?text=Cacao+Arte+1',
      'https://placehold.co/800x600/872b13/ffeaca?text=Cacao+Arte+2',
      'https://placehold.co/800x600/ea5b0c/ffeaca?text=Cacao+Arte+3',
      'https://placehold.co/800x600/f59c00/ffeaca?text=Cacao+Arte+4',
    ],
    incluye: ['Todos los materiales del taller', 'Chocolate artesanal para llevar (300g)', 'Certificado de participación'],
    queTraer: ['Ropa que pueda mancharse', 'Ganas de crear'],
  },
  {
    id: '3',
    slug: 'amanecer-agroecologico',
    nombre: 'Amanecer Agroecológico',
    descripcion: 'Tour al amanecer con desayuno orgánico incluido. Viví la magia de la cosecha con los primeros rayos del sol.',
    duracion: '5 horas',
    precio: 9500,
    capacidad: 10,
    imagen: '',
    destacada: true,
    images: [
      'https://placehold.co/800x600/d51312/ffeaca?text=Amanecer+1',
      'https://placehold.co/800x600/872b13/ffeaca?text=Amanecer+2',
      'https://placehold.co/800x600/ea5b0c/ffeaca?text=Amanecer+3',
      'https://placehold.co/800x600/f59c00/ffeaca?text=Amanecer+4',
    ],
    incluye: ['Desayuno orgánico completo', 'Guía agroecológico certificado', 'Transporte al punto de partida'],
    queTraer: ['Abrigo (madrugada fría)', 'Linterna', 'Ropa cómoda'],
  },
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

- [ ] **Step 3: Update productos mock**

Replace the contents of `front/lib/api/productos.ts` with:

```typescript
import type { Producto } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL

export const MOCK_PRODUCTOS: Producto[] = [
  {
    id: '1',
    slug: 'cacao-en-polvo-500g',
    nombre: 'Cacao en Polvo 500g',
    descripcion: 'Cacao puro sin azúcar, ideal para recetas de repostería y bebidas calientes. Sin aditivos, sin gluten.',
    precio: 2800,
    stock: 50,
    imagen: '',
    categoria: 'cacao',
    images: [
      'https://placehold.co/800x800/ffeaca/872b13?text=Cacao+Polvo+1',
      'https://placehold.co/800x800/f59c00/872b13?text=Cacao+Polvo+2',
      'https://placehold.co/800x800/d51312/ffeaca?text=Cacao+Polvo+3',
      'https://placehold.co/800x800/ea5b0c/ffeaca?text=Cacao+Polvo+4',
    ],
  },
  {
    id: '2',
    slug: 'chocolate-oscuro-70',
    nombre: 'Chocolate Oscuro 70%',
    descripcion: 'Tableta artesanal de 100g. Alto contenido de cacao, sin azúcar añadida. Origen único, cosecha del año.',
    precio: 1500,
    stock: 30,
    imagen: '',
    categoria: 'chocolate',
    images: [
      'https://placehold.co/800x800/ffeaca/872b13?text=Chocolate+1',
      'https://placehold.co/800x800/872b13/ffeaca?text=Chocolate+2',
      'https://placehold.co/800x800/d51312/ffeaca?text=Chocolate+3',
      'https://placehold.co/800x800/fdc300/872b13?text=Chocolate+4',
    ],
  },
  {
    id: '3',
    slug: 'nibs-de-cacao',
    nombre: 'Nibs de Cacao',
    descripcion: 'Trozos crujientes de cacao tostado, 200g. Perfectos para agregar a granolas, smoothies y postres.',
    precio: 1800,
    stock: 40,
    imagen: '',
    categoria: 'cacao',
    images: [
      'https://placehold.co/800x800/ffeaca/872b13?text=Nibs+1',
      'https://placehold.co/800x800/f59c00/872b13?text=Nibs+2',
      'https://placehold.co/800x800/ea5b0c/ffeaca?text=Nibs+3',
      'https://placehold.co/800x800/872b13/ffeaca?text=Nibs+4',
    ],
  },
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
    return MOCK_PRODUCTOS.find(p => p.slug === slug) ?? null
  } catch {
    return MOCK_PRODUCTOS.find(p => p.slug === slug) ?? null
  }
}
```

- [ ] **Step 4: Extend useCarrito.agregar to accept cantidad**

In `front/lib/useCarrito.ts`, change the `agregar` function signature from `(producto: Producto)` to `(producto: Producto, cantidad = 1)` and update the logic:

```typescript
const agregar = (producto: Producto, cantidad = 1) => {
  setItems(prev => {
    const existente = prev.find(i => i.producto.id === producto.id)
    const nuevos = existente
      ? prev.map(i =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        )
      : [...prev, { producto, cantidad }]
    localStorage.setItem('carrito', JSON.stringify(nuevos))
    return nuevos
  })
}
```

The default `cantidad = 1` keeps all existing call sites (e.g. `ProductoCard`) working without changes.

- [ ] **Step 5: Add style prop to Button**

In `front/components/ui/Button.tsx`, add `style?: React.CSSProperties` to `ButtonProps` and spread it last (so it overrides defaults):

```typescript
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  href?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: React.CSSProperties
}

export default function Button({
  children, variant = 'primary', href, onClick, disabled, type = 'button', style: styleProp,
}: ButtonProps) {
  const style = { ...styles.base, ...styles[variant], opacity: disabled ? 0.5 : 1, ...styleProp }
  if (href) return <Link href={href} style={style}>{children}</Link>
  return <button type={type} onClick={onClick} disabled={disabled} style={style}>{children}</button>
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd front && npx tsc --noEmit
```

Expected: no errors. If `agregar` call sites complain, confirm the default `cantidad = 1` is in place.

- [ ] **Step 7: Commit**

```bash
git add front/lib/types/index.ts front/lib/api/experiencias.ts front/lib/api/productos.ts front/lib/useCarrito.ts front/components/ui/Button.tsx
git commit -m "feat: extend types, mock data, useCarrito, and Button for detail pages"
```

---

### Task 2: ImageGallery Component

**Files:**
- Create: `front/components/ui/ImageGallery.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `ImageGallery({ images: string[], alt: string, aspectRatio?: '1/1' | '4/3' })` — default client component with internal `activeIndex` state

---

- [ ] **Step 1: Create the component**

Create `front/components/ui/ImageGallery.tsx`:

```typescript
'use client'
import { useState } from 'react'

interface ImageGalleryProps {
  images: string[]
  alt: string
  aspectRatio?: '1/1' | '4/3'
}

export default function ImageGallery({ images, alt, aspectRatio = '1/1' }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div style={{
        aspectRatio,
        backgroundColor: 'var(--color-cream)',
        border: '2px dashed var(--color-brown)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.5,
      }}>
        <span style={{ fontSize: '3rem' }}>🍫</span>
      </div>
    )
  }

  const displayed = images.slice(0, 4)

  return (
    <div>
      {/* Main image */}
      <div style={{ aspectRatio, borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
        <img
          src={displayed[activeIndex]}
          alt={`${alt} ${activeIndex + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Thumbnails — hidden on mobile via .gallery-thumbnails class */}
      {displayed.length > 1 && (
        <div className="gallery-thumbnails" style={{ display: 'flex', gap: '8px' }}>
          {displayed.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              style={{
                width: 64,
                height: 64,
                padding: 0,
                borderRadius: '6px',
                overflow: 'hidden',
                border: i === activeIndex
                  ? '2px solid var(--color-crimson)'
                  : '2px solid transparent',
                cursor: 'pointer',
                flexShrink: 0,
                background: 'none',
              }}
            >
              <img
                src={src}
                alt={`${alt} miniatura ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd front && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add front/components/ui/ImageGallery.tsx
git commit -m "feat: add ImageGallery shared component"
```

---

### Task 3: QuantitySelector Component

**Files:**
- Create: `front/components/ui/QuantitySelector.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `QuantitySelector({ value: number, onChange: (n: number) => void, min?: number, max?: number })`

---

- [ ] **Step 1: Create the component**

Create `front/components/ui/QuantitySelector.tsx`:

```typescript
interface QuantitySelectorProps {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = Infinity,
}: QuantitySelectorProps) {
  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: 40,
    height: 40,
    border: '1px solid var(--color-brown)',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: 'var(--color-brown)',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    fontSize: '1.25rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  })

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        style={btnStyle(value <= min)}
      >
        −
      </button>
      <span style={{
        minWidth: 40,
        textAlign: 'center',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: '1.125rem',
        color: 'var(--color-brown)',
      }}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        style={btnStyle(value >= max)}
      >
        +
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd front && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add front/components/ui/QuantitySelector.tsx
git commit -m "feat: add QuantitySelector shared component"
```

---

### Task 4: Responsive CSS Classes

**Files:**
- Modify: `front/app/globals.css`

**Interfaces:**
- Produces: CSS classes `.detail-grid-exp`, `.detail-grid-prod`, `.related-grid`, `.gallery-thumbnails`, `.sidebar-sticky` — used by Tasks 5 and 6

---

- [ ] **Step 1: Add CSS classes to globals.css**

Append to the end of `front/app/globals.css`:

```css
/* Detail page responsive layouts */
.detail-grid-exp {
  display: grid;
  grid-template-columns: 65fr 35fr;
  gap: 48px;
  align-items: start;
}

.detail-grid-prod {
  display: grid;
  grid-template-columns: 55fr 45fr;
  gap: 64px;
  align-items: start;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 767px) {
  .detail-grid-exp,
  .detail-grid-prod {
    grid-template-columns: 1fr;
  }

  .related-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .gallery-thumbnails {
    display: none !important;
  }

  .sidebar-sticky {
    position: static !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add front/app/globals.css
git commit -m "feat: add responsive CSS classes for detail page layouts"
```

---

### Task 5: Rewrite Experiencia Detail Page

**Files:**
- Rewrite: `front/app/(booking)/experiencias/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getExperienciaBySlug(slug)` → `Experiencia | null`; `getExperiencias()` → `Experiencia[]`; `ImageGallery`; `Button` (with style prop); `Badge`; CSS classes from Task 4
- Produces: `/experiencias/[slug]` route — hero + 2-col layout + sticky sidebar

---

- [ ] **Step 1: Rewrite the page**

Replace the full contents of `front/app/(booking)/experiencias/[slug]/page.tsx` with:

```typescript
import { getExperienciaBySlug, getExperiencias } from '@/lib/api/experiencias'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ImageGallery from '@/components/ui/ImageGallery'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const experiencias = await getExperiencias()
  return experiencias.map(e => ({ slug: e.slug }))
}

export default async function ExperienciaDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const exp = await getExperienciaBySlug(slug)
  if (!exp) notFound()

  const images = exp.images ?? []
  const heroImage = images[0] ?? ''
  const incluye = exp.incluye ?? []
  const queTraer = exp.queTraer ?? []

  return (
    <>
      {/* Hero */}
      <div
        style={{
          position: 'relative',
          height: 'clamp(300px, 40vw, 480px)',
          backgroundImage: heroImage ? `url(${heroImage})` : 'none',
          backgroundColor: 'var(--color-brown)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />
        <h1
          style={{
            position: 'relative',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            color: 'var(--color-cream)',
            textAlign: 'center',
            padding: '0 2rem',
            lineHeight: 1.15,
          }}
        >
          {exp.nombre}
        </h1>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <Badge color="amber">Disponible</Badge>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
        <div className="detail-grid-exp">
          {/* Left column — content */}
          <div>
            <h2 style={{ color: 'var(--color-crimson)', marginBottom: '16px' }}>
              Sobre esta experiencia
            </h2>
            <p
              style={{
                fontSize: '1rem',
                lineHeight: 1.8,
                color: 'var(--color-brown)',
                marginBottom: '32px',
              }}
            >
              {exp.descripcion}
            </p>

            {incluye.length > 0 && (
              <>
                <h3 style={{ color: 'var(--color-brown)', marginBottom: '12px' }}>¿Qué incluye?</h3>
                <ul style={{ listStyle: 'none', marginBottom: '32px' }}>
                  {incluye.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                        color: 'var(--color-brown)',
                      }}
                    >
                      <span style={{ color: 'var(--color-amber)', fontWeight: 700, flexShrink: 0 }}>
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {queTraer.length > 0 && (
              <>
                <h3 style={{ color: 'var(--color-brown)', marginBottom: '12px' }}>¿Qué traer?</h3>
                <ul style={{ listStyle: 'none', marginBottom: '32px' }}>
                  {queTraer.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                        color: 'var(--color-brown)',
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div style={{ borderTop: '2px solid var(--color-gold)', marginBottom: '32px' }} />

            <ImageGallery images={images} alt={exp.nombre} aspectRatio="4/3" />
          </div>

          {/* Right column — sticky sidebar */}
          <div>
            <div
              className="sidebar-sticky"
              style={{
                position: 'sticky',
                top: '88px',
                backgroundColor: 'var(--color-cream)',
                border: '1px solid rgba(135,43,19,0.1)',
                borderRadius: '12px',
                padding: '28px',
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <span
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: 'var(--color-amber)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  ${exp.precio.toLocaleString('es-AR')}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '24px',
                  marginBottom: '20px',
                  color: 'var(--color-brown)',
                  fontSize: '0.9rem',
                }}
              >
                <span>⏱ {exp.duracion}</span>
                <span>👥 {exp.capacidad} personas</span>
              </div>

              <div style={{ borderTop: '2px solid var(--color-gold)', marginBottom: '20px' }} />

              <div style={{ marginBottom: '12px' }}>
                <Button
                  href={`/reservar/${exp.slug}`}
                  variant="primary"
                  style={{ display: 'block', textAlign: 'center', width: '100%' }}
                >
                  Reservar ahora
                </Button>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--color-brown)', opacity: 0.6 }}>
                Sin compromiso · Cancelación flexible
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd front && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual verification**

Start dev server (`npm run dev` from `front/`), navigate to `/experiencias/cacao-intenso`.

Check:
- Hero renders with colored background (placeholder image) and overlay
- H1 with experiencia name over the hero
- "Disponible" badge top-right
- Two-column layout: content left, sidebar card right
- "Sobre esta experiencia", "¿Qué incluye?" (checkmarks), "¿Qué traer?" (bullets) sections visible
- Sidebar shows price, duration, capacity, "Reservar ahora" button
- "Reservar ahora" links to `/reservar/cacao-intenso`
- ImageGallery shows main photo + 4 thumbnails; clicking thumbnail changes main image
- On mobile (≤767px): single column, sidebar below content, thumbnails hidden

- [ ] **Step 4: Commit**

```bash
git add front/app/(booking)/experiencias/[slug]/page.tsx
git commit -m "feat: rewrite experiencia detail page with hero, 2-col layout, and sticky sidebar"
```

---

### Task 6: AddToCartSection + Rewrite Producto Detail Page

**Files:**
- Create: `front/app/(shop)/tienda/[slug]/AddToCartSection.tsx`
- Rewrite: `front/app/(shop)/tienda/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getProductoBySlug(slug)` → `Producto | null`; `getProductos()` → `Producto[]`; `ImageGallery`; `QuantitySelector`; `useCarrito.agregar(producto, cantidad)`; `Button` (with style prop); `Badge`; `ProductoCard` from `@/components/shop/ProductoCard`; CSS classes from Task 4
- Produces: `/tienda/[slug]` route — 2-col layout + related products

---

- [ ] **Step 1: Create AddToCartSection client component**

Create `front/app/(shop)/tienda/[slug]/AddToCartSection.tsx`:

```typescript
'use client'
import { useState } from 'react'
import type { Producto } from '@/lib/types'
import { useCarrito } from '@/lib/useCarrito'
import QuantitySelector from '@/components/ui/QuantitySelector'
import Button from '@/components/ui/Button'

export default function AddToCartSection({ producto }: { producto: Producto }) {
  const [cantidad, setCantidad] = useState(1)
  const { agregar } = useCarrito()
  const sinStock = producto.stock === 0

  if (sinStock) {
    return (
      <div>
        <Button
          disabled
          style={{ display: 'block', textAlign: 'center', width: '100%' }}
        >
          Agregar al carrito
        </Button>
        <p style={{ marginTop: '8px', fontSize: '0.875rem', color: 'var(--color-brown)', opacity: 0.6 }}>
          Sin stock disponible
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <QuantitySelector
          value={cantidad}
          onChange={setCantidad}
          min={1}
          max={producto.stock}
        />
      </div>
      <p style={{ marginBottom: '16px', fontSize: '0.875rem', color: 'var(--color-brown)', opacity: 0.6 }}>
        {producto.stock} unidades disponibles
      </p>
      <Button
        onClick={() => agregar(producto, cantidad)}
        style={{ display: 'block', textAlign: 'center', width: '100%' }}
      >
        Agregar al carrito
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite the producto detail page**

Replace the full contents of `front/app/(shop)/tienda/[slug]/page.tsx` with:

```typescript
import { getProductoBySlug, getProductos } from '@/lib/api/productos'
import Badge from '@/components/ui/Badge'
import ImageGallery from '@/components/ui/ImageGallery'
import ProductoCard from '@/components/shop/ProductoCard'
import AddToCartSection from './AddToCartSection'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const productos = await getProductos()
  return productos.map(p => ({ slug: p.slug }))
}

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [producto, todos] = await Promise.all([
    getProductoBySlug(slug),
    getProductos(),
  ])
  if (!producto) notFound()

  const images = producto.images ?? []

  const relacionados = todos
    .filter(p => p.categoria === producto.categoria && p.slug !== slug)
    .slice(0, 4)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Main 2-column grid */}
      <div className="detail-grid-prod">
        {/* Gallery */}
        <div>
          <ImageGallery images={images} alt={producto.nombre} aspectRatio="1/1" />
        </div>

        {/* Info */}
        <div>
          <div style={{ marginBottom: '12px' }}>
            <Badge color="amber">{producto.categoria}</Badge>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              color: 'var(--color-brown)',
              marginBottom: '12px',
              lineHeight: 1.15,
            }}
          >
            {producto.nombre}
          </h1>

          <p
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--color-amber)',
              fontFamily: 'var(--font-body)',
              marginBottom: '16px',
            }}
          >
            ${producto.precio.toLocaleString('es-AR')}
          </p>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              color: 'var(--color-brown)',
              marginBottom: '24px',
            }}
          >
            {producto.descripcion}
          </p>

          <div style={{ borderTop: '2px solid var(--color-gold)', marginBottom: '24px' }} />

          <AddToCartSection producto={producto} />
        </div>
      </div>

      {/* Related products */}
      {relacionados.length > 0 && (
        <div style={{ marginTop: '64px' }}>
          <div style={{ borderTop: '2px solid var(--color-gold)', marginBottom: '32px' }} />
          <h2 style={{ color: 'var(--color-crimson)', marginBottom: '24px' }}>
            También te puede gustar
          </h2>
          <div className="related-grid">
            {relacionados.map(p => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd front && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual verification**

Navigate to `/tienda/cacao-en-polvo-500g`.

Check:
- 2-column layout: gallery left, info right
- Gallery shows main image + 4 thumbnails; clicking thumbnail changes main image
- H1 with display font (Honey Lips), amber price, brown description
- Gold separator
- QuantitySelector showing `1` with `−` disabled (at min=1) and `+` enabled up to stock
- "X unidades disponibles" caption updates correctly
- "Agregar al carrito" adds the selected quantity to cart; verify at `/carrito`
- "También te puede gustar" shows up to 2 other `cacao` products in a 4-col grid (only 2 exist, so 2 cards)
- Navigate to `/tienda/chocolate-oscuro-70` — related section should show nibs and cacao (different categoria — actually chocolate has no siblings, section should not render)
- On mobile (≤767px): single column, thumbnails hidden, grid 2-col

- [ ] **Step 5: Commit**

```bash
git add front/app/(shop)/tienda/[slug]/AddToCartSection.tsx front/app/(shop)/tienda/[slug]/page.tsx
git commit -m "feat: rewrite producto detail page with gallery, qty selector, and related products"
```

---

## Self-Review

**Spec coverage:**
- ✅ Hero experiencia (image, overlay, H1, badge)
- ✅ 2-col layout experiencia (65/35) + sticky sidebar
- ✅ Contenido: descripcion, incluye (checkmarks), queTraer (bullets), galería
- ✅ Sidebar: precio, duración, capacidad, CTA "Reservar ahora", caption
- ✅ 2-col layout producto (55/45)
- ✅ ImageGallery con thumbnails (shared)
- ✅ QuantitySelector min/max con disabled states
- ✅ AddToCartSection con stock=0 handling
- ✅ Sección "También te puede gustar" filtrada por categoria
- ✅ Responsive: single-col mobile, thumbnails ocultos, sidebar static
- ✅ params awaited con patrón Next.js 16
- ✅ Placeholder images array (swappable)
- ✅ Tipos opcionales para no romper codebase existente

**Out of scope (not covered — intentional):**
- Hover animations en cards
- Swipe gesture en galería mobile
- Tests automatizados
