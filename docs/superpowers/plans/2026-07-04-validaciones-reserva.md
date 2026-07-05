# Validación integral del formulario de reserva — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validación completa del flujo de reserva: reglas por campo en frontend (react-hook-form + Zod) y backend (class-validator), reglas de negocio en el servicio (experiencia, fecha, capacidad, duplicados con alerta al admin), honeypot y rate limiting.

**Architecture:** El frontend valida con un schema Zod parametrizado por capacidad (patrón ya existente en el checkout: `lib/cart/checkout-schema.ts` + `zodResolver`). El backend es la fuente de verdad: DTO endurecido + `ValidationPipe` estricto + reglas de negocio en `ReservasService.create` en orden fijo (honeypot → experiencia → fecha → capacidad → duplicado → crear). Las notificaciones de duplicado reutilizan el patrón email-admin + Telegram de `NotificacionesService`.

**Tech Stack:** NestJS 11 + class-validator/class-transformer + Prisma (back, tests con Jest). Next.js 16 + react-hook-form 7 + Zod 4 + @hookform/resolvers (front, tests con Vitest). Todas las dependencias del front ya están instaladas; el back necesita `@nestjs/throttler` y `@nestjs/mapped-types`.

**Spec:** `docs/superpowers/specs/2026-07-04-validaciones-reserva-design.md`

## Global Constraints

- Mensajes visibles al usuario en español colombiano (tuteo: "ingresa", "inténtalo" — NO voseo).
- Fecha de reserva: mínima = mañana (hoy + 1 día), máxima = hoy + 6 meses, calculadas en zona `America/Bogota`.
- Teléfono: regex `^\+?(?:[\s-]*\d){7,15}[\s-]*$` (7–15 dígitos, `+` opcional, espacios/guiones permitidos); se persiste normalizado sin espacios ni guiones.
- Notas: máximo 500 caracteres. Nombre: 3–100. Email: máx. 255.
- `estado` NO se acepta en el endpoint público: el servidor siempre crea `pendiente`.
- Honeypot: campo `website`; si viene con valor se responde éxito falso sin crear ni notificar.
- Rate limit en `POST /reservas`: 5 por hora por IP; global suave 60/min.
- Mensajes de commit sin tildes, estilo del repo: `feat(back): ...` / `feat(front): ...` / `test(back): ...`.
- Comandos del back se corren en `back/`; los del front en `front/`.
- No modificar el formulario de checkout ni el de contacto (fuera de alcance).

---

### Task 1: DTO endurecido + UpdateReservaDto + ValidationPipe estricto

**Files:**
- Modify: `back/src/reservas/dto/create-reserva.dto.ts`
- Create: `back/src/reservas/dto/update-reserva.dto.ts`
- Create: `back/src/reservas/dto/create-reserva.dto.spec.ts`
- Modify: `back/src/main.ts:8`
- Modify: `back/src/reservas/reservas.controller.ts:14`

**Interfaces:**
- Consumes: nada de tareas anteriores.
- Produces: `CreateReservaDto` con campos `experienciaId: string`, `fecha: string`, `cantidadPersonas: number`, `nombre: string`, `email: string`, `telefono: string`, `notas?: string`, `website?: string` (SIN `estado`). `UpdateReservaDto extends PartialType(CreateReservaDto)`. Las tareas 3–5 dependen de que `website` exista y `estado` no.

- [ ] **Step 1: Instalar @nestjs/mapped-types**

Run (en `back/`): `npm install @nestjs/mapped-types`
Expected: agregado a dependencies sin errores.

- [ ] **Step 2: Escribir tests del DTO (fallan)**

Crear `back/src/reservas/dto/create-reserva.dto.spec.ts`:

```ts
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CreateReservaDto } from './create-reserva.dto'

const base = {
  experienciaId: 'exp1',
  fecha: '2026-08-15',
  cantidadPersonas: 2,
  nombre: 'Ana García',
  email: 'ana@test.com',
  telefono: '+57 300 123-4567',
}

async function erroresDe(data: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(CreateReservaDto, data)
  const errors = await validate(dto)
  return errors.map(e => e.property)
}

describe('CreateReservaDto', () => {
  it('acepta un body válido', async () => {
    expect(await erroresDe(base)).toEqual([])
  })

  it('acepta notas y website opcionales', async () => {
    expect(await erroresDe({ ...base, notas: 'Sin gluten', website: '' })).toEqual([])
  })

  it('rechaza nombre corto, vacío o de solo espacios', async () => {
    expect(await erroresDe({ ...base, nombre: 'Al' })).toContain('nombre')
    expect(await erroresDe({ ...base, nombre: '   ' })).toContain('nombre')
    expect(await erroresDe({ ...base, nombre: 'x'.repeat(101) })).toContain('nombre')
  })

  it('hace trim del nombre antes de validar', async () => {
    const dto = plainToInstance(CreateReservaDto, { ...base, nombre: '  Ana García  ' })
    expect(await validate(dto)).toEqual([])
    expect(dto.nombre).toBe('Ana García')
  })

  it('rechaza emails inválidos o demasiado largos', async () => {
    expect(await erroresDe({ ...base, email: 'no-es-email' })).toContain('email')
    expect(await erroresDe({ ...base, email: `${'x'.repeat(250)}@test.com` })).toContain('email')
  })

  it('valida el teléfono: 7-15 dígitos con + opcional y separadores', async () => {
    expect(await erroresDe({ ...base, telefono: '3001234567' })).toEqual([])
    expect(await erroresDe({ ...base, telefono: '+1 212 555 0100' })).toEqual([])
    expect(await erroresDe({ ...base, telefono: '123456' })).toContain('telefono')       // 6 dígitos
    expect(await erroresDe({ ...base, telefono: '1'.repeat(16) })).toContain('telefono') // 16 dígitos
    expect(await erroresDe({ ...base, telefono: 'abc1234567' })).toContain('telefono')
  })

  it('rechaza cantidadPersonas decimal o menor a 1', async () => {
    expect(await erroresDe({ ...base, cantidadPersonas: 2.5 })).toContain('cantidadPersonas')
    expect(await erroresDe({ ...base, cantidadPersonas: 0 })).toContain('cantidadPersonas')
  })

  it('rechaza fecha que no sea ISO', async () => {
    expect(await erroresDe({ ...base, fecha: '15/08/2026' })).toContain('fecha')
  })

  it('rechaza notas de más de 500 caracteres', async () => {
    expect(await erroresDe({ ...base, notas: 'x'.repeat(501) })).toContain('notas')
  })

  it('rechaza estado como propiedad no permitida', async () => {
    // simula el ValidationPipe global (whitelist + forbidNonWhitelisted):
    // al quitar los decoradores de estado, pasa a ser propiedad desconocida
    const dto = plainToInstance(CreateReservaDto, { ...base, estado: 'confirmada' })
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true })
    expect(errors.map(e => e.property)).toContain('estado')
  })
})
```

