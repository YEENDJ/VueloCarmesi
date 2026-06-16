# Vuelo Carmesí — Portal Web

**Fecha:** 2026-06-15  
**Stack:** Monorepo · Next.js 14+ (frontend) · NestJS (backend) · TypeScript

---

## Resumen

Portal web completo para Vuelo Carmesí, marca de experiencias agroecológicas con sabor a cacao. Combina landing institucional, plataforma de reservas y tienda online. Estructura monorepo con frontend (Next.js) y backend (NestJS) independientes que se comunican vía API REST.

---

## Identidad Visual

### Paleta de colores (fuente: Manual de Marca)

| Token CSS              | Hex       | Pantone            | Uso                          |
|------------------------|-----------|--------------------|------------------------------|
| `--color-cream`        | `#ffeaca` | 7506C              | Fondo principal, superficies |
| `--color-crimson`      | `#d51312` | 485C               | Color primario de marca      |
| `--color-orange`       | `#ea5b0c` | Bright Orange C    | Acento secundario, CTAs      |
| `--color-brown`        | `#872b13` | 174C               | Textos oscuros, fondos rich  |
| `--color-amber`        | `#f59c00` | 137C               | Highlights, badges           |
| `--color-gold`         | `#fdc300` | 116C               | Detalles decorativos         |

### Tipografías

- **Honey Lips** — títulos y headings (H1, H2) · archivo: `Honey Lips Personal Use.ttf` ⚠️ verificar licencia comercial
- **Bellota Bold** — cuerpo de texto y párrafos · archivos: `Bellota-Bold.otf` / `Bellota-Bold.ttf`

Fuentes disponibles en `Material de apoyo/Fonts/`. Se copiarán a `front/public/fonts/` y se cargarán con `@font-face`.

### Personalidad de marca

- Héroe 70%: proactivo, aventurero, valiente, recursivo
- Sabio 30%: experto, confiable, analítico, competente

---

## Arquitectura

**Enfoque:** Monorepo con dos paquetes independientes. El frontend (Next.js) consume la API REST del backend (NestJS). Comunicación via HTTP con variables de entorno para la URL base de la API.

```
vuelo-carmesi/               ← raíz del monorepo
  front/                     ← Next.js 14+ App Router
  back/                      ← NestJS REST API
  package.json               ← workspaces root
```

### Frontend — Mapa de páginas

#### Landing `(landing)`
| Ruta | Descripción |
|------|-------------|
| `/` | Hero + propuesta de valor + secciones principales |
| `/contacto` | Formulario de contacto |

La landing es una single-page con secciones: Hero, Experiencias (preview), Sobre nosotros, Galería, CTA Reserva.

#### Reservas `(booking)`
| Ruta | Descripción |
|------|-------------|
| `/experiencias` | Catálogo de experiencias disponibles |
| `/experiencias/[slug]` | Detalle de una experiencia |
| `/reservar/[slug]` | Formulario de reserva |
| `/reservar/confirmacion` | Pantalla de confirmación exitosa |

#### Tienda `(shop)`
| Ruta | Descripción |
|------|-------------|
| `/tienda` | Catálogo de productos (cacao, chocolates, etc.) |
| `/tienda/[slug]` | Detalle de producto |
| `/carrito` | Carrito de compras |
| `/checkout` | Proceso de pago |

### Backend — Módulos NestJS

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| `ExperienciasModule` | `GET/POST /experiencias` · `GET/PATCH/DELETE /experiencias/:id` | CRUD de experiencias agroecológicas |
| `ReservasModule` | `GET/POST /reservas` · `GET/PATCH /reservas/:id` | Gestión de reservas |
| `ProductosModule` | `GET/POST /productos` · `GET/PATCH/DELETE /productos/:id` | CRUD de productos de tienda |
| `PedidosModule` | `POST /pedidos` · `GET /pedidos/:id` | Gestión de pedidos |

---

## Estructura de carpetas

```
vuelo-carmesi/
  front/
    app/
      (landing)/
        layout.tsx
        page.tsx
        contacto/page.tsx
      (booking)/
        layout.tsx
        experiencias/
          page.tsx
          [slug]/page.tsx
        reservar/
          [slug]/page.tsx
          confirmacion/page.tsx
      (shop)/
        layout.tsx
        tienda/
          page.tsx
          [slug]/page.tsx
        carrito/page.tsx
        checkout/page.tsx
      layout.tsx
      globals.css
    components/
      ui/          · Button · Card · Badge · Input
      layout/      · Navbar · Footer · Hero
      booking/     · ExperienciaCard · ReservaForm
      shop/        · ProductoCard · Carrito
    lib/
      api/         · clientes HTTP para consumir el back
      utils/
      types/
    styles/
      tokens.css
    public/
      images/
      fonts/

  back/
    src/
      experiencias/
        experiencias.module.ts
        experiencias.controller.ts
        experiencias.service.ts
        dto/
      reservas/
        reservas.module.ts
        reservas.controller.ts
        reservas.service.ts
        dto/
      productos/
        productos.module.ts
        productos.controller.ts
        productos.service.ts
        dto/
      pedidos/
        pedidos.module.ts
        pedidos.controller.ts
        pedidos.service.ts
        dto/
      app.module.ts
      main.ts

  package.json     ← workspaces: ["front", "back"]
  .gitignore
```

---

## Tokens CSS de marca

`front/styles/tokens.css` centralizará todas las variables de diseño:

```css
:root {
  --color-cream:   #ffeaca;
  --color-crimson: #d51312;
  --color-orange:  #ea5b0c;
  --color-brown:   #872b13;
  --color-amber:   #f59c00;
  --color-gold:    #fdc300;

  --font-display: 'Honey Lips', cursive;
  --font-body:    'Bellota Bold', sans-serif;
}
```

---

## Decisiones técnicas

- **Monorepo** con npm workspaces (o pnpm workspaces)
- **Next.js 14+ App Router** con Server Components por defecto
- **NestJS** como API REST independiente
- **TypeScript** en ambos paquetes
- **Comunicación:** fetch desde Next.js hacia `NEXT_PUBLIC_API_URL` (env var)
- **CSS Modules** o Tailwind con tokens de marca (a definir en implementación)
- **Base de datos:** a definir al construir cada módulo (Postgres + Prisma es la opción natural para NestJS)
- **Autenticación:** a definir cuando se construya el flujo de reservas/checkout

---

## Fuera de scope (por ahora)

- Panel de administración
- Pasarela de pago real
- Sistema de autenticación de usuarios
- Internacionalización
