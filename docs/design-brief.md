# Vuelo Carmesí — Prompt de Diseño para Claude Design

> Pegá este documento completo en una nueva conversación con Claude Design.
> Contiene todo el contexto de marca + la tarea explícita + especificaciones por pantalla y componente.

---

## TAREA

Necesito que diseñes el sistema visual completo del portal web **Vuelo Carmesí**. El resultado debe ser una propuesta detallada que especifique, para cada pantalla y cada componente:

- Layout en desktop (1280px) y mobile (375px)
- Estructura de bloques con posición, tamaño y espaciado
- Colores exactos usando los tokens de marca
- Tipografía con tamaño, peso y color por cada nivel de texto
- Todos los estados de interacción (default, hover, focus, active, disabled, error, loading, empty)
- Comportamiento responsive — cómo se transforma el layout al pasar a mobile

Usá únicamente los colores y tipografías del sistema de diseño que te doy abajo. No inventes colores nuevos ni uses fuentes externas.

---

## SISTEMA DE DISEÑO

### Paleta de colores

| Token              | Hex       | Rol en UI                                          |
|--------------------|-----------|-----------------------------------------------------|
| `--color-cream`    | `#FFEACA` | Fondo dominante — superficies, tarjetas, páginas    |
| `--color-crimson`  | `#D51312` | Color primario — headings principales, CTAs, Navbar |
| `--color-orange`   | `#EA5B0C` | Acento activo — hover de botones, íconos, links     |
| `--color-brown`    | `#872B13` | Texto oscuro — body, labels, Footer, fondos ricos   |
| `--color-amber`    | `#F59C00` | Destacados — badges, precios, rating, detalles      |
| `--color-gold`     | `#FDC300` | Decorativo — separadores, ornamentos, detalles finos|

**Regla de composición:** cream domina el espacio. Crimson jerarquiza. Orange activa. Brown ancla. Amber y gold acentúan.

Para fondos oscuros (hero, footer, bandas CTA) usá brown `#872B13` o crimson `#D51312`. Texto sobre fondo oscuro siempre en cream `#FFEACA`.

### Tipografías

| Familia          | Uso                              | CSS var          |
|------------------|----------------------------------|------------------|
| **Honey Lips**   | H1, H2, títulos display          | `--font-display` |
| **Bellota Bold** | H3, body, párrafos, labels, nav  | `--font-body`    |

**Escala tipográfica:**

| Nivel        | Fuente       | Tamaño desktop | Tamaño mobile | Color por defecto          |
|--------------|--------------|----------------|---------------|----------------------------|
| H1 Display   | Honey Lips   | 72px           | 40px          | cream (sobre fondo oscuro) |
| H1 Light     | Honey Lips   | 56px           | 36px          | crimson (sobre cream)      |
| H2           | Honey Lips   | 40px           | 28px          | crimson o brown            |
| H3           | Bellota Bold | 24px           | 20px          | brown                      |
| Body Large   | Bellota Bold | 18px           | 16px          | brown                      |
| Body         | Bellota Bold | 16px           | 15px          | brown                      |
| Label        | Bellota Bold | 14px           | 13px          | brown o amber              |
| Caption      | Bellota Bold | 12px           | 12px          | brown al 70%               |

### Sistema de espaciado

Base unit: `8px`. Todos los espaciados son múltiplos de 8.

| Token     | Valor | Uso típico                            |
|-----------|-------|---------------------------------------|
| `space-1` | 8px   | Gap mínimo entre elementos inline     |
| `space-2` | 16px  | Padding interno de chips/badges       |
| `space-3` | 24px  | Gap entre tarjetas, padding horizontal de inputs |
| `space-4` | 32px  | Padding interno de cards              |
| `space-5` | 40px  | Gap entre secciones menores           |
| `space-6` | 48px  | Padding vertical de secciones densas  |
| `space-8` | 64px  | Padding vertical de secciones estándar|
| `space-10`| 80px  | Padding vertical de secciones hero    |
| `space-16`| 128px | Padding vertical de secciones grandes |

