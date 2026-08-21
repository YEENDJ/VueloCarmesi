# Brief para Claude Design — Ficha de detalle de experiencia

> Pantalla: `/experiencias/[slug]`. Este documento es la instrucción completa;
> lo que no esté aquí, no existe en la pantalla.

---

## 1. Qué estás diseñando

Rediseña **una sola pantalla**: la ficha de detalle de una experiencia turística.
No diseñes el listado, ni la portada, ni el carrito, ni el panel de administración,
ni la pantalla de reserva.

El sitio es de **Vuelo Carmesí**, una finca agroecológica de cacao y café en
Colombia que vende dos cosas: productos derivados del cacao y experiencias
turísticas en la finca. Esta pantalla vende una experiencia.

**Quién la visita:** una persona que llegó desde el listado de experiencias, desde
Google o desde un enlace de WhatsApp; en móvil la mayoría de las veces. Está
decidiendo si reserva y no conoce la finca.

**Qué tiene que lograr la pantalla, en este orden:**

1. Que entienda de qué va la experiencia y se le antoje.
2. Que encuentre sin buscar: cuánto cuesta, cuánto dura, para cuántas personas,
   cuándo se hace, dónde se encuentra con el guía y qué pasa si cancela.
3. Que pulse **Reservar ahora** y llegue a `/reservar/[slug]`, donde elige fecha
   y número de personas. **La fecha no se elige en esta pantalla.**

Todo lo que no sirva a esos tres objetivos, sobra.

---

## 2. La decisión de fondo: la ficha se arma entera desde el panel

No hay contenido fijo en el código. **Cada texto, cada foto y cada viñeta la
escribe el administrador de la finca desde el panel**, campo por campo. De ahí
salen dos reglas que mandan sobre cualquier idea de composición:

- **Casi todo es opcional.** Si un campo viene vacío, su bloque **desaparece
  entero**. Nunca se rellena con texto inventado, ni se deja un hueco, ni se
  muestra «Sin información».
- **La pantalla tiene que verse deliberada en el caso mínimo**, no solo en el
  caso completo. Una ficha con solo nombre, foto, precio, duración, capacidad y
  relato debe verse terminada, no a medio llenar.

Diseña, por tanto, bloques que se puedan quitar sin que la página se caiga: nada
de rejillas de tres columnas fijas ni de composiciones que dependan de que exista
la sección de al lado.

---

## 3. Paleta de marca — usar solo estos colores

Son los colores del manual de marca. No introduzcas colores nuevos, ni azules,
ni grises fríos, ni degradados de moda entre dos tonos vivos.

| Color | Hex | Token | Para qué se usa |
|---|---|---|---|
| Crema | `#ffeaca` | `--color-cream` | Fondo de las zonas claras. Y el texto sobre fondos oscuros. |
| Marrón | `#872b13` | `--color-brown` | Texto principal sobre crema. Fondo de la banda de datos prácticos y de la barra inferior. |
| Carmesí | `#d51312` | `--color-crimson` | **Solo el botón de acción principal** y los rótulos de sección. Si se usa en todo, deja de resaltar. |
| Naranja | `#ea5b0c` | `--color-orange` | Acento secundario: icono de «incluye». |
| Ámbar | `#f59c00` | `--color-amber` | Etiquetas y estados. |
| Oro | `#fdc300` | `--color-gold` | Rótulos e iconos sobre fondo oscuro, cifras destacadas, borde de la miniatura activa. |
| Marrón oscuro | `#4a1709` | — | Fondo de la banda del relato y base del velo sobre las fotos. |
| Crema papel | `#FBF6EC` | `--admin-bg` | Fondo de las tarjetas de lista sobre crema. |

**Reglas de color:**

- El fondo por defecto es crema `#ffeaca`, **no blanco**.
- El botón principal es **siempre** carmesí `#d51312` con texto crema. Uno solo
  por pantalla, repetido si hace falta, pero siempre el mismo.
