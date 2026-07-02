# Plan de Implementación: Operación sin Fricción

> **Para agentes:** SKILL REQUERIDA: Usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para ejecutar este plan tarea por tarea. Los pasos usan sintaxis checkbox (`- [ ]`) para rastreo.

**Objetivo:** Completar los servicios que faltan para que Vuelo Carmesí opere de forma autónoma: formulario de contacto funcional, notificaciones por email + Telegram, subida de imágenes vía Cloudinary, y panel de configuración del sitio.

**Arquitectura:** Módulo `NotificacionesModule` centralizado en NestJS que encapsula `EmailService` (Resend) + `TelegramService` (fetch nativo). `UploadsModule` maneja subida a Cloudinary. `SiteConfigModule` provee un key-value store en BD. Todos los módulos se registran en `AppModule`. Las notificaciones siempre se llaman con fire-and-forget para que nunca bloqueen la operación de negocio.

**Stack:** NestJS 11, Prisma 7, Next.js 14 (App Router), Resend SDK, Cloudinary SDK v2, Telegram Bot API (fetch nativo).

## Restricciones globales

- Todas las respuestas de texto al usuario en **español**
- Precios en **COP** (pesos colombianos) — sin símbolo $, con `toLocaleString('es-CO')`
- Teléfonos con prefijo **+57**
- NestJS: seguir el patrón existente — un archivo por rol (module / controller / service / dto)
- Frontend: seguir patrones de `lib/admin/api.ts` — funciones `fetch` simples con `checked()`
- Fire-and-forget en todas las llamadas a `NotificacionesService`: siempre `.catch(err => logger.error(...))`
- Sin librerías adicionales para Telegram — usar `fetch` nativo
- Multer ya incluido en `@nestjs/platform-express` — no instalar paquete extra

---

## Mapa de archivos

**Creados:**
- `back/src/notificaciones/notificaciones.module.ts`
- `back/src/notificaciones/notificaciones.service.ts`
- `back/src/notificaciones/email.service.ts`
- `back/src/notificaciones/telegram.service.ts`
- `back/src/notificaciones/templates/confirmacion-reserva.html`
- `back/src/notificaciones/templates/confirmacion-pedido.html`
- `back/src/notificaciones/templates/contacto-recibido.html`
- `back/src/notificaciones/templates/alerta-admin.html`
- `back/src/contacto/contacto.module.ts`
- `back/src/contacto/contacto.controller.ts`
- `back/src/contacto/contacto.service.ts`
- `back/src/contacto/dto/create-contacto.dto.ts`
- `back/src/uploads/uploads.module.ts`
- `back/src/uploads/uploads.controller.ts`
- `back/src/uploads/uploads.service.ts`
- `back/src/site-config/site-config.module.ts`
- `back/src/site-config/site-config.controller.ts`
- `back/src/site-config/site-config.service.ts`
- `front/components/admin/ImageUploader.tsx`
- `front/components/admin/ProductoFormModal.tsx`
- `front/lib/api/site-config.ts`

**Modificados:**
- `back/prisma/schema.prisma` — agregar modelos Contacto y SiteConfig
- `back/src/app.module.ts` — registrar 4 módulos nuevos
- `back/src/reservas/reservas.module.ts` — importar NotificacionesModule
- `back/src/reservas/reservas.service.ts` — fire-and-forget al crear reserva
- `back/src/pedidos/pedidos.module.ts` — importar NotificacionesModule
- `back/src/pedidos/pedidos.service.ts` — fire-and-forget al crear pedido
- `front/lib/api/experiencias.ts` — precios mock en COP
- `front/lib/api/productos.ts` — precios mock en COP
- `front/lib/admin/api.ts` — agregar métodos de uploads y site-config
- `front/app/(public)/(landing)/contacto/page.tsx` — conectar al endpoint real
- `front/app/admin/(protected)/productos/page.tsx` — habilitar botón + modal
- `front/app/admin/(protected)/experiencias/page.tsx` — actualizar para pasar imagen al modal
- `front/components/admin/ExperienciaFormModal.tsx` — agregar campo imagen
- `front/app/admin/(protected)/config/page.tsx` — reemplazar placeholder
- `front/components/layout/Hero.tsx` — soporte para prop imagen real
- `front/app/(public)/(landing)/page.tsx` — pasar hero_image al Hero

---

## Tarea 1: Fixes menores

**Archivos:**
- Modificar: `front/lib/api/experiencias.ts`
- Modificar: `front/lib/api/productos.ts` (verificar existencia de MOCK_PRODUCTOS)
- Modificar: `front/app/admin/(protected)/productos/page.tsx:62`

**Interfaz:**
- No produce interfaces que otras tareas consuman
- Puede hacerse en paralelo con cualquier otra tarea

- [ ] **Paso 1: Actualizar precios mock de experiencias**

En `front/lib/api/experiencias.ts`, reemplazar los tres objetos de `MOCK_EXPERIENCIAS` con estos:

```typescript
export const MOCK_EXPERIENCIAS: Experiencia[] = [
  {
    id: '1',
    slug: 'ruta-del-cacao',
    nombre: 'Ruta del Cacao',
    descripcion: 'Recorre el ciclo completo del cacao: desde la mazorca abierta en el árbol hasta la tableta terminada. Fermentación, secado y degustación guiada por los productores de la finca.',
    duracion: '3 horas',
    precio: 95000,
    capacidad: 12,
    imagen: '',
    destacada: true,
    images: [
      'https://placehold.co/800x600/d51312/ffeaca?text=Ruta+del+Cacao',
      'https://placehold.co/800x600/872b13/ffeaca?text=Ruta+del+Cacao+2',
    ],
    incluye: ['Guía especializado', 'Degustación de variedades de cacao', 'Tableta de chocolate para llevar'],
    queTraer: ['Ropa cómoda', 'Calzado cerrado', 'Protector solar'],
  },
  {
    id: '2',
    slug: 'madrugada-cafetera',
    nombre: 'Madrugada Cafetera',
    descripcion: 'Madrugar nunca fue tan placentero. Acompañá a los recolectores al amanecer, aprendé a seleccionar el grano maduro y cerrá con una taza en V60.',
    duracion: '2.5 horas',
    precio: 75000,
    capacidad: 8,
    imagen: '',
    destacada: true,
    images: [
      'https://placehold.co/800x600/d51312/ffeaca?text=Madrugada+Cafetera',
      'https://placehold.co/800x600/872b13/ffeaca?text=Madrugada+Cafetera+2',
    ],
    incluye: ['Guía cafetero', 'Taza de café cosechado por vos', 'Desayuno ligero'],
    queTraer: ['Abrigo', 'Linterna', 'Ropa cómoda'],
  },
  {
    id: '3',
    slug: 'taller-chocolate-artesanal',
    nombre: 'Taller de Chocolate Artesanal',
    descripcion: 'Aprendé a templar, moldear y personalizar tus propias tabletas de chocolate. Te llevás lo que hacés.',
    duracion: '2 horas',
    precio: 85000,
    capacidad: 10,
    imagen: '',
    destacada: false,
    images: [
      'https://placehold.co/800x600/d51312/ffeaca?text=Taller+Chocolate',
      'https://placehold.co/800x600/872b13/ffeaca?text=Taller+Chocolate+2',
    ],
    incluye: ['Todos los materiales', 'Tableta artesanal para llevar (100g)', 'Certificado de participación'],
    queTraer: ['Ropa que pueda mancharse', 'Ganas de crear'],
  },
]
```