### Grid

- Desktop: contenedor máximo `1200px`, centrado, padding lateral `24px`
- Tablet (768px): padding lateral `20px`
- Mobile (375px): padding lateral `16px`
- Columnas: 12 en desktop, 4 en mobile

### Bordes y sombras

- Border-radius pequeño: `4px` (badges, inputs)
- Border-radius medio: `8px` (cards, botones)
- Border-radius grande: `12px` (cards destacadas, modales)
- Sombra sutil: `0 2px 8px rgba(135, 43, 19, 0.10)` (usando brown)
- Sombra media: `0 4px 16px rgba(135, 43, 19, 0.16)`
- Sombra hover: `0 8px 24px rgba(135, 43, 19, 0.20)`

---

## PERSONALIDAD DE MARCA

**Vuelo Carmesí** es una marca de experiencias agroecológicas con sabor a cacao.

- **70% Héroe** — proactivo, aventurero, valiente, recursivo
- **30% Sabio** — experto, confiable, analítico, competente

El diseño debe evocar tierra, cacao y naturaleza con carácter audaz. No es minimalista ni frío — es cálido, con textura, con energía. El cream es como papel kraft, el crimson es como el interior del cacao maduro.

---

## COMPONENTES BASE

Para cada componente describí: estructura visual, medidas, colores, tipografía y todos los estados.

---

### `Button`

**Tres variantes:**

**Primary (crimson):**
- Fondo: crimson `#D51312`
- Texto: cream `#FFEACA`, Bellota Bold, 16px
- Padding: 14px vertical × 28px horizontal
- Border-radius: 8px
- Estado hover: fondo orange `#EA5B0C`
- Estado active/pressed: fondo brown `#872B13`
- Estado disabled: fondo crimson al 40%, cursor not-allowed, texto cream al 50%
- Estado loading: mismo estilo + spinner inline izquierda del texto (cream, 16px)

**Secondary (orange outline):**
- Fondo: transparente
- Borde: 2px solid orange `#EA5B0C`
- Texto: orange `#EA5B0C`, Bellota Bold, 16px
- Padding: 12px vertical × 26px horizontal
- Border-radius: 8px
- Estado hover: fondo orange `#EA5B0C`, texto cream
- Estado active: fondo brown, borde brown, texto cream
- Estado disabled: borde al 40%, texto al 40%

**Ghost (brown outline):**
- Fondo: transparente
- Borde: 1.5px solid brown `#872B13`
- Texto: brown `#872B13`, Bellota Bold, 16px
- Padding: 12px vertical × 26px horizontal
- Estado hover: fondo brown `#872B13`, texto cream
- Estado active: fondo brown oscurecido ~10%
- Estado disabled: todo al 40%

---

### `Input`

Aplica a `input[type=text]`, `input[type=email]`, `input[type=tel]`, `select`, `textarea`.

- Fondo: cream `#FFEACA`
- Borde: 1.5px solid brown `#872B13` al 40%
- Border-radius: 4px
- Padding: 12px vertical × 16px horizontal
- Label encima: Bellota Bold 14px, color brown, margin-bottom 6px
- Placeholder: Bellota Bold 16px, brown al 40%
- Texto ingresado: Bellota Bold 16px, brown
- Estado focus: borde crimson `#D51312` 2px, outline none, leve sombra crimson `0 0 0 3px rgba(213,19,18,0.15)`
- Estado error: borde crimson `#D51312`, mensaje de error debajo en Bellota Bold 13px crimson
- Estado disabled: fondo cream al 60%, borde al 20%, cursor not-allowed
- `textarea`: mismo estilo, min-height 120px, resize vertical

---

### `Badge`

- Forma: pill (border-radius 100px)
- Padding: 4px vertical × 10px horizontal
- Bellota Bold, 12px

