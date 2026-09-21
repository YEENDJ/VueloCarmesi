# Página de grupos: colegios, universidades y empresas

**Fecha:** 2026-09-17
**Estado:** Propuesta — pendiente de aprobación
**Ruta nueva:** `/grupos` · `/en/group-visits`

## Contexto y problema

Vuelo Carmesí ya vende a instituciones. La hoja 22 del portafolio lo documenta con
nombre propio: **Uniandes, Unillanos, SENA, Unimeta, Unicooperativa, Uniminuto,
Colegio Dorado, Colegio Cubarral** en educación; **Socodevi, Fedecacao, Rare, Asmeta,
Limpal Colombia, Más Meta, Ecopetrol** en organizaciones y gremios. Son 8 instituciones
educativas y 7 organizaciones dentro de las 692 personas atendidas desde 2023.

El sitio web no le habla a ese comprador en ninguna página.

El problema no es de tono ni de posicionamiento: es **funcional**. El formulario de
`/reservar/[slug]` construye el selector de personas con
`Array.from({ length: experiencia.capacidad })` —`front/components/booking/ReservaForm.tsx:90`—,
y las capacidades del tarifario son **2 a 12** para la experiencia cacaotera y **2 a 8**
para avistamiento. Un coordinador con 40 estudiantes abre el formulario, ve que el número
más alto del desplegable es 12 y se va. No hay mensaje de error ni salida alternativa: el
producto que necesita, sencillamente, no está a la venta en la web.

Lo que hace hoy ese tráfico es caer en `/contacto`, que pide tres campos —nombre, email,
mensaje— y no pregunta nada de lo que decide una cotización. Del otro lado llega un correo
y un aviso de Telegram sin institución, sin número de personas, sin fecha y sin saber si
necesita factura. La respuesta arranca con una ronda de preguntas que el formulario pudo
haber hecho, y en ese intervalo el coordinador ya escribió a otras dos fincas.

### Qué decide realmente este comprador

No es un turista con más presupuesto. Es alguien que tiene que **justificar la salida ante
un tercero** —un rector, un comité de bienestar, un área de compras— y necesita cerrar
cinco cosas antes de poder proponerla:

| Pregunta | Dónde está hoy | Estado |
|---|---|---|
| ¿Caben mis 40 personas? | En ningún lado. El sitio dice 12 y 8. | **Falta el dato** |
| ¿Entra el bus hasta la finca? | Hoja 18 del portafolio: vía pavimentada, entra bus y van. | Confirmado, sin publicar |
| ¿Hay póliza? ¿Qué cubre? | «Póliza de asistencia y riesgos» sin aseguradora ni cobertura. | Parcial |
| ¿Me facturan a nombre de la institución? | En ningún lado. | **Falta el dato** |
| Con menores: ¿qué papeles pide? | Hoja 16 y `/politicas/proteccion-infancia`. | Confirmado, publicado pero sin conectar |

Las tres respuestas que faltan son exactamente las que `portafolio/RECOMENDACIONES.md`
(P0-4) lleva marcadas como deuda desde antes: grupo mínimo, tarifa de menores, aseguradora
y cobertura, cupos por día y tarifa neta para aliados.

### Por qué esto es una página y no un párrafo más

Mismo argumento que sostiene `/aviturismo`: una ficha de experiencia vende **una salida**
y se lee de arriba abajo en dos minutos. No aguanta una tabla de facturación, una política
de autorización de menores ni un esquema de ruta por tramos — y es justo eso lo que este
visitante viene a buscar. Tampoco es un caso de `/contacto`: quien llega ahí ya decidió
escribir, y el problema es que este comprador **todavía no puede decidir**.