- [ ] **Paso 2: Actualizar precios mock de productos**

Abrir `front/lib/api/productos.ts`. Reemplazar el array `MOCK_PRODUCTOS` con:

```typescript
export const MOCK_PRODUCTOS: Producto[] = [
  {
    id: '1',
    slug: 'chocolate-negro-70',
    nombre: 'Chocolate Negro 70%',
    descripcion: 'Tableta 80 g con cacao fino de aroma del Huila. Notas a frutos rojos y panela. Sin lecitina ni saborizantes.',
    precio: 22000,
    stock: 40,
    imagen: '',
    categoria: 'chocolate',
    images: ['https://placehold.co/800x600/872b13/ffeaca?text=Chocolate+70'],
  },
  {
    id: '2',
    slug: 'nibs-de-cacao',
    nombre: 'Nibs de Cacao Tostado',
    descripcion: 'Trozos de cacao fermentado y tostado, sin azúcar. 150 g. Ideal para yogur, ensaladas o snack.',
    precio: 18000,
    stock: 20,
    imagen: '',
    categoria: 'cacao',
    images: ['https://placehold.co/800x600/ea5b0c/ffeaca?text=Nibs+Cacao'],
  },
  {
    id: '3',
    slug: 'cafe-especial-finca',
    nombre: 'Café Especial de la Finca',
    descripcion: 'Arábica lavado, proceso honey. Tostión media. 250 g molido o en grano. Puntuación SCA 84.',
    precio: 32000,
    stock: 22,
    imagen: '',
    categoria: 'otro',
    images: ['https://placehold.co/800x600/f59c00/ffeaca?text=Cafe+Especial'],
  },
]
```

- [ ] **Paso 3: Habilitar botón "Nuevo Producto"**

En `front/app/admin/(protected)/productos/page.tsx`, buscar la línea:
```typescript
<button className="btn-primary" disabled onClick={() => {}} title="Próximamente">
```
Reemplazar con:
```typescript
<button className="btn-primary" onClick={() => setModal('new')}>
```

También agregar el estado `modal` al principio del componente (después de `savingStock`):
```typescript
const [modal, setModal] = useState<AdminProducto | null | 'new'>()
```

- [ ] **Paso 4: Verificar en el navegador**

Abrir `http://localhost:3000/admin/productos`. El botón "+ Nuevo producto" debe estar habilitado (sin apariencia grisada). El modal aún no existe — se implementa en Tarea 8.

- [ ] **Paso 5: Commit**

```bash
git add front/lib/api/experiencias.ts front/lib/api/productos.ts front/app/admin/(protected)/productos/page.tsx
git commit -m "fix: precios mock en COP, habilitar botón Nuevo Producto"
```

---

## Tarea 2: Modelos Prisma — Contacto y SiteConfig

**Archivos:**
- Modificar: `back/prisma/schema.prisma`
- Crear: migración vía `prisma migrate dev`

**Interfaz:**
- Produce: tablas `Contacto` y `SiteConfig` en la base de datos — requeridas por Tareas 3, 4 y 9

- [ ] **Paso 1: Agregar modelos al schema**

En `back/prisma/schema.prisma`, al final del archivo agregar:

```prisma
model Contacto {
  id        String   @id @default(cuid())
  nombre    String
  email     String
  mensaje   String
  createdAt DateTime @default(now())
}

model SiteConfig {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

- [ ] **Paso 2: Ejecutar migración**

Desde la carpeta `back/`:
```bash
npx prisma migrate dev --name "add-contacto-site-config"
```

Resultado esperado:
```
✔ Generated Prisma Client
The following migration was created: prisma/migrations/20260628_add_contacto_site_config/migration.sql
```

- [ ] **Paso 3: Sembrar claves iniciales de SiteConfig**

Al final de `back/prisma/seed.ts`, antes del `console.log('🎉 Seed completado')`, agregar:

```typescript
  await prisma.siteConfig.createMany({
    data: [
      { key: 'hero_image', value: '' },
      { key: 'about_image', value: '' },
      { key: 'gallery_images', value: '[]' },
      { key: 'admin_email', value: '' },
    ],
    skipDuplicates: true,
  })
  console.log('✅ SiteConfig inicializado')
```

- [ ] **Paso 4: Regenerar Prisma Client y verificar**

```bash
cd back && npx prisma generate
```

Verificar que `node_modules/.prisma/client` se regeneró sin errores.

- [ ] **Paso 5: Commit**

```bash
git add back/prisma/schema.prisma back/prisma/seed.ts back/prisma/migrations/
git commit -m "feat(db): agregar modelos Contacto y SiteConfig"
```

---

## Tarea 3: NotificacionesModule

**Archivos:**
- Crear: `back/src/notificaciones/email.service.ts`
- Crear: `back/src/notificaciones/telegram.service.ts`
- Crear: `back/src/notificaciones/notificaciones.service.ts`
- Crear: `back/src/notificaciones/notificaciones.module.ts`
- Crear: 4 templates HTML en `back/src/notificaciones/templates/`

**Interfaz:**
- Produce: `NotificacionesModule` (exporta `NotificacionesService`) — consumido por Tareas 4, 5
- `NotificacionesService` expone:
  - `enviarConfirmacionReserva(reserva: ReservaConExperiencia): Promise<void>`
  - `enviarConfirmacionPedido(pedido: PedidoConItems): Promise<void>`
  - `enviarNuevoContacto(contacto: { nombre: string; email: string; mensaje: string; id: string }): Promise<void>`

- [ ] **Paso 1: Instalar Resend**

```bash
cd back && npm install resend
```

- [ ] **Paso 2: Agregar variables de entorno**

En `back/.env`, agregar al final:
```env
RESEND_API_KEY=re_REEMPLAZAR_CON_TU_KEY
RESEND_FROM_EMAIL=hola@vuelocarmesi.com
TELEGRAM_BOT_TOKEN=REEMPLAZAR_CON_TU_TOKEN
TELEGRAM_CHAT_ID=REEMPLAZAR_CON_TU_CHAT_ID
```

> **Nota:** Crear cuenta en resend.com, verificar el dominio o usar el email de onboarding para pruebas. Para Telegram: crear bot en @BotFather, agregar al grupo del equipo, obtener chat_id.

- [ ] **Paso 3: Crear template `confirmacion-reserva.html`**

Crear `back/src/notificaciones/templates/confirmacion-reserva.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Confirmación de Reserva</title></head>
<body style="font-family:Georgia,serif;background:#FFEACA;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(135,43,19,.12)">
    <div style="background:#D51312;padding:32px 40px">
      <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#FFEACA;margin-bottom:8px">Vuelo Carmesí</div>
      <div style="font-size:26px;color:#fff;font-weight:bold">¡Tu reserva está confirmada!</div>
    </div>
    <div style="padding:32px 40px">
      <p style="color:#5C3317;font-size:16px;margin:0 0 24px">Hola <strong>{{nombre}}</strong>, recibimos tu reserva para:</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#872B13;font-weight:bold;width:40%">Experiencia</td><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#5C3317">{{experiencia}}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#872B13;font-weight:bold">Fecha</td><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#5C3317">{{fecha}}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#872B13;font-weight:bold">Personas</td><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#5C3317">{{cantidadPersonas}}</td></tr>
        <tr><td style="padding:10px 0;color:#872B13;font-weight:bold">Email de contacto</td><td style="padding:10px 0;color:#5C3317">{{email}}</td></tr>
      </table>
      <p style="color:#5C3317;margin:24px 0 0;font-size:14px;line-height:1.7">Te confirmamos los detalles de llegada y pago a la brevedad por este mismo correo. Ante cualquier duda escribinos a <a href="mailto:hola@vuelocarmesi.com" style="color:#D51312">hola@vuelocarmesi.com</a>.</p>
    </div>
    <div style="background:#F0D6A8;padding:20px 40px;font-size:12px;color:#872B13;text-align:center">Vuelo Carmesí · Finca agroecológica · Colombia</div>
  </div>
