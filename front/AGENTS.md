<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Convenciones del proyecto

## Moneda: siempre `$`, nunca otra cosa

Todo importe visible se escribe **`$160.000`**. Sin espacio detrás del símbolo,
sin sufijo `COP`, sin `Co$`, sin `USD`, y con separador de miles con punto.

El sitio vende en un solo país y en una sola moneda. Escribirla de tres formas
distintas no aclara de qué moneda se trata: solo hace que la misma cifra
parezca dos precios diferentes según la pantalla en la que caiga.

| Así sí | Así no |
|---|---|
| `$160.000` | `$ 160.000` · `COP 160.000` · `$160.000 COP` · `$160,000` · `Co$160.000` |

### La excepción: el sitio en inglés

En `/en` el precio se escribe **`COP 160,000`**, con la moneda delante y coma
de millares.

No es una incoherencia con lo de arriba: esa regla se escribió cuando el sitio
vendía en un solo país a un solo público, y ahí el `$` no es ambiguo porque
todos saben de qué moneda se habla. Para un visitante estadounidense —que es el
público de `/en`— `$160.000` se lee como ciento sesenta dólares con una
puntuación rara, y son cuarenta. Es el único dato del sitio cuyo **significado**
cambia con el idioma, no su redacción.

El separador cambia por el mismo motivo: en inglés el punto es el decimal, así
que `160.000` se leería como «ciento sesenta».

**No se convierte a dólares.** El cobro es en pesos, y una cifra en USD sería un
importe que el visitante no va a pagar: la tasa se mueve a diario y su banco
añade su spread. Aclarar la moneda resuelve la confusión sin prometer un precio
que no controlamos.

Lo resuelve la misma función, que recibe el idioma:

```ts
formatPrecio(160000)        // $160.000
formatPrecio(160000, 'en')  // COP 160,000
```

En componentes cliente el idioma sale de `useLocale()`; en páginas de servidor,
del `locale` de `params`. El panel de administración no pasa nada: está en
español y el valor por defecto ya es el correcto.

**Nunca formatees un precio a mano.** Hay una sola función y se usa siempre:

```ts
import { formatPrecio } from '@/lib/format'

<span>{formatPrecio(producto.precio)}</span>
```

Si te encuentras escribiendo `` `$${n.toLocaleString('es-CO')}` `` dentro de un
componente, eso ya existe: es `formatPrecio`. Estaba a mano en nueve sitios y
uno había quedado en `es-AR`.

Esto vale también para las etiquetas de formulario del panel: `Precio ($) *`,
no `Precio (COP) *`.

### El glifo del `$`

Playfair Display dibuja el signo de peso con **dos barras verticales**. A los
tamaños de la tarjeta de precio eso deja de leerse como un precio.

En `styles/tokens.css` hay una cara `'Peso'` con `unicode-range: U+0024` que
toma ese único carácter de `public/fonts/Peso-Bellota.woff2` —el `$` de Bellota,
de una sola barra— y va **primera** en `--font-display`. Cualquier otro carácter
cae a Playfair, así que no hace falta tocar el marcado en ningún sitio.

- **No quites `'Peso'` de la pila.** Si lo haces, todos los precios en
  tipografía display vuelven a las dos barras y no es evidente por qué.
- El archivo es un subset de un solo glifo (2,3 KB) con el escalado al 92%
  **horneado en el contorno**, no con `size-adjust` — ese descriptor no existe
  en Safari 16 y anteriores. El 92% está medido contra la altura de mayúsculas
  de Playfair; no lo cambies a ojo.
- Se regenera con `python front/scripts/generar-peso.py`, que documenta de
  dónde sale cada número. Solo hace falta si cambia Bellota.

El backend no puede importar del front, así que tiene su propio gemelo en
`back/src/notificaciones/format-items-pedido.util.ts` con exactamente la misma
salida — es lo que da formato a los correos y a los avisos de Telegram. **Si
cambias uno, cambia el otro**: un pedido tiene que leerse igual en la web que
en el correo de confirmación.

## Idioma

Español de Colombia, en tuteo: «reserva», «descubre», «escríbenos». Nada de
voseo rioplatense («reservá», «descubrí»). Teléfonos con `+57`.
