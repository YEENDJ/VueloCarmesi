
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
    public/images/  → biblioteca de fotos (ver docs/catalogo-fotos.md)
  back/           → NestJS REST API
  portafolio/     → portafolio comercial: fuente + generador (se publica en /portafolio)
  docs/           → Specs, catálogo de fotos, reportes de Lighthouse
  assets/originales/ → originales de cámara, sin versionar
  Material de apoyo/ → Fuentes y recursos de marca
  package.json    → Workspaces root
```

### Imágenes

Dos caminos, según si el contenido es editable sin tocar código:

| Tipo | Dónde vive | Cómo se sube |
|------|-----------|--------------|
| Contenido de autor (landing, secciones fijas) | `front/public/images/` | Se commitea con el código |
| Contenido editable (experiencias, productos, hero) | Cloudinary | Panel admin → `POST /api/uploads/image` |

El portafolio comercial lee de la **misma** biblioteca que la web: cada foto existe una
sola vez. Detalle y catálogo completo en [`docs/catalogo-fotos.md`](docs/catalogo-fotos.md).

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

## Despliegue

**Son dos plataformas distintas, y esto importa más de lo que parece:** mergear
a `main` despliega el front en segundos y el backend puede tardar bastante más,
o fallar por su cuenta. Durante esa ventana el sitio corre con front nuevo y
backend viejo, y el síntoma es siempre el mismo — textos fijos en el idioma
nuevo y contenido de la base en español, porque el backend viejo ignora
`?idioma`. Antes de dar por roto el i18n, comprobar cuál de los dos falta.

| Pieza | Plataforma | URL | Se despliega |
|---|---|---|---|
| Front | **Vercel** | https://www.vuelocarmesi.com | Automático al mergear a `main` |
| Backend | **Render** | https://vuelocarmesi.onrender.com | Al mergear a `main` (verificar en Events si falló) |
| Base de datos | **Neon** (Postgres) | — | No se despliega |

> ⚠️ **Hay UNA sola base de datos.** No existe entorno de pruebas separado: lo
> que corras en local contra `DATABASE_URL` toca producción. Por eso las
> migraciones van siempre con `prisma migrate deploy`, nunca con `migrate dev`,
> que puede ofrecer resetear.

### Variables de entorno

No están en el repo: viven en el panel de cada plataforma. `.env.example` de
cada paquete lista cuáles hacen falta.

| Variable | Dónde | Si falta |
|---|---|---|
| `DEEPL_API_KEY` | Render | El backend arranca igual y guarda solo en español. Solo deja un `WARN`: **el fallo es silencioso**. Copiar la clave con el sufijo `:fx`, que es lo que hace que `deepl-node` hable con el servidor del plan gratuito. |
| `NEXT_PUBLIC_SITE_URL` | Vercel | Los `hreflang` y `canonical` salen con URLs relativas y la indexación bilingüe no sirve. |
| `NEXT_PUBLIC_API_URL` | Vercel | El front no encuentra el backend. |
| `DATABASE_URL` | Render | — |

> `NEXT_PUBLIC_*` **no es secreto**: Next incrusta esas variables en el
> JavaScript que descarga cada visitante, así que cualquiera puede leerlas del
> sitio publicado. Marcarlas como *Secret* en Vercel no protege de nada y solo
> impide consultarlas desde el panel. Lo que protege los endpoints de admin es
> el `AdminGuard` y el CORS, no que la URL sea difícil de encontrar.

### Cachés al desplegar

Un cambio correcto puede tardar en verse, y no es un fallo:

| Dato | Caduca en |
|---|---|
| Experiencias y productos | 60 s |
| Configuración del sitio | 300 s |

Guardar Configuración desde el panel invalida su caché al momento
(`revalidateTag` en `front/app/api/admin/site-config/route.ts`). Experiencias y
productos todavía no: ahí hay que esperar el minuto.

---

## Branches

| Rama | Propósito |
|------|-----------|
| `main` | Producción |
| `develop` | Integración |
| `Yeison_DEV` | Desarrollo activo |

---

## Fuera de scope (por ahora)

- Pasarela de pago real
- Autenticación de usuarios (el panel usa una cookie de sesión, no cuentas)
