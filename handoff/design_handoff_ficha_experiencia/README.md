# Handoff: Ficha de detalle de experiencia — Vuelo Carmesí

## Overview

Pantalla de detalle (`/experiencias/[slug]`) de una experiencia turística de **Vuelo Carmesí**, finca agroecológica de cacao y café en San Vicente de Chucurí (Colombia).

La pantalla tiene tres objetivos, en este orden:

1. Que el visitante entienda de qué va la experiencia y se le antoje.
2. Que encuentre sin buscar: precio, duración, capacidad, horarios, punto de encuentro y política de cancelación.
3. Que pulse **Reservar ahora** y llegue a `/reservar/[slug]`, donde elige fecha y número de personas. **La fecha NO se elige en esta pantalla.**

Todo el contenido lo escribe el administrador de la finca desde el panel, campo por campo. **Casi todo es opcional: si un campo viene vacío, su bloque desaparece entero** — nunca se rellena, nunca se deja un hueco, nunca se muestra «Sin información».

## About the Design Files

El archivo `Ficha Experiencia v2.dc.html` de este paquete es una **referencia de diseño hecha en HTML**: un prototipo que muestra el aspecto y el comportamiento buscados, **no código de producción para copiar**. Está escrito con estilos inline y un pequeño runtime de prototipado; nada de eso debe migrarse.

La tarea es **recrear este diseño en el entorno del codebase destino** (Next.js/React con Tailwind, Vue, Astro, etc.) usando sus patrones, componentes y utilidades ya establecidos. Si el proyecto aún no tiene entorno, elige el más apropiado e impleméntalo allí.

Los datos hardcodeados en el prototipo (tres juegos: `completa`, `intermedia`, `minima`) son solo para demostrar los estados; en producción vienen de la base de datos.

## Fidelity

**Alta fidelidad (hifi).** Colores, tipografías, escala tipográfica, retícula y espaciados son los definitivos y provienen del manual de marca. Recrea la UI fielmente usando las utilidades del codebase. Las fotos del prototipo son marcadores rayados (`repeating-linear-gradient` + etiqueta monoespaciada): en producción se sustituyen por las imágenes reales de `imagenes[]`.

---

## Data model — trabaja SOLO con estos campos

| Campo | Tipo | Obligatorio | Ejemplo |
|---|---|---|---|
| `nombre` | texto | sí | «Ruta café y cacao» |
| `descripcion` | texto ≤160 car. | no | **No se muestra en pantalla.** Solo `<meta description>` y Open Graph |
| `descripcionLarga` | texto largo con párrafos | sí | El relato, párrafos separados por línea en blanco |
| `duracion` | texto libre | sí | «8 horas» |
| `precio` | número | sí | `160000` → `$160.000` |
| `capacidad` | entero | sí | `12` → «Hasta 12 personas» |
| `imagenes` | lista ordenada, 1–6 | sí | la primera es la portada |
| `horarios` | texto libre 1–2 líneas | no | «Martes a domingo, 8:00 a. m. y 2:00 p. m.» |
| `puntoEncuentro` | texto libre 1–3 líneas | no | «Finca Vuelo Carmesí, vereda La Esperanza, San Vicente de Chucurí» |
| `recomendaciones` | texto libre 1–3 líneas | no | «Desde 8 años. Requiere caminar 40 minutos por terreno irregular.» |
| `incluye` | lista de textos cortos (3–6) | sí | «Guía especializado» |
| `queTraer` | lista de textos cortos (1–3) | no | «Calzado cerrado» |
| `noIncluye` | lista de textos cortos (1–2) | no | «Transporte hasta la finca» |

Dos valores de **configuración del sitio**, iguales en todas las fichas:

- **Punto de encuentro por defecto** — se usa cuando la experiencia no trae el suyo.
- **Resumen de política de cancelación** — «Cancela sin costo hasta 48 horas antes.», acompañado del enlace «Ver política». Si está vacío, la línea desaparece.

### Lo que NO existe — no lo implementes

Sin valoraciones ni reseñas · sin calendario ni selector de fecha · sin mapa, coordenadas o botón a Google Maps (el punto de encuentro es **texto plano**) · sin perfil del guía · sin itinerario por horas · sin idiomas ni escala de dificultad · sin precio tachado ni descuentos · sin contador de plazas ni urgencia · sin experiencias relacionadas · sin FAQ · sin formulario de contacto, chat o botón flotante de WhatsApp.

---

## Screens / Views