- Texto sobre foto: **siempre** con velo oscuro encima. Nunca texto claro
  directamente sobre la imagen.
- Los textos secundarios sobre fondo oscuro son crema con opacidad (0.7–0.88),
  no un gris.
- Sobre crema, los secundarios son marrón con opacidad (0.55–0.7), no un gris.

---

## 4. Tipografía

Dos familias, ninguna más:

- **Playfair Display** (serif, variable 500–700) — títulos, precios grandes,
  entradilla del relato.
- **Bellota** (sans redondeada, peso 700 disponible en el sitio) — cuerpo de
  texto, botones, rótulos, navegación.

No uses Inter, Roboto, Montserrat, Poppins ni Arial. Si Bellota no está
disponible, usa una sans redondeada de fallback, nunca una geométrica fría.

**Escala real del sitio** (tokens `--fs-*`), respétala:

| Uso | Tamaño |
|---|---|
| Título de la ficha (`h1`) | `clamp(30px, 5.5vw, 52px)`, peso 700, interlineado 1.04 |
| Entradilla del relato | `clamp(20px, 4vw, 30px)`, Playfair cursiva, peso 500 |
| Precio en la tarjeta | `clamp(30px, 5vw, 42px)`, Playfair 700 |
| Precio en la barra inferior | `clamp(22px, 4vw, 30px)`, Playfair 700, en oro |
| Rótulo de sección («eyebrow») | 13px, peso 700, mayúsculas, `letter-spacing: 3px` |
| Cuerpo | 16px como piso, hasta ~17px en escritorio, interlineado 1.65–1.85 |
| Avisos y legales | 12–13px |

**Decisión tomada sobre el título:** el `h1` llega hasta 52px, **no** hasta 76px.
La portada de la landing usa 96px y la ficha de producto 31px; el título de la
experiencia se sitúa deliberadamente entre ambos. A 76px competía con la portada
del sitio. No lo agrandes.

---

## 5. Retícula

Una sola retícula para todo el sitio, del navbar al footer. No inventes márgenes
propios para esta pantalla:

- Ancho máximo de contenido: **1200px**, centrado (`--contenido-ancho`).
- Margen lateral: `clamp(1rem, 4vw, 2rem)` — 16px en móvil, 32px como techo
  (`--contenido-margen`).
- Las bandas de color van **a sangre**; lo que se alinea a 1200px es su contenido.

---

## 6. Idioma y tono

- Español de **Colombia**, en **tuteo**: «reserva», «descubre», «escríbenos».
- Prohibido el voseo rioplatense: nada de «reservá», «descubrí», «escribinos».
- Prohibida la expresión «a la brevedad»; se dice «lo antes posible».
- Moneda en pesos colombianos con punto de miles: `$160.000`. Nunca `$160,000`
  ni `COP 160000`. Teléfonos con `+57`.
- Tono cálido y concreto, de finca. Nada de lenguaje corporativo ni de agencia de
  viajes genérica.

---

## 7. Los datos que existen — trabaja SOLO con estos campos

Estructura real de una experiencia en la base de datos. Cada elemento que
diseñes tiene que salir de esta lista:

| Campo | Tipo | Obligatorio | Ejemplo real |
|---|---|---|---|
| `nombre` | texto | sí | «Ruta café y cacao» |
| `descripcion` | texto, máx. 160 caracteres | no | **No se muestra en pantalla.** Es solo la descripción para Google y para la vista previa al compartir el enlace. No diseñes nada para ella. |
| `descripcionLarga` | texto largo con párrafos | sí | El relato. Varios párrafos separados por línea en blanco. |
| `duracion` | texto libre | sí | «8 horas» |
| `precio` | número | sí | 160000 → se muestra `$160.000` |
| `capacidad` | número entero | sí | 12 → «Hasta 12 personas» |
| `imagenes` | lista de fotos, en orden | sí | 1 a 6 fotos. **La primera es la portada.** |
| `horarios` | texto libre, 1–2 líneas | no | «Martes a domingo, 8:00 a. m. y 2:00 p. m.» |
| `puntoEncuentro` | texto libre, 1–3 líneas | no | «Finca Vuelo Carmesí, vereda La Esperanza, San Vicente de Chucurí» |
| `recomendaciones` | texto libre, 1–3 líneas | no | «Desde 8 años. Requiere caminar 40 minutos por terreno irregular.» |
| `incluye` | lista de textos cortos | sí | «Guía especializado», «Almuerzo», «Refrigerio» |
| `queTraer` | lista de textos cortos | no | «Calzado cerrado» |
| `noIncluye` | lista de textos cortos | no | «Transporte hasta la finca» |