- [ ] **Step 3: Correr tests y verificar que fallan**

Run (en `back/`): `npx jest reservas/dto --verbose`
Expected: FAIL — el DTO actual no tiene trim, ni @IsEmail, ni @Matches, ni @IsInt, y sí tiene `estado`.

- [ ] **Step 4: Reescribir el DTO**

Reemplazar `back/src/reservas/dto/create-reserva.dto.ts` completo:

```ts
import { Transform } from 'class-transformer'
import {
  IsDateString, IsEmail, IsInt, IsNotEmpty, IsOptional,
  IsString, Length, Matches, MaxLength, Min,
} from 'class-validator'

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value

export const TELEFONO_REGEX = /^\+?(?:[\s-]*\d){7,15}[\s-]*$/

export class CreateReservaDto {
  @IsString() @IsNotEmpty()
  experienciaId: string

  @IsDateString({}, { message: 'La fecha no es válida' })
  fecha: string

  @IsInt({ message: 'La cantidad de personas debe ser un número entero' })
  @Min(1, { message: 'Debe reservar para al menos 1 persona' })
  cantidadPersonas: number

  @Transform(trim)
  @IsString()
  @Length(3, 100, { message: 'El nombre debe tener entre 3 y 100 caracteres' })
  nombre: string

  @Transform(trim)
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(255, { message: 'El email no puede superar 255 caracteres' })
  email: string

  @Transform(trim)
  @Matches(TELEFONO_REGEX, { message: 'El teléfono debe tener entre 7 y 15 dígitos' })
  telefono: string

  @IsOptional() @IsString()
  @MaxLength(500, { message: 'Las notas no pueden superar 500 caracteres' })
  notas?: string

  // Honeypot anti-bots: los humanos nunca llenan este campo
  @IsOptional() @IsString()
  website?: string
}
```

Crear `back/src/reservas/dto/update-reserva.dto.ts`:

```ts
import { PartialType } from '@nestjs/mapped-types'
import { CreateReservaDto } from './create-reserva.dto'

export class UpdateReservaDto extends PartialType(CreateReservaDto) {}
```

- [ ] **Step 5: Endurecer el ValidationPipe y tipar el PATCH**

En `back/src/main.ts` reemplazar la línea 8:

```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}))
```

En `back/src/reservas/reservas.controller.ts`: importar `UpdateReservaDto` y cambiar la firma de `update`:

```ts
import { UpdateReservaDto } from './dto/update-reserva.dto'
// ...
@Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateReservaDto) { return this.service.update(id, dto) }
```

- [ ] **Step 6: Correr tests y build**

Run (en `back/`): `npx jest reservas/dto --verbose` → Expected: PASS (todos).
Run (en `back/`): `npm run build` → Expected: compila sin errores (si `reservas.service.ts` referencia `dto.estado` en `create`, eliminar esa referencia se hace en la Task 3; en el código actual `create` no usa `estado` explícitamente, así que compila).

- [ ] **Step 7: Commit**

```bash
git add back/src/reservas/dto back/src/main.ts back/src/reservas/reservas.controller.ts back/package.json back/package-lock.json
git commit -m "feat(back): endurecer validacion del DTO de reserva y ValidationPipe estricto"
```

---

### Task 2: Utilidad de rango de fechas de reserva (backend)

**Files:**
- Create: `back/src/reservas/fecha-reserva.util.ts`
- Create: `back/src/reservas/fecha-reserva.util.spec.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `hoyBogota(): string` (YYYY-MM-DD), `fechaMinimaReserva(): string` (mañana), `fechaMaximaReserva(): string` (hoy + 6 meses), `fechaReservaValida(fechaIso: string): boolean`, `sumarDias(iso: string, dias: number): string`. La Task 3 usa `fechaReservaValida`, `fechaMinimaReserva`, `fechaMaximaReserva` y `sumarDias`.

- [ ] **Step 1: Escribir tests (fallan)**

Crear `back/src/reservas/fecha-reserva.util.spec.ts`:

```ts
import {
  hoyBogota, fechaMinimaReserva, fechaMaximaReserva, fechaReservaValida, sumarDias,
} from './fecha-reserva.util'

describe('fecha-reserva.util', () => {
  beforeEach(() => {
    // Mediodía en Bogotá (UTC-5) para evitar ambigüedad de zona
    jest.useFakeTimers().setSystemTime(new Date('2026-07-04T12:00:00-05:00'))
  })
  afterEach(() => jest.useRealTimers())

  it('hoyBogota devuelve la fecha de Bogotá en formato ISO', () => {
    expect(hoyBogota()).toBe('2026-07-04')
  })

  it('la fecha mínima es mañana', () => {
    expect(fechaMinimaReserva()).toBe('2026-07-05')
  })

  it('la fecha máxima es hoy + 6 meses', () => {
    expect(fechaMaximaReserva()).toBe('2027-01-04')
  })

  it('usa el día de Bogotá aunque UTC ya esté en el día siguiente', () => {
    // 23:00 en Bogotá = 04:00 UTC del día siguiente
    jest.setSystemTime(new Date('2026-07-04T23:00:00-05:00'))
    expect(hoyBogota()).toBe('2026-07-04')
    expect(fechaMinimaReserva()).toBe('2026-07-05')
  })

  it('valida los límites del rango de forma inclusiva', () => {
    expect(fechaReservaValida('2026-07-04')).toBe(false) // hoy: no
    expect(fechaReservaValida('2026-07-05')).toBe(true)  // mañana: sí
    expect(fechaReservaValida('2027-01-04')).toBe(true)  // límite superior: sí
    expect(fechaReservaValida('2027-01-05')).toBe(false) // pasado el límite: no
    expect(fechaReservaValida('2026-01-01')).toBe(false) // pasado: no
  })

  it('acepta fecha ISO con hora y compara solo el día', () => {
    expect(fechaReservaValida('2026-07-05T10:00:00.000Z')).toBe(true)
  })

  it('sumarDias cruza fin de mes correctamente', () => {
    expect(sumarDias('2026-07-31', 1)).toBe('2026-08-01')
  })
})
```

- [ ] **Step 2: Correr tests y verificar que fallan**

Run (en `back/`): `npx jest fecha-reserva --verbose`
Expected: FAIL — "Cannot find module './fecha-reserva.util'".

- [ ] **Step 3: Implementar la utilidad**

Crear `back/src/reservas/fecha-reserva.util.ts`:

```ts
const TZ = 'America/Bogota'