Una sola vista, cinco bloques en este orden. Contenedor global: `max-width: 1200px`, centrado, margen lateral `clamp(1rem, 4vw, 2rem)`. Fondo de página **crema `#ffeaca`, no blanco**. Padding inferior del documento: `calc(104px + env(safe-area-inset-bottom))` para que la barra fija no tape el final.

La composición es **fluida, sin breakpoints**: los bloques usan `flex-wrap` con bases `flex: 1 1 460px` / `1 1 320px` y `grid-template-columns: repeat(auto-fit, minmax(...))`, de modo que pasan de una a varias columnas por sí solos entre 320px y 1200px.

### 1. Portada (foto + título + tarjeta de precio)

Padding superior `clamp(1rem,4vw,2rem)`. Fila `display:flex; flex-wrap:wrap; gap:clamp(20px,3vw,40px); align-items:flex-start`.

**Decisión clave: la foto nunca lleva texto encima.** Así funciona con cualquier foto que suba el administrador (oscura, clara, movida) y no hace falta velo de legibilidad.

**Columna izquierda — `flex: 1 1 460px; min-width: min(100%, 280px)`**

- Foto activa: `aspect-ratio: 4/3`, `border-radius: 12px`, `overflow: hidden`. Reserva proporción para que la página no salte al cargar (`next/image` con `fill` + `object-fit: cover`).
- Etiqueta de archivo (solo prototipo) abajo-izquierda; en producción se elimina.
- **Contador** abajo-derecha: texto «1 / 6», Bellota 700, 12px, color `#872b13`, fondo `rgba(255,234,202,0.88)`, padding `4px 10px`, radio `20px`.
- **Miniaturas** (solo si `imagenes.length > 1`): `display:grid; grid-template-columns: repeat(auto-fill, minmax(88px,1fr)); gap:8px; margin-top:8px`. Cada botón: alto `clamp(64px,10vw,84px)`, `min-width:44px`, radio 8px, `border: 3px solid` → activa `#fdc300`, inactiva `rgba(135,43,19,0.14)`; opacidad activa `1`, inactiva `0.55`; `transition: opacity .15s ease`; `cursor: pointer`; `aria-label="Ver <descripción de la foto>"`.
- Debajo, aviso de interactividad: «Toca una foto para verla en grande» — 12px, `letter-spacing:1.5px`, mayúsculas, `rgba(135,43,19,0.6)`, `margin-top:8px`.

**Columna derecha — `flex: 1 1 320px; min-width: min(100%, 280px)`**

- Eyebrow «VUELO CARMESÍ · EXPERIENCIA»: Bellota 700, 13px, `letter-spacing:3px`, mayúsculas, **carmesí `#d51312`**.
- `h1` = `nombre`: **Playfair Display 700**, `clamp(30px, 5.5vw, 52px)`, `line-height:1.04`, color `#872b13`, `margin: 10px 0 16px`, `overflow-wrap: break-word`. **No pasar de 52px** (la portada del sitio usa 96px y competiría).
- Dos píldoras de datos duros (`display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px`): fondo `rgba(135,43,19,0.08)`, radio 22px, padding `8px 14px`, Bellota 700 14px, con icono de trazo 18px en naranja `#ea5b0c` a la izquierda:
  - reloj → `duracion`
  - grupo de personas → «Hasta {capacidad} personas»
- **Tarjeta de precio**: fondo `#FBF6EC`, borde `1px solid rgba(135,43,19,0.14)`, radio 10px, padding `clamp(16px,2.5vw,22px)`, `display:flex; flex-direction:column; gap:10px`.
  - Rótulo «DESDE»: Bellota 700, 12px, `letter-spacing:2px`, `rgba(135,43,19,0.6)`.
  - Precio: Playfair 700, `clamp(30px,5vw,42px)`, `#872b13`; al lado «por persona» Bellota 700 14px `rgba(135,43,19,0.65)`.
  - **Botón principal** «Reservar ahora»: ancho 100%, fondo **carmesí `#d51312`**, texto `#ffeaca`, radio 8px, padding 15px, Bellota 700 17px, `min-height:44px`. Navega a `/reservar/[slug]`.
  - **Línea de cancelación** (solo si hay resumen): 13px, `line-height:1.5`, `rgba(135,43,19,0.7)`, con enlace «Ver política» en `#d51312` subrayado y 700. Va aquí a propósito: resuelve la duda en el momento de decidir.

### 2. El relato — única banda oscura `#4a1709`

`margin-top: clamp(32px,5vw,56px)`; banda **a sangre** (100% del viewport) con contenido a 1200px; padding `clamp(2.5rem,6vw,4rem) clamp(1rem,4vw,2rem)`. Fila flex-wrap con `gap: clamp(20px,4vw,48px)`.

