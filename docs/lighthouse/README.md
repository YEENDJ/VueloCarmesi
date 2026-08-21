# Reportes Lighthouse — Vuelo Carmesí

Auditoría corrida contra el **build de producción** (`next build` + `next start`) con Chrome headless.

## Resultados

| Página | Perf | Accesibilidad | Best Practices | SEO |
|--------|:----:|:----:|:----:|:----:|
| Home — escritorio | 88 | 92 | 100 | 100 |
| Home — móvil | 80 | 92 | 100 | 100 |
| Tienda — escritorio | 98 | 90 | 100 | 100 |
| Experiencia — escritorio | 96 | 92 | 100 | 100 |

Core Web Vitals (escritorio): LCP 0.8–1.4 s · CLS < 0.01 · TBT 0–110 ms.

## Archivos

Abrí los `.html` en el navegador para ver el reporte completo e interactivo:

- `lh-home-desktop.html` / `.json`
- `lh-home-mobile.html` / `.json`
- `lh-tienda-desktop.html` / `.json`
- `lh-experiencia-desktop.html` / `.json`

## Pendientes de mejora

- **Accesibilidad:** contraste de color y enlaces distinguibles solo por color (paleta de marca).
- **Perf móvil:** LCP alto por imágenes del hero (optimizar formato/tamaño y `priority`).