Y no son tres páginas. Un colegio, una facultad y un área de bienestar comparten el 70 %
de lo que necesitan —logística, póliza, qué incluye, condiciones— y se separan solo en la
mitad superior. Tres páginas repartirían la misma autoridad en tres URLs delgadas que
compiten entre sí; una página profunda con índice de anclas es lo que ya funciona en
`/aviturismo` y en `/politicas/cancelacion`.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Destino de la solicitud | Modelo propio `SolicitudGrupo`, calcado de `Contacto`: fila en Postgres + correo al solicitante + correo y Telegram al admin. |
| Datos comerciales que faltan | Van en `SiteConfig`, editables desde el panel. Si están vacíos **la fila no se pinta**. |
| Alcance de este documento | Diseño para aprobar. La implementación va después, en su propia rama. |
| Ruta | `/grupos` en español, `/en/group-visits` en inglés. |
| Agencias y operadores | No tienen pista propia. Cierran la página en un bloque corto que lleva al mismo formulario con `tipo=agencia`. |

### Por qué vacío significa ocultar, y no un respaldo

`PruebaSocial` hace lo contrario: cuando `SiteConfig` no responde, cae a un número escrito
en el código (`692`, `8`, `7`…). Ahí está bien, porque una cifra de impacto algo
desactualizada no le cuesta nada a nadie.

Acá no. «Póliza con cobertura de $X» o «tarifa de menores $Y» son **compromisos
comerciales**: si el número está mal, el colegio lo lleva a su comité, lo aprueba con ese
número y la diferencia la paga la finca. Un respaldo escrito en el código es una promesa
que nadie revisó. Por eso, mientras el dato no exista, la página no lo menciona — y la
ausencia no se nota, porque cada bloque está diseñado para leerse completo sin esa fila.

### Por qué `/en/group-visits` y no `/en/groups`

Misma regla que `/en/birding` en `routing.ts`: gana el término del gremio sobre el del
diccionario. «Groups» solo es un sustantivo; «group visits» es lo que escribe un colegio
internacional o una agencia receptiva buscando proveedor. El público inglés de esta página
es delgado —colegios bilingües de Bogotá, alguna agencia— pero dejarla sin traducir
rompería el `hreflang` recíproco y el selector de idioma, que hoy son consistentes en todo
el sitio.

## Estructura de la página

Once bloques, en el orden en que este comprador decide. El patrón visual es el de
`/aviturismo`: `page-shell`, kicker, h1, lead, banda de resumen, índice de anclas,
rejilla de tarjetas, cierre.

### 1 · Cabecera

- **Kicker:** «Grupos e instituciones»
- **h1 (es):** «Salidas pedagógicas y jornadas corporativas en una finca de cacao — Cubarral, Meta»
- **h1 (en):** «School field trips and corporate days at a cacao farm in Meta, Colombia»
- **Lead:** 692 personas atendidas desde 2023 · 8 instituciones educativas · 7 organizaciones. Guianza y póliza de asistencia y riesgos en todos los casos.

El h1 carga el tipo de salida y el municipio por el mismo motivo que el de aviturismo:
nadie busca «experiencias agroecológicas para grupos», se busca «salida pedagógica finca
Meta» y «actividad de integración empresarial Villavicencio».

### 2 · Banda de resumen — cuatro datos, diez segundos

Mismo recurso que `.avi-resumen`: cuatro tarjetas con icono, en blanco sobre el crema.
Contestan «¿me sirven o no?» antes de que el visitante lea un párrafo.

| # | Dato | Fuente | Icono |
|---|---|---|---|
| 1 | Hasta **N** personas por jornada | `SiteConfig.grupos_cupo_dia` — **se oculta si está vacío** | `Users` |
| 2 | **Entra bus y van.** Vía pavimentada hasta la finca | Hoja 18, confirmado | `Bus` |
| 3 | **Póliza** de asistencia y riesgos incluida | Hoja 19, confirmado | `ShieldCheck` |
| 4 | **Factura** a nombre de la institución | `SiteConfig.grupos_facturacion` — se oculta si está vacío | `FileText` |

La tarjeta 1 es la razón de ser de la página y es, además, el dato que hoy no existe. Si
se publica la página sin `grupos_cupo_dia`, la banda sale con tres tarjetas y sigue
funcionando — pero conviene tenerlo antes de anunciarla.

### 3 · Quiénes ya vinieron

Va arriba, tercero, y no al final como en la mayoría de las webs. Para este comprador es
el bloque más persuasivo de la página: **«ya trabajamos con la Unillanos» le resuelve el
riesgo reputacional**, que es el que de verdad lo frena.

