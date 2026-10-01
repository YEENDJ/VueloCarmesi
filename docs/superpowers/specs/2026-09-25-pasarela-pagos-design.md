# Pasarela de pagos: tienda y reservas

**Fecha:** 2026-09-25
**Estado:** Propuesta — pendiente de aprobación y de las decisiones de la sección final
**Alcance:** backend (`pagos`, `pedidos`, `reservas`), checkout del front, panel, textos legales

## Contexto y problema

La pasarela quedó diferida en `2026-06-28-vuelo-carmesi-operacion-sin-friccion.md` y hoy
el sitio vende sin cobrar:

- **Tienda.** `POST /pedidos` crea el pedido, descuenta stock dentro de la transacción y
  el checkout dice «Coordinamos el método de pago al confirmar el pedido». El cobro pasa
  por WhatsApp o transferencia, a mano.
- **Reservas.** `POST /reservas` crea la reserva en `pendiente` y el admin la confirma
  desde el panel. La reserva no guarda cuánto cuesta: si mañana cambia el precio de la
  experiencia, no queda registro de lo que se le ofreció a ese cliente.

Conectar la pasarela en sí es lo fácil: se redirige al checkout de la pasarela y se
escucha un webhook. Lo que da trabajo es **todo lo que pasa cuando el pago no termina
bien**, que es la mayoría de los casos raros y el origen de casi todos los reclamos. Este
spec se centra en eso, y lo deja independiente de la pasarela que se elija.

### Tres hechos del código actual que condicionan el diseño

1. **El dinero es `Float`.** `Experiencia.precio`, `Producto.precio`, `Pedido.total` e
   `ItemPedido.precio`. Las pasarelas colombianas trabajan con enteros (Wompi con
   `amount_in_cents`) y firman el monto: un `49999.999999` por redondeo rompe la firma o,
   peor, cobra un peso de menos. Hay que pasar a `Int` en pesos **antes** de que exista el
   primer pago real.
2. **No hay cupo por fecha.** `ReservasService.create` solo revisa que `cantidadPersonas`
   no pase de `experiencia.capacidad` *por reserva*; diez reservas de 12 personas para el
   mismo día pasan todas. El admin lo resuelve al confirmar. Con cobro en línea esto deja
   de servir: no se le puede rechazar a mano a alguien que ya pagó.
3. **No hay tareas programadas.** No existe `@nestjs/schedule` ni ningún cron. El backend
   está en Render; si el plan es el gratuito, el servicio **se duerme** tras un rato sin
   tráfico y un cron dentro del proceso no correría. El diseño no puede depender de él.

Y uno de operación: **hay una sola base de datos, la de producción.** Los pagos de
prueba del sandbox van a caer en ella.

## Modelo de datos

### Dinero en enteros

Migración de `Float` a `Int` (pesos COP, sin decimales) en las cuatro columnas. Los
precios actuales son enteros en la práctica, así que el cast no pierde nada; la migración
lo verifica antes (`SELECT ... WHERE precio <> round(precio)` debe salir vacío) y aborta
si no.

### `Pago`, modelo aparte

```prisma
model Pago {
  id             String    @id @default(cuid())
  /// La que se le envía a la pasarela. Única y nunca reutilizada: cada intento
  /// lleva la suya. Formato: VC-<pedido|reserva>-<id corto>-<n intento>.
  referencia     String    @unique
  pedidoId       String?
  pedido         Pedido?   @relation(fields: [pedidoId], references: [id])
  reservaId      String?
  reserva        Reserva?  @relation(fields: [reservaId], references: [id])
  /// Pesos enteros. Se copia al crear el intento y no se recalcula.
  monto          Int
  moneda         String    @default("COP")
  proveedor      String
  /// Id de la transacción del lado de la pasarela. Llega con el primer evento.
  proveedorTxId  String?   @unique
  /// pendiente | aprobado | rechazado | anulado | expirado | error
  estado         String    @default("pendiente")
  /// tarjeta | pse | nequi | bancolombia | ... (lo que reporte la pasarela)
  metodo         String?
  /// Motivo del rechazo tal como lo reporta la pasarela, para el panel.
  motivo         String?
  /// prueba | produccion. La base es una sola: sin esto, los pagos del sandbox
  /// se mezclan con los reales en el panel y en las cifras.
  modo           String
  /// Último evento crudo recibido, para auditar un reclamo.
  payload        Json      @default("{}")
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([estado, createdAt])
}
```