export const DIAS_ANTELACION_MINIMA = 1
export const MESES_HORIZONTE_MAXIMO = 6

// 'en-CA' formatea como YYYY-MM-DD
export function hoyBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

export function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

function sumarMeses(iso: string, meses: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + meses)
  return d.toISOString().slice(0, 10)
}

export function fechaMinimaReserva(): string {
  return sumarDias(hoyBogota(), DIAS_ANTELACION_MINIMA)
}

export function fechaMaximaReserva(): string {
  return sumarMeses(hoyBogota(), MESES_HORIZONTE_MAXIMO)
}

export function fechaReservaValida(fechaIso: string): boolean {
  const dia = fechaIso.slice(0, 10)
  return dia >= fechaMinimaReserva() && dia <= fechaMaximaReserva()
}
```

- [ ] **Step 4: Correr tests y verificar que pasan**

Run (en `back/`): `npx jest fecha-reserva --verbose`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add back/src/reservas/fecha-reserva.util.ts back/src/reservas/fecha-reserva.util.spec.ts
git commit -m "feat(back): utilidad de rango de fechas de reserva en zona de Bogota"
```

---

### Task 3: Reglas de negocio en create: experiencia, fecha, capacidad, estado forzado, telefono normalizado

**Files:**
- Modify: `back/src/reservas/reservas.service.ts:33-45` (método `create`)
- Modify: `back/src/reservas/reservas.service.spec.ts` (mocks + nuevo describe)

**Interfaces:**
- Consumes: `CreateReservaDto` (Task 1, con `website?` y sin `estado`); `fechaReservaValida`, `fechaMinimaReserva`, `fechaMaximaReserva` de `./fecha-reserva.util` (Task 2).
- Produces: `ReservasService.create(dto)` que lanza `NotFoundException` (experiencia inexistente) y `BadRequestException` (archivada / fecha fuera de rango / capacidad excedida), fuerza `estado: 'pendiente'` y persiste `telefono` sin espacios ni guiones. Las Tasks 4 y 5 extienden este mismo método.

- [ ] **Step 1: Actualizar mocks y agregar tests (fallan)**

En `back/src/reservas/reservas.service.spec.ts`:

(a) Ampliar `mockPrisma` (líneas 7-15) agregando `findFirst` a `reserva` y el modelo `experiencia`:

```ts
const mockPrisma = {
  reserva: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  experiencia: {
    findUnique: jest.fn(),
  },
}
```

(b) Ampliar `mockNotificaciones` con el método que llegará en la Task 4 (por ahora solo el existente):

```ts
const mockNotificaciones = {
  enviarConfirmacionReserva: jest.fn().mockResolvedValue(undefined),
  enviarReservaConfirmadaCliente: jest.fn().mockResolvedValue(undefined),
  enviarReservaCanceladaCliente: jest.fn().mockResolvedValue(undefined),
}
```

(c) Agregar al final del archivo un nuevo `describe` (reutiliza `reservaBase`; nota: el `beforeEach` con la creación del módulo está dentro del describe existente, así que este nuevo describe necesita su propio setup):