- Rótulo «LA EXPERIENCIA»: Bellota 700, 13px, `letter-spacing:3px`, mayúsculas, **oro `#fdc300`**; contenedor `flex: 0 0 auto; min-width:180px` (en móvil queda arriba, en escritorio a la izquierda).
- Texto: `flex: 1 1 460px; min-width: min(100%, 260px)`.
  - **Primer párrafo**: Playfair Display *cursiva* 500, `clamp(20px,4vw,30px)`, `line-height:1.35`, `#ffeaca`, `margin-bottom:22px`.
  - **Resto de párrafos**: Bellota, `clamp(16px,1.3vw,17px)`, `line-height:1.85`, `rgba(255,234,202,0.78)`, `max-width: 62ch`, `margin-bottom:18px`.
  - El corte es **por párrafo** (`split` por línea en blanco), no por el primer punto. Un relato de un solo párrafo se muestra entero en cursiva grande, sin cuerpo debajo — ese caso debe verse bien.
  - Conserva los saltos de línea del administrador (`white-space: pre-line`).

### 3. Antes de reservar (datos prácticos) — sobre crema

Se sustituyó la banda marrón `#872b13` del diseño anterior: dos bandas oscuras seguidas se confundían entre sí y el bloque parecía nota al pie. Ahora va sobre crema con filete ámbar, que le da más peso sin encerrarlo.

Padding `clamp(2.5rem,6vw,3.5rem) clamp(1rem,4vw,2rem) 0`.

- Cabecera: rótulo «ANTES DE RESERVAR» en **carmesí `#d51312`** (13px, 700, `letter-spacing:3px`) + regla que ocupa el resto del ancho: `flex:1; height:2px; background:#f59c00` (ámbar), `gap:14px`.
- Rejilla: `repeat(auto-fit, minmax(260px, 1fr))`, `gap: clamp(18px,3vw,28px)`. Con uno o dos datos se reparte igual y sigue viéndose deliberada.
- Cada dato: `border-top: 2px solid #f59c00`, `padding-top:14px`, columna con `gap:8px`.
  - Fila de icono (24px, trazo, naranja `#ea5b0c`) + rótulo Bellota 700 12px `letter-spacing:2px` `rgba(135,43,19,0.6)` mayúsculas.
  - Valor: `clamp(16px,1.3vw,17px)`, `line-height:1.6`, `#872b13`, `overflow-wrap: break-word`.

| Rótulo | Icono | Campo |
|---|---|---|
| CUÁNDO | reloj | `horarios` |
| PUNTO DE ENCUENTRO | pin | `puntoEncuentro` (o el general del sitio) |
| TEN EN CUENTA | triángulo de aviso | `recomendaciones` |

**Cada dato desaparece si viene vacío; la sección entera desaparece si no hay ninguno.**

### 4. Las tres listas — sobre crema

Padding `clamp(2.5rem,6vw,3.5rem) clamp(1rem,4vw,2rem) clamp(2rem,4vw,3rem)`; columna con `gap: clamp(24px,3.5vw,34px)`.

Los textos son de 1 a 6 palabras, así que **no se usan tarjetas grandes**: cada elemento es una **viñeta píldora** que mide lo que mide su texto. Con un solo elemento se ve igual de deliberado que con seis (el problema de las tarjetas cuadradas medio vacías queda resuelto).

- Rótulo del bloque: **carmesí `#d51312`**, Bellota 700, 13px, `letter-spacing:3px`, mayúsculas, `margin-bottom:14px`.
- Contenedor de viñetas: `display:flex; flex-wrap:wrap; gap:10px`.
- Viñeta: `inline-flex`, `align-items:center`, `gap:9px`, fondo `#FBF6EC`, borde `1px solid rgba(135,43,19,0.14)`, radio 22px, padding `10px 16px`, Bellota 700 15px, `line-height:1.3`. Punto de 8px a la izquierda (`border-radius:50%`).

| Bloque | Rótulo | Punto | Color del texto |
|---|---|---|---|
| `incluye` | INCLUIDO EN TU CUPO | naranja `#ea5b0c` | `#872b13` |
| `queTraer` | QUÉ TRAER | ámbar `#f59c00` | `#872b13` |
| `noIncluye` | NO INCLUYE | `rgba(135,43,19,0.45)` | `rgba(135,43,19,0.7)` |

**«No incluye» no es un error**: nada de rojo ni de aspa de alerta; va en marrón apagado para que informe sin alarmar. Cada bloque desaparece si su lista está vacía; la sección entera desaparece si las tres lo están.