- La cifra grande: `692` personas desde 2023 (de `SiteConfig.impacto_personas`, con el
  mismo respaldo que usa `PruebaSocial` — acá sí, porque es una cifra de impacto).
- Dos listas de píldoras, como en la hoja 22: **Instituciones educativas** (Uniandes,
  Unillanos, SENA, Unimeta, Unicooperativa, Uniminuto, Colegio Dorado, Colegio Cubarral) y
  **Organizaciones y gremios** (Socodevi, Fedecacao, Rare, Asmeta, Limpal Colombia,
  Más Meta, Ecopetrol).

**Nombres en texto, nunca logotipos.** Listar clientes por nombre es práctica comercial
normal; reproducir sus marcas exige autorización escrita de cada una, y Ecopetrol y
Uniandes tienen manuales de uso de marca que no vamos a cumplir por accidente. La hoja 22
ya toma esta decisión y deja escrito el porqué.

> La lista del portafolio y la de `PruebaSocial.tsx` **no coinciden hoy**: el componente
> tiene nueve nombres y le faltan Unicooperativa, Colegio Dorado, Colegio Cubarral, Asmeta,
> Limpal Colombia y Más Meta. Al implementar, las dos listas salen de un solo archivo
> (`front/lib/clientes.ts`), separadas por tipo. Que la misma prueba social diga dos cosas
> distintas en dos páginas es exactamente lo que nota un comprador institucional.

### 4 · Las tres pistas

Tres tarjetas con foto real, encabezado y CTA propio. Cada CTA abre el formulario del
bloque 11 con el campo `tipo` ya seleccionado y el foco puesto en «institución».

| Pista | Foto | Kicker | Qué dice |
|---|---|---|---|
| **Colegios** | `personas/grupo-mural.jpg` | Salida pedagógica | Educación ambiental en terreno · el cacao de la mazorca a la barra · cultura campesina · guía por subgrupo con docentes · refrigerio y póliza incluidos · **cupos ampliados por rotación de subgrupos** |
| **Universidades y SENA** | `personas/estudiantes.jpg`, con crédito «Universidad de los Llanos · Ingeniería Forestal» | Salida de campo | Contenido ajustado al programa · agroecología, beneficio del cacao y biodiversidad · guía especializado · jornada completa combinable con avistamiento |
| **Empresas** | `personas/corporativos.jpg` | Bienestar e integración | Integración de equipos · combinable con avistamiento de aves · almuerzo de campo opcional · **fecha exclusiva para el grupo** · facturación empresarial |

Las tres fotos existen en `front/public/images/personas/` y están en
`docs/catalogo-fotos.md`. La de estudiantes lleva crédito visible porque es un grupo real
identificable, igual que en la hoja 17.

Las **familias** salen de acá a propósito, aunque el portafolio las tenga en la misma
lámina: ya tienen `/experiencias` y el formulario de reserva les funciona. Meterlas aquí
diluiría la página justo donde tiene que ser específica.

### 5 · Tarifas

Tabla de cuatro filas con las tarifas al público, más las notas de grupo.

**Los precios no se escriben en esta página.** Se piden a la API con
`getExperiencias(locale)` y se pintan con `formatPrecio(precio, locale)`. El mismo motivo
por el que `/aviturismo` no repite el precio de la salida de aves: el panel de
administración es el dueño del precio, y un número escrito a mano en el código queda
desactualizado sin que nadie se entere. Esto además resuelve solo la regla de moneda de
`front/AGENTS.md` —`$70.000` en español, `COP 70,000` en `/en`— sin tocar nada.

| Columna | De dónde sale |
|---|---|
| Servicio | `experiencia.nombre` |
| Duración | `experiencia.duracion` |
| Grupo | `experiencia.capacidad` («2 a 12») |
| Por persona | `formatPrecio(experiencia.precio, locale)` |

Debajo, tres notas que solo se pintan si su clave tiene valor:

- **Grupo mínimo** — `grupos_minimo`
- **Tarifa de menores** — `grupos_tarifa_menores`, guardada como **número** (`45000`) y
  pintada con `formatPrecio`, para que en `/en` salga `COP 45,000` y no un `$45.000` que
  un lector en inglés lee como cuarenta y cinco dólares.
- **Descuento por volumen** — `grupos_descuento_volumen`

Cierra la fila «Jornadas corporativas y escolares · a medida · **Cotización**», que es la
que lleva al formulario.

### 6 · Qué incluye y qué no incluye

Dos columnas, `checks` y `crosses`, textual de la hoja 19. La columna de la derecha es la
más valiosa de la página entera y la que nadie publica:

> **No incluye, en ningún plan:** transporte hasta la finca y peajes · almuerzo ·
> alojamiento (todos los planes son de un día, sin pernocte) · gastos personales ·
> servicios médicos no cubiertos por la póliza.

El comentario de la hoja 19 lo dice sin rodeos: *si el colegio asume que hay almuerzo y no
lo hay, la queja la recibe la finca*. Publicarlo antes de la cotización cuesta una
cotización perdida y ahorra una jornada arruinada.

Debajo, los costos adicionales: chocoterapia + refrigerio suelto, almuerzo de campo
(se cotiza según el grupo) y productos de la finca.

### 7 · Transporte y logística

El bloque que un colegio necesita para armar el permiso de salida.

- **Esquema de ruta por tramos:** Bogotá → 86 km / 2 h 30 → Villavicencio → 60 km /
  1 h 20 → Cubarral → 7 km / 20 min → Vuelo Carmesí. En la web va como fila de pasos
  (no el SVG del PDF), horizontal en escritorio y vertical en móvil.
- **Entra bus y van**, vía pavimentada hasta la finca. **Parqueadero: 4 automóviles y 1 bus.**
- Punto de encuentro: Finca La Fortuna, vereda Brisas del Tonoa. Coordenadas del pin.
  Llegada 15 minutos antes.
- Altura 600–850 msnm · clima cálido húmedo 24–30 °C, seco de diciembre a marzo ·
  exigencia física baja a media, senderos de tierra.
- Mejor franja: aves 5:30–8:00 a. m. · cacao 9:00 a. m.–1:00 p. m.
- Qué llevar (ocho ítems, a dos columnas). «Los binoculares los ponemos nosotros.»
- **En el sitio:** baños, zona de comida, botiquín y protocolo de emergencia.
- **Transporte** — `SiteConfig.grupos_transporte`, se oculta si está vacío. Es la primera
  pregunta de un coordinador y hoy no tiene respuesta escrita.

> `RECOMENDACIONES.md` (P0-3) deja cinco datos de terreno marcados como no confirmados,
> tres de los cuales son de este bloque: el último tramo Cubarral → vereda, la
> accesibilidad en silla de ruedas y la señal celular. Los dos primeros ya están resueltos
> en la hoja 18 con chip punteado. **Accesibilidad y señal celular no se publican hasta
> medirlos** — una promesa de accesibilidad que no se cumple el día de la visita es un
> problema mayor que no haberla mencionado.

### 8 · Menores, póliza y papeleo

El bloque que no tiene ningún competidor de la zona y que un colegio exige por escrito
antes de aprobar nada.

- **Póliza de asistencia y riesgos incluida.** Aseguradora y cobertura desde
  `grupos_aseguradora`; si está vacío, la tarjeta dice solo que está incluida.
- **Protección de la niñez.** Resumen de tres líneas del compromiso ESCNNA (Ley 679 de
  2001 y Ley 1336 de 2009) y enlace a `/politicas/proteccion-infancia`, que ya existe y
  está completa. **No se reformula el texto legal**: se resume y se enlaza.
- **Autorización escrita de los padres** — las cuatro cosas que debe contener, de la
  hoja 16: nombre e identificación del menor · nombre e identificación del adulto
  responsable · fechas de la actividad · datos de contacto de los padres.
