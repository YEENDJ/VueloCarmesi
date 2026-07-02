# Handoff: Vuelo Carmesí — Portal web completo

## Resumen

**Vuelo Carmesí** es una marca de experiencias agroecológicas con sabor a cacao (personalidad 70% Héroe / 30% Sabio). Este paquete contiene el sistema de diseño completo + las 10 vistas del portal: landing, contacto, catálogo de experiencias, detalle de experiencia, reserva, confirmación, tienda, detalle de producto, carrito y checkout.

El objetivo del portal: vender **experiencias** (reservas) y **productos** (e-commerce de cacao y chocolate artesanal).

---

## Sobre los archivos de diseño

Los archivos de este bundle son **referencias de diseño hechas en HTML** — prototipos que muestran el look & feel y el comportamiento previstos, **no código de producción para copiar tal cual**.

La tarea es **recrear estos diseños en el entorno del proyecto base que ya tienen** (React, Vue, Next, etc.), usando sus patrones, componentes y librerías establecidas. Si todavía no hay un entorno definido, elegir el framework más apropiado e implementarlos ahí.

El prototipo `Vuelo Carmesi.dc.html` es un único archivo navegable: en la barra superior hay un **selector de pantalla** (dropdown) y un toggle **Desktop / Mobile**. Esa barra superior es *andamiaje del prototipo* — **no** es parte del producto, no la implementen.

> ⚠️ Detalle técnico del prototipo, irrelevante para producción: el responsive del prototipo se logra con **container queries** (`container-type: inline-size` + unidades `cqw`) para poder simular mobile sin redimensionar la ventana. En producción usen **media queries normales** según los breakpoints de abajo.

---

## Fidelidad

**Alta fidelidad (hi-fi).** Colores, tipografías, espaciados y estados son definitivos y deben respetarse al pixel. Recrear la UI exactamente usando las librerías/patrones del codebase. Las únicas piezas "de relleno" son las **imágenes** (ver sección Assets) y los **textos de ejemplo** (copy realista pero sustituible por contenido real).

---

## Design Tokens

### Colores

| Token             | Hex       | Uso |
|-------------------|-----------|-----|
| `--color-cream`   | `#FFEACA` | Fondo dominante: superficies, tarjetas, páginas |
| `--color-crimson` | `#D51312` | Primario: headings, CTAs, navbar |
| `--color-orange`  | `#EA5B0C` | Acento activo: hover de botones, íconos, links |
| `--color-brown`   | `#872B13` | Texto oscuro, labels, footer, fondos ricos |
| `--color-amber`   | `#F59C00` | Destacados: badges, precios, rating |
| `--color-gold`    | `#FDC300` | Decorativo: separadores, ornamentos |

**Tonos derivados usados en el prototipo (para que coincida exactamente):**
- Panel claro sobre cream (cards de documentación, inputs, resumen carrito): `#FFF6E4`
- Brown más oscuro (hover de botón ghost / active): `#6E2310`
- Deep brown (solo barra del prototipo, **no usar en producción**): `#5C1D0D`
- Texto sobre fondo oscuro: cream a 85% → `rgba(255,234,202,.85)`; secundario 80%/60%.
- Bordes sutiles sobre cream: `rgba(135,43,19,.15)`; bordes de input: `rgba(135,43,19,.4)`.
- Stripes de placeholder de imagen: `#F0D6A8` / `#E9CB97` (sobre cream) y `#9A3417` / `#8A2E14` (sobre brown).

### Tipografía

Dos familias (incluidas en `/fonts`):
- **Honey Lips** (`HoneyLips.ttf`) → display script. Solo H1/H2 y títulos display. `--font-display`. Peso 400.
- **Bellota** → todo lo demás. `Bellota-Bold.ttf` (700) para H3/body/labels/nav; `Bellota-Regular.ttf` (400) para descripciones suaves. `--font-body`.

| Nivel       | Familia    | Desktop | Mobile | Color por defecto |
|-------------|-----------|---------|--------|-------------------|
| H1 Display  | Honey Lips | 72px | 40px | cream (sobre oscuro) |
| H1 Light    | Honey Lips | 56px | 36px | crimson (sobre cream) |
| H2          | Honey Lips | 40px | 28px | crimson o brown |
| H3          | Bellota 700 | 24px | 20px | brown |
| Body Large  | Bellota 700 | 18px | 16px | brown |
| Body        | Bellota 700 | 16px | 15px | brown |
| Label       | Bellota 700 | 14px | 13px | brown o amber |
| Caption     | Bellota 700 | 12px | 12px | brown 70% |