### 5. Barra de reserva fija

`position: fixed; left:0; right:0; bottom:0; z-index:20`. Fondo **marrón `#872b13`**, padding `14px clamp(1rem,4vw,2rem)` con `padding-bottom: calc(14px + env(safe-area-inset-bottom))`, `box-shadow: 0 -4px 18px rgba(74,23,9,0.28)`. Contenido a 1200px, `display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px` (envuelve en dos líneas si no cabe).

- Izquierda: precio en Playfair 700 `clamp(22px,4vw,30px)` en **oro `#fdc300`** + «por persona · {duracion}» Bellota 700 14px `rgba(255,234,202,0.8)`.
- Derecha: botón carmesí «Reservar ahora», padding `14px 24px`, 16px, `min-height:44px`, `white-space:nowrap`.

**El precio aparece dos veces en la pantalla y es deliberado**: la tarjeta lo presenta en el momento del antojo, la barra lo mantiene a mano durante el scroll. No lo reduzcas a uno ni lo repitas una tercera vez.

---

## Interactions & Behavior

- **Miniaturas** → cambian la foto grande de la portada. Estado local `idx`, arranca en `0` (la primera imagen es la portada). Transición de opacidad `.15s ease`. El contador «n / total» se actualiza.
- **Reservar ahora** (los dos botones) → navegación a `/reservar/[slug]`. No abre modal ni selector de fecha.
- **Ver política** → página de política de cancelación (enlace normal).
- **Foco visible obligatorio** en botón principal, miniaturas y enlace de política: `outline: 3px solid #fdc300; outline-offset: 3px` sobre `:focus-visible`.
- **Táctil**: todo lo pulsable ≥ 44×44px.
- **Responsive**: fluido, sin breakpoints. A ~320px todo queda en una columna; hacia 900px+ la foto y la tarjeta de precio se ponen en paralelo y las rejillas suman columnas. Nada desborda horizontalmente a 320px: `overflow-x: hidden` en el contenedor y `overflow-wrap: break-word` en título, valores prácticos y viñetas.
- **Carga de imágenes**: proporción reservada (`aspect-ratio: 4/3` en la portada, alto fijo en miniaturas) para evitar saltos de layout.
- Sin animaciones más allá de la transición de opacidad de las miniaturas y los estados hover/focus de botones y enlaces.

## State Management

Estado de cliente mínimo:

- `idx: number` — índice de la foto activa. Se resetea a `0` si cambia la experiencia.
- Todo lo demás es contenido del servidor: la ficha se puede renderizar en el servidor (RSC/SSG) y solo la galería necesita ser cliente.

Derivados a calcular en render (nunca en la plantilla):

- `precioFmt = '$' + precio.toLocaleString('es-CO')` → `$160.000`. Nunca `$160,000` ni `COP 160000`.
- `capacidadTexto = 'Hasta ' + capacidad + ' personas'`.
- `parrafos = descripcionLarga.split(/\n\s*\n/).filter(Boolean)` → `[0]` en cursiva grande, resto en cuerpo.
- `practicos` = lista construida solo con los campos no vacíos, en el orden CUÁNDO → PUNTO DE ENCUENTRO → TEN EN CUENTA.
- `listas` = lista construida solo con las listas no vacías, en el orden incluye → queTraer → noIncluye.
- `showThumbs = imagenes.length > 1`.

Sin fetch en cliente, sin paginación, sin datos en tiempo real.

## Design Tokens

**Color** (paleta de marca cerrada — no introducir azules, grises fríos ni degradados de dos tonos vivos)

| Token | Hex | Uso |
|---|---|---|
| `--color-cream` | `#ffeaca` | Fondo de página; texto sobre fondos oscuros |
| `--color-brown` | `#872b13` | Texto principal sobre crema; fondo de la barra inferior |
| `--color-crimson` | `#d51312` | **Solo** botón principal y rótulos de sección |
| `--color-orange` | `#ea5b0c` | Iconos de trazo, punto de «incluye» |
| `--color-amber` | `#f59c00` | Filetes y regla de «antes de reservar», punto de «qué traer» |
| `--color-gold` | `#fdc300` | Rótulos sobre fondo oscuro, precio de la barra, borde de miniatura activa, anillo de foco |
| marrón oscuro | `#4a1709` | Fondo de la banda del relato |
| `--admin-bg` | `#FBF6EC` | Fondo de tarjeta de precio y de las viñetas |