**Variantes:**
- `Disponible`: fondo amber `#F59C00`, texto brown `#872B13`
- `Nuevo`: fondo orange `#EA5B0C`, texto cream
- `Agotado`: fondo brown al 15%, texto brown al 60%
- `Destacado`: fondo gold `#FDC300`, texto brown

---

### `Card`

Contenedor base reutilizable por `ExperienciaCard` y `ProductoCard`.

- Fondo: cream `#FFEACA`
- Borde: 1px solid brown `#872B13` al 15%
- Border-radius: 12px
- Sombra: `0 2px 8px rgba(135, 43, 19, 0.10)`
- Overflow: hidden (para que la imagen respete el border-radius)
- Estado hover de la card completa: sombra media, translateY(-4px), transición 200ms ease

---

### `ExperienciaCard`

Basada en `Card`. Layout vertical.

- **Imagen:** 100% ancho × 200px alto, object-fit cover
- **Cuerpo (padding 24px):**
  - Badge de disponibilidad (top-right sobre la imagen, con position absolute)
  - Título: H3 Bellota Bold 20px, brown, margin-bottom 8px
  - Descripción corta: Body 14px, brown al 70%, 2 líneas max con `line-clamp-2`
  - Fila de detalles: ícono reloj + duración (amber) | separador | precio en amber bold
  - Botón "Ver más" secundario (orange outline), ancho completo, margin-top 16px

---

### `ProductoCard`

Basada en `Card`. Layout vertical.

- **Imagen:** 100% ancho × 220px alto, object-fit cover, fondo cream
- **Badge** (si aplica): position absolute top-right sobre imagen
- **Cuerpo (padding 20px):**
  - Nombre: Bellota Bold 18px, brown
  - Descripción corta: 13px, brown al 65%, 1 línea max
  - Precio: Bellota Bold 20px, amber `#F59C00`
  - Botón "Agregar al carrito" primary (crimson), ancho completo, margin-top 12px

---

### `Navbar`

- Altura: 72px desktop, 60px mobile
- Fondo: crimson `#D51312`
- Layout: `space-between`, padding horizontal 24px (container centrado)
- **Izquierda:** Logo PNG a 48px de alto, proportional width
- **Derecha desktop:** Links en Bellota Bold 16px cream, gap 32px entre links
  - Estado hover: underline cream o amber
  - Estado active (página actual): underline amber permanente
- **Mobile:** hamburger menu (ícono cream 24px) que despliega menú vertical
  - Panel mobile: fondo brown `#872B13`, links centrados, Bellota Bold 20px cream, padding 24px vertical por link
  - Animación: slide-down desde top, 250ms ease

---

### `Footer`

- Fondo: brown `#872B13`
- Padding vertical: 64px desktop, 48px mobile
- Layout desktop: 3 columnas (logo+tagline | links navegación | contacto/redes)
- Layout mobile: apilado verticalmente, centrado
- Texto: cream `#FFEACA`
- Tipografía: Bellota Bold 14px para links y caption
- Links hover: color amber
- Línea divisoria inferior: gold `#FDC300` al 30%, 1px
- Copyright: Bellota Bold 12px, cream al 60%, centrado, padding-top 24px

---

## VISTAS

Para cada vista describí el layout completo en desktop y mobile, con secciones, dimensiones, colores y tipografías.

---

### Vista 1: Landing `/`

Página de scroll único con 7 secciones apiladas verticalmente.

---

#### Sección 1 — Navbar
*(Ver componente Navbar arriba)*

---

#### Sección 2 — Hero

