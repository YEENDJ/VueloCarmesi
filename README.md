
# Vuelo Carmesí

Portal web completo para **Vuelo Carmesí** — experiencias agroecológicas con sabor a cacao.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 · App Router · TypeScript |
| Backend | NestJS 11 · Prisma 7 · TypeScript · REST API |
| Base de datos | PostgreSQL (Neon) |
| Idiomas | next-intl · español (raíz) e inglés (`/en`) |
| Monorepo | npm workspaces |

> **Next 16, no 14.** La versión importa: hay APIs que cambiaron de nombre o de
> firma respecto a lo que está escrito en la mayoría de tutoriales —`params` es
> una promesa, `middleware.ts` pasó a llamarse `proxy.ts`, `revalidateTag` pide
> un segundo argumento—. Antes de escribir código de Next, leer la guía que
> corresponda en `node_modules/next/dist/docs/`, como recuerda `front/AGENTS.md`.

---

## Estructura del proyecto

```
vuelo-carmesi/
  front/          → Next.js 16 App Router
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
| Contenido editable (experiencias, productos, hero) | Cloudinary | Panel admin → `POST /api/admin/uploads`, que reenvía a `POST /uploads/image` |

El portafolio comercial lee de la **misma** biblioteca que la web: cada foto existe una
sola vez. Detalle y catálogo completo en [`docs/catalogo-fotos.md`](docs/catalogo-fotos.md).

### Frontend — Rutas (`front/app/[locale]/`)

El español vive en la raíz sin prefijo y el inglés bajo `/en`, con el segmento
traducido. El mapa completo está en `front/lib/i18n/routing.ts`, que es la
fuente: esta tabla es un resumen y puede quedarse atrás.

| Sección | Español | Inglés |
|---------|---------|--------|
| Landing | `/` | `/en` |
| Landing | `/sobre-nosotros` | `/en/about` |
| Landing | `/aviturismo` | `/en/birding` |
| Landing | `/contacto` | `/en/contact` |
| Reservas | `/experiencias` | `/en/experiences` |
| Reservas | `/experiencias/[slug]` | `/en/experiences/[slug]` |
| Reservas | `/reservar/[slug]` | `/en/book/[slug]` |
| Reservas | `/reservar/confirmacion` | `/en/book/confirmation` |
| Tienda | `/tienda` | `/en/shop` |
| Tienda | `/tienda/[slug]` | `/en/shop/[slug]` |
| Tienda | `/carrito` | `/en/cart` |
| Tienda | `/checkout` | `/en/checkout` |
| Tienda | `/checkout/confirmacion` | `/en/checkout/confirmation` |
| Legal | `/politicas` | `/en/policies` |
| Legal | `/politicas/cancelacion` | `/en/policies/cancellation` |
| Legal | `/politicas/proteccion-infancia` | `/en/policies/child-protection` |
| Panel | `/admin` | — (monolingüe, fuera de `[locale]`) |

El slug de las fichas también se traduce: `/experiencias/experiencia-cacaotera`
↔ `/en/experiences/cacao-experience`.

### Backend — Módulos (`back/src/`)

**Sin prefijo `/api`.** El backend no usa `setGlobalPrefix`: las rutas cuelgan
de la raíz. `/api/experiencias` responde 404.

| Módulo | Endpoints |
|--------|-----------|
| `experiencias` | `GET/POST /experiencias` · `GET /experiencias/slug/:slug` · `GET/PATCH/DELETE /experiencias/:id` |
| `productos` | `GET/POST /productos` · `GET /productos/slug/:slug` · `GET/PATCH/DELETE /productos/:id` |
| `reservas` | `GET/POST /reservas` · `GET/PATCH/DELETE /reservas/:id` |
| `pedidos` | `POST /pedidos` · `GET /pedidos/:id` |
| `site-config` | `GET /site-config` · `PATCH /site-config` (admin) |
| `traduccion` | Sin endpoints: lo usan experiencias y productos al guardar |

Los `GET` de catálogo aceptan `?idioma=en` para devolver la versión inglesa.
Sin el parámetro responden en español, que es el original.

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

Ninguno de los dos archivos se commitea. `.env.example` de cada paquete es la
referencia.

`front/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Sin `/api` al final.** El backend no tiene prefijo global, así que con
`http://localhost:3001/api` todas las peticiones dan 404.

`back/.env`:

```
DATABASE_URL=postgresql://…
DEEPL_API_KEY=…:fx
```

`DEEPL_API_KEY` es opcional para levantar el proyecto: sin ella el backend
arranca y guarda solo en español. Con ella, cada experiencia o producto que se
guarde se traduce al inglés automáticamente. El sufijo `:fx` es parte de la
clave del plan gratuito y hay que copiarlo — es lo que decide contra qué
servidor de DeepL se habla.

> `DATABASE_URL` apunta a la **única** base de datos, que es la de producción.
> Ver la sección de despliegue antes de correr migraciones.

---

## Desarrollo

```bash
# Ambos servicios en paralelo (desde la raíz)
npm run dev

# Solo frontend → http://localhost:3000
npm run dev:front

# Solo backend → http://localhost:3001
npm run dev:back
```

El panel de administración queda en http://localhost:3000/admin y la versión
inglesa en http://localhost:3000/en.

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