Opacidades: secundarios sobre oscuro = crema al **0.7–0.88**; secundarios sobre crema = marrón al **0.55–0.7**. Bordes = `rgba(135,43,19,0.12–0.14)`. Nunca grises.

**Tipografía** — dos familias, ninguna más: **Playfair Display** (serif, 500–700, cursiva disponible) y **Bellota** (sans redondeada, 700). Prohibidas Inter, Roboto, Montserrat, Poppins y Arial; si Bellota falla, fallback a una sans redondeada, nunca geométrica fría.

| Uso | Valor |
|---|---|
| `h1` | Playfair 700, `clamp(30px,5.5vw,52px)`, `line-height:1.04` |
| Entradilla del relato | Playfair cursiva 500, `clamp(20px,4vw,30px)`, `line-height:1.35` |
| Precio en tarjeta | Playfair 700, `clamp(30px,5vw,42px)` |
| Precio en barra | Playfair 700, `clamp(22px,4vw,30px)`, en oro |
| Rótulo de sección | Bellota 700, 13px, mayúsculas, `letter-spacing:3px` |
| Rótulo pequeño | Bellota 700, 11–12px, `letter-spacing:2px` |
| Cuerpo | Bellota, `clamp(16px,1.3vw,17px)`, `line-height:1.6–1.85`, medida máx. 62ch |
| Avisos y legales | 12–13px |

**Retícula y espaciado** — contenido máx. **1200px** centrado; margen lateral `clamp(1rem,4vw,2rem)`; bandas de color a sangre con contenido a 1200px; gaps `8 / 10 / 14 / 20 / 28 / 40px`; secciones `clamp(2.5rem,6vw,4rem)`.

**Radios** — 22px píldoras y botones redondos · 12px foto de portada · 10px tarjetas · 8px botones y miniaturas.

**Sombras** — solo una: la barra fija, `0 -4px 18px rgba(74,23,9,0.28)`.

**Iconos** — dibujados en **trazo** sobre rejilla de 24px, grosor `1.85`, extremos y uniones redondeados (`stroke-linecap/linejoin: round`), sin relleno. Nada de emoji, iconos rellenos ni PNG. Los usados: reloj, grupo de personas, pin, triángulo de aviso. Sustituibles por el set de iconos del codebase si respeta esas reglas.

## Idioma y tono

Español de **Colombia**, en **tuteo**: «reserva», «descubre», «escríbenos». Prohibido el voseo rioplatense («reservá», «descubrí»). Prohibido «a la brevedad» → «lo antes posible». Moneda con punto de miles (`$160.000`); teléfonos con `+57`. Tono cálido y concreto, de finca; nada de lenguaje corporativo ni de agencia genérica.

## Estados que hay que soportar (y probar)

1. **Ficha completa** — 6 fotos, relato de 4 párrafos, los tres datos prácticos, 6 «incluye», 3 «qué traer», 2 «no incluye».
2. **Ficha mínima** — 1 foto, relato de un solo párrafo, ningún dato práctico, 3 «incluye» y nada más: sin miniaturas, sin «antes de reservar», sin «qué traer» ni «no incluye». **Tiene que verse terminada, no a medio llenar.**
3. **Ficha intermedia** — 3 fotos, solo «punto de encuentro» entre los prácticos, y una lista de un solo elemento.

En el prototipo se cambia entre los tres con los tweaks `estado` y `mostrarCancelacion`; en producción los tres salen del mismo render condicional.

## Assets

Ninguno propio. Las fotos son las de `imagenes[]` subidas por el administrador (en el prototipo, marcadores rayados generados con CSS). Iconos dibujados en SVG inline dentro del prototipo. Fuentes desde Google Fonts: `Bellota` (400, 700) y `Playfair Display` (400/500/600/700 + cursiva).

## Files

- `Ficha Experiencia v2.dc.html` — el diseño de referencia, con los tres estados y la galería funcionando.
- `screenshots/escritorio-1200.png` — pantalla completa a 1200px de contenido (estado *ficha completa*).
- `screenshots/movil-360.png` — pantalla completa a 360px (estado *ficha completa*).

En las capturas, la barra de reserva aparece al final del documento por conveniencia de la imagen: en la pantalla real es **fija al borde inferior** y acompaña todo el scroll.

En el proyecto de diseño también existen:

- `Ficha Experiencia · 3 opciones.dc.html` — las tres direcciones exploradas en móvil y escritorio (la aprobada es la **A / 2A**, que es la que documenta este README).
- `Ficha Experiencia.dc.html` — primera versión (portada inmersiva con texto sobre la foto), **descartada**.