**Desktop:**
- Altura: 100vh mínimo
- Fondo: imagen de fondo de la finca/cacao con overlay gradiente `linear-gradient(to bottom, rgba(135,43,19,0.70) 0%, rgba(135,43,19,0.50) 100%)`
- Contenido centrado vertical y horizontalmente (flexbox column, align-center)
- Eyebrow: Bellota Bold 14px, gold `#FDC300`, letter-spacing 3px, uppercase, margin-bottom 16px. Texto: "EXPERIENCIAS AGROECOLÓGICAS"
- H1: Honey Lips 72px, cream, text-align center, max-width 800px, line-height 1.1
- Subtítulo: Bellota Bold 20px, cream al 85%, text-align center, max-width 560px, margin-top 16px
- CTA button: Primary crimson, tamaño grande (18px, padding 18px 40px), margin-top 40px
- Scroll indicator: flecha o ícono animado en cream en la parte inferior, centrado

**Mobile:**
- H1: 40px, max-width 100%
- Subtítulo: 16px
- Padding horizontal: 16px
- CTA: ancho completo

---

#### Sección 3 — Preview de Experiencias

**Desktop:**
- Padding: 80px vertical
- Fondo: cream `#FFEACA`
- H2 centrado: Honey Lips 40px, crimson, margin-bottom 12px
- Subtítulo centrado: Bellota Bold 18px, brown al 70%, max-width 480px, margin-bottom 48px
- Grid: 3 columnas, gap 24px, max-width contenedor
- Debajo del grid: link/botón "Ver todas las experiencias" centrado, estilo ghost brown, margin-top 40px

**Mobile:**
- Grid: 1 columna (scroll o cards apiladas)
- H2: 28px

---

#### Sección 4 — Sobre Nosotros

**Desktop:**
- Padding: 100px vertical
- Fondo: alternado — brown `#872B13`
- Layout: 2 columnas 50/50, gap 80px, align-items center
- Columna izquierda: imagen con border-radius 12px, sombra media
- Columna derecha:
  - Eyebrow: Bellota Bold 13px, gold uppercase letter-spacing 3px
  - H2: Honey Lips 40px, cream, margin-bottom 20px
  - Body: Bellota Bold 18px, cream al 85%, line-height 1.7, margin-bottom 32px
  - Botón ghost (borde cream, texto cream, hover fondo cream texto brown)

**Mobile:**
- Imagen arriba, texto abajo
- Padding: 60px vertical
- H2: 28px

---

#### Sección 5 — Galería

**Desktop:**
- Padding: 80px vertical
- Fondo: cream
- H2 centrado: Honey Lips 40px, crimson, margin-bottom 40px
- Grid masonry 4 columnas, gap 12px, con imágenes de distintas alturas
- Imágenes con border-radius 8px, hover: leve scale(1.02) + sombra media

**Mobile:**
- Grid 2 columnas, gap 8px

---

#### Sección 6 — Banda CTA

**Desktop:**
- Padding: 80px vertical
- Fondo: crimson `#D51312`
- Contenido centrado vertical + horizontal
- H2: Honey Lips 48px, cream, text-align center, max-width 640px
- Párrafo: Bellota Bold 18px, cream al 85%, margin-top 16px, max-width 480px
- Botón: secondary orange outline pero con borde cream y texto cream en este contexto. Hover: fondo cream, texto crimson. Tamaño grande (padding 18px 40px, 18px font-size)

**Mobile:**
- H2: 32px
- Botón: ancho completo

---

#### Sección 7 — Footer
*(Ver componente Footer arriba)*

---

### Vista 2: Contacto `/contacto`

**Desktop:**
- Layout de 2 columnas: columna izquierda (info) 40% | columna derecha (formulario) 60%
- Padding página: 80px vertical

**Columna izquierda (fondo brown `#872B13`, padding 48px):**
- H2: Honey Lips 40px, cream
- Párrafo intro: Bellota Bold 18px, cream al 80%, line-height 1.7
- Lista de datos de contacto con íconos: email, teléfono, ubicación
- Íconos: amber `#F59C00`, texto: Bellota Bold 16px, cream