Un pedido o una reserva puede tener **varios** `Pago`: uno por intento. Esto es lo que
permite reintentar sin perder el pedido (ver casos).

### Cambios en `Pedido`

- `estado`: `pendiente_pago | pagado | enviado | entregado | cancelado | expirado | requiere_revision`.
  Los pedidos que ya existen quedan con su estado actual (`pendiente` se lee como el
  flujo manual de siempre).
- `venceEn DateTime?`: hasta cuándo se aparta el stock sin pago aprobado.

### Cambios en `Reserva`

- `total Int`: `experiencia.precio × cantidadPersonas`, copiado al crear la reserva.
- `porcentajeAbono Int` y `montoAbono Int`: el porcentaje vigente al crearla y lo que se
  cobra en línea. Ver «Abono de la reserva».
- `venceEn DateTime?`: igual que en `Pedido`.
- `estado` suma `pendiente_pago`, `expirada` y `requiere_revision` a los que ya existen.

### Abono de la reserva, parametrizable

En línea se cobra **un porcentaje** del total. El resto (el saldo) se paga el día de la
actividad, como ya se hace. El porcentaje arranca en **30 %** y se cambia desde el panel,
sin desplegar.

- **Dónde vive:** clave `reservas_abono_porcentaje` en `SiteConfig`, con su campo en
  `/admin/config` («Porcentaje de abono al reservar», con ayuda: «solo el número, de 1 a
  100; 100 cobra la reserva completa»). No va en `CLAVES_TRADUCIBLES` porque es una
  cifra, y es pública: la ficha y el formulario la necesitan para mostrar el monto.
- **Validación al guardar:** hoy `SiteConfigService.patch` guarda cualquier texto. Para
  esta clave se valida que sea un entero entre 1 y 100 y se rechaza con 400 si no. Un
  «30%» o un «treinta» guardado a ciegas haría que las reservas cobraran cero.
- **Validación al leer:** si la clave falta o no es válida (una fila editada a mano en
  la base), el backend usa **30** y deja un `WARN`. Nunca se cobra 0 ni más del total.
- **Se congela en la reserva.** Al crearla se copia el porcentaje a `porcentajeAbono` y
  se calcula `montoAbono = round(total × porcentajeAbono / 100)` en pesos enteros. Si el
  admin cambia el porcentaje después, las reservas que ya existen **no se recalculan**:
  cada una conserva lo que se le ofreció, y el saldo (`total − montoAbono`) queda exacto.
  Los reintentos de pago de esa reserva cobran el mismo `montoAbono` congelado.
- **Lo que ve el cliente:** el formulario de reserva y la página de resultado muestran
  el total, «Pagas hoy: $X (30 %)» y «Saldo el día de la actividad: $Y», con el
  porcentaje leído de la misma clave. El correo de confirmación repite los tres números
  desde la reserva, no desde la configuración.
- **Fuera de alcance:** un porcentaje distinto por experiencia. Si hace falta, se agrega
  una columna opcional en `Experiencia` que, cuando tiene valor, gana sobre la clave
  global. Las cotizaciones de `/grupos` no pasan por este flujo: su 30/70 es texto de la
  página y de la política, y se cotiza aparte.

## Los casos en que el pago no se completa

Este es el núcleo del spec. Un pedido o reserva que espera pago está en `pendiente_pago`
con un `venceEn`. Cada caso dice qué le pasa al `Pago` y qué le pasa a lo que se está
comprando.