Eyebrows (kickers): Bellota 700, 13–14px, `letter-spacing:3px`, `text-transform:uppercase`, color gold (sobre oscuro) u orange (sobre cream).

### Espaciado — base 8px

`8 / 16 / 24 / 32 / 40 / 48 / 64 / 80 / 128`. Padding vertical de secciones: estándar 64–80px, hero 80–100px.

### Radios

- 4px → badges, inputs
- 8px → botones, cards de galería, thumbnails
- 12px → cards, modales, cards destacadas
- 100px → badges pill
- 50% → círculo de éxito (confirmación)

### Sombras (basadas en brown)

- Sutil: `0 2px 8px rgba(135,43,19,.10)`
- Media: `0 4px 16px rgba(135,43,19,.16)`
- Hover: `0 8px 24px rgba(135,43,19,.20)`

### Grid / contenedor

- Contenedor máx **1200px**, centrado, padding lateral 24px (desktop) / 20px (tablet) / 16px (mobile).
- Breakpoints: **desktop ≥1024**, **tablet 768–1023**, **mobile <768** (diseño de referencia 375–420px).

---

## Componentes base

### Button — 3 variantes, alto contraste

**Primary (crimson)** · texto cream Bellota 700 16px · padding `14px 28px` · radius 8px.
- default `bg #D51312` · hover `bg #EA5B0C` · active `bg #872B13`
- disabled `bg rgba(213,19,18,.4)`, texto `rgba(255,234,202,.5)`, `cursor:not-allowed`
- loading: igual a default + spinner inline a la izquierda (círculo 16px, borde cream, `animation: spin .7s linear infinite`)

**Secondary (orange outline)** · texto orange · `border:2px solid #EA5B0C` · bg transparent · padding `12px 26px` · radius 8px.
- hover `bg #EA5B0C` + texto cream · active `bg/border #872B13` + texto cream · disabled todo a 40%

**Ghost (brown outline)** · texto brown · `border:1.5px solid #872B13` · bg transparent · padding `12px 26px`.
- hover `bg #872B13` + texto cream · active `bg #6E2310` · disabled todo a 40%

Tamaño grande (heros/CTAs): font 18px, padding `18px 40px`.

### Input (`text/email/tel/select/textarea`)

- bg cream `#FFEACA` (o `#FFF6E4` cuando va dentro de una card cream) · `border:1.5px solid rgba(135,43,19,.4)` · radius 4px · padding `12px 16px`
- Label arriba: Bellota 700 14px brown, `margin-bottom:6px`
- Placeholder: brown 40% · Texto ingresado: brown 700 16px
- **focus**: `border:2px solid #D51312`, `outline:none`, `box-shadow:0 0 0 3px rgba(213,19,18,.15)`
- **error**: `border:2px solid #D51312` + mensaje debajo Bellota 700 13px crimson
- **disabled**: bg `rgba(255,234,202,.6)`, borde a 20%, `cursor:not-allowed`
- `textarea`: min-height 120px, `resize:vertical`. `select`: chevron custom (SVG) a la derecha.

### Badge (pill, radius 100px, padding `4px 10px`, Bellota 700 12px)

- **Disponible** → bg amber `#F59C00`, texto brown
- **Nuevo** → bg orange `#EA5B0C`, texto cream
- **Agotado** → bg `rgba(135,43,19,.15)`, texto `rgba(135,43,19,.6)`
- **Destacado** → bg gold `#FDC300`, texto brown

### Card (base)

bg cream · `border:1px solid rgba(135,43,19,.15)` · radius 12px · sombra sutil · `overflow:hidden`. Hover: sombra media + `translateY(-4px)`, transición `200ms ease`.

- **ExperienciaCard**: imagen 100%×200px (cover) con badge `position:absolute top/right 12px`; cuerpo padding 24px → título H3 20px brown, descripción 14px brown 70% (`line-clamp:2`), fila ⏱ duración (amber) · separador · precio (amber 700), botón "Ver más" **secondary** full-width `margin-top:16px`.
- **ProductoCard**: imagen 100%×220px (cover); badge opcional top/right; cuerpo padding 20px → nombre Bellota 700 18px brown, descripción 13px brown 65% (1 línea), precio Bellota 700 20px amber, botón "Agregar al carrito" **primary** full-width `margin-top:12px`. La card es flex-column con el precio empujado con `margin-top:auto` para alinear botones.

