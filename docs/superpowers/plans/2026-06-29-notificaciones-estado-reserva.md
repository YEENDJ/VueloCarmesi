# Notificaciones por cambio de estado de reserva — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enviar email al cliente cuando el admin confirma o cancela una reserva desde el panel, con un endpoint dedicado `PATCH /reservas/:id/estado` que maneja la transición de estado, valida transiciones inválidas, y dispara las notificaciones correspondientes. El admin puede incluir un motivo opcional en cancelaciones, que se incluye en el email junto a un CTA para volver a reservar.

**Architecture:** Nuevo endpoint `PATCH /reservas/:id/estado` separado del PATCH genérico de edición. El servicio valida la transición de estado (ej: cancelada → confirmada es inválida), actualiza la BD, y dispara notificaciones fire-and-forget. Las instrucciones prácticas y datos de contacto se leen desde `SiteConfig` con fallback a valores por defecto. El modal de cancelación en el frontend intercepta el cambio de estado antes de hacer la llamada API.

**Tech Stack:** NestJS + Prisma (backend), Next.js 14 + React (frontend), class-validator (DTOs), nodemailer + templates HTML (email)

## Global Constraints

- Notificaciones son fire-and-forget: errores se loggean pero NO fallan el request
- Las instrucciones y contacto se leen de SiteConfig keys `instrucciones_confirmacion` y `contacto_negocio`; si no existen, usar fallbacks hardcodeados
- Templates HTML siguen el mismo estilo visual que los existentes: fondo `#FFEACA`, header `#D51312`, tipografía Georgia serif
- Transición inválida: `cancelada → confirmada` y `cancelada → pendiente` lanzan `BadRequestException`
- El endpoint existente `PATCH /reservas/:id` se mantiene sin cambios para editar datos de la reserva

---

### Task 1: Scaffolding — DTO, templates HTML, métodos de EmailService

**Files:**
- Create: `back/src/reservas/dto/update-estado-reserva.dto.ts`
- Create: `back/src/notificaciones/templates/reserva-confirmada.html`
- Create: `back/src/notificaciones/templates/reserva-cancelada.html`
- Modify: `back/src/notificaciones/email.service.ts`

**Interfaces:**
- Produces:
  - `UpdateEstadoReservaDto` con `estado: 'pendiente' | 'confirmada' | 'cancelada'` y `motivo?: string`
  - `EmailService.templateReservaConfirmada(vars: Record<string, string>): string` — vars: `nombre`, `experiencia`, `fecha`, `cantidadPersonas`, `instrucciones`, `contacto`
  - `EmailService.templateReservaCancelada(vars: Record<string, string>): string` — vars: `nombre`, `experiencia`, `fecha`, `motivoHtml`, `urlReserva`

- [ ] **Step 1: Crear el DTO**

Crear `back/src/reservas/dto/update-estado-reserva.dto.ts`:

```ts
import { IsIn, IsOptional, IsString } from 'class-validator'

export class UpdateEstadoReservaDto {
  @IsIn(['pendiente', 'confirmada', 'cancelada'])
  estado: 'pendiente' | 'confirmada' | 'cancelada'

  @IsOptional()
  @IsString()
  motivo?: string
}
```

- [ ] **Step 2: Crear template HTML reserva-confirmada**