Y dos textos que **no** pertenecen a la experiencia sino a la configuración del
sitio, iguales en todas las fichas:

| Dato | Ejemplo |
|---|---|
| Punto de encuentro por defecto | Se usa cuando la experiencia no trae el suyo. |
| Resumen de la política de cancelación | «Cancela sin costo hasta 48 horas antes.» Acompañado del enlace «Ver política». Si está vacío, la línea desaparece. |

**Sobre las listas:** `incluye` suele tener 3 a 6 elementos; `queTraer` y
`noIncluye` a veces tienen **uno solo**. El diseño tiene que verse bien con un
elemento, no solo con seis. Y los textos de las viñetas son cortos: entre 1 y 6
palabras. Diseña la tarjeta para eso, no para un párrafo.

---

## 8. Lo que NO existe — no lo inventes

Lo más importante del brief. La pantalla **no tiene** estos datos, así que no
dibujes componentes que los necesiten:

- ❌ **Valoraciones, estrellas, reseñas, opiniones de clientes.** No existen.
- ❌ **Calendario o selector de fechas.** La fecha y el número de personas se
  eligen en la pantalla siguiente, `/reservar/[slug]`.
- ❌ **Mapa, coordenadas, «cómo llegar», botón a Google Maps.** El punto de
  encuentro es **texto plano**, nada más.
- ❌ **Perfil del guía, foto del anfitrión, biografía.** No existe.
- ❌ **Itinerario por horas** («9:00 llegada, 10:30 recorrido»). No hay campo de
  itinerario. Lo más parecido es `incluye`, que es una lista sin horas.
- ❌ **Idiomas, nivel de dificultad como escala, edad mínima como campo aparte.**
  Todo eso, si existe, va escrito a mano dentro de «Ten en cuenta».
- ❌ **Precio tachado, descuentos, «antes $X», precios por franja.**
- ❌ **Contador de plazas restantes o urgencia** («quedan 3 cupos»).
- ❌ **Experiencias relacionadas o «también te puede gustar».**
- ❌ **Preguntas frecuentes.**
- ❌ **Galería tipo mosaico de huecos fijos.** Puede haber una sola foto.
- ❌ **Formulario de contacto, chat, botón de WhatsApp flotante.**

Si una sección te queda vacía, **quítala**.

---

## 9. Estructura de la pantalla, en orden

Este es el orden actual y responde a las preguntas del visitante en el orden en
que se las hace. Puedes replantear la composición de cada bloque, pero no añadas
secciones nuevas ni elimines datos, y mantén la alternancia de bandas.

### 9.1 Portada inmersiva

- Foto a todo el ancho, alta: `clamp(440px, 70dvh, 700px)`. Ocupa la primera
  pantalla pero deja ver que hay más abajo.
- Velo en degradado sobre la foto, de `rgba(74,23,9,0.15)` arriba a
  `rgba(74,23,9,0.94)` abajo: la foto respira arriba y el texto se apoya en la
  zona densa.