### Navbar

- Altura 72px desktop / 60px mobile · bg crimson `#D51312` · contenido `space-between`, padding lateral 24px.
- Izquierda: logo (en el prototipo es el wordmark "Vuelo Carmesí" en Honey Lips cream 26px; en producción usar el **logo PNG real a 48px de alto**).
- Derecha desktop: links Bellota 700 16px cream, gap 32px. Hover: underline cream/amber. **Activo** (página actual): underline amber permanente (`border-bottom:2px solid #F59C00`).
- Mobile: hamburguesa (3 líneas cream, 24px) que despliega panel **bg brown `#872B13`**, links centrados Bellota 700 20px cream, padding 24px vertical por link, animación slide-down 250ms ease.

### Footer

- bg brown `#872B13` · padding 64px desktop / 48px mobile.
- 3 columnas (logo+tagline | navegación | contacto), colapsan apiladas y centradas en mobile.
- Texto cream, links Bellota 700 14px (hover → amber). Títulos de columna: eyebrow gold uppercase 14px.
- Divisoria superior del copyright: `1px solid rgba(253,195,0,.3)`. Copyright Bellota 12px cream 60%, centrado, `padding-top:24px`.

---

## Pantallas / Vistas

> Regla de composición transversal: **cream domina**; fondos oscuros (brown/crimson) se alternan en secciones para dar ritmo; texto sobre oscuro siempre cream.

### 1. Landing `/`
Scroll único, 7 secciones: **Navbar → Hero → Preview de Experiencias → Sobre Nosotros → Galería → Banda CTA → Footer**.
- **Hero**: min-height 86–100vh. Eyebrow gold uppercase + H1 Honey Lips (72px) + subtítulo + CTA primary grande + indicador de scroll (flecha cream con bob animation). Fondo: imagen de finca con overlay `linear-gradient(rgba(135,43,19,.7), rgba(135,43,19,.5))`.
  - **3 variaciones de Hero** entregadas (probar con el switcher del prototipo — ese switcher es solo demo):
    - **A · Centrado**: contenido centrado sobre imagen full-bleed con overlay (es la opción del brief, recomendada por defecto).
    - **B · Split imagen**: 50/50, texto sobre brown a la izquierda + imagen a la derecha; dos CTAs (primary + outline cream).
    - **C · Editorial cream**: fondo cream, H1 crimson gigante (hasta 96px), texto + imagen enmarcada; tono más "Sabio".
- **Preview Experiencias**: bg cream, H2 crimson centrado + subtítulo, grid 3 col (auto-fit minmax 280px) de ExperienciaCard, botón ghost "Ver todas" centrado.
- **Sobre Nosotros**: bg brown, 2 col 50/50 (imagen radius 12 + texto cream); mobile apila imagen arriba.
- **Galería**: bg cream, H2 crimson, **masonry** (CSS `columns: 4 160px`, gap 12px) con imágenes de alturas variables, radius 8px, hover scale(1.02). Mobile → 2 columnas.
- **Banda CTA**: bg crimson, H2 cream 48px centrado + párrafo + botón outline cream (hover → bg cream/texto crimson).

### 2. Contacto `/contacto`
2 columnas dentro de una card con `overflow:hidden`: izquierda **info bg brown** (40%, H2 cream + intro + lista email/tel/ubicación con íconos amber), derecha **formulario bg cream** (60%, H3 "Envianos un mensaje" + Nombre/Email/Asunto/Mensaje + botón primary full-width).
- **Estado de éxito**: el form se reemplaza por panel inline → check amber 48px, H3 "¡Mensaje enviado!" Honey Lips 28px crimson, párrafo, link ghost "Volver al inicio". (En el prototipo se muestra como variante debajo del form, rotulada.)
- Mobile: columnas apiladas.

### 3. Catálogo de Experiencias `/experiencias`
**Hero interno** 280px (200px mobile) bg brown+overlay, H1 48px cream centrado. **Barra de controles**: bg cream, border-bottom, conteo "6 experiencias disponibles" (izq) + `select` de orden (der). **Grid** 3 col de ExperienciaCard, gap 24px. **Estado vacío**: ícono planta, H3 "Próximamente nuevas experiencias", párrafo + botón de contacto (mostrado como variante rotulada).