</body>
</html>
```

- [ ] **Paso 4: Crear template `confirmacion-pedido.html`**

Crear `back/src/notificaciones/templates/confirmacion-pedido.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Confirmación de Pedido</title></head>
<body style="font-family:Georgia,serif;background:#FFEACA;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(135,43,19,.12)">
    <div style="background:#D51312;padding:32px 40px">
      <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#FFEACA;margin-bottom:8px">Vuelo Carmesí</div>
      <div style="font-size:26px;color:#fff;font-weight:bold">¡Recibimos tu pedido!</div>
    </div>
    <div style="padding:32px 40px">
      <p style="color:#5C3317;font-size:16px;margin:0 0 24px">Hola <strong>{{nombre}}</strong>, tu pedido fue registrado exitosamente.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#872B13;font-weight:bold;width:40%">N° de pedido</td><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#5C3317;font-family:monospace">{{id}}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#872B13;font-weight:bold">Dirección</td><td style="padding:10px 0;border-bottom:1px solid #F0D6A8;color:#5C3317">{{direccion}}</td></tr>
        <tr><td style="padding:10px 0;color:#872B13;font-weight:bold">Total</td><td style="padding:10px 0;color:#D51312;font-size:18px;font-weight:bold">$ {{total}}</td></tr>
      </table>
      <p style="color:#5C3317;margin:24px 0 0;font-size:14px;line-height:1.7">Te enviaremos los datos de despacho una vez confirmemos el pago. Ante cualquier duda escribinos a <a href="mailto:hola@vuelocarmesi.com" style="color:#D51312">hola@vuelocarmesi.com</a>.</p>
    </div>
    <div style="background:#F0D6A8;padding:20px 40px;font-size:12px;color:#872B13;text-align:center">Vuelo Carmesí · Finca agroecológica · Colombia</div>
  </div>
</body>
</html>
```

- [ ] **Paso 5: Crear template `contacto-recibido.html`**

Crear `back/src/notificaciones/templates/contacto-recibido.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Recibimos tu mensaje</title></head>
<body style="font-family:Georgia,serif;background:#FFEACA;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(135,43,19,.12)">
    <div style="background:#D51312;padding:32px 40px">
      <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#FFEACA;margin-bottom:8px">Vuelo Carmesí</div>
      <div style="font-size:26px;color:#fff;font-weight:bold">¡Recibimos tu mensaje!</div>
    </div>
    <div style="padding:32px 40px">
      <p style="color:#5C3317;font-size:16px;margin:0 0 16px">Hola <strong>{{nombre}}</strong>,</p>
      <p style="color:#5C3317;font-size:15px;margin:0 0 16px;line-height:1.7">Gracias por escribirnos. Tu mensaje fue recibido y te responderemos a la brevedad.</p>
      <div style="background:#F0D6A8;border-radius:8px;padding:16px 20px;color:#5C3317;font-size:14px;line-height:1.7;font-style:italic">"{{mensaje}}"</div>
    </div>
    <div style="background:#F0D6A8;padding:20px 40px;font-size:12px;color:#872B13;text-align:center">Vuelo Carmesí · Finca agroecológica · Colombia</div>
  </div>
</body>
</html>
```

- [ ] **Paso 6: Crear template `alerta-admin.html`**

Crear `back/src/notificaciones/templates/alerta-admin.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>{{tipo}} — Vuelo Carmesí Admin</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0">
    <div style="background:#872B13;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">
      🔔 {{tipo}}
    </div>
    <div style="padding:24px 28px">
      {{filas}}
      <div style="margin-top:20px">
        <a href="{{adminUrl}}" style="background:#D51312;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold">Ver en el panel →</a>
      </div>
    </div>
  </div>
</body>
</html>
```

- [ ] **Paso 7: Crear `email.service.ts`**

Crear `back/src/notificaciones/email.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common'
import { Resend } from 'resend'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly resend = new Resend(process.env.RESEND_API_KEY)
  private readonly from = process.env.RESEND_FROM_EMAIL ?? 'hola@vuelocarmesi.com'

  private tpl(name: string, vars: Record<string, string>): string {
    const file = path.join(__dirname, 'templates', `${name}.html`)
    let html = fs.readFileSync(file, 'utf-8')
    for (const [k, v] of Object.entries(vars)) {
      html = html.replaceAll(`{{${k}}}`, v)
    }
    return html
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.resend.emails.send({ from: this.from, to, subject, html })
  }

  templateConfirmacionReserva(vars: Record<string, string>): string {
    return this.tpl('confirmacion-reserva', vars)
  }

  templateConfirmacionPedido(vars: Record<string, string>): string {
    return this.tpl('confirmacion-pedido', vars)
  }

  templateContactoRecibido(vars: Record<string, string>): string {
    return this.tpl('contacto-recibido', vars)
  }

  templateAlertaAdmin(vars: Record<string, string>): string {
    return this.tpl('alerta-admin', vars)
  }
}
```

- [ ] **Paso 8: Crear `telegram.service.ts`**

Crear `back/src/notificaciones/telegram.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name)
  private readonly token = process.env.TELEGRAM_BOT_TOKEN
  private readonly chatId = process.env.TELEGRAM_CHAT_ID

  async send(text: string): Promise<void> {
    if (!this.token || !this.chatId) {
      this.logger.warn('Telegram no configurado — TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID faltante')
      return
    }
    const url = `https://api.telegram.org/bot${this.token}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: this.chatId, text, parse_mode: 'Markdown' }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Telegram error ${res.status}: ${body}`)
    }
  }
}
```

- [ ] **Paso 9: Crear `notificaciones.service.ts`**

Crear `back/src/notificaciones/notificaciones.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common'
import { EmailService } from './email.service'
import { TelegramService } from './telegram.service'

const ADMIN_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'