```ts
describe('ReservasService.create', () => {
  let service: ReservasService

  const experienciaActiva = { id: 'exp1', nombre: 'Agroturismo', capacidad: 8, archivada: false }

  const dtoBase = {
    experienciaId: 'exp1',
    fecha: '2026-08-15',
    cantidadPersonas: 2,
    nombre: 'Ana García',
    email: 'ana@test.com',
    telefono: '+57 300 123-4567',
  }

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
    jest.useFakeTimers({ doNotFake: ['setImmediate'] }).setSystemTime(new Date('2026-07-04T12:00:00-05:00'))
    mockPrisma.experiencia.findUnique.mockResolvedValue(experienciaActiva)
    mockPrisma.reserva.findFirst.mockResolvedValue(null)
    mockPrisma.reserva.create.mockResolvedValue({ ...reservaBase, estado: 'pendiente' })
  })

  afterEach(() => jest.useRealTimers())

  it('lanza NotFoundException si la experiencia no existe', async () => {
    mockPrisma.experiencia.findUnique.mockResolvedValue(null)
    await expect(service.create(dtoBase)).rejects.toThrow(NotFoundException)
    expect(mockPrisma.reserva.create).not.toHaveBeenCalled()
  })

  it('lanza BadRequestException si la experiencia esta archivada', async () => {
    mockPrisma.experiencia.findUnique.mockResolvedValue({ ...experienciaActiva, archivada: true })
    await expect(service.create(dtoBase)).rejects.toThrow(BadRequestException)
  })

  it('rechaza reservar hoy o en el pasado', async () => {
    await expect(service.create({ ...dtoBase, fecha: '2026-07-04' })).rejects.toThrow(BadRequestException)
    await expect(service.create({ ...dtoBase, fecha: '2026-06-01' })).rejects.toThrow(BadRequestException)
  })

  it('acepta manana y el limite de 6 meses, rechaza un dia despues', async () => {
    await expect(service.create({ ...dtoBase, fecha: '2026-07-05' })).resolves.toBeDefined()
    await expect(service.create({ ...dtoBase, fecha: '2027-01-04' })).resolves.toBeDefined()
    await expect(service.create({ ...dtoBase, fecha: '2027-01-05' })).rejects.toThrow(BadRequestException)
  })

  it('rechaza cantidadPersonas mayor a la capacidad', async () => {
    await expect(service.create({ ...dtoBase, cantidadPersonas: 9 })).rejects.toThrow(BadRequestException)
    await expect(service.create({ ...dtoBase, cantidadPersonas: 8 })).resolves.toBeDefined()
  })

  it('crea con estado pendiente y telefono normalizado', async () => {
    await service.create(dtoBase)
    expect(mockPrisma.reserva.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        estado: 'pendiente',
        telefono: '+573001234567',
        fecha: new Date('2026-08-15'),
      }),
      include: { experiencia: { select: { id: true, nombre: true } } },
    })
  })

  it('dispara la notificacion de confirmacion al crear', async () => {
    await service.create(dtoBase)
    await new Promise(r => setImmediate(r))
    expect(mockNotificaciones.enviarConfirmacionReserva).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Correr tests y verificar que fallan**

Run (en `back/`): `npx jest reservas.service --verbose`
Expected: FAIL — el `create` actual no consulta experiencia, no valida fecha ni capacidad, no normaliza teléfono ni fija estado.

- [ ] **Step 3: Reescribir create en el servicio**

En `back/src/reservas/reservas.service.ts`, agregar imports:

```ts
import { fechaMinimaReserva, fechaMaximaReserva, fechaReservaValida } from './fecha-reserva.util'
```

Reemplazar el método `create` (líneas 33-45):

```ts
async create(dto: CreateReservaDto) {
  const experiencia = await this.prisma.experiencia.findUnique({
    where: { id: dto.experienciaId },
  })
  if (!experiencia) throw new NotFoundException('La experiencia no existe')
  if (experiencia.archivada) {
    throw new BadRequestException('Esta experiencia no está disponible actualmente')
  }

  if (!fechaReservaValida(dto.fecha)) {
    throw new BadRequestException(
      `La fecha debe estar entre ${fechaMinimaReserva()} y ${fechaMaximaReserva()}`
    )
  }

  if (dto.cantidadPersonas > experiencia.capacidad) {
    throw new BadRequestException(
      `Esta experiencia admite máximo ${experiencia.capacidad} personas por reserva`
    )
  }

  const { fecha, website: _website, telefono, ...rest } = dto
  const reserva = await this.prisma.reserva.create({
    data: {
      ...rest,
      telefono: telefono.replace(/[\s-]/g, ''),
      fecha: new Date(fecha),
      estado: 'pendiente',
    },
    include: { experiencia: { select: { id: true, nombre: true } } },
  })

  this.notificaciones
    .enviarConfirmacionReserva(reserva)
    .catch(err => this.logger.error('Notificación de reserva fallida', err))

  return reserva
}
```

- [ ] **Step 4: Correr tests y verificar que pasan**

Run (en `back/`): `npx jest reservas.service --verbose`
Expected: PASS — los tests nuevos y los existentes de `cambiarEstado`.

- [ ] **Step 5: Commit**

```bash
git add back/src/reservas/reservas.service.ts back/src/reservas/reservas.service.spec.ts
git commit -m "feat(back): reglas de negocio al crear reserva (experiencia, fecha, capacidad, estado)"
```

---

### Task 4: Duplicado → 409 + alerta al admin por email y Telegram

**Files:**
- Modify: `back/src/notificaciones/notificaciones.service.ts` (nuevo método al final de la clase)
- Modify: `back/src/notificaciones/notificaciones.service.spec.ts` (tests del método nuevo)
- Modify: `back/src/reservas/reservas.service.ts` (chequeo de duplicado en `create`)
- Modify: `back/src/reservas/reservas.service.spec.ts` (mock + tests)

**Interfaces:**
- Consumes: `create` de la Task 3; `sumarDias` de la Task 2; patrón existente `email.templateAlertaAdmin({ tipo, filas, adminUrl })`, `email.send(to, subject, html)`, `telegram.send(text)`.
- Produces: `NotificacionesService.enviarAlertaReservaDuplicada(datos: { nombre: string; email: string; telefono: string; experienciaNombre: string; fecha: string }): Promise<void>`. `create` lanza `ConflictException` (409) ante duplicado.

- [ ] **Step 1: Tests del método de notificación (fallan)**

En `back/src/notificaciones/notificaciones.service.spec.ts`, agregar al final (el archivo ya define `mockEmail`, `mockTelegram`, `mockPrisma` y el setup del módulo; reutilizarlos con un nuevo `describe` que siga el patrón de los existentes — copiar el `beforeEach` del describe superior si el setup es por-describe):

```ts
describe('enviarAlertaReservaDuplicada', () => {
  const datos = {
    nombre: 'Ana García',
    email: 'ana@test.com',
    telefono: '+573001234567',
    experienciaNombre: 'Agroturismo',
    fecha: '2026-08-15',
  }

  it('envia email al admin con el template de alerta', async () => {
    await service.enviarAlertaReservaDuplicada(datos)

    expect(mockEmail.templateAlertaAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: expect.stringContaining('reintentando') })
    )
    const filas = mockEmail.templateAlertaAdmin.mock.calls[0][0].filas
    expect(filas).toContain('Ana García')
    expect(filas).toContain('ana@test.com')
    expect(filas).toContain('+573001234567')
    expect(filas).toContain('Agroturismo')
    expect(mockEmail.send).toHaveBeenCalledWith(
      'admin@vuelocarmesi.com',
      expect.stringContaining('Reserva duplicada'),
      expect.any(String),
    )
  })

  it('envia alerta por Telegram con los datos del cliente', async () => {
    await service.enviarAlertaReservaDuplicada(datos)

    const msg = mockTelegram.send.mock.calls[0][0]
    expect(msg).toContain('Ana García')
    expect(msg).toContain('ana@test.com')
    expect(msg).toContain('+573001234567')
    expect(msg).toContain('Agroturismo')
  })
})
```

- [ ] **Step 2: Correr y verificar que fallan**

Run (en `back/`): `npx jest notificaciones.service --verbose`
Expected: FAIL — `enviarAlertaReservaDuplicada is not a function`.

- [ ] **Step 3: Implementar el método**

En `back/src/notificaciones/notificaciones.service.ts`, agregar al final de la clase (sigue el patrón de `enviarConfirmacionReserva`; `filaHtml`, `escapeHtml` y `ADMIN_URL` ya existen en el archivo):

```ts
async enviarAlertaReservaDuplicada(datos: {
  nombre: string; email: string; telefono: string
  experienciaNombre: string; fecha: string
}): Promise<void> {
  const fechaStr = new Date(`${datos.fecha.slice(0, 10)}T00:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const adminEmail = await this.getAdminEmail()
  if (adminEmail) {
    const filas = [
      filaHtml('Nombre', escapeHtml(datos.nombre)),
      filaHtml('Email', escapeHtml(datos.email)),
      filaHtml('Teléfono', escapeHtml(datos.telefono)),
      filaHtml('Experiencia', escapeHtml(datos.experienciaNombre)),
      filaHtml('Fecha solicitada', fechaStr),
      filaHtml('Situación', 'Ya tiene una reserva pendiente para esa experiencia y fecha. Conviene contactarlo.'),
    ].join('')
    const html = this.email.templateAlertaAdmin({
      tipo: '⚠️ Cliente reintentando reserva',
      filas,
      adminUrl: `${ADMIN_URL}/admin/reservas`,
    })
    await this.email.send(adminEmail, `[Reserva] Reserva duplicada: ${datos.nombre}`, html)
  }

  await this.telegram.send(
    `⚠️ *Cliente reintentando reserva*\nNombre: ${datos.nombre}\nEmail: ${datos.email}\nCelular: ${datos.telefono}\nExperiencia: ${datos.experienciaNombre}\nFecha: ${fechaStr}\nYa tiene una reserva pendiente — contactarlo.`,
  )
}
```

Run (en `back/`): `npx jest notificaciones.service --verbose` → Expected: PASS.

- [ ] **Step 4: Tests del chequeo de duplicado en el servicio de reservas (fallan)**

En `back/src/reservas/reservas.service.spec.ts`:

(a) Agregar a `mockNotificaciones`:

```ts
enviarAlertaReservaDuplicada: jest.fn().mockResolvedValue(undefined),
```

(b) Agregar import de `ConflictException` junto a los existentes de `@nestjs/common`.

(c) Dentro del `describe('ReservasService.create')`, agregar:

```ts
it('lanza ConflictException si hay una reserva pendiente con mismo email, experiencia y fecha', async () => {
  mockPrisma.reserva.findFirst.mockResolvedValue({ ...reservaBase, estado: 'pendiente' })

  await expect(service.create(dtoBase)).rejects.toThrow(ConflictException)
  expect(mockPrisma.reserva.create).not.toHaveBeenCalled()

  await new Promise(r => setImmediate(r))
  expect(mockNotificaciones.enviarAlertaReservaDuplicada).toHaveBeenCalledWith(
    expect.objectContaining({ email: 'ana@test.com', experienciaNombre: 'Agroturismo' })
  )
})

it('busca duplicados sin distinguir mayusculas en el email y solo en el dia solicitado', async () => {
  await service.create(dtoBase)
  expect(mockPrisma.reserva.findFirst).toHaveBeenCalledWith({
    where: {
      experienciaId: 'exp1',
      estado: 'pendiente',
      email: { equals: 'ana@test.com', mode: 'insensitive' },
      fecha: { gte: new Date('2026-08-15T00:00:00Z'), lt: new Date('2026-08-16T00:00:00Z') },
    },
  })
})

it('no consulta duplicados si la fecha ya es invalida', async () => {
  await expect(service.create({ ...dtoBase, fecha: '2026-07-04' })).rejects.toThrow(BadRequestException)
  expect(mockPrisma.reserva.findFirst).not.toHaveBeenCalled()
})
```

Run (en `back/`): `npx jest reservas.service --verbose` → Expected: FAIL (los 3 nuevos).

- [ ] **Step 5: Implementar el chequeo en create**

En `back/src/reservas/reservas.service.ts`:

(a) Imports: agregar `ConflictException` a los de `@nestjs/common` y `sumarDias` al import de `./fecha-reserva.util`.

(b) En `create`, entre el chequeo de capacidad y el `prisma.reserva.create`, insertar:

```ts
const dia = dto.fecha.slice(0, 10)
const duplicada = await this.prisma.reserva.findFirst({
  where: {
    experienciaId: dto.experienciaId,
    estado: 'pendiente',
    email: { equals: dto.email, mode: 'insensitive' },
    fecha: { gte: new Date(`${dia}T00:00:00Z`), lt: new Date(`${sumarDias(dia, 1)}T00:00:00Z`) },
  },
})
if (duplicada) {
  this.notificaciones
    .enviarAlertaReservaDuplicada({
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono,
      experienciaNombre: experiencia.nombre,
      fecha: dia,
    })
    .catch(err => this.logger.error('Alerta de reserva duplicada fallida', err))
  throw new ConflictException(
    'Ya tienes una reserva pendiente para esta experiencia en esa fecha. Te contactaremos pronto.'
  )
}
```

- [ ] **Step 6: Correr tests y verificar que pasan**

Run (en `back/`): `npx jest --verbose`
Expected: PASS — toda la suite del back.

- [ ] **Step 7: Commit**

```bash
git add back/src/reservas back/src/notificaciones
git commit -m "feat(back): rechazar reserva duplicada con alerta al admin por email y telegram"
```

---

### Task 5: Honeypot en el servicio

**Files:**
- Modify: `back/src/reservas/reservas.service.ts` (inicio de `create`)
- Modify: `back/src/reservas/reservas.service.spec.ts`

**Interfaces:**
- Consumes: campo `website?` del DTO (Task 1); `create` de las Tasks 3-4.
- Produces: si `dto.website` tiene contenido, `create` devuelve `{ id: 'ok', estado: 'pendiente' }` sin tocar la base ni notificar (el controller responde 201 normal; el bot no distingue).

- [ ] **Step 1: Tests (fallan)**

En el `describe('ReservasService.create')` de `back/src/reservas/reservas.service.spec.ts`:

```ts
it('honeypot con valor: responde exito falso sin crear ni notificar', async () => {
  const result = await service.create({ ...dtoBase, website: 'http://spam.example' })

  expect(result).toEqual({ id: 'ok', estado: 'pendiente' })
  expect(mockPrisma.experiencia.findUnique).not.toHaveBeenCalled()
  expect(mockPrisma.reserva.create).not.toHaveBeenCalled()
  await new Promise(r => setImmediate(r))
  expect(mockNotificaciones.enviarConfirmacionReserva).not.toHaveBeenCalled()
  expect(mockNotificaciones.enviarAlertaReservaDuplicada).not.toHaveBeenCalled()
})

it('honeypot vacio: crea normalmente', async () => {
  await expect(service.create({ ...dtoBase, website: '' })).resolves.toBeDefined()
  expect(mockPrisma.reserva.create).toHaveBeenCalled()
})
```

Run (en `back/`): `npx jest reservas.service --verbose` → Expected: FAIL.

- [ ] **Step 2: Implementar**

Al inicio de `create` en `back/src/reservas/reservas.service.ts` (primera instrucción del método):

```ts
if (dto.website) {
  this.logger.warn(`Honeypot activado: envío descartado (email: ${dto.email})`)
  return { id: 'ok', estado: 'pendiente' }
}
```

Run (en `back/`): `npx jest reservas.service --verbose` → Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add back/src/reservas/reservas.service.ts back/src/reservas/reservas.service.spec.ts
git commit -m "feat(back): honeypot anti-bots en creacion de reserva"
```

---

### Task 6: Rate limiting con @nestjs/throttler

**Files:**
- Modify: `back/src/app.module.ts`
- Modify: `back/src/reservas/reservas.controller.ts` (decorador en `create`)
- Modify: `back/package.json` (dependencia nueva)

**Interfaces:**
- Consumes: `AppModule` y `ReservasController` existentes.
- Produces: límite global 60 req/min por IP; `POST /reservas` limitado a 5 por hora por IP (respuesta 429, que el front mapea en la Task 8).

- [ ] **Step 1: Instalar**

Run (en `back/`): `npm install @nestjs/throttler`
Expected: instala la versión compatible con Nest 11 (v6.x).

- [ ] **Step 2: Registrar el módulo y el guard global**

En `back/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { PrismaService } from './prisma.service'
import { ExperienciasModule } from './experiencias/experiencias.module'
import { ReservasModule } from './reservas/reservas.module'
import { ProductosModule } from './productos/productos.module'
import { PedidosModule } from './pedidos/pedidos.module'
import { ContactoModule } from './contacto/contacto.module'
import { NotificacionesModule } from './notificaciones/notificaciones.module'
import { UploadsModule } from './uploads/uploads.module'
import { SiteConfigModule } from './site-config/site-config.module'

@Module({
  imports: [
    // límite global suave: 60 requests por minuto por IP
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 60 }] }),
    ExperienciasModule,
    ReservasModule,
    ProductosModule,
    PedidosModule,
    ContactoModule,
    NotificacionesModule,
    UploadsModule,
    SiteConfigModule,
  ],
  providers: [
    PrismaService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

- [ ] **Step 3: Límite estricto en el POST público**

En `back/src/reservas/reservas.controller.ts`, importar y decorar:

```ts
import { Throttle } from '@nestjs/throttler'
// ...
@Post()
@Throttle({ default: { limit: 5, ttl: 3_600_000 } }) // 5 reservas por hora por IP
create(@Body() dto: CreateReservaDto) { return this.service.create(dto) }
```

(Nota: al agregar el decorador, el método deja de caber en una línea; mantener el resto del controller con su formato compacto actual.)

- [ ] **Step 4: Verificar build y suite**

Run (en `back/`): `npm run build` → Expected: compila.
Run (en `back/`): `npx jest --verbose` → Expected: PASS (el guard es global vía DI, no afecta unit tests de servicios).

- [ ] **Step 5: Verificación manual del 429**

Con la base de datos y el back corriendo (`npm run start:dev` en `back/`), en PowerShell:

```powershell
1..6 | ForEach-Object {
  try {
    $r = Invoke-WebRequest -Uri http://localhost:3001/reservas -Method POST -ContentType 'application/json' -Body '{"experienciaId":"x"}'
    "$_ -> $($r.StatusCode)"
  } catch { "$_ -> $($_.Exception.Response.StatusCode.value__)" }
}
```

Expected: las primeras 5 responden 400/404 (validación) y la 6ª responde **429**.

- [ ] **Step 6: Commit**

```bash
git add back/src/app.module.ts back/src/reservas/reservas.controller.ts back/package.json back/package-lock.json
git commit -m "feat(back): rate limiting global y estricto en creacion de reservas"
```

---

### Task 7: Schema Zod del formulario de reserva (frontend)

**Files:**
- Create: `front/lib/booking/reserva-schema.ts`
- Create: `front/lib/booking/reserva-schema.test.ts`

**Interfaces:**
- Consumes: nada del front; espeja las reglas del back (Tasks 1-2).
- Produces: `crearReservaSchema(capacidad: number)` (schema Zod), `type ReservaFormValues = { nombre: string; telefono: string; email: string; fecha: string; cantidadPersonas: string; notas: string; website: string }`, `fechaMinimaReserva(): string`, `fechaMaximaReserva(): string`, `NOTAS_MAX = 500`. La Task 8 consume todo esto.

Nota de convención: se usa `lib/booking/` (espejo de `lib/cart/checkout-schema.ts`) en lugar del `lib/schemas/` que menciona el spec — misma pieza, ubicación consistente con el codebase.

- [ ] **Step 1: Escribir tests (fallan)**

Crear `front/lib/booking/reserva-schema.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  crearReservaSchema, fechaMinimaReserva, fechaMaximaReserva, NOTAS_MAX,
} from './reserva-schema'

const schema = crearReservaSchema(8)

const VALID = {
  nombre: 'Ana García',
  telefono: '+57 300 123 4567',
  email: 'ana@example.com',
  fecha: '2026-08-15',
  cantidadPersonas: '2',
  notas: '',
  website: '',
}

function errorDe(data: Record<string, string>, campo: string): string | undefined {
  const r = schema.safeParse(data)
  if (r.success) return undefined
  return r.error.issues.find(i => i.path[0] === campo)?.message
}

describe('crearReservaSchema', () => {
  beforeEach(() => {
    // Mediodía en Bogotá (UTC-5)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-04T12:00:00-05:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('acepta datos válidos', () => {
    expect(schema.safeParse(VALID).success).toBe(true)
  })

  it('valida el nombre: 3-100 caracteres, con trim', () => {
    expect(errorDe({ ...VALID, nombre: 'Al' }, 'nombre')).toBeDefined()
    expect(errorDe({ ...VALID, nombre: '  ' }, 'nombre')).toBeDefined()
    expect(errorDe({ ...VALID, nombre: 'x'.repeat(101) }, 'nombre')).toBeDefined()
    expect(errorDe({ ...VALID, nombre: '  Ana  ' }, 'nombre')).toBeUndefined()
  })

  it('valida el teléfono: 7-15 dígitos, + opcional, separadores permitidos', () => {
    expect(errorDe({ ...VALID, telefono: '3001234567' }, 'telefono')).toBeUndefined()
    expect(errorDe({ ...VALID, telefono: '+1 212-555-0100' }, 'telefono')).toBeUndefined()
    expect(errorDe({ ...VALID, telefono: '123456' }, 'telefono')).toBeDefined()
    expect(errorDe({ ...VALID, telefono: '1'.repeat(16) }, 'telefono')).toBeDefined()
    expect(errorDe({ ...VALID, telefono: 'abc' }, 'telefono')).toBeDefined()
  })

  it('valida el email', () => {
    expect(errorDe({ ...VALID, email: 'no-es-email' }, 'email')).toBeDefined()
    expect(errorDe({ ...VALID, email: `${'x'.repeat(250)}@x.com` }, 'email')).toBeDefined()
  })

  it('rechaza fecha hoy, en el pasado o a más de 6 meses', () => {
    expect(errorDe({ ...VALID, fecha: '2026-07-04' }, 'fecha')).toBeDefined()   // hoy
    expect(errorDe({ ...VALID, fecha: '2026-01-01' }, 'fecha')).toBeDefined()   // pasado
    expect(errorDe({ ...VALID, fecha: '2027-01-05' }, 'fecha')).toBeDefined()   // > 6 meses
    expect(errorDe({ ...VALID, fecha: '2026-07-05' }, 'fecha')).toBeUndefined() // mañana
    expect(errorDe({ ...VALID, fecha: '2027-01-04' }, 'fecha')).toBeUndefined() // límite
    expect(errorDe({ ...VALID, fecha: '' }, 'fecha')).toBeDefined()
  })

  it('valida cantidadPersonas contra la capacidad', () => {
    expect(errorDe({ ...VALID, cantidadPersonas: '8' }, 'cantidadPersonas')).toBeUndefined()
    expect(errorDe({ ...VALID, cantidadPersonas: '9' }, 'cantidadPersonas')).toBeDefined()
    expect(errorDe({ ...VALID, cantidadPersonas: '0' }, 'cantidadPersonas')).toBeDefined()
    expect(errorDe({ ...VALID, cantidadPersonas: '2.5' }, 'cantidadPersonas')).toBeDefined()
  })

  it('limita las notas a NOTAS_MAX', () => {
    expect(errorDe({ ...VALID, notas: 'x'.repeat(NOTAS_MAX) }, 'notas')).toBeUndefined()
    expect(errorDe({ ...VALID, notas: 'x'.repeat(NOTAS_MAX + 1) }, 'notas')).toBeDefined()
  })

  it('el honeypot website no se valida (los bots pueden llenarlo)', () => {
    expect(schema.safeParse({ ...VALID, website: 'http://spam' }).success).toBe(true)
  })

  it('fechaMinimaReserva y fechaMaximaReserva usan el día de Bogotá', () => {
    expect(fechaMinimaReserva()).toBe('2026-07-05')
    expect(fechaMaximaReserva()).toBe('2027-01-04')
    // 23:00 en Bogotá = 04:00 UTC del día siguiente
    vi.setSystemTime(new Date('2026-07-04T23:00:00-05:00'))
    expect(fechaMinimaReserva()).toBe('2026-07-05')
  })
})
```

- [ ] **Step 2: Correr y verificar que fallan**

Run (en `front/`): `npx vitest run lib/booking`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar el schema**

Crear `front/lib/booking/reserva-schema.ts`:

```ts
import { z } from 'zod'

const TZ = 'America/Bogota'
const DIAS_ANTELACION_MINIMA = 1
const MESES_HORIZONTE_MAXIMO = 6

export const NOTAS_MAX = 500
export const TELEFONO_REGEX = /^\+?(?:[\s-]*\d){7,15}[\s-]*$/

// 'en-CA' formatea como YYYY-MM-DD
function hoyBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

function sumarMeses(iso: string, meses: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + meses)
  return d.toISOString().slice(0, 10)
}

export function fechaMinimaReserva(): string {
  return sumarDias(hoyBogota(), DIAS_ANTELACION_MINIMA)
}

export function fechaMaximaReserva(): string {
  return sumarMeses(hoyBogota(), MESES_HORIZONTE_MAXIMO)
}

export function crearReservaSchema(capacidad: number) {
  return z.object({
    nombre: z.string().trim()
      .min(3, 'Ingresa tu nombre completo (mínimo 3 caracteres)')
      .max(100, 'El nombre no puede superar 100 caracteres'),
    telefono: z.string().trim()
      .regex(TELEFONO_REGEX, 'Ingresa un teléfono válido (7 a 15 dígitos)'),
    email: z.string().trim()
      .max(255, 'El email no puede superar 255 caracteres')
      .email('Ingresa un email válido'),
    fecha: z.string()
      .min(1, 'Selecciona una fecha')
      .refine(f => f >= fechaMinimaReserva(), 'Reserva con al menos un día de anticipación')
      .refine(f => f <= fechaMaximaReserva(), 'Solo recibimos reservas hasta 6 meses de anticipación'),
    cantidadPersonas: z.string().refine(v => {
      const n = Number(v)
      return Number.isInteger(n) && n >= 1 && n <= capacidad
    }, `Esta experiencia admite entre 1 y ${capacidad} personas`),
    notas: z.string().max(NOTAS_MAX, `Máximo ${NOTAS_MAX} caracteres`),
    website: z.string(), // honeypot — sin validación a propósito
  })
}

export type ReservaFormValues = z.infer<ReturnType<typeof crearReservaSchema>>
```

- [ ] **Step 4: Correr tests y verificar que pasan**

Run (en `front/`): `npx vitest run lib/booking`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add front/lib/booking
git commit -m "feat(front): schema zod de validacion del formulario de reserva"
```

---

### Task 8: Reescribir ReservaForm con react-hook-form + errores por campo

**Files:**
- Modify: `front/components/booking/ReservaForm.tsx` (reescritura completa)

**Interfaces:**
- Consumes: `crearReservaSchema`, `ReservaFormValues`, `fechaMinimaReserva`, `fechaMaximaReserva`, `NOTAS_MAX` de `@/lib/booking/reserva-schema` (Task 7). Backend con 409/429/400 (Tasks 4-6). Patrón de referencia: `front/app/(public)/(shop)/checkout/page.tsx`.
- Produces: formulario con validación por campo (blur + revalidación), honeypot, contador de notas y mapeo de errores HTTP. Mantiene la prop actual `{ experiencia: Experiencia }`.

- [ ] **Step 1: Reescribir el componente**

Reemplazar `front/components/booking/ReservaForm.tsx` completo (conserva la identidad visual actual: `inputStyle`, `Field`, chevron del select, botón y textos):

```tsx
'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Experiencia } from '@/lib/types'
import {
  crearReservaSchema, fechaMinimaReserva, fechaMaximaReserva,
  NOTAS_MAX, type ReservaFormValues,
} from '@/lib/booking/reserva-schema'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '4px',
  border: '1.5px solid rgba(135,43,19,.4)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '16px',
  color: 'var(--color-brown)',
  backgroundColor: 'var(--color-cream)',
  outline: 'none',
}

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  border: '1.5px solid var(--color-crimson)',
}