**Columna derecha (fondo cream, padding 48px):**
- H3: Bellota Bold 24px, brown, margin-bottom 32px. Texto: "Envianos un mensaje"
- Campos: Nombre (full width), Email (full width), Asunto (full width), Mensaje textarea (full width, 160px alto)
- Botón "Enviar mensaje" Primary crimson, ancho completo, margin-top 8px

**Estado de éxito (después de enviar):**
- El formulario se reemplaza por un panel inline
- Ícono check en gold/amber, grande (48px)
- H3 "¡Mensaje enviado!" en Honey Lips 28px, crimson
- Párrafo confirmación: Bellota Bold 16px, brown
- Link "Volver al inicio" ghost brown

**Mobile:**
- Columnas apiladas: info arriba, formulario abajo

---

### Vista 3: Catálogo de Experiencias `/experiencias`

**Desktop:**

**Hero interno (no tan alto como el de landing):**
- Altura: 280px
- Fondo: brown con overlay imagen
- H1: Honey Lips 48px, cream, centrado
- Subtítulo: Bellota Bold 16px, cream al 80%

**Barra de controles:**
- Fondo: cream, borde bottom 1px brown al 15%
- Padding: 16px vertical
- Izquierda: conteo "X experiencias disponibles" en Bellota Bold 14px, brown al 60%
- Derecha: `select` de ordenamiento (Precio: menor a mayor / mayor a menor / Más recientes)

**Grid de tarjetas:**
- Padding: 48px vertical
- 3 columnas desktop, gap 24px
- ExperienciaCard por cada ítem

**Estado vacío (sin experiencias):**
- Ícono ilustración (planta o semilla, tono cream/amber)
- H3 "Próximamente nuevas experiencias" Bellota Bold 24px brown
- Párrafo + botón de contacto

**Mobile:**
- Hero: 200px alto
- Grid: 1 columna

---

### Vista 4: Detalle de Experiencia `/experiencias/[slug]`

**Desktop — layout de 2 columnas en el bloque principal:**

**Hero completo:**
- Altura: 480px
- Imagen fondo + overlay gradient (igual al hero de landing pero más sutil)
- H1: Honey Lips 56px, cream
- Badge de disponibilidad en esquina inferior izquierda

**Cuerpo (2 columnas):**
- Columna principal (65%):
  - H2 "Sobre esta experiencia" Honey Lips 32px crimson, padding-top 48px
  - Body texto descriptivo largo: Bellota Bold 18px, brown, line-height 1.8
  - H3 "¿Qué incluye?" Bellota Bold 24px brown, margin-top 40px
  - Lista con íconos amber checkmark
  - H3 "¿Qué traer?" — mismo estilo, lista con íconos
  - Galería fotográfica: grid 3 columnas, border-radius 8px, hover scale leve

- Columna lateral sticky (35%, top 24px):
  - Card elevada (sombra media), padding 32px, border-radius 12px, fondo cream
  - Precio: Bellota Bold 32px, amber
  - Duración: ícono reloj + texto, Bellota Bold 16px, brown
  - Capacidad: ícono personas + texto
  - Separador horizontal: gold al 30%
  - Botón "Reservar ahora" Primary crimson, ancho completo, tamaño grande
  - Texto debajo: Caption 12px brown al 60% "Sin compromiso de pago"

**Mobile:**
- Columna lateral va debajo de la columna principal (pierden el sticky)
- Hero: 300px

---

### Vista 5: Formulario de Reserva `/reservar/[slug]`

**Desktop — 2 columnas:**

**Columna principal (60%):**
- H1: Honey Lips 40px, crimson. "Reservá tu experiencia"
- Subtítulo: Bellota Bold 16px, brown al 70%
- Formulario en card (cream, sombra media, padding 40px, border-radius 12px):
  - Fila 1: Nombre completo (50%) | Teléfono (50%)
  - Fila 2: Email (100%)
  - Fila 3: Fecha deseada input date (50%) | Cantidad de personas select (50%)
  - Comentarios textarea (100%, 120px alto)
  - Botón "Confirmar reserva" Primary crimson, ancho completo, tamaño grande
  - Caption debajo: "Te contactaremos para confirmar disponibilidad"