- **Guía por subgrupo**, con docentes acompañando.
- **Facturación** — `grupos_facturacion`, se oculta si está vacío.
- **Enlace al portafolio en PDF** (`/portafolio`), con el rótulo «el documento que archiva
  la institución». Ya existe, ya está publicado y es literalmente lo que un coordinador
  adjunta a una solicitud de aprobación interna. Coste de implementación: un enlace.

### 9 · Cómo se reserva

Cuatro pasos, con el mismo recurso visual de la línea de tiempo de `/aviturismo`:

1. Envías la solicitud con los datos del grupo.
2. Confirmamos disponibilidad y te enviamos la cotización formal.
3. **30 %** al reservar; el **70 %** restante en efectivo el día de la actividad.
4. La jornada, con guianza y póliza.

Con la anticipación mínima (`grupos_anticipacion`, respaldo «48 horas») y enlace a
`/politicas/cancelacion`.

> **Contradicción heredada, a resolver antes de publicar.** La hoja 19 dice en la
> condición de reserva 1 que las actividades deben estar *pagadas en su totalidad antes de
> su realización*, y en la de pago 1 que es 30 % al reservar y 70 % el día de la actividad.
> Las dos son textuales de las políticas entregadas. En un PDF pasa; en una página web que
> un área de compras lee con calma, no: deja la política de cancelación sin base clara
> —¿el 100 % de penalidad se calcula sobre qué valor?—. **Esta página publica el 30/70**,
> que es lo que se hace en la práctica, y la contradicción hay que arreglarla también en
> `/politicas/cancelacion` y en el portafolio.

### 10 · Preguntas frecuentes

Seis a ocho preguntas reales del comprador institucional, en `<details>` nativo (funciona
sin JavaScript y es accesible sin trabajo extra): ¿pueden recibir 40 personas el mismo
día? · ¿entra el bus? · ¿qué pasa si llueve? · ¿hay descuento para grupos grandes? ·
¿facturan a nombre del colegio? · ¿qué cubre la póliza? · ¿cuánto antes hay que reservar? ·
¿hay opción de almuerzo?

> **Sin marcado `FAQPage`.** Desde 2023 Google reserva los resultados enriquecidos de FAQ
> a sitios de gobierno y salud, así que el `JSON-LD` no traería estrellas ni acordeón en el
> buscador. El bloque se queda porque contesta de verdad lo que este comprador pregunta y
> porque le ahorra un correo a la finca — no porque vaya a rendir en SEO.

### 11 · Formulario de cotización

El objetivo de toda la página. Ancla `#cotizar`, alcanzable desde los tres CTA de las
pistas, desde la banda de resumen y desde el menú de anclas.

| Campo | Tipo | Regla |
|---|---|---|
| `tipo` * | radio | colegio · universidad · empresa · agencia · otro. Lo preselecciona el CTA. |
| `institucion` * | texto | 3–140. «Nombre del colegio, universidad o empresa» |
| `contacto` * | texto | 3–100. Quien escribe |
| `cargo` | texto | máx. 100. «Coordinador académico, bienestar, talento humano…» |
| `email` * | email | máx. 255 |
| `telefono` * | texto | `TELEFONO_REGEX` de `create-reserva.dto.ts`, reutilizada |
| `personas` * | número | entero, 1–500. **Sin tope por capacidad: ese es el punto de la página** |
| `edades` | texto | máx. 60. Solo visible con `tipo=colegio` |
| `fechaTentativa` | fecha | opcional, ≥ mañana. Opcional a propósito: a esta altura casi nunca hay fecha |
| `experiencias` | checkboxes | cacaotera · aves · aves + cacao · chocoterapia · a medida |
| `requiereTransporte` | checkbox | — |
| `requiereFactura` | checkbox | abre `nit` |
| `nit` | texto | máx. 40, visible solo con `requiereFactura` |
| `mensaje` | textarea | opcional, máx. 1000, con contador |
| `website` | honeypot | oculto, `tabIndex={-1}`. Si viene con valor, se descarta en silencio |

**Stack:** `react-hook-form` + `zod` + `@hookform/resolvers`, que ya están instalados y en
uso en `front/app/[locale]/(public)/(shop)/checkout/page.tsx`. El esquema vive en
`front/lib/schemas/solicitud-grupo.ts`. Errores por campo bajo el input, con
`aria-invalid` y `aria-describedby`.