Crear `back/src/notificaciones/templates/reserva-confirmada.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Reserva Confirmada</title></head>
<body style="font-family:Georgia,serif;background:#FFEACA;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(135,43,19,.12)">
    <div style="background:#D51312;padding:32px 40px">
      <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#FFEACA;margin-bottom:8px">Vuelo Carmesí</div>
      <div style="font-size:26px;color:#fff;font-weight:bold">¡Tu reserva está confirmada!</div>
    </div>
    <div style="padding:32px 40px">
      <p style="color:#5C3317;font-size:16px;margin:0 0 24px">Hola <strong>{{nombre}}</strong>, tu reserva ha sido <strong>confirmada</strong>. Te esperamos con gusto.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#872B13;font-weight:bold;width:40%">Experiencia</td><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#5C3317">{{experiencia}}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#872B13;font-weight:bold">Fecha</td><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#5C3317">{{fecha}}</td></tr>
        <tr><td style="padding:10px 0;color:#872B13;font-weight:bold">Personas</td><td style="padding:10px 0;color:#5C3317">{{cantidadPersonas}}</td></tr>
      </table>
      <div style="margin:24px 0;padding:16px 20px;background:#FFF8F0;border-left:3px solid #D51312;border-radius:4px">
        <div style="color:#872B13;font-weight:bold;font-size:13px;margin-bottom:8px">📋 Antes de llegar</div>
        <div style="color:#5C3317;font-size:14px;line-height:1.7">{{instrucciones}}</div>
      </div>
      <p style="color:#5C3317;font-size:14px;margin:0">¿Tienes alguna duda? Contáctanos: <strong>{{contacto}}</strong></p>
    </div>
    <div style="background:#F0D6A8;padding:20px 40px;font-size:12px;color:#872B13;text-align:center">Vuelo Carmesí · Finca agroecológica · Colombia</div>
  </div>
</body>
</html>
```

- [ ] **Step 3: Crear template HTML reserva-cancelada**

Crear `back/src/notificaciones/templates/reserva-cancelada.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Actualización de tu reserva</title></head>
<body style="font-family:Georgia,serif;background:#FFEACA;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(135,43,19,.12)">
    <div style="background:#5C3317;padding:32px 40px">
      <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#FFEACA;margin-bottom:8px">Vuelo Carmesí</div>
      <div style="font-size:26px;color:#fff;font-weight:bold">Actualización sobre tu reserva</div>
    </div>
    <div style="padding:32px 40px">
      <p style="color:#5C3317;font-size:16px;margin:0 0 16px">
        Hola <strong>{{nombre}}</strong>, lamentamos informarte que tu reserva para <strong>{{experiencia}}</strong> el <strong>{{fecha}}</strong> ha sido cancelada.
      </p>
      {{motivoHtml}}
      <p style="color:#5C3317;font-size:14px;margin:24px 0 8px">Si deseas reservar en otra fecha, puedes hacerlo desde nuestro sitio web:</p>
      <div style="text-align:center;margin:20px 0">
        <a href="{{urlReserva}}" style="display:inline-block;background:#D51312;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">Volver a reservar</a>
      </div>
    </div>
    <div style="background:#F0D6A8;padding:20px 40px;font-size:12px;color:#872B13;text-align:center">Vuelo Carmesí · Finca agroecológica · Colombia</div>
  </div>
</body>
</html>
```

- [ ] **Step 4: Agregar métodos de template a EmailService**

En `back/src/notificaciones/email.service.ts`, agregar después de `templateAlertaAdmin`:

```ts
  templateReservaConfirmada(vars: Record<string, string>): string {
    return this.tpl('reserva-confirmada', vars)
  }

  templateReservaCancelada(vars: Record<string, string>): string {
    return this.tpl('reserva-cancelada', vars)
  }
```

- [ ] **Step 5: Commit**

```bash
git add back/src/reservas/dto/update-estado-reserva.dto.ts back/src/notificaciones/templates/reserva-confirmada.html back/src/notificaciones/templates/reserva-cancelada.html back/src/notificaciones/email.service.ts
git commit -m "feat: DTO UpdateEstadoReserva + templates HTML confirmada/cancelada"
```

---

### Task 2: ReservasService.cambiarEstado() + endpoint (TDD)

**Files:**
- Create: `back/src/reservas/reservas.service.spec.ts`
- Modify: `back/src/reservas/reservas.service.ts`
- Modify: `back/src/reservas/reservas.controller.ts`

**Interfaces:**
- Consumes: `UpdateEstadoReservaDto` de Task 1; `NotificacionesService` (mockeado en tests, implementado en Task 3)
- Produces: `ReservasService.cambiarEstado(id: string, dto: UpdateEstadoReservaDto): Promise<Reserva>` — `PATCH /reservas/:id/estado`