**Columna resumen (40%):**
- Card sticky (fondo brown `#872B13`, padding 32px, border-radius 12px)
- Label: Bellota Bold 12px, gold uppercase letter-spacing. "ESTÁS RESERVANDO"
- Nombre experiencia: Honey Lips 28px, cream
- Imagen miniatura: 100% ancho, 160px alto, border-radius 8px, margin: 16px 0
- Detalles: precio, duración — Bellota Bold 16px, cream
- Línea separadora gold al 30%
- Nota: Caption 12px, cream al 60%

**Mobile:**
- Resumen primero (colapsado/accordion o siempre visible), formulario debajo
- Campos en columna única

---

### Vista 6: Confirmación de Reserva `/reservar/confirmacion`

Layout centrado, sin columnas.

**Desktop:**
- Padding: 80px vertical
- Contenedor máx 600px, centrado
- Ícono éxito: círculo gold `#FDC300` con checkmark brown, 80px diámetro
- H1: Honey Lips 48px, crimson, text-align center, margin-top 24px. "¡Reserva recibida!"
- Párrafo: Bellota Bold 18px, brown, text-align center, max-width 440px, margin: 16px auto
- **Card de resumen** (cream, borde amber, border-radius 12px, padding 32px, margin: 40px 0):
  - "Código de reserva: #ABC123" — Bellota Bold 20px, amber
  - Separador
  - Experiencia: label 12px brown al 60% + valor 16px brown
  - Fecha, personas: igual
- Fila de 2 botones centrados:
  - "Volver al inicio" ghost brown
  - "Ver tienda" Primary crimson

**Mobile:**
- Ícono 64px
- H1 36px

---

### Vista 7: Catálogo de Productos `/tienda`

Misma estructura que `/experiencias` pero con ProductoCard.

**Hero interno:**
- H1: "Nuestra Tienda"
- Subtítulo: descripción de los productos (cacao, chocolates artesanales, etc.)

**Filtros de categoría:**
- Fila de pills/tabs: "Todos" | "Cacao" | "Chocolates" | "Kits" (otros a definir)
- Pill activo: fondo crimson, texto cream
- Pill inactivo: fondo transparent, borde brown, texto brown; hover: fondo brown, texto cream

**Grid de productos:**
- 4 columnas desktop, 2 tablet, 1 mobile
- Gap 20px
- ProductoCard por ítem

---

### Vista 8: Detalle de Producto `/tienda/[slug]`

**Desktop — 2 columnas en proporción 55/45:**

**Columna izquierda — Galería:**
- Imagen principal: 100%, aspect ratio 1:1, border-radius 12px, object-fit cover
- Thumbnails debajo: fila de 4, 64px × 64px, border-radius 8px, borde al click: crimson 2px
- Estado hover thumbnail: borde orange

**Columna derecha — Información:**
- Badge categoría (top)
- H1: Honey Lips 40px, brown
- Precio: Bellota Bold 32px, amber, margin: 16px 0
- Descripción: Bellota Bold 16px, brown, line-height 1.8
- Separador: gold al 30%
- **Selector de cantidad:**
  - Layout: botón "−" (brown outline, 40px×40px) | número centrado (Bellota Bold 20px, brown, min-width 40px) | botón "+" (brown outline)
  - Hover botones: fondo brown, texto cream
  - Cantidad mínima 1, máxima definida por stock
- Botón "Agregar al carrito" Primary crimson, ancho completo, tamaño grande, margin-top 24px
- Nota de disponibilidad: Caption 12px, brown al 60%

**Sección de productos relacionados (debajo, ancho completo):**
- H2 "También te puede gustar" Honey Lips 32px, crimson, margin: 64px 0 32px
- Grid 4 columnas ProductoCard