function Field({
  label,
  required,
  error,
  errorId,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  errorId?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '14px',
          color: 'var(--color-brown)',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--color-crimson)' }}> *</span>}
      </label>
      {children}
      {error && (
        <span
          id={errorId}
          role="alert"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-crimson)',
          }}
        >
          {error}
        </span>
      )}
    </div>
  )
}

export default function ReservaForm({ experiencia }: { experiencia: Experiencia }) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState('')

  const schema = useMemo(() => crearReservaSchema(experiencia.capacidad), [experiencia.capacidad])
  const {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting },
  } = useForm<ReservaFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      nombre: '', telefono: '', email: '', fecha: '',
      cantidadPersonas: '1', notas: '', website: '',
    },
  })

  const notas = watch('notas')

  const onSubmit = async (data: ReservaFormValues) => {
    setSubmitError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          cantidadPersonas: Number(data.cantidadPersonas),
          notas: data.notas || undefined,
          experienciaId: experiencia.id,
        }),
      })
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error('Ya tienes una reserva pendiente para esta experiencia en esa fecha. Te contactaremos pronto.')
        }
        if (res.status === 429) {
          throw new Error('Has enviado demasiadas solicitudes. Inténtalo de nuevo más tarde.')
        }
        const body = await res.json().catch(() => ({}))
        const message = Array.isArray(body?.message) ? body.message.join('. ') : body?.message
        throw new Error(message || 'Hubo un problema al enviar tu reserva. Inténtalo de nuevo o escríbenos directamente.')
      }
      router.push('/reservar/confirmacion')
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : 'Hubo un problema al enviar tu reserva. Inténtalo de nuevo o escríbenos directamente.'
      )
    }
  }

  const personasOpts = Array.from({ length: experiencia.capacidad }, (_, i) => i + 1)

  const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23872b13' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Honeypot anti-bots: invisible para humanos */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
        {...register('website')}
      />

      {/* Fila 1: Nombre | Teléfono */}
      <div className="form-row-2">
        <Field label="Nombre completo" required error={errors.nombre?.message} errorId="err-nombre">
          <input
            type="text"
            placeholder="Tu nombre"
            aria-invalid={!!errors.nombre}
            aria-describedby={errors.nombre ? 'err-nombre' : undefined}
            style={errors.nombre ? inputErrorStyle : inputStyle}
            {...register('nombre')}
          />
        </Field>
        <Field label="Teléfono" required error={errors.telefono?.message} errorId="err-telefono">
          <input
            type="tel"
            placeholder="+57 300 000 0000"
            aria-invalid={!!errors.telefono}
            aria-describedby={errors.telefono ? 'err-telefono' : undefined}
            style={errors.telefono ? inputErrorStyle : inputStyle}
            {...register('telefono')}
          />
        </Field>
      </div>

      {/* Fila 2: Email */}
      <Field label="Email" required error={errors.email?.message} errorId="err-email">
        <input
          type="email"
          placeholder="tu@email.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'err-email' : undefined}
          style={errors.email ? inputErrorStyle : inputStyle}
          {...register('email')}
        />
      </Field>

      {/* Fila 3: Fecha | Personas */}
      <div className="form-row-2">
        <Field label="Fecha deseada" required error={errors.fecha?.message} errorId="err-fecha">
          <input
            type="date"
            min={fechaMinimaReserva()}
            max={fechaMaximaReserva()}
            aria-invalid={!!errors.fecha}
            aria-describedby={errors.fecha ? 'err-fecha' : undefined}
            style={errors.fecha ? inputErrorStyle : inputStyle}
            {...register('fecha')}
          />
        </Field>
        <Field label="Cantidad de personas" required error={errors.cantidadPersonas?.message} errorId="err-personas">
          <select
            aria-invalid={!!errors.cantidadPersonas}
            aria-describedby={errors.cantidadPersonas ? 'err-personas' : undefined}
            style={{
              ...(errors.cantidadPersonas ? inputErrorStyle : inputStyle),
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: chevronSvg,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px',
              cursor: 'pointer',
            }}
            {...register('cantidadPersonas')}
          >
            {personasOpts.map(n => (
              <option key={n} value={String(n)}>
                {n} persona{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Comentarios */}
      <Field label="Comentarios adicionales" error={errors.notas?.message} errorId="err-notas">
        <textarea
          placeholder="¿Alguna consulta o necesidad especial?"
          rows={4}
          maxLength={NOTAS_MAX}
          aria-invalid={!!errors.notas}
          aria-describedby={errors.notas ? 'err-notas' : undefined}
          style={{ ...(errors.notas ? inputErrorStyle : inputStyle), minHeight: '120px', resize: 'vertical' }}
          {...register('notas')}
        />
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'var(--color-brown)',
            opacity: 0.6,
            alignSelf: 'flex-end',
          }}
        >
          {(notas ?? '').length}/{NOTAS_MAX}
        </span>
      </Field>

      {/* Error de envío */}
      {submitError && (
        <p role="alert" style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--color-crimson)',
          backgroundColor: 'rgba(213,19,18,.08)',
          border: '1px solid rgba(213,19,18,.3)',
          borderRadius: '6px',
          padding: '12px 16px',
          margin: 0,
        }}>
          {submitError}
        </p>
      )}

      {/* Submit */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '18px 40px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isSubmitting ? 'rgba(213,19,18,.6)' : 'var(--color-crimson)',
            color: 'var(--color-cream)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '18px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {isSubmitting ? 'Procesando...' : 'Confirmar reserva'}
        </button>
        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'var(--color-brown)',
            opacity: 0.6,
          }}
        >
          Te contactaremos para confirmar disponibilidad
        </p>
      </div>

    </form>
  )
}
```

- [ ] **Step 2: Verificar tipos y build**

Run (en `front/`): `npx tsc --noEmit` → Expected: sin errores.
Run (en `front/`): `npm run build` → Expected: build exitoso.

- [ ] **Step 3: Verificación manual del flujo**

Con back (`npm run start:dev` en `back/`) y front (`npm run dev` en `front/`) corriendo, abrir `http://localhost:3000/reservar/<slug-de-una-experiencia>`:

