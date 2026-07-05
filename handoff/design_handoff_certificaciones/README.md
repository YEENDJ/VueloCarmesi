# Handoff incremental: Sección de Certificaciones — Vuelo Carmesí

> **Alcance:** SOLO la funcionalidad **nueva** de certificaciones/avales. El resto del sitio (landing, tienda, flujos, etc.) ya está implementado — **no tocar nada más**. Esto se **agrega** al sitio existente.

## Qué se agrega

Dos piezas que comparten la misma fuente de datos:

1. **Sección "Avales y certificaciones"** en la **landing** — ubicada **entre "Sobre Nosotros" y "La finca en imágenes" (galería)**. Grid de tarjetas, una por certificación.
2. **Tira de sellos en el footer** (global, visible en todas las páginas) — fila de logos monocromáticos sobre el fondo brown, encima del copyright, bajo el título "Certificados por".

Ver `screenshots/01-seccion-landing.png` y `screenshots/02-tira-footer.png`.

---

## Modelo de datos (nuevo)

Una sola lista de certificaciones alimenta ambas piezas. En producción puede venir de un CMS/config; los campos:

```ts
type Certificacion = {
  nombre: string;    // "Buenas Prácticas Agrícolas"
  entidad: string;   // organismo emisor: "ICA"
  detalle: string;   // 1 línea de qué garantiza
  logo: string;      // logo oficial de la entidad (imagen); en el proto es placeholder
};
```

Datos de ejemplo usados en el prototipo (ajustar a las certificaciones reales de la finca):

```
[
  { nombre: "Buenas Prácticas Agrícolas", entidad: "ICA",       detalle: "Certificación BPA que avala el manejo responsable del cultivo de cacao." },
  { nombre: "Turismo Sostenible",         entidad: "MinCIT",    detalle: "Norma NTS-TS que garantiza prácticas turísticas responsables con el entorno." },
  { nombre: "Producción Agroecológica",   entidad: "Ecocert",   detalle: "Cultivo libre de agroquímicos, respetando los ciclos naturales del monte." },
  { nombre: "Comercio Justo",             entidad: "Fairtrade", detalle: "Precios justos y condiciones dignas para las familias productoras." }
]
```

> ⚠️ **Logos:** usar los **logos oficiales** de cada entidad (PNG/SVG con licencia de uso). En el prototipo son placeholders rayados con etiqueta monospace — reemplazar por el logo real de cada organismo.

---

## Pieza 1 — Sección en la landing

**Ubicación:** insertar como una sección nueva **después** del bloque "Sobre Nosotros" y **antes** de la galería.

**Layout y estilo (tokens del sistema ya existente):**
- Fondo: cream `#FFEACA`. Padding vertical `clamp(48px, 8vw, 80px)`, contenedor máx `1100px` centrado.
- **Encabezado centrado:** eyebrow "Avales y certificaciones" (Bellota 700, 13px, `letter-spacing:3px`, uppercase, color orange `#EA5B0C`) + H2 en Honey Lips 40px crimson `#D51312` ("Respaldados por quienes cuidan la tierra") + párrafo Bellota 700 ~18px brown-70%.
- **Grid** `repeat(auto-fit, minmax(220px, 1fr))`, gap 24px.
- **Tarjeta** (una por certificación): fondo `#FFF6E4`, borde `1px solid rgba(135,43,19,.15)`, radius 12, padding `28px 24px`, sombra sutil, contenido centrado en columna:
  - Logo en círculo 96px (borde `2px rgba(135,43,19,.12)`) — acá va el logo oficial.
  - Nombre: Bellota 700 17px brown.
  - Entidad: Bellota 700 12px uppercase `letter-spacing:.5px` orange, márgenes `6px 0 12px`.
  - Detalle: 13px line-height 1.5 brown-70%.

**Nota de ritmo visual:** al insertar esta sección cream, en el prototipo se cambió el fondo de la **galería** siguiente de cream a **brown `#872B13`** (con su H2 en cream) para no dejar dos secciones cream seguidas. Si en el sitio ya implementado la galería es cream, aplicar el mismo cambio para mantener la alternancia brown → cream → brown → crimson.

---

## Pieza 2 — Tira en el footer

**Ubicación:** dentro del footer existente, **entre** las columnas (logo/navegación/contacto) y la línea de copyright.

**Layout y estilo:**
- Separador arriba: `border-top:1px solid rgba(253,195,0,.3)`, `margin-top:32px; padding-top:28px`.
- Título "Certificados por": Bellota 700 12px uppercase `letter-spacing:1px`, color `rgba(253,195,0,.7)` (gold atenuado), centrado, `margin-bottom:18px`.
- Fila de sellos: `display:flex; flex-wrap:wrap; justify-content:center; gap:16px`.
- Cada sello: círculo 64px, fondo `rgba(255,234,202,.08)`, borde `1px solid rgba(253,195,0,.25)`, con el logo dentro. Atributo `title` = nombre de la certificación (tooltip accesible).
- El copyright pasa debajo con su propio separador atenuado (`rgba(253,195,0,.15)`, `padding-top:24px`).

**Tratamiento recomendado en producción:** logos en escala de grises / monocromo atenuado, con color al `:hover` (para que aporten credibilidad sin competir con el contenido).

---

## Colocación contextual (opcional, recomendado a futuro)

Para reforzar la confianza en el momento de decisión (no incluido en este prototipo, pero fácil con el mismo dato):
- **Detalle de Experiencia** → mostrar el sello de **Turismo Sostenible** cerca del precio/CTA.
- **Detalle de Producto** → mostrar **BPA (ICA)** / agroecológica cerca del producto.

---

## Implementación (resumen)

1. Agregar la lista `certificaciones` a la capa de datos/config (fuente única para ambas piezas).
2. Crear un componente reutilizable, p. ej. `CertBadge` (logo + `title`), y usarlo en:
   - `CertificacionesSection` (tarjetas con nombre/entidad/detalle) → insertar en la landing entre Sobre Nosotros y Galería.
   - La tira del footer (solo el círculo con logo).
3. Reemplazar los placeholders por los **logos oficiales** con licencia.
4. Respetar tokens existentes (no introducir colores nuevos).

## Archivos en este bundle

- `README.md` — este documento.
- `screenshots/01-seccion-landing.png` — la sección en la landing.
- `screenshots/02-tira-footer.png` — la tira de sellos en el footer.

> El código de referencia vive en el prototipo `Vuelo Carmesi.dc.html` (vista Landing) del proyecto — este handoff describe solo el bloque nuevo a portar.
