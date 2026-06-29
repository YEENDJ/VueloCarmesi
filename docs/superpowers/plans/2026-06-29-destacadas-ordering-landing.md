# Destacadas: Ordenamiento y Landing con Datos Reales — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que el flag `destacada` ordene la vista pública de experiencias y alimente la landing page con datos reales de la API.

**Architecture:** El backend expone un query param `?destacadas=true` en `GET /experiencias` y cambia el `orderBy` para que las destacadas siempre aparezcan primero. El frontend agrega un helper `getExperienciasDestacadas()` que llama a ese endpoint, y la landing page lo consume en lugar del array hardcodeado.

**Tech Stack:** NestJS + Prisma (backend), Next.js 15 App Router con server components (frontend), Jest (tests backend).

## Global Constraints

- Tests backend: `npm test` desde `back/`, patrón del spec en `back/src/reservas/reservas.service.spec.ts`
- Commits frecuentes, en español, con prefijo `feat:` o `test:`
- No modificar comportamiento del admin (sigue usando `GET /experiencias` sin param)
- La landing no rompe si no hay experiencias destacadas (render condicional de la sección)

---

### Task 1: Backend — `findAll` con ordenamiento y filtro por destacada

**Files:**
- Create: `back/src/experiencias/experiencias.service.spec.ts`
- Modify: `back/src/experiencias/experiencias.service.ts:9-11`
- Modify: `back/src/experiencias/experiencias.controller.ts:1,9`

**Interfaces:**
- Produces: `ExperienciasService.findAll(soloDestacadas?: boolean): Promise<Experiencia[]>`
- Produces: `GET /experiencias?destacadas=true` → solo experiencias con `destacada: true`, orden `destacada desc, createdAt desc`
- Produces: `GET /experiencias` → todas las experiencias, orden `destacada desc, createdAt desc`

- [ ] **Step 1: Escribir el test que falla**

Crear `back/src/experiencias/experiencias.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing'
import { ExperienciasService } from './experiencias.service'
import { PrismaService } from '../prisma.service'

const mockPrisma = {
  experiencia: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

describe('ExperienciasService.findAll', () => {
  let service: ExperienciasService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExperienciasService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get(ExperienciasService)
    jest.clearAllMocks()
  })

  it('ordena destacadas primero cuando no hay filtro', async () => {
    mockPrisma.experiencia.findMany.mockResolvedValue([])
    await service.findAll()
    expect(mockPrisma.experiencia.findMany).toHaveBeenCalledWith({
      orderBy: [{ destacada: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('filtra solo destacadas cuando soloDestacadas es true', async () => {
    mockPrisma.experiencia.findMany.mockResolvedValue([])
    await service.findAll(true)
    expect(mockPrisma.experiencia.findMany).toHaveBeenCalledWith({
      where: { destacada: true },
      orderBy: [{ destacada: 'desc' }, { createdAt: 'desc' }],
    })
  })
})
```

- [ ] **Step 2: Correr el test para verificar que falla**

```bash
cd back && npx jest experiencias.service --no-coverage
```

Esperado: FAIL — `findAll is not a function` o mismatch en el `orderBy`.

- [ ] **Step 3: Implementar el cambio en el servicio**

Reemplazar `findAll()` en `back/src/experiencias/experiencias.service.ts`:

```typescript
findAll(soloDestacadas = false) {
  return this.prisma.experiencia.findMany({
    ...(soloDestacadas ? { where: { destacada: true } } : {}),
    orderBy: [{ destacada: 'desc' }, { createdAt: 'desc' }],
  })
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

```bash
cd back && npx jest experiencias.service --no-coverage
```

Esperado: PASS — 2 tests pasando.

- [ ] **Step 5: Actualizar el controller para aceptar el query param**

En `back/src/experiencias/experiencias.controller.ts`, agregar `Query` al import y modificar `findAll`:

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { ExperienciasService } from './experiencias.service'
import { CreateExperienciaDto } from './dto/create-experiencia.dto'

@Controller('experiencias')
export class ExperienciasController {
  constructor(private readonly service: ExperienciasService) {}

  @Get()              findAll(@Query('destacadas') destacadas?: string)                            { return this.service.findAll(destacadas === 'true') }
  @Get('slug/:slug')  findBySlug(@Param('slug') slug: string)                                     { return this.service.findBySlug(slug) }
  @Get(':id')         findOne(@Param('id') id: string)                                            { return this.service.findById(id) }
  @Post()             create(@Body() dto: CreateExperienciaDto)                                   { return this.service.create(dto) }
  @Patch(':id')       update(@Param('id') id: string, @Body() dto: Partial<CreateExperienciaDto>) { return this.service.update(id, dto) }
  @Delete(':id')      remove(@Param('id') id: string)                                             { return this.service.remove(id) }
}
```

