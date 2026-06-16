# Vuelo Carmesí

Portal web completo para **Vuelo Carmesí** — experiencias agroecológicas con sabor a cacao.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14+ · App Router · TypeScript |
| Backend | NestJS · TypeScript · REST API |
| Monorepo | npm workspaces |

---

## Estructura del proyecto

```
vuelo-carmesi/
  front/          → Next.js 14+ App Router
  back/           → NestJS REST API
  docs/           → Specs y planes de implementación
  Material de apoyo/ → Fuentes y recursos de marca
  package.json    → Workspaces root
```

### Frontend — Rutas (`front/app/`)

| Sección | Ruta | Descripción |
|---------|------|-------------|
| Landing | `/` | Hero, experiencias preview, sobre nosotros, galería |
| Landing | `/contacto` | Formulario de contacto |
| Reservas | `/experiencias` | Catálogo de experiencias |
| Reservas | `/experiencias/[slug]` | Detalle de experiencia |
| Reservas | `/reservar/[slug]` | Formulario de reserva |
| Reservas | `/reservar/confirmacion` | Confirmación de reserva |
| Tienda | `/tienda` | Catálogo de productos |
| Tienda | `/tienda/[slug]` | Detalle de producto |
| Tienda | `/carrito` | Carrito de compras |
| Tienda | `/checkout` | Proceso de pago |

### Backend — Módulos (`back/src/`)

| Módulo | Endpoints |
|--------|-----------|
| `experiencias` | `GET/POST /api/experiencias` · `GET/PATCH/DELETE /api/experiencias/:id` |
| `reservas` | `GET/POST /api/reservas` · `GET/PATCH /api/reservas/:id` |
| `productos` | `GET/POST /api/productos` · `GET/PATCH/DELETE /api/productos/:id` |
| `pedidos` | `POST /api/pedidos` · `GET /api/pedidos/:id` |

---

## Identidad visual

Colores y tipografías definidos como CSS custom properties en `front/styles/tokens.css`.

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-cream` | `#ffeaca` | Fondo principal |
| `--color-crimson` | `#d51312` | Color primario de marca |
| `--color-orange` | `#ea5b0c` | Acento, CTAs |
| `--color-brown` | `#872b13` | Textos, fondos |
| `--color-amber` | `#f59c00` | Highlights |
| `--color-gold` | `#fdc300` | Detalles |
| `--font-display` | Honey Lips | Títulos |
| `--font-body` | Bellota Bold | Cuerpo de texto |

> ⚠️ **Honey Lips** tiene licencia "Personal Use" — verificar licencia comercial antes de producción.

---

## Requisitos

- Node.js 18+
- npm 9+

---

## Instalación

```bash
# Clonar el repo
git clone https://github.com/YEENDJ/VueloCarmesi.git
cd VueloCarmesi

# Instalar dependencias de ambos paquetes
npm install
cd front && npm install && cd ..
cd back && npm install && cd ..
```

---

## Variables de entorno

Crear `front/.env.local` (no se commitea):

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Ver `front/.env.example` como referencia.

---

## Desarrollo

```bash
# Ambos servicios en paralelo (desde la raíz)
npm run dev

# Solo frontend → http://localhost:3000
npm run dev:front

# Solo backend → http://localhost:3001/api
npm run dev:back
```

---

## Branches

| Rama | Propósito |
|------|-----------|
| `main` | Producción |
| `develop` | Integración |
| `Yeison_DEV` | Desarrollo activo |

---

## Fuera de scope (por ahora)

- Panel de administración
- Pasarela de pago real
- Autenticación de usuarios
- Internacionalización