**Mobile:**
- Galería arriba (sin thumbnails, swipe), info abajo
- H1: 28px

---

### Vista 9: Carrito `/carrito`

**Desktop — 2 columnas:**

**Columna principal (65%) — Lista de ítems:**
- H1: Honey Lips 36px, crimson. "Tu carrito"
- Por cada producto:
  - Layout fila: imagen 80×80 border-radius 8px | nombre + descripción | controles cantidad | precio | botón eliminar
  - Imagen: object-fit cover
  - Nombre: Bellota Bold 18px, brown
  - Cantidad: igual al selector del detalle de producto pero más compacto (32px)
  - Precio por ítem: Bellota Bold 18px, amber
  - Botón eliminar: ícono trash en brown al 40%, hover: crimson
  - Separador horizontal entre ítems: brown al 10%
- Botón "Vaciar carrito" debajo: ghost brown pequeño, icono trash

**Columna resumen (35%):**
- Card sticky (cream, sombra media, padding 32px, border-radius 12px)
- H3 "Resumen del pedido" Bellota Bold 22px, brown
- Fila subtotal por producto: label + precio, Bellota Bold 15px, brown
- Separador
- Fila **Total**: Bellota Bold 22px, brown | precio en amber 24px bold
- Botón "Ir al checkout" Primary crimson, ancho completo, tamaño grande, margin-top 24px
- Link "Seguir comprando" debajo, centrado, ghost brown pequeño

**Estado vacío del carrito:**
- Ícono bolsa vacía (usando amber/cream), 64px
- H3 "Tu carrito está vacío" Bellota Bold 24px, brown
- Párrafo + botón "Ver tienda" Primary crimson

**Mobile:**
- Lista de ítems arriba, resumen abajo
- Imagen en ítem: 64×64

---

### Vista 10: Checkout `/checkout`

**Desktop — 2 columnas:**

**Columna formulario (60%):**
- H1: Honey Lips 36px, crimson. "Finalizar pedido"
- Sección "Datos de contacto":
  - H3 Bellota Bold 18px, brown, con separador amber debajo
  - Nombre completo (full width)
  - Fila: Email (60%) | Teléfono (40%)
- Sección "Datos de entrega" (si aplica):
  - H3 igual
  - Dirección (full width)
  - Fila: Ciudad (50%) | Código postal (50%)
  - Notas de entrega textarea (full width, 80px)
- Botón "Confirmar pedido" Primary crimson, ancho completo, tamaño grande, margin-top 32px
- Caption debajo: "Al confirmar aceptás nuestras condiciones de venta"

**Columna resumen (40%):**
- Card sticky (fondo brown `#872B13`, padding 32px, border-radius 12px)
- Label: Bellota Bold 12px, gold uppercase. "RESUMEN DE TU PEDIDO"
- Por cada ítem:
  - Nombre: Bellota Bold 15px, cream | cantidad badge: amber | precio: cream
- Separador gold al 30%
- Total: Bellota Bold 20px, cream | precio: amber bold 22px
- Caption 12px cream al 60%: nota sobre método de pago

**Mobile:**
- Formulario arriba, resumen debajo (colapsado con accordion "Ver resumen")

---

## ENTREGABLES ESPERADOS

Para cada pantalla y componente documentado arriba, necesito que me entregues:

1. **Descripción visual completa** — layout, estructura de bloques, colores exactos, tipografía con tamaños
2. **Comportamiento responsive** — cómo cambia en mobile vs desktop
3. **Estados de interacción** — todos los estados de cada componente interactivo
4. **Decisiones de diseño** — justificación de las elecciones visuales en términos de la personalidad de marca

Empezá por el sistema base (componentes) y luego avanzá por vistas en el orden de prioridad indicado. Si identificás inconsistencias o decisiones que tomar, propone la opción que mejor respete la personalidad Héroe/Sabio y usá los tokens de marca.