**Por qué `fechaTentativa` es opcional y `personas` obligatorio.** Un coordinador pide
cotización para poder proponer la salida; la fecha depende del calendario académico y de
una aprobación que todavía no tiene. Exigirle una fecha lo obliga a inventarla o a
abandonar el formulario. El número de personas, en cambio, sí lo sabe siempre — y sin él
no hay cotización posible.

## Backend

### Modelo

```prisma
/// Solicitud de cotización de un grupo: colegio, universidad, empresa o agencia.
///
/// Es hermana de `Contacto` y no una variante suya: lo que las separa no es el
/// texto del mensaje sino que acá cada dato que decide la cotización tiene su
/// columna. Con todo dentro de `mensaje` no se puede filtrar por tamaño de
/// grupo, ni contar cuántas solicitudes escolares entran, ni saber cuántas se
/// perdieron — que es justo lo que hoy no se puede medir.
model SolicitudGrupo {
  id                 String    @id @default(cuid())
  /// colegio | universidad | empresa | agencia | otro
  tipo               String
  institucion        String
  nit                String?
  contacto           String
  cargo              String?
  email              String
  telefono           String
  personas           Int
  /// Rango de edades del grupo. Solo lo pide el formulario cuando es colegio:
  /// es lo que decide la póliza y el papeleo de menores.
  edades             String?
  fechaTentativa     DateTime?
  /// Slugs de las experiencias marcadas, o vacío si pidió algo a medida.
  experiencias       String[]  @default([])
  requiereTransporte Boolean   @default(false)
  requiereFactura    Boolean   @default(false)
  mensaje            String    @default("")
  /// nueva | contactada | cotizada | cerrada | perdida
  estado             String    @default("nueva")
  createdAt          DateTime  @default(now())
}
```

`estado` entra ahora aunque en la fase 1 nadie lo cambie: la columna es gratis hoy y una
migración sobre la única base de datos que existe —que es la de producción— no lo es.

### Endpoint

`POST /solicitudes-grupo`, sin prefijo `/api` como todo el backend.
Módulo `back/src/solicitudes-grupo/`, calcado de `contacto/`: controller de un método,
service que crea la fila y dispara la notificación sin esperarla
(`.catch(err => this.logger.error(...))`, igual que `ContactoService`), DTO con
`class-validator` y `@Transform(trim)`.

Devuelve `{ id, createdAt }`. No devuelve la fila entera: no hace falta y evita
reflejar de vuelta datos de contacto.

### Notificaciones

`NotificacionesService.enviarNuevaSolicitudGrupo()`, con las tres salidas que ya usa
contacto:

1. **Correo al solicitante** — plantilla nueva
   `templates/solicitud-grupo-recibida.html`, con el resumen de lo que pidió y el plazo de
   respuesta. Que le llegue el resumen no es cortesía: es lo que reenvía internamente
   mientras espera la cotización.
2. **Correo al admin** — `templateAlertaAdmin` con una fila por campo, que ya existe.
3. **Telegram** — `🏫 *Nueva solicitud de grupo*` con tipo, institución, personas, fecha y
   teléfono. Es el canal que hace que se responda el mismo día.

### Lo que NO entra en la fase 1

**Pantalla en el panel.** `Contacto` tampoco la tiene y lleva meses funcionando con correo
y Telegram. Sumarla son unas 4–6 horas —página, drawer y `PATCH` de estado, sobre los
patrones de `admin/reservas`— y recomiendo hacerla en cuanto entren las primeras
solicitudes reales, porque `estado` sin pantalla no sirve de nada y el seguimiento de una
cotización institucional dura semanas. Pero no bloquea publicar la página.

**Rate limiting.** `@nestjs/throttler` no está instalado; la spec de validaciones de
reserva lo proponía y quedó sin implementar. El honeypot sí entra, porque es el patrón que
ya existe en `create-reserva.dto.ts` y cuesta un campo.

## Claves nuevas de `SiteConfig`