function filaHtml(label: string, value: string): string {
  return `<div style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px">
    <span style="color:#888;width:140px;display:inline-block">${label}</span>
    <strong>${value}</strong>
  </div>`
}

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name)
  private readonly adminEmail = process.env.ADMIN_EMAIL ?? ''

  constructor(
    private readonly email: EmailService,
    private readonly telegram: TelegramService,
  ) {}

  async enviarConfirmacionReserva(reserva: {
    id: string; nombre: string; email: string
    experiencia?: { nombre: string } | null
    fecha: Date; cantidadPersonas: number
  }): Promise<void> {
    const expNombre = reserva.experiencia?.nombre ?? 'Experiencia'
    const fechaStr = new Date(reserva.fecha).toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const htmlCliente = this.email.templateConfirmacionReserva({
      nombre: reserva.nombre,
      experiencia: expNombre,
      fecha: fechaStr,
      cantidadPersonas: String(reserva.cantidadPersonas),
      email: reserva.email,
    })
    await this.email.send(reserva.email, `Confirmación de tu reserva — Vuelo Carmesí`, htmlCliente)

    if (this.adminEmail) {
      const filas = [
        filaHtml('Nombre', reserva.nombre),
        filaHtml('Email', reserva.email),
        filaHtml('Experiencia', expNombre),
        filaHtml('Fecha', fechaStr),
        filaHtml('Personas', String(reserva.cantidadPersonas)),
      ].join('')
      const htmlAdmin = this.email.templateAlertaAdmin({
        tipo: '📅 Nueva Reserva',
        filas,
        adminUrl: `${ADMIN_URL}/admin/reservas`,
      })
      await this.email.send(this.adminEmail, `[Reserva] Nueva: ${reserva.nombre}`, htmlAdmin)
    }

    await this.telegram.send(
      `📅 *Nueva Reserva*\nNombre: ${reserva.nombre}\nEmail: ${reserva.email}\nExperiencia: ${expNombre}\nFecha: ${fechaStr}\nPersonas: ${reserva.cantidadPersonas}`,
    )
  }

  async enviarConfirmacionPedido(pedido: {
    id: string; nombre: string; email: string; direccion: string; total: number
  }): Promise<void> {
    const totalStr = pedido.total.toLocaleString('es-CO')

    const htmlCliente = this.email.templateConfirmacionPedido({
      nombre: pedido.nombre,
      id: pedido.id,
      direccion: pedido.direccion,
      total: totalStr,
    })
    await this.email.send(pedido.email, `Recibimos tu pedido — Vuelo Carmesí`, htmlCliente)

    if (this.adminEmail) {
      const filas = [
        filaHtml('N° pedido', pedido.id),
        filaHtml('Nombre', pedido.nombre),
        filaHtml('Email', pedido.email),
        filaHtml('Dirección', pedido.direccion),
        filaHtml('Total', `$ ${totalStr} COP`),
      ].join('')
      const htmlAdmin = this.email.templateAlertaAdmin({
        tipo: '🛒 Nuevo Pedido',
        filas,
        adminUrl: `${ADMIN_URL}/admin/pedidos`,
      })
      await this.email.send(this.adminEmail, `[Pedido] Nuevo: ${pedido.nombre}`, htmlAdmin)
    }

    await this.telegram.send(
      `🛒 *Nuevo Pedido*\nNombre: ${pedido.nombre}\nEmail: ${pedido.email}\nTotal: $ ${totalStr} COP`,
    )
  }

  async enviarNuevoContacto(contacto: {
    id: string; nombre: string; email: string; mensaje: string
  }): Promise<void> {
    const htmlCliente = this.email.templateContactoRecibido({
      nombre: contacto.nombre,
      mensaje: contacto.mensaje,
    })
    await this.email.send(contacto.email, `Recibimos tu mensaje — Vuelo Carmesí`, htmlCliente)

    if (this.adminEmail) {
      const filas = [
        filaHtml('Nombre', contacto.nombre),
        filaHtml('Email', contacto.email),
        filaHtml('Mensaje', contacto.mensaje),
      ].join('')
      const htmlAdmin = this.email.templateAlertaAdmin({
        tipo: '✉️ Nuevo Mensaje de Contacto',
        filas,
        adminUrl: `${ADMIN_URL}/admin`,
      })
      await this.email.send(this.adminEmail, `[Contacto] Mensaje de ${contacto.nombre}`, htmlAdmin)
    }

    await this.telegram.send(
      `✉️ *Nuevo Contacto*\nNombre: ${contacto.nombre}\nEmail: ${contacto.email}\nMensaje: ${contacto.mensaje}`,
    )
  }
}
```

- [ ] **Paso 10: Crear `notificaciones.module.ts`**

Crear `back/src/notificaciones/notificaciones.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { NotificacionesService } from './notificaciones.service'
import { EmailService } from './email.service'
import { TelegramService } from './telegram.service'

