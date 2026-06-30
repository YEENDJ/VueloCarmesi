# Notificaciones por cambio de estado de reserva

**Fecha:** 2026-06-29
**Estado:** Aprobado

## Contexto

Cuando el admin confirma o cancela una reserva desde el panel, actualmente solo se actualiza el campo `estado` en la BD. El cliente no recibe ninguna notificación. Las notificaciones existentes (email + Telegram) solo se disparan en la creación de una reserva nueva.

## Decisiones de diseño

- **Destinatario:** Solo el cliente. El admin no recibe notificación de sus propias acciones.
- **Canales:** Solo email al cliente (no Telegram — es un evento iniciado por el admin, no entrante).
- **Cancelación:** El admin puede escribir un motivo opcional que se incluye en el email. El email incluye un CTA para volver a reservar.
- **Confirmación:** El email incluye los datos de la reserva + instrucciones prácticas + datos de contacto del negocio.

## Arquitectura

### Backend

#### Nuevo endpoint
```
PATCH /reservas/:id/estado
Authorization: requerida (admin)
Body: { estado: "confirmada" | "cancelada" | "pendiente", motivo?: string }
Response: Reserva actualizada
```

El endpoint existente `PATCH /reservas/:id` se mantiene para editar datos de la reserva (nombre, fecha, personas, etc.).

#### Transiciones de estado permitidas
| Desde | Hacia | Permitido |
|-------|-------|-----------|
| pendiente | confirmada | ✅ |
| pendiente | cancelada | ✅ |
| confirmada | cancelada | ✅ |
| confirmada | pendiente | ✅ |
| cancelada | confirmada | ❌ |
| cancelada | pendiente | ❌ |

#### Piezas nuevas

**`back/src/reservas/dto/update-estado-reserva.dto.ts`**
```ts
class UpdateEstadoReservaDto {
  estado: 'pendiente' | 'confirmada' | 'cancelada'  // requerido, validado enum
  motivo?: string                                     // opcional, solo para cancelaciones
}
```

**`ReservasService.cambiarEstado(id, dto)`**
1. Carga la reserva actual (para conocer el estado previo)
2. Valida la transición — lanza `BadRequestException` si no está permitida
3. Actualiza `estado` en Prisma
4. Si el nuevo estado es `confirmada` → `notificaciones.enviarReservaConfirmadaCliente(reserva)`
5. Si el nuevo estado es `cancelada` → `notificaciones.enviarReservaCanceladaCliente(reserva, motivo)`
6. Las notificaciones son fire-and-forget (`.catch()` con logger), igual que en `create()`

**`NotificacionesService` — dos métodos nuevos**

`enviarReservaConfirmadaCliente(reserva)`:
- Asunto: `"Tu reserva está confirmada — Vuelo Carmesí"`
- Contenido: datos de la reserva (experiencia, fecha, personas) + instrucciones prácticas (qué llevar, dónde llegar, hora de encuentro) + número de contacto del negocio
- Las instrucciones prácticas y el contacto de bene configurar en siconfig desde el panel de admin

`enviarReservaCanceladaCliente(reserva, motivo?)`:
- Asunto: `"Actualización sobre tu reserva — Vuelo Carmesí"`
- Contenido: aviso de cancelación + motivo del admin (si existe) + CTA "Volver a reservar" apuntando a `FRONTEND_URL`

**Templates HTML nuevos**
- `back/src/notificaciones/templates/reserva-confirmada.html`
- `back/src/notificaciones/templates/reserva-cancelada.html`

Siguen el mismo estilo visual que los templates existentes.

### Frontend

#### `front/lib/admin/api.ts`
`updateEstadoReserva` cambia la URL de `/reservas/:id` a `/reservas/:id/estado`. El tipo del payload se extiende para incluir `motivo?: string`.

#### Modal de cancelación
Cuando el admin selecciona `"cancelada"` (desde el `<select>` de la tabla o el botón del `ReservaDrawer`), se muestra un modal de confirmación antes de hacer la llamada:

- Título: "Cancelar reserva de [nombre]"
- Textarea: "Motivo (opcional — se incluirá en el email al cliente)"
- Botones: "Volver" / "Confirmar cancelación"

Al confirmar → `PATCH /reservas/:id/estado` con `{ estado: "cancelada", motivo }`.

#### Confirmación directa
Cambiar a `"confirmada"` no requiere modal. El PATCH se hace inmediatamente al cambiar el select o presionar el botón.

#### Componentes afectados
- `front/lib/admin/api.ts` — cambio de URL + tipo
- `front/app/admin/(protected)/reservas/page.tsx` — estado local para modal de cancelación
- `front/components/admin/ReservaDrawer.tsx` — modal de cancelación integrado

No se crean páginas ni componentes nuevos.

## Flujo completo

```
Admin selecciona "cancelada"
  → Modal aparece con textarea de motivo
  → Admin escribe motivo (opcional) y confirma
  → PATCH /reservas/:id/estado { estado: "cancelada", motivo }
  → ReservasController → ReservasService.cambiarEstado()
  → Prisma actualiza estado
  → notificaciones.enviarReservaCanceladaCliente() [fire-and-forget]
    → EmailService.send() → email al cliente con motivo + CTA
  → Response: reserva actualizada
  → Frontend actualiza lista
```

## Manejo de errores

- Transición inválida → `400 BadRequestException` con mensaje descriptivo
- Reserva no encontrada → `404 NotFoundException` (ya existe en `findById`)
- Error de email → log de error, NO falla el request (el estado ya fue guardado)

## Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `back/src/reservas/dto/update-estado-reserva.dto.ts` | Crear |
| `back/src/reservas/reservas.controller.ts` | Modificar — agregar endpoint |
| `back/src/reservas/reservas.service.ts` | Modificar — agregar `cambiarEstado()` |
| `back/src/notificaciones/notificaciones.service.ts` | Modificar — agregar 2 métodos |
| `back/src/notificaciones/templates/reserva-confirmada.html` | Crear |
| `back/src/notificaciones/templates/reserva-cancelada.html` | Crear |
| `front/lib/admin/api.ts` | Modificar — URL + tipo |
| `front/app/admin/(protected)/reservas/page.tsx` | Modificar — modal cancelación |
| `front/components/admin/ReservaDrawer.tsx` | Modificar — modal cancelación |