### 4. Detalle de Experiencia `/experiencias/[slug]`
**Hero** 480px (300px mobile), imagen+overlay, H1 Honey Lips 56px cream + badge disponibilidad abajo-izq. **Cuerpo 2 col**:
- Principal (65%): H2 "Sobre esta experiencia" + body largo (line-height 1.8), H3 "¿Qué incluye?" y "¿Qué traer?" con listas de check amber, galería 3 col.
- Lateral **sticky** (35%, top 72px): card elevada padding 32 → precio amber 32px, ⏱ duración, 👥 capacidad, separador gold, botón "Reservar ahora" primary grande, caption "Sin compromiso de pago".
- Mobile: el lateral pasa debajo (pierde sticky).

### 5. Formulario de Reserva `/reservar/[slug]`
2 col. **Principal (60%)**: H1 "Reservá tu experiencia" + form en card cream (Nombre|Teléfono / Email / Fecha(date)|Personas(select) / Comentarios textarea / botón primary grande + caption). **Resumen (40%) sticky bg brown**: label gold "ESTÁS RESERVANDO", nombre experiencia Honey Lips 28px cream, miniatura 160px, precio/duración, separador gold, nota caption. Mobile: resumen arriba o siempre visible, form debajo, campos en 1 columna.

### 6. Confirmación de Reserva `/reservar/confirmacion`
Centrado, máx 600px. Círculo gold 80px con check brown, H1 "¡Reserva recibida!" Honey Lips 48px crimson, párrafo, **card resumen** (cream, borde amber, radius 12) con "Código de reserva: #ABC123" amber 20px + experiencia/fecha/personas, fila de 2 botones (ghost "Volver al inicio" + primary "Ver tienda"). Mobile: ícono 64px, H1 36px.

### 7. Catálogo de Productos (Tienda) `/tienda`
Igual estructura que experiencias pero con ProductoCard. Hero interno "Nuestra Tienda". **Filtros**: fila de pills "Todos | Cacao | Chocolates | Kits" (activo bg crimson/texto cream; inactivo borde brown/texto brown, hover bg brown/texto cream). **Grid 4 col** desktop / 2 tablet / 1 mobile (auto-fit minmax 220px), gap 20px.

### 8. Detalle de Producto `/tienda/[slug]`
2 col 55/45. **Galería (izq)**: imagen principal `aspect-ratio:1/1` radius 12 + fila de 4 thumbnails 64×64 radius 8 (seleccionado borde crimson 2px, hover borde orange). **Info (der)**: badge categoría, H1 Honey Lips 40px brown, precio amber 32px, descripción (line-height 1.8), separador gold, **selector de cantidad** (− / número / + con botones 40×40 brown-outline, hover bg brown/texto cream, mín 1), botón "Agregar al carrito" primary grande, caption de stock. Debajo, full-width: **"También te puede gustar"** H2 crimson + grid 4 col ProductoCard. Mobile: galería arriba (swipe, sin thumbnails), info abajo, H1 28px.

### 9. Carrito `/carrito`
2 col. **Lista (65%)**: H1 "Tu carrito" Honey Lips 36px crimson. Cada ítem = fila: imagen 80×80 radius 8 | nombre+descripción | selector cantidad compacto (32px) | precio amber | botón eliminar (🗑 brown 40%, hover crimson). Separador entre ítems `1px rgba(135,43,19,.1)`. Botón ghost "Vaciar carrito". **Resumen (35%) sticky cream**: H3 "Resumen del pedido", subtotales por producto, separador, **Total** brown 22px + precio amber 24px, botón "Ir al checkout" primary grande, link "Seguir comprando". **Estado vacío**: bolsa 64px, H3 "Tu carrito está vacío", botón "Ver tienda". Mobile: lista arriba, resumen abajo, imagen 64×64.

### 10. Checkout `/checkout`
2 col. **Form (60%)**: H1 "Finalizar pedido". Sección "Datos de contacto" (H3 con separador amber debajo → Nombre / Email(60%)|Teléfono(40%)). Sección "Datos de entrega" (Dirección / Ciudad|CP / Notas textarea). Botón "Confirmar pedido" primary grande + caption de condiciones. **Resumen (40%) sticky bg brown**: label gold "RESUMEN DE TU PEDIDO", por ítem nombre + badge cantidad amber + precio cream, separador gold, Total cream 20px + precio amber 22px, caption método de pago. Mobile: form arriba, resumen abajo (accordion "Ver resumen").

---

## Interacciones y comportamiento

- **Navegación**: navbar enlaza las 10 vistas; CTAs encadenan los flujos:
  - *Experiencias*: catálogo → detalle → reservar → confirmación.
  - *Tienda*: tienda → detalle producto → carrito → checkout → (confirmación de pedido, análoga a la de reserva).