@Module({
  providers: [NotificacionesService, EmailService, TelegramService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
```

- [ ] **Paso 11: Verificar que compila**

```bash
cd back && npm run build
```

Esperado: sin errores de TypeScript.

- [ ] **Paso 12: Commit**

```bash
git add back/src/notificaciones/ back/package.json back/package-lock.json
git commit -m "feat(back): NotificacionesModule con EmailService (Resend) y TelegramService"
```

---

## Tarea 4: ContactoModule

**Archivos:**
- Crear: `back/src/contacto/dto/create-contacto.dto.ts`
- Crear: `back/src/contacto/contacto.service.ts`
- Crear: `back/src/contacto/contacto.controller.ts`
- Crear: `back/src/contacto/contacto.module.ts`
- Modificar: `back/src/app.module.ts`
- Modificar: `front/app/(public)/(landing)/contacto/page.tsx`

**Interfaz:**
- Consume: `NotificacionesModule` (de Tarea 3), tabla `Contacto` (de Tarea 2)
- Produce: `POST /contacto` → `{ id, createdAt }`

- [ ] **Paso 1: Crear DTO**

Crear `back/src/contacto/dto/create-contacto.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsEmail } from 'class-validator'

export class CreateContactoDto {
  @IsString() @IsNotEmpty() nombre: string
  @IsEmail() email: string
  @IsString() @IsNotEmpty() mensaje: string
}
```

- [ ] **Paso 2: Crear service**

Crear `back/src/contacto/contacto.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { CreateContactoDto } from './dto/create-contacto.dto'

@Injectable()
export class ContactoService {
  private readonly logger = new Logger(ContactoService.name)

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  async create(dto: CreateContactoDto) {
    const contacto = await this.prisma.contacto.create({ data: dto })

    this.notificaciones
      .enviarNuevoContacto(contacto)
      .catch(err => this.logger.error('Notificación de contacto fallida', err))

    return { id: contacto.id, createdAt: contacto.createdAt }
  }
}
```

- [ ] **Paso 3: Crear controller**

Crear `back/src/contacto/contacto.controller.ts`:

```typescript
import { Controller, Post, Body } from '@nestjs/common'
import { ContactoService } from './contacto.service'
import { CreateContactoDto } from './dto/create-contacto.dto'

@Controller('contacto')
export class ContactoController {
  constructor(private readonly service: ContactoService) {}

  @Post()
  create(@Body() dto: CreateContactoDto) {
    return this.service.create(dto)
  }
}
```

- [ ] **Paso 4: Crear module**

Crear `back/src/contacto/contacto.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { ContactoController } from './contacto.controller'
import { ContactoService } from './contacto.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesModule } from '../notificaciones/notificaciones.module'

@Module({
  imports: [NotificacionesModule],
  controllers: [ContactoController],
  providers: [ContactoService, PrismaService],
})
export class ContactoModule {}
```

- [ ] **Paso 5: Registrar en AppModule**

Reemplazar `back/src/app.module.ts` con:

```typescript
import { Module } from '@nestjs/common'
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
    ExperienciasModule,
    ReservasModule,
    ProductosModule,
    PedidosModule,
    ContactoModule,
    NotificacionesModule,
    UploadsModule,
    SiteConfigModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
```

> **Nota:** UploadsModule y SiteConfigModule aún no existen — el backend no compilará hasta que se creen en Tareas 6 y 9. Para compilar antes, omitir esas dos importaciones temporalmente.

- [ ] **Paso 6: Probar el endpoint con curl**

Con el servidor corriendo (`npm run start:dev` en `back/`):

```bash
curl -X POST http://localhost:3001/contacto \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@test.com","mensaje":"Hola desde curl"}'
```

Esperado: `{"id":"...","createdAt":"..."}` con status 201.

- [ ] **Paso 7: Conectar el formulario en el frontend**

Reemplazar todo el contenido de `front/app/(public)/(landing)/contacto/page.tsx`:

```typescript
'use client'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' })
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstado('loading')
    try {
      const res = await fetch(`${API}/contacto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setEstado('ok')
    } catch {
      setEstado('error')
    }
  }

  return (
    <section style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--color-brown)' }}>Contacto</h1>
      {estado === 'ok' ? (
        <p style={{ color: 'var(--color-crimson)', fontSize: '1.1rem' }}>
          ¡Gracias! Te respondemos a la brevedad. Revisá tu correo.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input label="Nombre" name="nombre" required value={form.nombre} onChange={handleChange} />
          <Input label="Email" name="email" type="email" required value={form.email} onChange={handleChange} />
          <Input label="Mensaje" name="mensaje" required value={form.mensaje} onChange={handleChange} multiline />
          {estado === 'error' && (
            <p style={{ color: 'var(--color-crimson)', fontSize: 14, margin: 0 }}>
              Hubo un error al enviar. Intentá de nuevo o escribinos directamente a hola@vuelocarmesi.com.
            </p>
          )}
          <Button type="submit" disabled={estado === 'loading'}>
            {estado === 'loading' ? 'Enviando…' : 'Enviar mensaje'}
          </Button>
        </form>
      )}
    </section>
  )
}
```

- [ ] **Paso 8: Verificar en el navegador**

Ir a `http://localhost:3000/contacto`. Llenar el formulario y enviar. Verificar:
- El botón muestra "Enviando…" durante la petición
- Al completarse aparece el mensaje de éxito
- El email llega a la casilla configurada en `RESEND_FROM_EMAIL`

- [ ] **Paso 9: Commit**

```bash
git add back/src/contacto/ back/src/app.module.ts front/app/(public)/(landing)/contacto/page.tsx
git commit -m "feat: ContactoModule — endpoint POST /contacto + formulario conectado"
```

---

## Tarea 5: Notificaciones en Reservas y Pedidos

**Archivos:**
- Modificar: `back/src/reservas/reservas.module.ts`
- Modificar: `back/src/reservas/reservas.service.ts`
- Modificar: `back/src/pedidos/pedidos.module.ts`
- Modificar: `back/src/pedidos/pedidos.service.ts`

**Interfaz:**
- Consume: `NotificacionesService.enviarConfirmacionReserva()` y `enviarConfirmacionPedido()` (Tarea 3)
- No produce nuevas interfaces

- [ ] **Paso 1: Actualizar ReservasModule**

Reemplazar `back/src/reservas/reservas.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { ReservasController } from './reservas.controller'
import { ReservasService } from './reservas.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesModule } from '../notificaciones/notificaciones.module'

@Module({
  imports: [NotificacionesModule],
  controllers: [ReservasController],
  providers: [ReservasService, PrismaService],
})
export class ReservasModule {}
```

- [ ] **Paso 2: Actualizar ReservasService**

Reemplazar `back/src/reservas/reservas.service.ts`:

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
import { CreateReservaDto } from './dto/create-reserva.dto'

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name)

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

  async remove(id: string) {
    await this.findById(id)
    return this.prisma.reserva.delete({ where: { id } })
  }
}
```

- [ ] **Paso 3: Actualizar PedidosModule**

Reemplazar `back/src/pedidos/pedidos.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { PedidosController } from './pedidos.controller'
import { PedidosService } from './pedidos.service'
import { PrismaService } from '../prisma.service'
import { NotificacionesModule } from '../notificaciones/notificaciones.module'

@Module({
  imports: [NotificacionesModule],
  controllers: [PedidosController],
  providers: [PedidosService, PrismaService],
})
export class PedidosModule {}
```

- [ ] **Paso 4: Agregar fire-and-forget a PedidosService**

En `back/src/pedidos/pedidos.service.ts`, agregar la importación y constructor:

```typescript
// Agregar al inicio de los imports:
import { Logger } from '@nestjs/common'
import { NotificacionesService } from '../notificaciones/notificaciones.service'
```

Cambiar el constructor de:
```typescript
constructor(private prisma: PrismaService) {}
```
A:
```typescript
private readonly logger = new Logger(PedidosService.name)

constructor(
  private prisma: PrismaService,
  private notificaciones: NotificacionesService,
) {}
```

Al final del método `create()`, justo antes del `return pedido` (dentro del `$transaction`), agregar:

```typescript
      this.notificaciones
        .enviarConfirmacionPedido(pedido)
        .catch(err => this.logger.error('Notificación de pedido fallida', err))

      return pedido
```

- [ ] **Paso 5: Verificar compilación**

```bash
cd back && npm run build
```

Sin errores de TypeScript.

- [ ] **Paso 6: Prueba de integración — crear una reserva**

Con el servidor corriendo, crear una reserva de prueba. Verificar que:
- La reserva se crea correctamente (status 201)
- El email de confirmación llega al cliente
- El mensaje de Telegram llega al grupo del equipo
- Si el email falla, la reserva igual se crea (no da error 500)

- [ ] **Paso 7: Commit**

```bash
git add back/src/reservas/ back/src/pedidos/
git commit -m "feat(back): fire-and-forget de notificaciones al crear reserva y pedido"
```

---

## Tarea 6: UploadsModule

**Archivos:**
- Crear: `back/src/uploads/uploads.service.ts`
- Crear: `back/src/uploads/uploads.controller.ts`
- Crear: `back/src/uploads/uploads.module.ts`

**Interfaz:**
- Produce: `POST /uploads/image` → `{ url: string, publicId: string }`
- Consume: `multer` (incluido en `@nestjs/platform-express`), `cloudinary` SDK

- [ ] **Paso 1: Instalar Cloudinary**

```bash
cd back && npm install cloudinary
```

- [ ] **Paso 2: Agregar variables de entorno**

En `back/.env`, agregar:
```env
CLOUDINARY_CLOUD_NAME=REEMPLAZAR
CLOUDINARY_API_KEY=REEMPLAZAR
CLOUDINARY_API_SECRET=REEMPLAZAR
```

> Crear cuenta en cloudinary.com → Dashboard → copiar Cloud Name, API Key y API Secret.

- [ ] **Paso 3: Crear `uploads.service.ts`**

Crear `back/src/uploads/uploads.service.ts`:

```typescript
import { BadRequestException, Injectable } from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

@Injectable()
export class UploadsService {
  async uploadImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Solo se aceptan imágenes JPG, PNG o WebP')
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('El archivo supera el límite de 5 MB')
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'vuelo-carmesi', resource_type: 'image' },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary sin resultado'))
          resolve({ url: result.secure_url, publicId: result.public_id })
        },
      )
      stream.end(file.buffer)
    })
  }
}
```

- [ ] **Paso 4: Crear `uploads.controller.ts`**

Crear `back/src/uploads/uploads.controller.ts`:

```typescript
import {
  Controller, Post, UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { UploadsService } from './uploads.service'

@Controller('uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Campo "file" requerido')
    return this.service.uploadImage(file)
  }
}
```

- [ ] **Paso 5: Crear `uploads.module.ts`**

Crear `back/src/uploads/uploads.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { UploadsController } from './uploads.controller'
import { UploadsService } from './uploads.service'

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
```

- [ ] **Paso 6: Instalar tipos de multer**

```bash
cd back && npm install -D @types/multer
```

- [ ] **Paso 7: Probar el endpoint**

```bash
curl -X POST http://localhost:3001/uploads/image \
  -F "file=@/ruta/a/imagen.jpg"