| # | Caso | `Pago` | Pedido / reserva |
|---|---|---|---|
| 1 | **Abandona**: cierra la pestaña, no vuelve | Queda `pendiente` sin `proveedorTxId`, o nunca se crea | Vence en `venceEn` → `expirado`, **devuelve stock** |
| 2 | **Rechazado**: fondos, banco, antifraude | `rechazado` con `motivo` | **Sigue en `pendiente_pago`** hasta vencer, para poder reintentar |
| 3 | **Reintenta** tras un rechazo | Un `Pago` **nuevo**, referencia nueva | Sin cambios; conserva el stock apartado |
| 4 | **Queda pendiente**: PSE, Nequi o validación bancaria tardan | `pendiente` con `proveedorTxId` | **No vence** mientras haya un pago pendiente (ver regla de vencimiento) |
| 5 | **Aprobado después de vencer** ⚠️ | `aprobado` | Se intenta **volver a apartar**. Si alcanza → `pagado`. Si no → `requiere_revision` + alerta |
| 6 | **El webhook no llega** | Sin actualizar | La conciliación lo consulta en la pasarela y aplica el caso que corresponda |
| 7 | **Webhook duplicado o fuera de orden** | Se ignora si no avanza el estado | Sin cambios |
| 8 | **Anulación o contracargo** posterior | `anulado` | `requiere_revision`. **No se cancela solo**: puede estar ya enviado |
| 9 | **Dos pedidos por la última unidad** | — | El segundo falla al crearse, como hoy: el `updateMany` con `stock >= cantidad` ya lo cubre |
| 10 | **Reintenta dentro de la pasarela** con la misma referencia tras un rechazo | De `rechazado`, `expirado` o `error` pasa a `aprobado` con el `proveedorTxId` del intento nuevo. Una transacción ajena que no sea aprobación se ignora | Como una aprobación normal: si venció, aplica el caso 5. La conciliación también revisa los `rechazado` y `error` |

### Regla de vencimiento

Un pedido o reserva en `pendiente_pago` se da por vencido cuando se cumplen **las dos**
condiciones:

- `venceEn` ya pasó (propuesta: **30 minutos** desde la creación), y
- no tiene ningún `Pago` en `pendiente` con `proveedorTxId`, **o** el más reciente de esos
  lleva más de **24 horas** (tope para PSE o Nequi colgados).

Al vencer: estado a `expirado` / `expirada`, se devuelven las unidades (la misma lógica
que ya usa `cancelado` en `PedidosService.update`) y los `Pago` pendientes sin
transacción pasan a `expirado`.

### El caso 5, en detalle

Es el único en que se le puede fallar al cliente con su dinero ya cobrado, así que no se
resuelve en silencio en ninguna rama:

1. Llega `APPROVED` para un pedido `expirado`.
2. En una transacción, se intenta el mismo descuento condicionado que usa `create`
   (`updateMany` con `stock >= cantidad`) por cada ítem.
3. **Alcanza:** pedido a `pagado`, flujo normal. El cliente no se entera de nada.
4. **No alcanza:** se deshace el descuento parcial, el pedido pasa a `requiere_revision` y
   sale una alerta al admin por Telegram y correo (reusando `alertarAdmin` de
   `NotificacionesService`). El cliente recibe un correo que dice que el pago llegó y que
   lo contactan para reponer o reembolsar. **No** se reembolsa automáticamente: con una
   sola unidad faltante lo normal es ofrecer un sustituto, y eso lo decide una persona.

Para reservas, el paso 2 es revisar el cupo del día (si existe; ver decisiones).

### Transiciones: solo hacia adelante

El estado de un `Pago` avanza, no retrocede:

```
pendiente ──▶ aprobado ──▶ anulado
    │            ▲
    ├──▶ rechazado
    ├──▶ expirado ─┤   (también a rechazado o error)
    └──▶ error ────┘   (también a rechazado)
```

`expirado` no es final: lo pone el vencimiento cuando el pedido se queda sin
respuesta, pero el cliente pudo seguir en la página de la pasarela y pagar después.
Ese pago tiene que poder registrarse (caso 5).