Todas se editan en `/admin/config`, en una sección nueva **«Grupos e instituciones»**, con
el mismo patrón de array + botón de guardar que usan `CIFRAS_IMPACTO` y `CIFRAS_FINCA`.

| Clave | Etiqueta en el panel | Dónde se pinta | Si está vacía |
|---|---|---|---|
| `grupos_cupo_dia` | Personas máximas por jornada | Banda de resumen | No se pinta la tarjeta |
| `grupos_minimo` | Grupo mínimo | Nota bajo las tarifas | No se pinta la nota |
| `grupos_tarifa_menores` | Tarifa de menores (solo el número) | Nota bajo las tarifas | No se pinta la nota |
| `grupos_descuento_volumen` | Descuento por volumen | Nota bajo las tarifas | No se pinta la nota |
| `grupos_anticipacion` | Anticipación mínima para grupos | Resumen y pasos | Respaldo: «48 horas» |
| `grupos_aseguradora` | Aseguradora y cobertura de la póliza | Bloque de póliza | La tarjeta dice solo «póliza incluida» |
| `grupos_facturacion` | Datos de facturación | Resumen y bloque de papeleo | No se pintan |
| `grupos_transporte` | Transporte: qué ofrecemos | Bloque de logística | No se pinta la tarjeta |
| `grupos_tarifa_neta` | Tarifa neta para aliados | Bloque de agencias | Respaldo: «consultar tarifario neto vigente» |

**Cuatro son texto y hay que añadirlas a `CLAVES_TRADUCIBLES`** en
`back/src/site-config/site-config.service.ts` para que salgan en inglés vía DeepL:
`grupos_aseguradora`, `grupos_facturacion`, `grupos_transporte` y `grupos_anticipacion`.
Las demás son cifras o rangos y se sirven igual en los dos idiomas.

> **Cuidado con los importes escritos a mano.** `grupos_tarifa_menores` guarda el número
> pelado (`45000`) justamente para poder pasarlo por `formatPrecio` y respetar la regla de
> moneda. `grupos_tarifa_neta`, en cambio, es texto libre: si alguien escribe ahí
> «$50.000», ese `$` sale igual en `/en` y un lector estadounidense leerá cincuenta
> dólares. La etiqueta del panel tiene que pedir un **porcentaje o un rango**, no un
> importe.

## Recoger el tráfico que ya existe

Tres cambios chicos que empiezan a rendir el mismo día en que se publique, y que valen
tanto como la página:

**`/contacto`** — banda arriba del formulario: «¿Escribes desde un colegio, una universidad
o una empresa? Tenemos una página con capacidad, tarifas y logística para grupos →». Es
donde cae hoy este tráfico, así que es el enlace de mayor rendimiento del proyecto entero.
Un componente y una clave de traducción.

**`/reservar/[slug]`** — bajo el selector de personas, cuando el visitante llega al tope:
«¿Son más de {capacidad}? Cotizamos grupos →». Ataca el punto exacto donde hoy se pierde
la venta.

**`/experiencias`** — una tarjeta al final de la rejilla, con el mismo tratamiento que usa
`AvisoAviturismo`.

## Navegación y SEO

- **Navbar:** «Grupos» entra como tercera pestaña —`Inicio · Experiencias · Grupos ·
  Tienda · Nosotros · Contacto`—. Son seis en escritorio más el carrito y el selector de
  idioma; **hay que verificar en tablet (768–1023 px) que no se rompa la fila**, que es
  donde va justo.
- **Footer:** en la columna de navegación.
- **`routing.ts`:** `'/grupos': { es: '/grupos', en: '/group-visits' }`.
- **`alternatesDeIdioma('/grupos', locale)`** para el `hreflang` recíproco.
- **`generateMetadata`** con `keywords` del gremio: *salida pedagógica Meta · salidas
  escolares Villavicencio · visita empresarial finca cacao · turismo escolar Cubarral ·
  actividad de integración empresarial Meta · salida de campo universidad agroecología ·
  school field trip Colombia · corporate day trip Meta Colombia*.
