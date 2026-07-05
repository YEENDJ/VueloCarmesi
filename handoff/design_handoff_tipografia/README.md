# Handoff incremental: Reemplazo de tipografía display — Vuelo Carmesí

> **Alcance:** SOLO reemplazar la fuente display **Honey Lips** por **Playfair Display**. No cambiar nada más del sitio. Todo lo demás (Bellota como fuente de cuerpo, colores, layout) queda igual.

## Por qué

Honey Lips es un script muy enmarañado (baja legibilidad) y tiene licencia **de pago** ("Personal Use"). Se reemplaza por **Playfair Display** — un serif display clásico, elegante y muy legible, **gratuito para uso comercial** (SIL Open Font License, vía Google Fonts).

## Qué cambia

La variable/rol **`--font-display`** (títulos H1/H2, títulos display y el wordmark del logo). **Bellota** sigue siendo la fuente de cuerpo (`--font-body`) — **no se toca**.

---

## Pasos para Claude Code

1. **Cargar Playfair Display** (pesos 500, 600, 700). Preferentemente self-hosted (descargar los `.woff2` y servir con `@font-face`); si el proyecto ya usa el CDN de Google Fonts, seguir ese patrón:

   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">
   ```

   O en Next.js con `next/font`:
   ```ts
   import { Playfair_Display } from 'next/font/google';
   export const playfair = Playfair_Display({ subsets: ['latin'], weight: ['500','600','700'], display: 'swap', variable: '--font-display' });
   ```

2. **Apuntar `--font-display` a Playfair Display** en el archivo de tokens (donde hoy está definida Honey Lips):

   ```css
   :root {
     --font-display: 'Playfair Display', Georgia, serif;   /* antes: 'Honey Lips', cursive */
     /* --font-body sin cambios: 'Bellota', sans-serif */
   }
   ```

3. **Eliminar Honey Lips del proyecto:** borrar el archivo `Honey Lips Personal Use.ttf` / `HoneyLips.ttf` y su regla `@font-face`. No debe quedar ninguna referencia (evita mantener un font sin licencia en el repo).

4. **Ajustes de peso y alto de línea** (Playfair es serif, no script — corre distinto):
   - Usar **700** para H1 y el wordmark; **600** para H2 / subtítulos display.
   - Playfair es más ancho y alto que Honey Lips: revisar los H1 grandes de los heros. `line-height` recomendado **1.05–1.15** en titulares grandes. No cambiar la escala de tamaños general.
   - Opcional: en titulares muy grandes, `letter-spacing: -0.01em` afina el resultado.
   - Playfair tiene **itálica** (`font-style: italic`) — útil para acentuar una palabra en un titular si se quiere, pero no es obligatorio.

5. **Verificar contraste de legibilidad** sobre los fondos de marca (crimson `#D51312`, brown `#872B13`, cream `#FFEACA`) — Playfair funciona bien en todos; solo confirmar que ningún título quedó con `font-weight` menor a 500 (los pesos finos de Playfair pierden fuerza sobre fondos oscuros).

---

## Checklist de lugares afectados (todos usan `--font-display`)

- Wordmark "Vuelo Carmesí" en **navbar** y **footer**.
- Todos los **H1** (heros de landing y de vistas internas, "¡Reserva recibida!", "¡Pedido recibido!", etc.).
- Todos los **H2** y títulos de sección display ("Experiencias que dejan huella", "Respaldados por quienes cuidan la tierra", "Tu carrito", etc.).
- **No** aplica a body, labels, botones, inputs ni badges → esos siguen en Bellota.

> Si `--font-display` ya está bien centralizada, el cambio es en **un solo lugar** (paso 2) + cargar la fuente (paso 1) + limpiar Honey Lips (paso 3). El resto son ajustes finos de line-height.

---

## Texto listo para pegarle a Claude Code

> Reemplazá la tipografía display del sitio Vuelo Carmesí: hoy usa **Honey Lips** (script, licencia de pago) en `--font-display`. Cambiala por **Playfair Display** (Google Fonts, SIL OFL, libre para uso comercial), pesos 500/600/700, self-hosted si es posible. Apuntá `--font-display` a `'Playfair Display', Georgia, serif`. Dejá **Bellota** como cuerpo sin cambios. Eliminá el archivo de Honey Lips y su `@font-face`. Usá peso 700 en H1/logo y 600 en H2; subí `line-height` a 1.05–1.15 en los titulares grandes de los heros. No cambies colores, layout ni la escala de tamaños. Afecta wordmark (navbar+footer), todos los H1 y H2/títulos display; no toca body, botones ni inputs.