Un evento que pide una transición que no está en el diagrama se guarda en el log y se
ignora. Así, un `DECLINED` que llega tarde no deshace un `APPROVED`, y el mismo `APPROVED`
repetido no descuenta stock dos veces. La idempotencia se apoya en `proveedorTxId` único.

## Módulo `pagos`

### Interfaz de proveedor

```ts
interface ProveedorPagos {
  /** URL o datos del checkout para redirigir al cliente. */
  crearCheckout(pago: Pago, cliente: DatosCliente, urlRetorno: string): Promise<Checkout>
  /** Valida la firma y traduce el evento al vocabulario de `Pago`. Lanza si no es auténtico. */
  verificarWebhook(rawBody: Buffer, headers: Record<string, string>): EventoPago
  /** Pregunta el estado a la pasarela. La usan la conciliación y la página de resultado. */
  consultarTransaccion(referencia: string): Promise<EventoPago | null>
}
```

Primero se implementa un `ProveedorFalso` para las pruebas, con el que se cubren los
nueve casos. El adaptador real (Wompi u otro) se escribe cuando exista la cuenta, y la
lógica de estados no se toca.

### Endpoints

| Ruta | Acceso | Qué hace |
|---|---|---|
| `POST /pagos` | Público, `@LimiteFormularios` | Crea un intento sobre un pedido o reserva en `pendiente_pago` y devuelve el checkout. Es también el endpoint de reintento |
| `POST /pagos/webhook` | Público, **sin** límite de formularios | Verifica la firma sobre el body crudo (`rawBody: true` en `main.ts`) y aplica el evento. Responde 200 aunque el evento se ignore, para que la pasarela no lo reintente sin fin |
| `GET /pagos/estado/:referencia` | Público | Estado para la página de resultado. Si está `pendiente`, antes de responder consulta a la pasarela |
| `POST /pagos/mantenimiento` | `ADMIN_API_KEY` | Corre vencimiento + conciliación (ver abajo) |

El monto **siempre** lo calcula el backend desde el pedido o la reserva; el cliente
nunca lo manda.

### Vencimiento y conciliación sin cron propio

Como el backend puede estar dormido, estas tareas no viven en un `setInterval`. Corren
por tres caminos, todos idempotentes:

1. **Al paso:** crear un pedido nuevo dispara primero el vencimiento de lo que ya pasó
   su `venceEn`. Hace que el stock vuelva justo cuando alguien lo necesita; si falla, el
   pedido se crea igual. (Los webhooks no lo disparan: un pago que llega tarde ya se
   resuelve por el caso 5.)