- [ ] **Step 1: Escribir el test**

Crear `back/src/reservas/reservas.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ReservasService } from './reservas.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'

const mockPrisma = {
  reserva: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

const mockNotificaciones = {
  enviarConfirmacionReserva: jest.fn().mockResolvedValue(undefined),
  enviarReservaConfirmadaCliente: jest.fn().mockResolvedValue(undefined),
  enviarReservaCanceladaCliente: jest.fn().mockResolvedValue(undefined),
}

const reservaBase = {
  id: '1',
  nombre: 'Ana García',
  email: 'ana@test.com',
  telefono: '3001234567',
  fecha: new Date('2026-08-15'),
  cantidadPersonas: 2,
  experienciaId: 'exp1',
  experiencia: { id: 'exp1', nombre: 'Agroturismo' },
  notas: null,
  createdAt: new Date(),
}

describe('ReservasService.cambiarEstado', () => {
  let service: ReservasService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReservasService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificacionesService, useValue: mockNotificaciones },
      ],
    }).compile()
    service = module.get(ReservasService)
    jest.clearAllMocks()
  })

  it('lanza NotFoundException si la reserva no existe', async () => {
    mockPrisma.reserva.findUnique.mockResolvedValue(null)
    await expect(service.cambiarEstado('id-fake', { estado: 'confirmada' }))
      .rejects.toThrow(NotFoundException)
  })

  it('lanza BadRequestException al cambiar de cancelada a confirmada', async () => {
    mockPrisma.reserva.findUnique.mockResolvedValue({ ...reservaBase, estado: 'cancelada' })
    await expect(service.cambiarEstado('1', { estado: 'confirmada' }))
      .rejects.toThrow(BadRequestException)
  })

  it('lanza BadRequestException al cambiar de cancelada a pendiente', async () => {
    mockPrisma.reserva.findUnique.mockResolvedValue({ ...reservaBase, estado: 'cancelada' })
    await expect(service.cambiarEstado('1', { estado: 'pendiente' }))
      .rejects.toThrow(BadRequestException)
  })

  it('actualiza estado a confirmada y llama enviarReservaConfirmadaCliente', async () => {
    mockPrisma.reserva.findUnique.mockResolvedValue({ ...reservaBase, estado: 'pendiente' })
    const updated = { ...reservaBase, estado: 'confirmada' }
    mockPrisma.reserva.update.mockResolvedValue(updated)

    const result = await service.cambiarEstado('1', { estado: 'confirmada' })

    expect(mockPrisma.reserva.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { estado: 'confirmada' },
      include: { experiencia: { select: { id: true, nombre: true } } },
    })
    expect(result.estado).toBe('confirmada')
    await new Promise(r => setImmediate(r))
    expect(mockNotificaciones.enviarReservaConfirmadaCliente).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'confirmada' })
    )
    expect(mockNotificaciones.enviarReservaCanceladaCliente).not.toHaveBeenCalled()
  })

  it('actualiza estado a cancelada y llama enviarReservaCanceladaCliente con motivo', async () => {
    mockPrisma.reserva.findUnique.mockResolvedValue({ ...reservaBase, estado: 'pendiente' })
    const updated = { ...reservaBase, estado: 'cancelada' }
    mockPrisma.reserva.update.mockResolvedValue(updated)

    await service.cambiarEstado('1', { estado: 'cancelada', motivo: 'Sin disponibilidad' })

    await new Promise(r => setImmediate(r))
    expect(mockNotificaciones.enviarReservaCanceladaCliente).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'cancelada' }),
      'Sin disponibilidad'
    )
    expect(mockNotificaciones.enviarReservaConfirmadaCliente).not.toHaveBeenCalled()
  })

  it('no llama ninguna notificación al cambiar a pendiente', async () => {
    mockPrisma.reserva.findUnique.mockResolvedValue({ ...reservaBase, estado: 'confirmada' })
    mockPrisma.reserva.update.mockResolvedValue({ ...reservaBase, estado: 'pendiente' })

    await service.cambiarEstado('1', { estado: 'pendiente' })

    await new Promise(r => setImmediate(r))
    expect(mockNotificaciones.enviarReservaConfirmadaCliente).not.toHaveBeenCalled()
    expect(mockNotificaciones.enviarReservaCanceladaCliente).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Correr el test para verificar que falla**

```bash
cd back && npx jest --testPathPattern=reservas.service --no-coverage
```

Esperado: FAIL — `service.cambiarEstado is not a function`

- [ ] **Step 3: Implementar ReservasService.cambiarEstado()**

En `back/src/reservas/reservas.service.ts`, agregar el import de `BadRequestException` y el método. El archivo completo queda:

```ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { CreateReservaDto } from './dto/create-reserva.dto'
import { UpdateEstadoReservaDto } from './dto/update-estado-reserva.dto'

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name)

  private static readonly TRANSICIONES_INVALIDAS: Partial<Record<string, string[]>> = {
    cancelada: ['confirmada', 'pendiente'],
  }

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  findAll() {
    return this.prisma.reserva.findMany({
      include: { experiencia: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } })
    if (!reserva) throw new NotFoundException()
    return reserva
  }

  async create(dto: CreateReservaDto) {
    const { fecha, ...rest } = dto
    const reserva = await this.prisma.reserva.create({
      data: { ...rest, fecha: new Date(fecha) },
      include: { experiencia: { select: { id: true, nombre: true } } },
    })

    this.notificaciones
      .enviarConfirmacionReserva(reserva)
      .catch(err => this.logger.error('Notificación de reserva fallida', err))

    return reserva
  }

  async update(id: string, dto: Partial<CreateReservaDto>) {
    await this.findById(id)
    const { fecha, ...rest } = dto
    return this.prisma.reserva.update({
      where: { id },
      data: { ...rest, ...(fecha ? { fecha: new Date(fecha) } : {}) },
    })
  }

  async cambiarEstado(id: string, dto: UpdateEstadoReservaDto) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id },
      include: { experiencia: { select: { id: true, nombre: true } } },
    })
    if (!reserva) throw new NotFoundException()

    const invalidos = ReservasService.TRANSICIONES_INVALIDAS[reserva.estado] ?? []
    if (invalidos.includes(dto.estado)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de "${reserva.estado}" a "${dto.estado}"`
      )
    }

    const updated = await this.prisma.reserva.update({
      where: { id },
      data: { estado: dto.estado },
      include: { experiencia: { select: { id: true, nombre: true } } },
    })

    if (dto.estado === 'confirmada') {
      this.notificaciones
        .enviarReservaConfirmadaCliente(updated)
        .catch(err => this.logger.error('Notificación confirmación fallida', err))
    } else if (dto.estado === 'cancelada') {
      this.notificaciones
        .enviarReservaCanceladaCliente(updated, dto.motivo)
        .catch(err => this.logger.error('Notificación cancelación fallida', err))
    }

    return updated
  }

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.reserva.delete({ where: { id } })
  }
}
```

- [ ] **Step 4: Agregar el endpoint al controller**

Reemplazar el contenido de `back/src/reservas/reservas.controller.ts`:

```ts
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common'
import { ReservasService } from './reservas.service'
import { CreateReservaDto } from './dto/create-reserva.dto'
import { UpdateEstadoReservaDto } from './dto/update-estado-reserva.dto'

@Controller('reservas')
export class ReservasController {
  constructor(private readonly service: ReservasService) {}

  @Get()       findAll()                                                                   { return this.service.findAll() }
  @Get(':id')  findOne(@Param('id') id: string)                                           { return this.service.findById(id) }
  @Post()      create(@Body() dto: CreateReservaDto)                                      { return this.service.create(dto) }
  @Patch(':id/estado') cambiarEstado(@Param('id') id: string, @Body() dto: UpdateEstadoReservaDto) { return this.service.cambiarEstado(id, dto) }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: Partial<CreateReservaDto>)  { return this.service.update(id, dto) }
  @Delete(':id') remove(@Param('id') id: string)                                         { return this.service.remove(id) }
}
```

> **Importante:** `PATCH ':id/estado'` debe declararse ANTES de `PATCH ':id'` para que NestJS enrute correctamente.

- [ ] **Step 5: Correr los tests para verificar que pasan**

```bash
cd back && npx jest --testPathPattern=reservas.service --no-coverage
```

Esperado: PASS — 6 tests en verde

- [ ] **Step 6: Commit**

```bash
git add back/src/reservas/reservas.service.ts back/src/reservas/reservas.service.spec.ts back/src/reservas/reservas.controller.ts
git commit -m "feat(reservas): endpoint PATCH /reservas/:id/estado con validación de transiciones"
```

---

### Task 3: NotificacionesService — dos métodos nuevos

**Files:**
- Modify: `back/src/notificaciones/notificaciones.service.ts`

**Interfaces:**
- Consumes:
  - `EmailService.templateReservaConfirmada(vars)` de Task 1
  - `EmailService.templateReservaCancelada(vars)` de Task 1
  - SiteConfig keys `instrucciones_confirmacion` y `contacto_negocio` (leídos de Prisma)
- Produces:
  - `NotificacionesService.enviarReservaConfirmadaCliente(reserva)` — firma exacta que esperan los tests de Task 2
  - `NotificacionesService.enviarReservaCanceladaCliente(reserva, motivo?)` — firma exacta que esperan los tests de Task 2

El tipo `reserva` en ambos métodos: `{ id: string; nombre: string; email: string; experiencia?: { nombre: string } | null; fecha: Date; cantidadPersonas: number; estado: string }`

- [ ] **Step 1: Agregar los dos métodos a NotificacionesService**

En `back/src/notificaciones/notificaciones.service.ts`, agregar los dos métodos nuevos al final de la clase (antes del cierre `}`):

```ts
  async enviarReservaConfirmadaCliente(reserva: {
    id: string; nombre: string; email: string
    experiencia?: { nombre: string } | null
    fecha: Date; cantidadPersonas: number; estado: string
  }): Promise<void> {
    const expNombre = reserva.experiencia?.nombre ?? 'Experiencia'
    const fechaStr = new Date(reserva.fecha).toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const instruccionesRow = await this.prisma.siteConfig.findUnique({ where: { key: 'instrucciones_confirmacion' } })
    const instrucciones = instruccionesRow?.value
      ?? 'Por favor llega 15 minutos antes del horario acordado. Recuerda llevar ropa cómoda, protector solar y mucho entusiasmo.'

    const contactoRow = await this.prisma.siteConfig.findUnique({ where: { key: 'contacto_negocio' } })
    const contacto = contactoRow?.value ?? 'hola@vuelocarmesi.com'

    const html = this.email.templateReservaConfirmada({
      nombre: reserva.nombre,
      experiencia: expNombre,
      fecha: fechaStr,
      cantidadPersonas: String(reserva.cantidadPersonas),
      instrucciones,
      contacto,
    })
    await this.email.send(reserva.email, 'Tu reserva está confirmada — Vuelo Carmesí', html)
  }

  async enviarReservaCanceladaCliente(reserva: {
    id: string; nombre: string; email: string
    experiencia?: { nombre: string } | null
    fecha: Date; estado: string
  }, motivo?: string): Promise<void> {
    const expNombre = reserva.experiencia?.nombre ?? 'Experiencia'
    const fechaStr = new Date(reserva.fecha).toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const motivoHtml = motivo
      ? `<div style="margin:16px 0;padding:16px 20px;background:#FFF8F0;border-left:3px solid #872B13;border-radius:4px"><div style="color:#872B13;font-weight:bold;font-size:13px;margin-bottom:4px">Motivo</div><div style="color:#5C3317;font-size:14px">${motivo}</div></div>`
      : ''

    const html = this.email.templateReservaCancelada({
      nombre: reserva.nombre,
      experiencia: expNombre,
      fecha: fechaStr,
      motivoHtml,
      urlReserva: ADMIN_URL,
    })
    await this.email.send(reserva.email, 'Actualización sobre tu reserva — Vuelo Carmesí', html)
  }
```

- [ ] **Step 2: Verificar que los tests de Task 2 siguen en verde**

```bash
cd back && npx jest --testPathPattern=reservas.service --no-coverage
```

Esperado: PASS — 6 tests (sin cambios esperados, los mocks no dependen de la implementación real)

- [ ] **Step 3: Commit**

```bash
git add back/src/notificaciones/notificaciones.service.ts
git commit -m "feat(notificaciones): enviarReservaConfirmadaCliente + enviarReservaCanceladaCliente"
```

---

### Task 4: Frontend — api.ts + modal de cancelación

**Files:**
- Modify: `front/lib/admin/api.ts`
- Modify: `front/components/admin/ReservaDrawer.tsx`
- Modify: `front/app/admin/(protected)/reservas/page.tsx`

**Interfaces:**
- Consumes: `PATCH /reservas/:id/estado` con body `{ estado, motivo? }` (endpoint de Task 2)

- [ ] **Step 1: Actualizar updateEstadoReserva en api.ts**

En `front/lib/admin/api.ts`, reemplazar la función `updateEstadoReserva`:

```ts
export function updateEstadoReserva(id: string, estado: EstadoReserva, motivo?: string): Promise<AdminReserva> {
  return fetch(`${BASE}/reservas/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado, ...(motivo ? { motivo } : {}) }),
  }).then(checked)
}
```

- [ ] **Step 2: Actualizar ReservaDrawer para modal de cancelación**

Reemplazar el contenido completo de `front/components/admin/ReservaDrawer.tsx`:

```tsx
'use client'
import { useState } from 'react'
import type { AdminReserva, EstadoReserva } from '@/lib/admin/types'
import StatusBadge from './StatusBadge'
import { updateEstadoReserva } from '@/lib/admin/api'