```

Esperado: `{"url":"https://res.cloudinary.com/...","publicId":"vuelo-carmesi/..."}` con status 201.

- [ ] **Paso 8: Commit**

```bash
git add back/src/uploads/ back/package.json back/package-lock.json
git commit -m "feat(back): UploadsModule — POST /uploads/image con Cloudinary"
```

---

## Tarea 7: Componente ImageUploader

**Archivos:**
- Crear: `front/components/admin/ImageUploader.tsx`
- Modificar: `front/lib/admin/api.ts` (agregar función `uploadImage`)

**Interfaz:**
- Produce: componente `<ImageUploader value={url} onChange={(url) => void} />` — consumido por Tareas 8 y 10

- [ ] **Paso 1: Agregar `uploadImage` al API client del admin**

En `front/lib/admin/api.ts`, agregar al final:

```typescript
// ── Uploads ────────────────────────────────────────────────
export async function uploadImage(file: File): Promise<{ url: string; publicId: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/uploads/image`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Upload error ${res.status}`)
  return res.json()
}
```

- [ ] **Paso 2: Crear `ImageUploader.tsx`**

Crear `front/components/admin/ImageUploader.tsx`:

```typescript
'use client'
import { useRef, useState } from 'react'
import { uploadImage } from '@/lib/admin/api'

interface Props {
  value: string
  onChange: (url: string) => void
  label?: string
}