- **Hover**: botones cambian según variante (ver Button); cards elevan (`translateY(-4px)` + sombra media); galería hace scale(1.02); links de nav muestran underline.
- **Selector de cantidad**: − / + actualizan número (mín 1, máx por stock); recalcular subtotales y total.
- **Filtros de tienda**: pill activo filtra el grid por categoría.
- **Orden (select)**: reordena el grid (precio asc/desc, recientes).
- **Formularios** (contacto, reserva, checkout): validación inline → estado error en input (borde crimson + mensaje 13px). Botón submit puede entrar en estado **loading** (spinner). Al éxito → panel/pantalla de confirmación.
- **Animaciones**: transición de hover 200ms ease; panel mobile slide-down 250ms ease; flecha de scroll del hero con bob suave.
- **Responsive**: ver breakpoints. Patrón general: grids multi-columna → 1 columna; layouts 2-col → apilados; columnas sticky pierden sticky y van debajo; navbar desktop → hamburguesa.

---

## Gestión de estado (sugerida)

- `cart`: array de `{ productId, nombre, precio, cantidad, img }` → deriva subtotales y total; persistir (localStorage o backend).
- `selectedScreen` / routing real por URL (no usar el switcher del prototipo).
- `heroVariant` (A/B/C): decisión de diseño, no necesariamente runtime — elegir una para producción.
- `filtroCategoria`, `ordenamiento` para la tienda; `cantidad` para detalle de producto.
- Estados de formulario: `values`, `errors`, `isSubmitting`, `isSuccess`.
- Datos a traer del backend: experiencias, productos, disponibilidad de fechas, creación de reservas y pedidos.

---

## Assets

- **Fuentes** (incluidas en `/fonts`): `HoneyLips.ttf`, `Bellota-Bold.ttf`, `Bellota-Regular.ttf`. Cargar vía `@font-face`. *Nota: "Honey Lips Personal Use" — verificar licencia para uso comercial antes de producción.*
- **Logo**: usar el logo PNG real de la marca a 48px de alto en navbar (el prototipo usa el wordmark tipográfico como sustituto).
- **Imágenes**: TODAS son placeholders rayados con etiqueta monospace (finca, cacao, talleres, productos, galería). Reemplazar por fotografía real de la finca/productos. Tamaños indicados por vista (heros full-bleed, cards 200/220px, galería masonry alturas variables, producto 1:1, miniaturas 64×64).
- **Íconos**: el prototipo usa glifos/emoji (✓ ⏱ 👥 ✉ ☎ 📍 🗑 🌱 🛍) como marcadores. En producción reemplazar por un set de íconos coherente (line icons), color amber para destacados.

---

## Stack y estructura de carpetas recomendada

> Si el proyecto base ya tiene un stack definido, **respetá ese** y mapeá esta estructura a sus convenciones. Lo de abajo es un punto de partida concreto por si arrancás de cero.

### Stack sugerido

- **Framework**: Next.js (App Router) + React + TypeScript — SSR/SSG para SEO (es un sitio comercial con catálogo) y routing por carpetas listo para los flujos.
- **Estilos**: CSS Modules o Tailwind con los tokens cargados como CSS custom properties / theme. Sea cual sea, **los design tokens viven en un solo lugar** (ver abajo).
- **Estado**: estado local de React para UI; Context o Zustand para el carrito (persistido en `localStorage`). Sin librería pesada — el alcance no lo necesita.
- **Formularios**: react-hook-form + un validador (zod) para la validación inline descrita.
- **Fuentes**: `next/font` (self-host automático). Display detrás de `--font-display`, body en `--font-body`.
- **Imágenes**: `next/image` con placeholders mientras no haya fotografía real.
- **Datos**: empezar con un mock layer (`/lib/data` con arrays tipados de experiencias y productos) para no bloquear la UI; reemplazar por la API real después.

### Estructura de carpetas