export default function ReservaDrawer({
  reserva,
  onClose,
  onUpdated,
  experienciaNombre,
}: {
  reserva: AdminReserva
  onClose: () => void
  onUpdated: (r: AdminReserva) => void
  experienciaNombre: string
}) {
  const [saving, setSaving] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [motivo, setMotivo] = useState('')

  async function cambiarEstado(estado: EstadoReserva, motivoTexto?: string) {
    setSaving(true)
    const updated = await updateEstadoReserva(reserva.id, estado, motivoTexto)
    onUpdated(updated)
    setSaving(false)
  }

  async function confirmarCancelacion() {
    setShowCancelModal(false)
    await cambiarEstado('cancelada', motivo || undefined)
    setMotivo('')
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-drawer" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-drawer-header">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-gold)', marginBottom: 4 }}>
              Detalle de Reserva
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-cream)' }}>
              {reserva.nombre}
            </div>
            <div style={{ marginTop: 6 }}>
              <StatusBadge estado={reserva.estado} />
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,234,202,.7)', fontSize: 20, cursor: 'pointer', padding: 4 }}
          >✕</button>
        </div>

        {/* Body */}
        <div className="admin-drawer-body">
          <Field label="Experiencia">{experienciaNombre}</Field>
          <Field label="Fecha">{new Date(reserva.fecha).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Field>
          <Field label="Personas">{reserva.cantidadPersonas}</Field>
          <div style={{ height: 1, background: 'var(--admin-border)', margin: '16px 0' }} />
          <Field label="Teléfono">{reserva.telefono}</Field>
          <Field label="Email">{reserva.email}</Field>
          {reserva.notas && <Field label="Notas">{reserva.notas}</Field>}
        </div>

        {/* Footer */}
        <div className="admin-drawer-footer">
          {reserva.estado !== 'confirmada' && (
            <button
              className="btn-primary"
              disabled={saving}
              onClick={() => cambiarEstado('confirmada')}
            >
              {saving ? '…' : 'Confirmar'}
            </button>
          )}
          {reserva.estado !== 'cancelada' && (
            <button
              className="btn-ghost"
              disabled={saving}
              onClick={() => setShowCancelModal(true)}
            >
              Cancelar reserva
            </button>
          )}
        </div>
      </div>

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 12, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>
              Cancelar reserva de {reserva.nombre}
            </div>
            <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
              Se enviará un email al cliente notificando la cancelación.
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
              Motivo (opcional — se incluirá en el email)
            </label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Sin disponibilidad para esa fecha…"
              rows={3}
              style={{ width: '100%', borderRadius: 8, border: '1px solid var(--admin-border)', padding: '10px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>Volver</button>
              <button className="btn-ghost" onClick={confirmarCancelacion} disabled={saving}>
                {saving ? '…' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="admin-field-label">{label}</div>
      <div className="admin-field-value">{children}</div>
    </div>
  )
}
```

- [ ] **Step 3: Actualizar reservas/page.tsx para el modal en la tabla**

Reemplazar el contenido completo de `front/app/admin/(protected)/reservas/page.tsx`:

```tsx
'use client'
import { useState, useEffect, useMemo } from 'react'
import type { AdminReserva, EstadoReserva } from '@/lib/admin/types'
import { getReservas, updateEstadoReserva } from '@/lib/admin/api'
import StatusBadge from '@/components/admin/StatusBadge'
import ReservaDrawer from '@/components/admin/ReservaDrawer'

const FILTROS = ['todas', 'pendientes', 'confirmadas', 'canceladas'] as const
type Filtro = typeof FILTROS[number]

const FILTRO_ESTADO: Record<Filtro, EstadoReserva | null> = {
  todas: null, pendientes: 'pendiente', confirmadas: 'confirmada', canceladas: 'cancelada',
}

export default function ReservasPage() {
  const [reservas, setReservas] = useState<AdminReserva[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [selected, setSelected] = useState<AdminReserva | null>(null)
  const [changing, setChanging] = useState<string | null>(null)
  const [cancelModal, setCancelModal] = useState<{ id: string; nombre: string } | null>(null)
  const [cancelMotivo, setCancelMotivo] = useState('')

  useEffect(() => {
    getReservas().then(data => { setReservas(data); setLoading(false) })
  }, [])

  const lista = useMemo(() => {
    const estado = FILTRO_ESTADO[filtro]
    return estado ? reservas.filter(r => r.estado === estado) : reservas
  }, [reservas, filtro])

  function handleUpdated(updated: AdminReserva) {
    setReservas(prev => prev.map(r => r.id === updated.id ? updated : r))
    setSelected(prev => prev?.id === updated.id ? updated : prev)
  }

  async function cambiarEstadoInline(id: string, estado: EstadoReserva, motivo?: string) {
    setChanging(id)
    const updated = await updateEstadoReserva(id, estado, motivo)
    handleUpdated(updated)
    setChanging(null)
  }

  function handleSelectChange(reserva: AdminReserva, nuevoEstado: EstadoReserva) {
    if (nuevoEstado === 'cancelada') {
      setCancelModal({ id: reserva.id, nombre: reserva.nombre })
    } else {
      cambiarEstadoInline(reserva.id, nuevoEstado)
    }
  }

  async function confirmarCancelacionModal() {
    if (!cancelModal) return
    const motivo = cancelMotivo || undefined
    setCancelModal(null)
    setCancelMotivo('')
    await cambiarEstadoInline(cancelModal.id, 'cancelada', motivo)
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Reservas</div>
          <div className="admin-page-subtitle">{reservas.length} reservas en total</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="admin-pills" style={{ marginBottom: 20 }}>
        {FILTROS.map(f => (
          <button key={f} className={`admin-pill${filtro === f ? ' active' : ''}`} onClick={() => setFiltro(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>
      ) : lista.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: 48, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 14 }}>
          Sin reservas {filtro !== 'todas' ? `con estado "${filtro}"` : ''}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Visitante</th>
                <th>Experiencia</th>
                <th style={{ textAlign: 'center' }}>Personas</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(r => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(r.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{r.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{r.telefono}</div>
                  </td>
                  <td style={{ minWidth: 140, maxWidth: 200 }}>{r.experiencia?.nombre ?? r.experienciaId}</td>
                  <td style={{ textAlign: 'center' }}>{r.cantidadPersonas}</td>
                  <td><StatusBadge estado={r.estado} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <select
                        className="admin-select"
                        style={{ fontSize: 12, padding: '5px 8px', width: 'auto' }}
                        value={r.estado}
                        disabled={changing === r.id}
                        onChange={e => handleSelectChange(r, e.target.value as EstadoReserva)}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                      <button className="btn-secondary btn-sm" onClick={() => setSelected(r)}>Detalle</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ReservaDrawer
          reserva={selected}
          experienciaNombre={selected.experiencia?.nombre ?? selected.experienciaId}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Modal de cancelación desde la tabla */}
      {cancelModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => { setCancelModal(null); setCancelMotivo('') }}
        >
          <div
            style={{ background: '#fff', borderRadius: 12, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>
              Cancelar reserva de {cancelModal.nombre}
            </div>
            <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
              Se enviará un email al cliente notificando la cancelación.
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
              Motivo (opcional — se incluirá en el email)
            </label>
            <textarea
              value={cancelMotivo}
              onChange={e => setCancelMotivo(e.target.value)}
              placeholder="Ej: Sin disponibilidad para esa fecha…"
              rows={3}
              style={{ width: '100%', borderRadius: 8, border: '1px solid var(--admin-border)', padding: '10px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => { setCancelModal(null); setCancelMotivo('') }}>Volver</button>
              <button className="btn-ghost" onClick={confirmarCancelacionModal}>
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Verificar build del frontend**

```bash
cd front && npx tsc --noEmit
```

Esperado: sin errores de tipos

- [ ] **Step 5: Commit**

```bash
git add front/lib/admin/api.ts front/components/admin/ReservaDrawer.tsx "front/app/admin/(protected)/reservas/page.tsx"
git commit -m "feat(admin): modal de cancelación con motivo + endpoint /reservas/:id/estado"
```

---

## Prueba manual end-to-end

Una vez que el backend esté corriendo (`cd back && npm run start:dev`) y el frontend esté corriendo (`cd front && npm run dev`):

1. Ir a `/admin/reservas`
2. Cambiar el select de una reserva a **Confirmada** → debe cambiar el badge inmediatamente. Verificar que el cliente recibió el email de confirmación.
3. Cambiar el select de una reserva a **Cancelada** → debe aparecer el modal. Escribir un motivo, confirmar. Verificar que el cliente recibió el email con el motivo y el botón "Volver a reservar".
4. Intentar desde Postman `PATCH /reservas/:id/estado` con una reserva cancelada y body `{ "estado": "confirmada" }` → debe retornar 400 con mensaje descriptivo.
5. Verificar que `PATCH /reservas/:id` (sin `/estado`) sigue funcionando para editar datos de la reserva.

## SiteConfig keys opcionales

Para personalizar instrucciones y contacto desde el panel admin, crear estas claves en SiteConfig:

| Key | Descripción | Ejemplo |
|-----|-------------|---------|
| `instrucciones_confirmacion` | Texto de instrucciones para el email de confirmación | "Llega 15 min antes. Trae ropa cómoda y protector solar." |
| `contacto_negocio` | Contacto visible en el email de confirmación | "hola@vuelocarmesi.com · +57 320 000 0000" |

Si no existen, el sistema usa los fallbacks definidos en el código.
