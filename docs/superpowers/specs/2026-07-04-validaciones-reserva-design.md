# Validación integral del formulario de reserva

**Fecha:** 2026-07-04
**Estado:** Aprobado por Yeison

## Contexto y problema

El formulario público de reserva (`front/components/booking/ReservaForm.tsx`) solo tiene
validación HTML nativa (required, type=email) y muestra un único error genérico. El backend
(`back/src/reservas/dto/create-reserva.dto.ts`) valida tipos básicos con class-validator pero
tiene huecos reales:

- `email` y `telefono` solo `@IsString()` — acepta cualquier texto y strings vacíos no,
  pero `"a"` sí.
- `fecha` acepta fechas pasadas.
- `cantidadPersonas` acepta decimales y no tiene tope contra la capacidad de la experiencia.
- `estado` es aceptado en el endpoint público: cualquiera puede crear una reserva ya
  `confirmada` por API.
- `create` no verifica que la experiencia exista (error 500 de Prisma por FK) ni que no esté
  archivada.
- El endpoint es público y no tiene rate limiting ni protección anti-bots.

## Decisiones de negocio (confirmadas con Yeison)

| Tema | Decisión |
|---|---|
| Fecha mínima | Desde **mañana** (hoy + 1 día). No se puede reservar en el pasado ni el mismo día. |
| Fecha máxima | Hoy + 6 meses. |
| Capacidad | Solo tope por reserva individual (`cantidadPersonas ≤ experiencia.capacidad`). No hay cupo compartido por fecha. |
| Duplicados | Rechazar (409) si existe reserva `pendiente` con mismo email + experiencia + fecha, **y notificar al admin por email y Telegram** para que contacte al cliente. |
| Teléfono | Internacional flexible: `+` opcional, 7–15 dígitos (espacios y guiones permitidos y limpiados al validar). |
| Anti-abuso | Rate limit (5 reservas/hora/IP en POST /reservas) + honeypot en el formulario. |
| Stack front | react-hook-form + Zod (criterio: la solución más profesional; hay más formularios en el sitio que reutilizarán el patrón). |

Los límites de fecha son constantes con nombre en el código (no configurables por admin).

## Reglas de validación por campo

| Campo | Regla |
|---|---|
| nombre | requerido, trim, 3–100 caracteres |
| telefono | requerido, regex `^\+?[\d\s-]{7,17}$` con 7–15 dígitos reales tras quitar espacios/guiones; se normaliza (sin espacios/guiones) antes de persistir |
| email | requerido, formato email real, máx. 255 |
| fecha | requerida, ≥ mañana, ≤ hoy + 6 meses (comparación por día calendario, zona horaria de Colombia `America/Bogota`) |
| cantidadPersonas | entero, 1 ≤ n ≤ capacidad de la experiencia |
| notas | opcional, máx. 500 caracteres |
| estado | eliminado del DTO público; el servidor siempre crea en `pendiente` |
| website (honeypot) | opcional, string; si viene con valor la reserva se descarta silenciosamente |

## Diseño

### Frontend

**Dependencias nuevas:** `react-hook-form`, `zod`, `@hookform/resolvers`.

**Nuevo archivo `front/lib/schemas/reserva.ts`:**
- `crearReservaSchema(capacidad: number)` devuelve el schema Zod con todas las reglas.
- Mensajes de error en español colombiano (tuteo: "inténtalo", no voseo).
- Exporta también helpers de fecha (`fechaMinima()`, `fechaMaxima()`) para los atributos
  `min`/`max` del input date.

**`ReservaForm.tsx` reescrito sobre `useForm` + `zodResolver`:**
- Error por campo debajo del input: texto pequeño color crimson, `aria-invalid` y
  `aria-describedby` en el input, borde del input en rojo.
- Validación en blur, revalidación en change (`mode: 'onTouched'`).
- Contador de caracteres visible en notas (n/500).
- Input fecha con `min`/`max` calculados.
- Honeypot: campo `website` oculto (posicionado fuera de pantalla por CSS, `tabIndex={-1}`,
  `autoComplete="off"`), enviado al backend con el resto del body.
- Mapeo de errores del backend:
  - 409 → "Ya tienes una reserva pendiente para esta experiencia en esa fecha, te
    contactaremos pronto."
  - 429 → "Has enviado demasiadas solicitudes, inténtalo más tarde."
  - 400 → mensaje de validación devuelto por el backend.
  - Otro → mensaje genérico actual, corregido a español colombiano.