- Sobre el velo, alineado abajo:
  - Rótulo pequeño en mayúsculas espaciadas, en oro: «VUELO CARMESÍ · EXPERIENCIA».
  - **Título de la experiencia** en Playfair, en crema. Elemento dominante.
  - Dos datos duros en fila, cada uno precedido de un punto de 5px en oro:
    la duración y «Hasta N personas».
- **Tarjeta de precio flotando sobre la foto**, en crema al 97%, radio 10px:
  - Rótulo «DESDE».
  - Precio en Playfair, en marrón.
  - «por persona».
  - **Botón carmesí a todo el ancho de la tarjeta: «Reservar ahora».**
  - **Línea de cancelación**: el resumen de la política y el enlace «Ver política»
    en carmesí subrayado. Va aquí a propósito: la duda sobre cancelar aparece
    justo en el momento de decidir, y resolverla en una línea evita que el
    visitante se vaya de la página a buscarla.
- En escritorio (≥900px) la tarjeta va a la derecha del título, con un mínimo de
  290px. En móvil va debajo, a todo el ancho.

### 9.2 Tira de miniaturas

- Fila de miniaturas pegada bajo la portada, con separación de 3px sobre fondo
  `#4a1709`. Altura `clamp(96px, 14vw, 128px)`.
- Al pulsar una, **cambia la foto de la portada**.
- La activa lleva borde de 3px en oro y opacidad 1; las demás, opacidad 0.5.
- 2 por fila en móvil, 4 desde 640px.
- **Si solo hay una foto, la tira no aparece.**

### 9.3 El relato — banda oscura `#4a1709`

- Rótulo a la izquierda, en oro y mayúsculas: «LA EXPERIENCIA».
- A la derecha, el texto:
  - **El primer párrafo** va destacado en Playfair cursiva grande.
  - **El resto** en cuerpo, crema al 78%, con ancho máximo de **62 caracteres**
    por línea.
  - El corte entre uno y otro es **por párrafo**, no por el primer punto: quien
    escribe decide dónde cae pulsando Enter. Un relato de un solo párrafo se
    muestra entero en cursiva grande y sin cuerpo debajo — ese caso tiene que
    verse bien.
- Se conservan los saltos de línea del administrador.
- En móvil el rótulo va arriba y el texto debajo.

### 9.4 Datos prácticos — banda marrón `#872b13`

Las tres dudas que aparecen justo antes de reservar. Bloque de definición, cada
dato con icono en trazo, en oro, y rótulo en oro y mayúsculas:

- **CUÁNDO** (icono de reloj) → `horarios`
- **PUNTO DE ENCUENTRO** (icono de pin) → `puntoEncuentro`, el de la experiencia
  o, si no lo trae, el general del sitio
- **TEN EN CUENTA** (icono de triángulo de aviso) → `recomendaciones`

Reglas: **cada dato desaparece si viene vacío, y la banda entera desaparece si no
hay ninguno.** Con uno o con dos, la rejilla los reparte y sigue viéndose
deliberada — nada de columnas vacías. Una columna en móvil; desde 720px, columnas
automáticas de mínimo 240px.

### 9.5 Las tres listas — banda crema

Vuelve el fondo crema. Tres bloques con **la misma forma**, uno debajo de otro,
para que la ficha se lea como una sola pieza y no como tres inventos distintos:

| Bloque | Rótulo | Icono | Color del icono |
|---|---|---|---|
| `incluye` | «INCLUIDO EN TU CUPO» | círculo con visto | naranja `#ea5b0c` |
| `queTraer` | «QUÉ TRAER» | mochila | marrón `#872b13` |
| `noIncluye` | «NO INCLUYE» | círculo con aspa | marrón al 55% |

- Los rótulos van en **carmesí**, mayúsculas espaciadas.
- Cada elemento es una tarjeta: fondo `#FBF6EC`, borde `rgba(135,43,19,0.12)`,
  radio 10px, **icono arriba y texto debajo**.
- Rejilla: 1 columna en móvil, 2 desde 640px, 3 desde 1024px.
- **El aspa de «no incluye» no es una cruz roja de error.** No incluir algo no es
  un fallo, es un dato: va en marrón apagado para que no alarme.