1. Tocar el campo Nombre, escribir "Al" y salir del campo → aparece el error de mínimo 3 caracteres bajo el input, borde rojo.
2. Corregir a "Ana García" → el error desaparece al escribir (revalidación en change).
3. El input de fecha no permite elegir hoy ni fechas a más de 6 meses (atributos min/max) y, si se fuerza, muestra el error de Zod.
4. Escribir en notas → el contador n/500 avanza.
5. Enviar un formulario válido → redirige a `/reservar/confirmacion` y llega la notificación.
6. Enviar la misma reserva otra vez → mensaje de duplicado ("Ya tienes una reserva pendiente…") y alerta de duplicado en Telegram/email del admin.

- [ ] **Step 4: Commit**

```bash
git add front/components/booking/ReservaForm.tsx
git commit -m "feat(front): validacion por campo con react-hook-form y zod en formulario de reserva"
```

---

### Task 9: Verificación final de suites y builds

**Files:** ninguno nuevo — solo verificación.

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: evidencia de que ambas suites y builds pasan.

- [ ] **Step 1: Suite completa del back**

Run (en `back/`): `npx jest --verbose`
Expected: PASS — DTO, fecha-util, reservas.service (create + cambiarEstado), notificaciones.service y el resto de specs existentes.

- [ ] **Step 2: Suite completa del front**

Run (en `front/`): `npm test`
Expected: PASS — reserva-schema, checkout-schema y store.

- [ ] **Step 3: Builds**

Run (en `back/`): `npm run build` → Expected: OK.
Run (en `front/`): `npm run build` → Expected: OK.

- [ ] **Step 4: Lint**

Run (en `back/`): `npm run lint` → Expected: sin errores nuevos.
Run (en `front/`): `npm run lint` → Expected: sin errores nuevos.

- [ ] **Step 5: Commit final (si lint/format tocó archivos)**

```bash
git add -A
git commit -m "chore: ajustes de lint tras validaciones de reserva"
```

(Omitir si no hay cambios.)