- [ ] **Step 6: Verificar que el build compila**

```bash
cd back && npm run build 2>&1 | tail -5
```

Esperado: sin errores de TypeScript.

- [ ] **Step 7: Commit**

```bash
git add back/src/experiencias/experiencias.service.spec.ts back/src/experiencias/experiencias.service.ts back/src/experiencias/experiencias.controller.ts
git commit -m "feat: findAll ordena por destacada desc + acepta ?destacadas=true"
```

---

### Task 2: Frontend helper `getExperienciasDestacadas`

**Files:**
- Modify: `front/lib/api/experiencias.ts` (agregar función al final del archivo)

**Interfaces:**
- Consumes: `GET /experiencias?destacadas=true` (Task 1)
- Produces: `getExperienciasDestacadas(): Promise<Experiencia[]>` — devuelve las destacadas; en error, fallback a las destacadas del mock

- [ ] **Step 1: Agregar la función al helper**

En `front/lib/api/experiencias.ts`, agregar al final del archivo (después de `getExperienciaBySlug`):

```typescript
export async function getExperienciasDestacadas(): Promise<Experiencia[]> {
  try {
    const res = await fetch(`${BASE}/experiencias?destacadas=true`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return MOCK_EXPERIENCIAS.filter(e => e.destacada)
  }
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd front && npx tsc --noEmit 2>&1 | grep experiencias
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add front/lib/api/experiencias.ts
git commit -m "feat: getExperienciasDestacadas — helper para landing"
```

---

### Task 3: Landing page con datos reales de la API

**Files:**
- Modify: `front/app/(public)/(landing)/page.tsx`

**Interfaces:**
- Consumes: `getExperienciasDestacadas(): Promise<Experiencia[]>` (Task 2)
- El tipo `Experiencia` tiene: `slug`, `nombre`, `descripcion`, `duracion`, `precio` (number)

- [ ] **Step 1: Reemplazar el array hardcodeado por la llamada a la API**

Reemplazar `front/app/(public)/(landing)/page.tsx` completo:

```typescript
import Hero from '@/components/layout/Hero'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import SobreNosotros from '@/components/secciones/SobreNosotros'
import { getSiteConfig } from '@/lib/api/site-config'
import { getExperienciasDestacadas } from '@/lib/api/experiencias'

export default async function HomePage() {
  const [config, destacadas] = await Promise.all([
    getSiteConfig(),
    getExperienciasDestacadas(),
  ])
  const preview = destacadas.slice(0, 3)

  return (
    <>
      <Hero
        titulo="El sabor maduro de la tierra"
        subtitulo="Cosechamos, fermentamos y catamos junto a vos. Conocé el cacao desde su raíz, en una finca que respira selva."
        ctaTexto="Reservá tu experiencia"
        ctaHref="/experiencias"
        imagen={config.hero_image || undefined}
      />

      {preview.length > 0 && (
        <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: 'var(--color-brown)' }}>
            Nuestras Experiencias
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {preview.map((exp) => (
              <Card key={exp.slug}>
                <div style={{ height: '200px', backgroundColor: 'var(--color-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '3rem' }}>🍫</span>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>{exp.nombre}</h3>
                  <p style={{ opacity: 0.8, marginBottom: '1rem', fontSize: '0.95rem' }}>{exp.descripcion}</p>
                  <p style={{ fontWeight: 700, color: 'var(--color-crimson)', marginBottom: '1rem' }}>
                    ${exp.precio.toLocaleString('es-CO')} — {exp.duracion}
                  </p>
                  <Button href={`/experiencias/${exp.slug}`} variant="outline">Ver detalle</Button>
                </div>
              </Card>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Button href="/experiencias">Ver todas las experiencias</Button>
          </div>
        </section>
      )}

      <SobreNosotros imagen={config.about_image || undefined} />

      <section style={{ padding: '5rem 2rem', textAlign: 'center', backgroundColor: 'var(--color-cream)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-brown)' }}>¿Listo para vivir la experiencia?</h2>
        <Button href="/experiencias" variant="primary">Reservar ahora</Button>
      </section>
    </>
  )
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd front && npx tsc --noEmit 2>&1 | grep landing
```

Esperado: sin errores.

- [ ] **Step 3: Verificar que el build de Next.js compila**

```bash
cd front && npm run build 2>&1 | tail -10
```

Esperado: sin errores. Si hay errores de ESLint no bloqueantes (warnings de `react/no-unescaped-entities`), son aceptables.

- [ ] **Step 4: Commit**

```bash
git add front/app/"(public)"/"(landing)"/page.tsx
git commit -m "feat: landing consume API de destacadas (reemplaza datos hardcodeados)"
```