export default function ImageUploader({ value, onChange, label = 'Imagen' }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const { url } = await uploadImage(file)
      onChange(url)
    } catch {
      setError('Error al subir la imagen. Verificá el formato y tamaño (máx. 5 MB).')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="admin-field-label">{label}</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {value ? (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e0d0c0' }}
            />
            <button
              type="button"
              onClick={() => onChange('')}
              style={{
                position: 'absolute', top: -6, right: -6,
                background: '#D51312', color: '#fff', border: 'none',
                borderRadius: '50%', width: 20, height: 20,
                fontSize: 12, cursor: 'pointer', lineHeight: '20px', padding: 0,
              }}
            >✕</button>
          </div>
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: 8, border: '2px dashed #d0c0b0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#a08070', fontSize: 11, flexShrink: 0,
          }}>
            Sin imagen
          </div>
        )}
        <div style={{ flex: 1 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            style={{ display: 'none' }}
            id="img-upload-input"
          />
          <label
            htmlFor="img-upload-input"
            className="btn-secondary btn-sm"
            style={{ display: 'inline-block', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Subiendo…' : value ? 'Cambiar imagen' : 'Subir imagen'}
          </label>
          <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            JPG, PNG o WebP · máx. 5 MB
          </div>
          {error && <div style={{ color: 'var(--color-crimson)', fontSize: 12, marginTop: 4 }}>{error}</div>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Paso 3: Verificar que el componente compila**

```bash
cd front && npx tsc --noEmit
```

Sin errores de TypeScript.

- [ ] **Paso 4: Commit**

```bash
git add front/components/admin/ImageUploader.tsx front/lib/admin/api.ts
git commit -m "feat(admin): componente ImageUploader con preview y upload a Cloudinary"
```

---

## Tarea 8: ProductoFormModal + ExperienciaFormModal con imagen

**Archivos:**
- Crear: `front/components/admin/ProductoFormModal.tsx`
- Modificar: `front/components/admin/ExperienciaFormModal.tsx`
- Modificar: `front/app/admin/(protected)/productos/page.tsx`

**Interfaz:**
- Consume: `ImageUploader` (Tarea 7), `createProducto`, `updateProducto` (ya en `api.ts`)
- Produce: modal de create/edit para productos con campo imagen funcional

- [ ] **Paso 1: Actualizar ExperienciaFormModal para agregar campo imagen**

En `front/components/admin/ExperienciaFormModal.tsx`:

Agregar `imagen: string` al tipo `FormData`:
```typescript
type FormData = {
  nombre: string; descripcion: string; slug: string
  precio: string; duracion: string; capacidad: string
  destacada: boolean; imagen: string
}

const EMPTY: FormData = {
  nombre: '', descripcion: '', slug: '', precio: '',
  duracion: '', capacidad: '', destacada: false, imagen: '',
}
```

En la inicialización del estado cuando hay experiencia existente, agregar `imagen: experiencia.imagen ?? ''`.

Agregar el import de `ImageUploader`:
```typescript
import ImageUploader from './ImageUploader'
```

En el `handleSubmit`, agregar `imagen: form.imagen` al objeto `data`.

Dentro del `<div className="admin-modal-body">`, agregar antes del div de Toggle:
```typescript
<ImageUploader
  value={form.imagen}
  onChange={url => set('imagen', url)}
  label="Imagen de portada"
/>
```

- [ ] **Paso 2: Crear `ProductoFormModal.tsx`**

Crear `front/components/admin/ProductoFormModal.tsx`:

```typescript
'use client'
import { useState } from 'react'
import type { AdminProducto } from '@/lib/admin/types'
import { createProducto, updateProducto } from '@/lib/admin/api'
import ImageUploader from './ImageUploader'

const CATEGORIAS = ['chocolates', 'despensa', 'cafe', 'regalos', 'hogar']

type FormData = {
  nombre: string; descripcion: string; slug: string
  precio: string; stock: string; categoria: string; imagen: string
}

const EMPTY: FormData = {
  nombre: '', descripcion: '', slug: '', precio: '',
  stock: '0', categoria: 'chocolates', imagen: '',
}

function toSlug(nombre: string) {
  return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ProductoFormModal({
  producto,
  onClose,
  onSaved,
}: {
  producto: AdminProducto | null
  onClose: () => void
  onSaved: (p: AdminProducto) => void
}) {
  const isEdit = !!producto
  const [form, setForm] = useState<FormData>(
    producto
      ? {
          nombre: producto.nombre, descripcion: producto.descripcion,
          slug: producto.slug, precio: String(producto.precio),
          stock: String(producto.stock), categoria: producto.categoria,
          imagen: producto.imagen ?? '',
        }
      : EMPTY
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k: keyof FormData, v: string) {
    setForm(prev => {
      const next = { ...prev, [k]: v }
      if (k === 'nombre' && !isEdit) next.slug = toSlug(v)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.slug || !form.precio || !form.categoria) {
      setError('Completá todos los campos requeridos')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = {
        nombre: form.nombre, descripcion: form.descripcion, slug: form.slug,
        precio: Number(form.precio), stock: Number(form.stock),
        categoria: form.categoria, imagen: form.imagen,
      }
      const saved = isEdit
        ? await updateProducto(producto!.id, data)
        : await createProducto(data)
      onSaved(saved)
    } catch {
      setError('Error al guardar. Revisá que el slug sea único.')
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div style={{ fontSize: 17, fontWeight: 700 }}>{isEdit ? 'Editar producto' : 'Nuevo producto'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--admin-text-muted)' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            <FormRow label="Nombre *">
              <input className="admin-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Chocolate Negro 70%" />
            </FormRow>
            <FormRow label="Slug (URL) *">
              <input className="admin-input" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="chocolate-negro-70" />
            </FormRow>
            <FormRow label="Descripción">
              <textarea className="admin-input" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
            </FormRow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <FormRow label="Precio (COP) *">
                <input className="admin-input" type="number" min={0} value={form.precio} onChange={e => set('precio', e.target.value)} />
              </FormRow>
              <FormRow label="Stock inicial">
                <input className="admin-input" type="number" min={0} value={form.stock} onChange={e => set('stock', e.target.value)} />
              </FormRow>
              <FormRow label="Categoría *">
                <select className="admin-input" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormRow>
            </div>
            <ImageUploader value={form.imagen} onChange={url => set('imagen', url)} label="Imagen del producto" />
            {error && <div style={{ color: 'var(--color-crimson)', fontSize: 13 }}>{error}</div>}
          </div>
          <div className="admin-modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="admin-field-label">{label}</div>
      {children}
    </div>
  )
}
```

- [ ] **Paso 3: Conectar ProductoFormModal en la página de Productos**

En `front/app/admin/(protected)/productos/page.tsx`:

Agregar imports al inicio:
```typescript
import ProductoFormModal from '@/components/admin/ProductoFormModal'
```

Al final del JSX devuelto (antes del `</>` de cierre), agregar:
```typescript
{modal !== undefined && (
  <ProductoFormModal
    producto={modal === 'new' ? null : modal}
    onClose={() => setModal(undefined)}
    onSaved={saved => {
      setProductos(prev => {
        const idx = prev.findIndex(p => p.id === saved.id)
        return idx >= 0 ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]
      })
      setModal(undefined)
    }}
  />
)}
```

También agregar botón "Editar" en cada fila de la tabla. Buscar el botón de eliminar en el map y agregar antes:
```typescript
<button className="btn-secondary btn-sm" onClick={() => setModal(p)}>Editar</button>
```

- [ ] **Paso 4: Probar en el navegador**

Ir a `/admin/productos`. Hacer clic en "+ Nuevo producto". Verificar:
- El modal se abre con todos los campos
- Se puede subir una imagen (aparece preview)
- Al guardar el producto aparece en la tabla

- [ ] **Paso 5: Commit**

```bash
git add front/components/admin/ProductoFormModal.tsx front/components/admin/ExperienciaFormModal.tsx front/app/admin/(protected)/productos/page.tsx
git commit -m "feat(admin): ProductoFormModal completo + imagen en ExperienciaFormModal"
```

---

## Tarea 9: SiteConfigModule

**Archivos:**
- Crear: `back/src/site-config/site-config.service.ts`
- Crear: `back/src/site-config/site-config.controller.ts`
- Crear: `back/src/site-config/site-config.module.ts`
- Crear: `front/lib/api/site-config.ts`
- Modificar: `front/lib/admin/api.ts`

**Interfaz:**
- Produce:
  - `GET /site-config` → `Record<string, string>`
  - `PATCH /site-config` body `Record<string, string>` → `Record<string, string>`
  - Frontend público: `getSiteConfig(): Promise<Record<string, string>>`
  - Admin: `patchSiteConfig(data: Record<string, string>): Promise<Record<string, string>>`

- [ ] **Paso 1: Crear `site-config.service.ts`**

Crear `back/src/site-config/site-config.service.ts`:

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class SiteConfigService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.prisma.siteConfig.findMany()
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  }

  async patch(data: Record<string, string>): Promise<Record<string, string>> {
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        this.prisma.siteConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    )
    return this.getAll()
  }
}
```

- [ ] **Paso 2: Crear `site-config.controller.ts`**

Crear `back/src/site-config/site-config.controller.ts`:

```typescript
import { Body, Controller, Get, Patch } from '@nestjs/common'
import { SiteConfigService } from './site-config.service'

@Controller('site-config')
export class SiteConfigController {
  constructor(private readonly service: SiteConfigService) {}

  @Get()
  getAll() {
    return this.service.getAll()
  }

  @Patch()
  patch(@Body() data: Record<string, string>) {
    return this.service.patch(data)
  }
}
```

- [ ] **Paso 3: Crear `site-config.module.ts`**

Crear `back/src/site-config/site-config.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { SiteConfigController } from './site-config.controller'
import { SiteConfigService } from './site-config.service'
import { PrismaService } from '../prisma.service'

@Module({
  controllers: [SiteConfigController],
  providers: [SiteConfigService, PrismaService],
})
export class SiteConfigModule {}
```

- [ ] **Paso 4: Crear cliente público frontend**

Crear `front/lib/api/site-config.ts`:

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function getSiteConfig(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${BASE}/site-config`, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return {}
  }
}
```

- [ ] **Paso 5: Agregar funciones admin al API client**

En `front/lib/admin/api.ts`, agregar al final:

```typescript
// ── SiteConfig ─────────────────────────────────────────────
export function getSiteConfigAdmin(): Promise<Record<string, string>> {
  return fetch(`${BASE}/site-config`).then(checked)
}
export function patchSiteConfig(data: Record<string, string>): Promise<Record<string, string>> {
  return fetch(`${BASE}/site-config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(checked)
}
```

- [ ] **Paso 6: Probar endpoints**

```bash
# GET — debe devolver las claves del seed
curl http://localhost:3001/site-config

# PATCH — actualizar hero_image
curl -X PATCH http://localhost:3001/site-config \
  -H "Content-Type: application/json" \
  -d '{"hero_image":"https://res.cloudinary.com/test/test.jpg"}'
```

- [ ] **Paso 7: Commit**

```bash
git add back/src/site-config/ front/lib/api/site-config.ts front/lib/admin/api.ts
git commit -m "feat: SiteConfigModule — GET/PATCH /site-config + clientes frontend"
```

---

## Tarea 10: Admin Config page + Hero dinámico

**Archivos:**
- Modificar: `front/app/admin/(protected)/config/page.tsx`
- Modificar: `front/components/layout/Hero.tsx`
- Modificar: `front/app/(public)/(landing)/page.tsx`

**Interfaz:**
- Consume: `getSiteConfigAdmin`, `patchSiteConfig` (Tarea 9), `ImageUploader` (Tarea 7)
- Produce: Hero con imagen configurable desde el admin

- [ ] **Paso 1: Reemplazar la página de Configuración**

Reemplazar todo el contenido de `front/app/admin/(protected)/config/page.tsx`:

```typescript
'use client'
import { useState, useEffect } from 'react'
import { getSiteConfigAdmin, patchSiteConfig } from '@/lib/admin/api'
import ImageUploader from '@/components/admin/ImageUploader'

export default function ConfigPage() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    getSiteConfigAdmin().then(data => { setConfig(data); setLoading(false) })
  }, [])

  function set(key: string, value: string) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  async function guardar(keys: string[]) {
    const sección = keys[0].replace('_', ' ')
    setSaving(sección)
    try {
      const data = Object.fromEntries(keys.map(k => [k, config[k] ?? '']))
      await patchSiteConfig(data)
      setToast('Guardado correctamente')
      setTimeout(() => setToast(''), 3000)
    } catch {
      setToast('Error al guardar')
      setTimeout(() => setToast(''), 3000)
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, padding: 32 }}>Cargando…</p>

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Configuración</div>
          <div className="admin-page-subtitle">Imágenes y ajustes generales del sitio</div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: '#1a1a1a',
          color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14, zIndex: 1000,
        }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Sección: Imágenes del sitio */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 2px 8px rgba(135,43,19,.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, color: 'var(--color-brown)' }}>
            Imágenes del sitio
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ImageUploader
              value={config.hero_image ?? ''}
              onChange={url => set('hero_image', url)}
              label="Imagen principal (Hero)"
            />
            <ImageUploader
              value={config.about_image ?? ''}
              onChange={url => set('about_image', url)}
              label="Foto sección Sobre Nosotros"
            />
          </div>
          <div style={{ marginTop: 24 }}>
            <button
              className="btn-primary"
              onClick={() => guardar(['hero_image', 'about_image'])}
              disabled={saving === 'hero_image'}
            >
              {saving === 'hero_image' ? 'Guardando…' : 'Guardar imágenes'}
            </button>
          </div>
        </div>

        {/* Sección: Notificaciones */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 2px 8px rgba(135,43,19,.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, color: 'var(--color-brown)' }}>
            Notificaciones
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="admin-field-label">Email del administrador</div>
              <input
                className="admin-input"
                type="email"
                value={config.admin_email ?? ''}
                onChange={e => set('admin_email', e.target.value)}
                placeholder="admin@vuelocarmesi.com"
                style={{ maxWidth: 360 }}
              />
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Recibe alertas de nuevas reservas, pedidos y mensajes de contacto
              </div>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <button
              className="btn-primary"
              onClick={() => guardar(['admin_email'])}
              disabled={saving === 'admin_email'}
            >
              {saving === 'admin_email' ? 'Guardando…' : 'Guardar notificaciones'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Paso 2: Actualizar Hero para soportar imagen real**

Reemplazar el bloque del placeholder en `front/components/layout/Hero.tsx`. El componente ya tiene una prop `imagen?: string` en la interfaz. Reemplazar el bloque `{/* placeholder... */}` con:

```typescript
        {imagen ? (
          <div style={{
            flex: '1 1 300px', height: '280px', borderRadius: '12px',
            overflow: 'hidden', boxShadow: '0 4px 16px rgba(135, 43, 19, 0.16)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagen} alt="Vuelo Carmesí" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{
            flex: '1 1 300px', height: '280px', borderRadius: '12px',
            overflow: 'hidden', boxShadow: '0 4px 16px rgba(135, 43, 19, 0.16)',
            background: 'repeating-linear-gradient(135deg, #F0D6A8 0 14px, #E9CB97 14px 28px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'monospace', fontSize: '12px', letterSpacing: '1px',
              color: 'rgba(135, 43, 19, 0.5)', textTransform: 'uppercase' as const,
            }}>
              FOTO · MAZORCA ABIERTA
            </span>
          </div>
        )}
```

También actualizar la destructuración de props para incluir `imagen`:
```typescript
export default function Hero({ titulo, subtitulo, ctaTexto, ctaHref, imagen }: HeroProps) {
```

- [ ] **Paso 3: Pasar hero_image al componente Hero en la landing**

En `front/app/(public)/(landing)/page.tsx`, agregar la importación y el fetch de config:

```typescript
import { getSiteConfig } from '@/lib/api/site-config'
```

Convertir el page en async y obtener el config:
```typescript
export default async function LandingPage() {
  const config = await getSiteConfig()
  // ... resto del código existente
```

En donde se use el componente `<Hero .../>`, agregar la prop `imagen`:
```typescript
<Hero
  titulo="..."
  subtitulo="..."
  ctaTexto="..."
  ctaHref="..."
  imagen={config.hero_image || undefined}
/>
```

- [ ] **Paso 4: Probar flujo completo**

1. Ir a `/admin/config`
2. Subir una imagen en "Imagen principal (Hero)"
3. Hacer clic en "Guardar imágenes" — debe aparecer el toast "Guardado correctamente"
4. Ir a `http://localhost:3000` — la landing debe mostrar la imagen subida en el Hero

- [ ] **Paso 5: Commit final**

```bash
git add front/app/admin/(protected)/config/page.tsx front/components/layout/Hero.tsx front/app/(public)/(landing)/page.tsx
git commit -m "feat: admin Config page + Hero con imagen dinámica desde SiteConfig"
```

---

## Auto-revisión del plan

**Cobertura de criterios de aceptación del spec:**

| Criterio | Tarea |
|---|---|
| `POST /contacto` guarda y responde 201 | T4 |
| Cliente recibe email al reservar | T5 |
| Cliente recibe email al pedir | T5 |
| Admin recibe email al llegar reserva/pedido/mensaje | T3, T4, T5 |
| Equipo recibe Telegram al llegar reserva/pedido/mensaje | T3, T4, T5 |
| Admin sube imagen desde modal Experiencia | T8 |
| Admin sube imagen desde modal Producto | T8 |
| Admin actualiza imagen Hero desde `/admin/config` | T10 |
| Landing muestra imagen Hero configurada | T10 |
| Botón "Nuevo Producto" funciona | T1 |
| Precios en seed y mocks en COP | T1 (mocks — seed ya estaba en COP) |
| Fallo de notificación NO impide crear reserva/pedido | T5 (fire-and-forget) |

**Todos los criterios cubiertos. Sin placeholders, sin TBDs.**