```
src/
├─ app/                          # rutas (App Router)
│  ├─ layout.tsx                 # Navbar + Footer + providers (carrito)
│  ├─ page.tsx                   # 1. Landing
│  ├─ contacto/page.tsx          # 2. Contacto
│  ├─ experiencias/
│  │  ├─ page.tsx                # 3. Catálogo de experiencias
│  │  └─ [slug]/page.tsx         # 4. Detalle de experiencia
│  ├─ reservar/
│  │  ├─ [slug]/page.tsx         # 5. Formulario de reserva
│  │  └─ confirmacion/page.tsx   # 6. Confirmación
│  ├─ tienda/
│  │  ├─ page.tsx                # 7. Catálogo de productos
│  │  └─ [slug]/page.tsx         # 8. Detalle de producto
│  ├─ carrito/page.tsx           # 9. Carrito
│  └─ checkout/page.tsx          # 10. Checkout
│
├─ styles/
│  ├─ tokens.css                 # ÚNICA fuente de tokens: colores, espaciado,
│  │                            #   radios, sombras, fuentes (custom properties)
│  └─ globals.css                # resets + escala tipográfica base
│
├─ components/
│  ├─ ui/                        # sistema base (1:1 con la sección "Componentes base")
│  │  ├─ Button.tsx              #   3 variantes + estados (default/hover/active/disabled/loading)
│  │  ├─ Input.tsx               #   text/email/tel/select/textarea + focus/error/disabled
│  │  ├─ Badge.tsx               #   Disponible / Nuevo / Agotado / Destacado
│  │  ├─ Card.tsx                #   card base + ExperienciaCard + ProductoCard
│  │  ├─ Navbar.tsx
│  │  └─ Footer.tsx
│  ├─ secciones/                 # bloques de la landing (Hero, SobreNosotros, Galeria, BandaCTA…)
│  └─ carrito/                   # ItemCarrito, ResumenPedido, SelectorCantidad…
│
├─ lib/
│  ├─ data/                      # mock layer tipado (experiencias, productos)
│  └─ cart/                      # store del carrito + helpers (subtotal, total, persistencia)
│
├─ hooks/                        # useCart, useCantidad, etc.
├─ types/                        # Experiencia, Producto, ItemCarrito, Reserva, Pedido
│
public/
├─ fonts/                        # Bellota (+ display elegida)
└─ images/                       # fotografía real reemplazando placeholders
```

### Orden de implementación sugerido

1. `styles/tokens.css` + `globals.css` — tokens y escala tipográfica.
2. `components/ui/*` — los 6 componentes base con todos sus estados (verificables contra el prototipo de forma aislada).
3. `layout.tsx` con Navbar + Footer + provider del carrito.
4. Vistas por flujo: **Landing → Contacto**, después **Experiencias (3→4→5→6)**, después **Tienda (7→8→9→10)**.
5. Cableado de estado e interacciones (carrito, filtros, validación, estados de éxito/vacío/error).
6. Responsive pass sobre cada vista.

### Convención clave

- **Tokens en un solo archivo.** Nada de hex sueltos en componentes: todo color/espaciado/radio/sombra sale de `tokens.css`. Esto permite, por ejemplo, cambiar la tipografía display (cuando se resuelva la licencia de Honey Lips) en una sola línea.

---

## Archivos en este bundle

- `Vuelo Carmesi.dc.html` — prototipo navegable de alta fidelidad con el sistema base + las 10 vistas (abrir en navegador; usar el selector de pantalla y el toggle Desktop/Mobile de la barra superior).
- `design-brief.md` — brief de marca original con todas las especificaciones (fuente de verdad).
- `fonts/` — las 3 fuentes a instalar.
- `README.md` — este documento.

*El switcher de Hero y la barra superior del prototipo son andamiaje de demostración; no forman parte del producto.*

### `screenshots/` — referencia visual de cada pantalla

| Archivo | Pantalla |
|---------|----------|
| `01-sistema.png` | Sistema base / componentes |
| `02-landing-hero-a.png` | Landing — Hero variante A (centrado) |
| `03-contacto.png` | Contacto |
| `04-experiencias.png` | Catálogo de Experiencias |
| `05-experiencia-detalle.png` | Detalle de Experiencia |
| `06-reservar.png` | Formulario de Reserva |
| `07-confirmacion.png` | Confirmación de Reserva |
| `08-tienda.png` | Catálogo de Productos |
| `09-producto-detalle.png` | Detalle de Producto |
| `10-carrito.png` | Carrito |
| `11-checkout.png` | Checkout |
| `12-landing-hero-b.png` | Landing — Hero variante B (split imagen) |
| `13-landing-hero-c.png` | Landing — Hero variante C (editorial cream) |
| `14-mobile-landing.png` | Ejemplo responsive (mobile) |

> Las capturas muestran la parte superior de cada vista (above-the-fold). Para ver cada pantalla completa y sus estados, abrir el prototipo `Vuelo Carmesi.dc.html` y navegar con el selector.