2. **Disparador externo:** [cron-job.org](https://cron-job.org) llama cada 15 minutos a
   `GET /api/cron/pagos` en el front, que valida `CRON_SECRET` y llama a
   `POST /pagos/mantenimiento` con `x-admin-key`. Así la clave de admin no sale del
   servidor del front. De paso despierta el servicio. *Decidido (2026-10-01):* no se usa
   Vercel Cron porque en el plan Hobby solo corre una vez al día, y pedirle cada 15
   minutos hace fallar el despliegue.

   Configuración del trabajo en cron-job.org:
   - URL: `https://www.vuelocarmesi.com/api/cron/pagos`, método `GET`.
   - Cabecera: `Authorization: Bearer <CRON_SECRET>` (la misma que en Vercel).
   - Cada 15 minutos; tiempo de espera al máximo (el arranque en frío de Render ronda
     el minuto). Activar el aviso por correo si falla varias veces seguidas.
3. **La conciliación** dentro de ese mantenimiento: por cada `Pago` en `pendiente` con
   más de 10 minutos, `consultarTransaccion` y aplicar el resultado. Cubre el caso 6.

> **Por verificar con la pasarela elegida:** cuántas veces y durante cuánto tiempo
> reintenta un webhook que no respondió. Con Render dormido, el primer intento puede
> caer en un arranque en frío; la conciliación lo cubre igual, pero conviene saberlo.

## Lo que ya está implementado (2026-09-25)

Pasos 1 a 4 del orden de implementación, en el backend. **El cobro en línea queda
apagado** hasta que exista `PAGOS_PROVEEDOR`: sin esa variable, pedidos y reservas siguen
naciendo en `pendiente` y avisando al momento, como hoy. Se puede mergear sin que un
cliente note nada.

- **Migración** `20260925000000_pagos_y_dinero_entero`: dinero a `Int`, verificación
  previa de decimales, tabla `Pago` con CHECK de un solo dueño y monto positivo,
  `RESTRICT` al borrar. Probada contra Postgres en memoria (PGlite): aborta sin tocar
  nada si hay un decimal. **No está aplicada**: va con `prisma migrate deploy` contra la
  única base.
- **`Pedido.stockApartado`**, que no estaba en el diseño original: con los estados nuevos,
  el estado ya no dice si el pedido tiene unidades descontadas (un `requiere_revision`
  puede tenerlas o no). Devolver stock ahora mira esta marca y la baja en el mismo UPDATE,
  así que nunca se devuelve dos veces.
- **Módulo `pagos`**: `PagosService`, `VencimientoService`, `ProveedorFalso` con firma
  HMAC real, y los endpoints de la tabla de arriba.
- **Reserva aprobada → `pendiente`.** Mientras la decisión 4 esté abierta, un abono
  aprobado deja la reserva en el mismo estado del flujo manual y el admin la confirma
  como siempre. Cambiarlo es una línea en `PagosService.aprobarReserva`.
- **Pagos que no avanzan el pedido:** cobro doble, pago de algo cancelado, monto distinto
  al esperado, anulación. Todos avisan al admin por Telegram y correo
  (`NotificacionesService.alertarPago`); los que necesitan una decisión dejan el pedido o
  la reserva en `requiere_revision`.
- **Borrar** un pedido o reserva con pagos responde 409, no 500.
- **Pruebas:** `src/pagos/pagos.casos.spec.ts` cubre los casos 1 a 8 contra un Prisma en
  memoria que deshace las transacciones como Postgres. El caso 9 ya lo cubrían las
  pruebas de pedidos.

Variables nuevas en Render: `PAGOS_PROVEEDOR` (vacía = apagado; `falso` = pasarela de
mentira, solo para desarrollo) y `PAGOS_FALSO_SECRETO`.

## Front

- **Checkout:** `POST /pedidos` → `POST /pagos` → redirección al checkout de la pasarela.
  El carrito se vacía solo cuando el pago queda `aprobado`, no al crear el pedido: si el
  pago falla, el cliente vuelve y su carrito sigue ahí.
- **`/checkout/resultado?ref=...`:** nunca confía en los parámetros que agrega la
  pasarela a la URL de retorno; pregunta a `GET /pagos/estado/:referencia` y muestra:
  - `aprobado` → confirmación, lo que hoy hace `/checkout/confirmacion`.
  - `pendiente` → «Estamos confirmando tu pago con el banco». Vuelve a consultar cada
    pocos segundos durante un par de minutos y luego dice que llega un correo.
  - `rechazado` → el motivo en lenguaje humano y un botón **Intentar de nuevo** (caso 3),
    con el tiempo que queda antes de que se libere lo apartado.
  - `expirado` → «Tu pedido venció», con enlace para volver a armarlo.
- La reserva tiene el mismo flujo con su propia página de resultado.
- Todos los textos nuevos van en `messages/es.json` y `messages/en.json`.

### Front, tal como quedó (2026-09-25)

- **El backend decide.** El checkout y el formulario de reserva mandan el `POST` de
  siempre; si lo creado vuelve en `pendiente_pago`, piden `POST /pagos` y redirigen. Sin
  pasarela, el flujo manual queda idéntico. `GET /pagos/config` solo decide los textos
  (botón «Pagar», el resumen del abono, la nota lateral en vez de «sin compromiso de
  pago»); si no responde, se asume que no se cobra.
- **Si la pasarela no abre**, el pedido o la reserva ya creados se reusan al volver a
  pulsar: crear otro apartaría el stock dos veces.
- **Carrito:** se vacía solo cuando la página de resultado ve el pago aprobado. La
  referencia en curso queda en localStorage; si el cliente pagó y cerró la pestaña sin
  volver, el checkout pregunta al abrirse cómo terminó y vacía el carrito si se aprobó.
- **Resultado:** `/checkout/resultado` y `/reservar/resultado` (`/en/checkout/result`,
  `/en/book/result`), fuera del índice y del sitemap. La pantalla sale de `vistaDe`
  (`front/lib/pagos.ts`), que mira el pedido y no solo el intento. Mientras el banco no
  responde se consulta cada 3 s durante 2 minutos. El motivo de rechazo que da la pasarela
  no se muestra tal cual: viene en su idioma y su jerga; se muestra un texto propio.
- **URL de retorno por idioma:** `idioma` viaja en `POST /pagos` y el backend tiene las dos
  rutas copiadas de `routing.ts` (`RETORNO` en `pagos.service.ts`).

## Notificaciones

| Momento | Cliente | Admin |
|---|---|---|
| Pedido o reserva creado | — (hoy sale aquí; se mueve) | — |
| Pago aprobado | Confirmación (el correo actual, con «pago recibido») | Telegram, como hoy |
| Pago rechazado | Opcional: «Tu pago no se completó» + enlace de reintento | — |
| Vencido | Opcional: «Tu pedido venció» | — |
| `requiere_revision` | «Recibimos tu pago, te contactamos» | **Alerta** por Telegram y correo |

El correo actual de pedido dice «Te enviaremos los datos de despacho una vez
confirmemos el pago»; con pasarela, ese texto cambia.

### Notificaciones, tal como quedaron (2026-10-01)

- **Aprobado:** `enviarConfirmacionPedido` y `enviarConfirmacionReserva` reciben un
  segundo argumento `{ monto }`. Con él, el acuse dice «Recibimos tu pago de $X» en vez
  de «una vez confirmemos el pago», y el de reserva agrega total, abono con su
  porcentaje y saldo, leídos de la reserva. Telegram y el correo al admin lo marcan
  como pagado en línea. Sin el argumento (flujo manual), los textos no cambian.
- **Rechazado:** *decidido:* sí se envía. Plantilla `pago-rechazado.html`, con
  «Intentar de nuevo» hacia la página de resultado (`?ref=`) y la hora límite en hora
  de Colombia. Solo sale si todavía se puede reintentar: el pedido o la reserva sigue
  en `pendiente_pago` y no ha pasado su `venceEn`. Un `error` de la pasarela no lo
  dispara.
- **Vencido:** *decidido:* no se envía.
- **`requiere_revision` con dinero recibido:** plantilla `pago-en-revision.html`, con
  el código corto `#VC-XXXXXX`. No sale en una anulación, porque ahí el dinero volvió
  al cliente. Si falla, la alerta al admin sale igual.

## Panel

- Pedidos y reservas muestran el estado del pago y la lista de intentos (monto, método,
  estado, motivo).
- Filtro rápido para `requiere_revision`: es la bandeja de lo que necesita una persona.
- Los pagos con `modo = prueba` se distinguen a simple vista y se excluyen de las
  cifras del dashboard.

### Panel, tal como quedó (2026-10-01)

- `GET /pedidos` y `GET /reservas` (y sus `:id` y `PATCH`) incluyen `pagos` sin
  `payload` (`back/src/pagos/panel.ts`).
- Detalle (panel lateral) de pedido y reserva: lista de intentos (`PagosLista`) y un aviso
  para `requiere_revision` (`AvisoRevision`). La reserva muestra además total, abono
  y saldo. El selector de estado del pedido suma `pagado`, para un pago que llegó por
  fuera.
- Filtro «Revisar» con contador en Pedidos y Reservas. En el Overview, una tarjeta
  «Pagos por revisar» que solo aparece si hay alguno.
- Insignia «Prueba» si todos los intentos son del sandbox. Las reglas de las cifras
  están en `front/lib/admin/pagos.ts`: no cuentan los de prueba ni lo que se quedó en
  `pendiente_pago` o venció, y «Ingresos estimados» tampoco suma cancelados.

## Legal

- **Términos de la tienda:** derecho de retracto (5 días hábiles, art. 47 Ley 1480) y
  reversión del pago (art. 51), con el canal para pedirlos.
- **Política de datos:** mencionar al procesador de pagos como encargado. El sitio no
  guarda datos de tarjeta en ningún momento; eso lo hace la pasarela.
- **Política de cancelación:** resolver la contradicción que ya señala
  `2026-09-17-pagina-grupos-design.md` («pagado en su totalidad antes de la actividad»
  frente a «30 % al reservar y 70 % el día»). Con cobro en línea la política tiene que
  decir sobre qué valor se calcula cada penalidad. Si la política nombra el porcentaje
  del abono, lo toma de `reservas_abono_porcentaje` y no lo escribe fijo: si no, el día
  que se cambie en el panel la política queda diciendo otra cifra que la que se cobra.

## Orden de implementación

1. ✅ Migración del dinero a `Int` (con la verificación previa). *Escrita, sin aplicar.*
2. ✅ Modelo `Pago` y campos nuevos de `Pedido` y `Reserva`.
3. ✅ Módulo `pagos` con `ProveedorFalso`, máquina de estados y pruebas de los nueve casos.
4. ✅ Vencimiento, conciliación y el endpoint de mantenimiento. Disparador:
   `front/app/api/cron/pagos/route.ts`. *Falta crear el trabajo en cron-job.org y poner
   `CRON_SECRET` en Vercel al activar los pagos.*
5. ✅ Front: checkout, página de resultado, carrito que sobrevive al fallo. Ver «Front, tal
   como quedó».
6. ✅ Notificaciones y panel. Ver «Notificaciones, tal como quedaron» y «Panel, tal
   como quedó».
7. Adaptador real en sandbox (`modo = prueba`), pruebas de extremo a extremo.
8. Textos legales publicados. Luego, credenciales de producción.

Los pasos 1 a 6 no necesitan la cuenta de la pasarela. Los siguientes sí.

## Decisiones pendientes

1. **Pasarela.** Recomendación: **Wompi** (tarjeta, PSE, Nequi, botón Bancolombia,
   sandbox gratis, webhook con checksum). Alternativas: Mercado Pago, ePayco, PayU. El
   trámite del comercio va a nombre del titular del RUT/NIT y de la cuenta bancaria, y
   tarda días: conviene empezarlo ya.
2. ~~Cuánto se cobra en línea en una reserva.~~ **Decidido (2026-09-25):** un
   porcentaje parametrizable, 30 % de arranque. Ver «Abono de la reserva».
3. **Cupo por fecha.** Hoy no existe (hecho 2). Opciones:
   - **Crear un cupo diario por experiencia** y que la reserva en `pendiente_pago` lo
     ocupe hasta vencer, igual que el stock. *Recomendada.*
   - **Seguir sin cupo** y que el admin confirme después del pago, aceptando que a
     veces habrá que reembolsar a alguien que ya pagó.

   Se cruza con el dato «cupos por día» que el portafolio tiene como deuda.
4. **¿Un abono pagado confirma la reserva sola**, o el admin la sigue confirmando?
5. **Envío en la tienda:** hoy el total no incluye envío. ¿Tarifa fija, por ciudad o
   contra entrega?
6. ~~**Plan de Render.**~~ **Resuelto (2026-10-01):** el disparador es cron-job.org
   en cualquier caso, así que el plan de Render deja de importar para esto.
7. **Tiempos:** 30 minutos de apartado y 24 horas de tope para un pago pendiente son
   una propuesta.