- **JSON-LD:** `Service`, con `provider` apuntando a la finca, `areaServed` Meta y
  Cundinamarca, y `audience` de tipo `EducationalAudience` y `BusinessAudience`. No
  `TouristAttraction` — ya lo usa `/aviturismo` y esto es un servicio a medida, no una
  atracción.
- **Sitemap:** no existe todavía en el proyecto, pese a lo que anuncia el comentario de
  `lib/sitio.ts`. Fuera del alcance de esta spec; los enlaces desde navbar, footer,
  `/contacto` y `/experiencias` bastan para que se indexe.

## Archivos

**Nuevos**

```
front/app/[locale]/(public)/(landing)/grupos/page.tsx
front/components/grupos/FormularioGrupo.tsx        ← cliente; la página es de servidor
front/components/grupos/RutaTramos.tsx
front/lib/schemas/solicitud-grupo.ts
front/lib/clientes.ts                              ← lista única, la comparte PruebaSocial
back/src/solicitudes-grupo/{controller,module,service}.ts
back/src/solicitudes-grupo/dto/create-solicitud-grupo.dto.ts
back/src/solicitudes-grupo/dto/create-solicitud-grupo.dto.spec.ts
back/src/notificaciones/templates/solicitud-grupo-recibida.html
back/prisma/migrations/…_solicitud_grupo/
```

**Modificados**

```
front/lib/i18n/routing.ts                  ← la ruta nueva
front/messages/{es,en}.json                ← espacio de nombres `grupos`
front/app/globals.css                      ← bloque `.grp-*`, al final
front/components/layout/{Navbar,Footer}.tsx
front/components/secciones/PruebaSocial.tsx ← pasa a leer de lib/clientes.ts
front/components/booking/ReservaForm.tsx    ← el aviso de tope de capacidad
front/app/[locale]/(public)/(landing)/contacto/page.tsx ← la banda de desvío
front/app/admin/(protected)/config/page.tsx ← sección «Grupos e instituciones»
back/src/app.module.ts
back/src/notificaciones/notificaciones.service.ts
back/src/site-config/site-config.service.ts ← CLAVES_TRADUCIBLES
back/prisma/schema.prisma
```

**Prefijo CSS:** `.grp-`, una convención por página como `.avi-` en aviturismo. El bloque
va al final de `globals.css`, mobile-first, con el mismo vocabulario visual de
`/aviturismo` y `/politicas`: disco de icono de 44 px, tarjeta de crema sobre crema, filete
superior naranja.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La página se publica sin `grupos_cupo_dia` y la promesa central queda muda | Las tarjetas vacías se ocultan; conseguir ese dato es el único bloqueo real antes de anunciar la página |
| El 30/70 contradice a `/politicas/cancelacion` | Arreglar la política **antes** de publicar: aquí el conflicto queda a la vista de un área de compras |
| Seis pestañas rompen la navbar en tablet | Verificar en 768–1023 px durante la implementación |
| Llegan solicitudes y nadie les hace seguimiento | Telegram avisa el mismo día; la pantalla del panel pasa a prioridad alta en cuanto entren las primeras |
| `PruebaSocial` y esta página muestran listas distintas de clientes | `lib/clientes.ts` como fuente única, dentro de esta misma entrega |

## Datos que hay que conseguir

Ninguno bloquea la implementación —todos tienen su clave en `SiteConfig` y su
comportamiento en vacío—, pero sin ellos la página trabaja a media máquina:

1. **Personas máximas por jornada.** El dato que justifica la página.
2. **Transporte:** ¿se coordina con operadores de la región o corre por cuenta del grupo?
3. **Facturación:** ¿factura electrónica, a nombre de quién, NIT, plazo?
4. **Aseguradora y cobertura de la póliza.** Un colegio lo pide por escrito.
5. Grupo mínimo, tarifa de menores y descuento por volumen.
6. Tarifa neta o comisión para agencias — en porcentaje, no en pesos.

Los seis son los mismos que `portafolio/RECOMENDACIONES.md` lleva marcados en P0-4 desde
antes de que existiera esta página. Resolverlos arregla las dos piezas a la vez.