- El submit sigue deshabilitándose durante el envío (comportamiento actual conservado).

### Backend — DTO (`create-reserva.dto.ts`)

```ts
@IsString() @IsNotEmpty() experienciaId
@IsDateString() fecha
@IsInt() @Min(1) cantidadPersonas
@Transform(trim) @IsNotEmpty() @Length(3, 100) nombre
@IsEmail() @MaxLength(255) email
@Matches(/^\+?[\d\s-]{7,17}$/) telefono   // 7–15 dígitos reales tras limpiar
@IsOptional() @MaxLength(500) notas
@IsOptional() @IsString() website          // honeypot
// estado: ELIMINADO
```

- `main.ts`: ValidationPipe global pasa a `{ whitelist: true, forbidNonWhitelisted: true,
  transform: true }`. Con `forbidNonWhitelisted`, un body con campos desconocidos (p. ej.
  `estado`) responde 400.
- El `update()` del controller hoy tipa el body como `Partial<CreateReservaDto>`, que es
  solo un tipo TypeScript: ValidationPipe no valida nada en ese endpoint. Se crea
  `UpdateReservaDto extends PartialType(CreateReservaDto)` (de `@nestjs/mapped-types`) para
  que la validación aplique también al PATCH. Los cambios de estado quedan solo en
  `PATCH /reservas/:id/estado` (verificado: el admin ya usa únicamente ese endpoint para
  estados).

### Backend — reglas de negocio (`reservas.service.ts#create`, en orden)

1. **Honeypot:** si `website` tiene valor → responder éxito falso (objeto mínimo con estado
   201) sin crear ni notificar; loguear el intento con `Logger.warn`.
2. **Experiencia:** buscarla; no existe → 404; `archivada` → 400 "experiencia no disponible".
3. **Fecha:** fuera de [mañana, hoy+6 meses] en `America/Bogota` → 400 con mensaje claro.
4. **Capacidad:** `cantidadPersonas > experiencia.capacidad` → 400.
5. **Duplicado:** existe reserva `pendiente` con mismo email (case-insensitive) +
   `experienciaId` + misma fecha (día calendario) → 409, y disparar
   `enviarAlertaReservaDuplicada` fire-and-forget.
6. Crear con `estado: 'pendiente'` fijado por el servidor y teléfono normalizado.

**Nuevo método `NotificacionesService.enviarAlertaReservaDuplicada(...)`:** sigue el patrón
existente — email al admin con `templateAlertaAdmin` (tipo "⚠️ Cliente reintentando
reserva") + `telegram.send` con nombre, email, teléfono, experiencia y fecha, indicando que
el cliente está intentando reservar de nuevo y conviene contactarlo.

### Rate limiting

- Dependencia `@nestjs/throttler` registrada en `AppModule`.
- Límite global suave: 60 req/min por IP.
- `POST /reservas`: `@Throttle` estricto de 5 por hora por IP.
- Si el límite global estorba al panel admin, marcar su controller con `@SkipThrottle`
  (decisión en implementación).

## Testing

**Backend (`reservas.service.spec.ts` ampliado):**
- Experiencia inexistente → 404; archivada → 400.
- Fecha: hoy → 400, mañana → OK, hoy+6 meses → OK, hoy+6 meses+1 día → 400, pasado → 400.
- `cantidadPersonas` > capacidad → 400.
- Duplicado pendiente → 409 y se dispara la notificación de alerta.
- Honeypot con valor → no crea, no notifica, responde éxito falso.
- `estado` enviado en el body del POST → 400 por `forbidNonWhitelisted`; la reserva creada
  sin ese campo siempre nace `pendiente`.

**Frontend:**
- Unit tests del schema Zod cubriendo cada regla y sus mensajes.
- Si el front no tiene runner, se agrega `vitest` mínimo solo para `lib/` (sin
  testing-library).

## Fuera de alcance

- Cupo compartido por fecha (decidido: no).
- Límites de fecha configurables desde el admin (decidido: constantes en código).
- Migrar los formularios de contacto y checkout a react-hook-form (queda como patrón a
  reutilizar después).
- Autenticación/autorización de los endpoints admin de reservas (hueco conocido, fuera de
  este trabajo).
