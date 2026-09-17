# Convenciones del proyecto

## Moneda: siempre `$`, nunca otra cosa

Todo importe visible se escribe **`$160.000`**. Sin espacio detrás del símbolo,
sin sufijo `COP`, sin `Co$`, sin `USD`, y con separador de miles con punto.

| Así sí | Así no |
|---|---|
| `$160.000` | `$ 160.000` · `$160.000 COP` · `COP 160.000` · `$160,000` |

Esto aplica igual a los correos y a los avisos de Telegram, que es donde se
había desviado: las plantillas de pedido usaban `$ 55.000` y el mensaje de
Telegram cerraba con `Total: $ 55.000 COP`, así que el mismo pedido se leía de
dos formas distintas según lo miraras en la web o en el correo.

**Nunca formatees un precio a mano.** Hay una sola función:

```ts
import { formatPrecio } from './format-items-pedido.util'

`Total: ${formatPrecio(pedido.total)}`
```

Es el gemelo de `formatPrecio` en `front/lib/format.ts`. Están duplicados a
propósito —el backend no puede importar del front— pero tienen que dar
exactamente la misma salida: **si cambias uno, cambia el otro**.

> Desde el i18n, el del front admite un segundo argumento con el idioma y en
> inglés devuelve `COP 160,000` (ver `front/AGENTS.md`). El del backend **no**
> lo tiene y sigue solo en español, porque los correos y los avisos de Telegram
> todavía no se envían traducidos. El día que se traduzcan, este gemelo necesita
> la misma excepción.

## Idioma

Español de Colombia, en tuteo. Teléfonos con `+57`.