- Cada bloque desaparece si su lista está vacía; la banda entera desaparece si
  las tres lo están. Si solo hay «Incluye», ocupa la sección y se ve deliberado.

### 9.6 Barra de reserva pegada abajo

- Barra `sticky` al borde inferior, siempre visible al hacer scroll, fondo marrón
  `#872b13`.
- Izquierda: el precio en Playfair y en oro, y al lado «por persona · [duración]».
- Derecha: **botón carmesí «Reservar ahora»**.
- Envuelve en dos líneas si no cabe.
- Respeta el área segura inferior de los móviles con gesto de inicio
  (`env(safe-area-inset-bottom)`).

**Decisión tomada sobre la repetición del precio:** aparece **dos veces** en esta
pantalla, en la tarjeta de portada y en la barra inferior, y eso es deliberado.
La tarjeta lo presenta en el momento del antojo; la barra lo mantiene a mano
durante todo el scroll sin sembrar botones por toda la página. No lo reduzcas a
uno ni lo repitas una tercera vez.

---

## 10. Requisitos técnicos del diseño

- **Diseña primero móvil** (360px de ancho) y después escritorio (1200px de
  contenido, centrado).
- Ningún elemento puede desbordar horizontalmente **a 320px** de ancho. Los
  textos largos sin espacios (una URL, un nombre pegado) tienen que partirse, no
  ensanchar la página.
- Cualquier cosa pulsable mide al menos **44×44px**.
- Los iconos van **dibujados en trazo**, sobre rejilla de 24px, grosor uniforme
  (1.8–1.9), extremos y uniones redondeados. **Nada de emoji como icono, nada de
  iconos rellenos, nada de imágenes PNG.**
- Las fotos reservan su proporción para que la página no salte mientras cargan.
- Contraste suficiente: el crema sobre marrón y sobre foto con velo tiene que
  leerse.
- Estados de foco visibles en el botón principal, en las miniaturas y en el
  enlace de la política.

---

## 11. Los puntos débiles que hay que resolver

La pantalla actual ya funciona con toda esta estructura. No la copies tal cual:
se busca una composición mejor, más rítmica y con mejor jerarquía, con los mismos
datos y la misma paleta. Estos son los problemas conocidos:

1. **La transición entre bandas es brusca.** Relato oscuro `#4a1709` → prácticos
   marrón `#872b13` → listas en crema. Los dos oscuros se pegan y casi se
   confunden entre sí, y el salto al crema es un corte seco.
2. **Las tarjetas de las tres listas se ven idénticas entre sí** y con poco peso
   visual: solo cambia el icono. Con textos de una o dos palabras quedan enormes
   y vacías.
3. **El bloque de datos prácticos parece una nota al pie**, cuando contiene
   justamente la información que desbloquea la reserva.
4. **La tira de miniaturas es funcional pero muda**: no se anuncia como
   interactiva.
5. **La barra inferior tapa el final de la última sección** en móvil.

---

## 12. Entregable

- Pantalla completa en **móvil (360px)** y en **escritorio (1200px)**.
- Los estados que importan, porque son los que ocurren de verdad:
  1. **Ficha completa**: 6 fotos, relato de 4 párrafos, los tres datos prácticos,
     6 «incluye», 3 «qué traer», 2 «no incluye».
  2. **Ficha mínima**: 1 foto, relato de un solo párrafo, ningún dato práctico,
     3 «incluye» y nada más. Sin tira de miniaturas, sin banda marrón, sin «qué
     traer» ni «no incluye». Tiene que verse terminada.
  3. **Ficha intermedia**: 3 fotos, solo «punto de encuentro» entre los datos
     prácticos, y una lista de un solo elemento.
- Nada de contenido de relleno: usa los textos de ejemplo de este brief, en
  español de Colombia y con precios en pesos.
