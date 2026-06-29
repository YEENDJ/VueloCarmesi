# Spec: Vuelo Carmesí — Operación sin fricción

**Fecha:** 2026-06-28  
**Estado:** Aprobado  
**Branch activo:** `Yeison_DEV`

---

## 1. Contexto

Vuelo Carmesí es un negocio colombiano de agroturismo (experiencias de cacao y café) con tienda online de productos derivados. El proyecto está al 70% de completitud: el backend con sus 4 módulos CRUD (Experiencias, Reservas, Productos, Pedidos) y el panel de administración funcionan. Lo que falta son los servicios de comunicación y la gestión de activos visuales que hacen que la operación diaria sea autónoma.

**Pasarela de pago:** diferida para una etapa posterior.

---

## 2. Alcance — Módulos a construir

| # | Módulo | Tipo | Prioridad |
|---|---|---|---|
| 1 | `ContactoModule` | back + front | Alta |
| 2 | `NotificacionesModule` | back | Alta |
| 3 | `UploadsModule` | back + front | Alta |
| 4 | `SiteConfigModule` | back + front | Media |
| 5 | Fixes menores | back + front | Media |

---

## 3. Arquitectura general

### Nuevos módulos en NestJS (`back/src/`)

```
back/src/
├── notificaciones/
│   ├── notificaciones.module.ts
│   ├── notificaciones.service.ts   ← orquesta email + Telegram
│   ├── email.service.ts            ← Resend SDK
│   ├── telegram.service.ts         ← Telegram Bot API (HTTP nativo)
│   └── templates/
│       ├── confirmacion-reserva.html
│       ├── confirmacion-pedido.html
│       ├── contacto-recibido.html
│       └── alerta-admin.html
│
├── uploads/
│   ├── uploads.module.ts
│   ├── uploads.controller.ts       ← POST /uploads/image
│   └── uploads.service.ts          ← Cloudinary SDK
│
├── contacto/
│   ├── contacto.module.ts
│   ├── contacto.controller.ts      ← POST /contacto
│   ├── contacto.service.ts
│   └── dto/create-contacto.dto.ts
│
└── site-config/
    ├── site-config.module.ts
    ├── site-config.controller.ts   ← GET /site-config, PUT /site-config/:key
    └── site-config.service.ts
```

### Módulos existentes que se modifican

- `ReservasModule` — inyecta `NotificacionesModule`, dispara notificaciones al crear reserva
- `PedidosModule` — inyecta `NotificacionesModule`, dispara notificaciones al crear pedido
- `AppModule` — registra los 4 módulos nuevos

### Cambios en el frontend (`front/`)

- `app/(public)/(landing)/contacto/page.tsx` — conectar al endpoint existente
- `app/admin/(protected)/config/page.tsx` — reemplazar placeholder con formulario real
- `components/secciones/ExperienciaFormModal` — agregar upload de imagen
- `components/secciones/ProductoFormModal` — agregar upload de imagen
- `components/layout/Hero.tsx` — leer `hero_image` de SiteConfig
- `lib/api/site-config.ts` — nuevo cliente para SiteConfig
- `lib/admin/api.ts` — agregar métodos para uploads y site-config

---

## 4. Módulo 1: ContactoModule

### Prisma Schema (adición)

```prisma
model Contacto {
  id        String   @id @default(cuid())
  nombre    String
  email     String
  mensaje   String
  createdAt DateTime @default(now())
}
```

### DTO

```typescript
// create-contacto.dto.ts
export class CreateContactoDto {
  @IsString() @IsNotEmpty() nombre: string
  @IsEmail() email: string
  @IsString() @IsNotEmpty() mensaje: string
}
```

### Endpoint

`POST /contacto`
- Body: `CreateContactoDto`
- Guarda en BD
- Dispara `notificaciones.enviarNuevoContacto(contacto)` — fire-and-forget
- Responde `201 { id, createdAt }`

### Frontend

`contacto/page.tsx` — el formulario ya existe. Se agrega:
- `fetch(`${API_URL}/contacto`, { method: 'POST', body: JSON.stringify(data) })`
- Estado de carga (`loading`) durante el envío
- Estado de éxito: mostrar mensaje de confirmación
- Estado de error: mostrar error genérico, conservar los datos del formulario

---

## 5. Módulo 2: NotificacionesModule

### Proveedor de email: Resend

- SDK: `resend` (npm)
- Plan gratuito: 3,000 emails/mes — suficiente para arrancar
- Variables de entorno: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

### Patrón fire-and-forget

Todas las llamadas a `NotificacionesService` desde otros servicios usan este patrón:

```typescript
// En ReservasService.create()
const reserva = await this.prisma.reserva.create({ data })

this.notificaciones
  .enviarConfirmacionReserva(reserva)
  .catch(err => this.logger.error('Notificación fallida', err))

return reserva
```

La operación de negocio **nunca falla** por causa de una notificación.

### Emails enviados

| Método | Destinatario | Trigger |
|---|---|---|
| `enviarConfirmacionReserva(reserva)` | Cliente + Admin | `POST /reservas` |
| `enviarConfirmacionPedido(pedido)` | Cliente + Admin | `POST /pedidos` |
| `enviarNuevoContacto(contacto)` | Cliente + Admin | `POST /contacto` |

#### Template: confirmacion-reserva.html (ejemplo de estructura)
- Saludo con nombre del cliente
- Detalles: experiencia, fecha, cantidad de personas
- Total / monto a cancelar (si aplica)
- Datos de contacto de Vuelo Carmesí
- Footer con logo y dirección (Colombia)

#### Template: alerta-admin.html (reutilizable con datos inyectados)
- Título: "Nueva [Reserva | Pedido | Consulta]"
- Tabla con todos los campos relevantes
- Link directo al panel admin correspondiente

### Telegram

- Variables: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- Implementación: `fetch` nativo a `https://api.telegram.org/bot{TOKEN}/sendMessage`
- Sin librerías extra — más liviano y menos dependencias
- Mensaje formato Markdown:
  ```
  📅 *Nueva Reserva*
  Nombre: Juan García
  Email: juan@email.com
  Experiencia: Ruta del Cacao
  Fecha: 2026-07-15
  Personas: 3
  ```

---

## 6. Módulo 3: UploadsModule

### Variables de entorno

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Endpoint

`POST /uploads/image`
- Autenticación: requiere cookie de admin (`adminToken`)
- Content-Type: `multipart/form-data`, campo `file`
- Límite de tamaño: 5 MB
- Tipos aceptados: `image/jpeg`, `image/png`, `image/webp`
- Cloudinary `folder`: `vuelo-carmesi/`
- Respuesta: `{ url: string, publicId: string }`
- Error 400 si el archivo no es imagen válida

### Implementación

```typescript
// uploads.service.ts
import { v2 as cloudinary } from 'cloudinary'

async uploadImage(buffer: Buffer, mimetype: string) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'vuelo-carmesi', resource_type: 'image' },
      (error, result) => error ? reject(error) : resolve(result)
    )
    stream.end(buffer)
  })
}
```

### Frontend — upload en modales del admin

Componente reutilizable `ImageUploader`:
- `<input type="file" accept="image/*">` con preview
- Al seleccionar: llama `POST /uploads/image`
- Muestra spinner durante la subida
- Al éxito: almacena la URL en el estado del formulario padre
- Al error: muestra mensaje de error, permite reintentar
- Se usa en: `ExperienciaFormModal`, `ProductoFormModal`, `admin/config/page.tsx`

---

## 7. Módulo 4: SiteConfigModule

### Prisma Schema (adición)

```prisma
model SiteConfig {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

### Claves iniciales (seed)

| key | value | Descripción |
|---|---|---|
| `hero_image` | `""` | URL de la imagen principal del Hero |
| `about_image` | `""` | Foto de la sección Sobre Nosotros |
| `gallery_images` | `"[]"` | JSON array de URLs para galería |
| `admin_email` | `""` | Email del admin para recibir notificaciones |
| `telegram_chat_id` | `""` | Chat ID del equipo (override de env var) |

### Endpoints

`GET /site-config` — público, devuelve `{ [key]: value }` para que el frontend los lea  
`PATCH /site-config` — protegido (admin cookie), body `{ [key]: value, ... }` actualiza uno o más valores en una sola llamada

### Frontend

`admin/config/page.tsx` — reemplazar placeholder con:
- Sección "Imágenes del sitio": Hero, About, galería (cada uno con `ImageUploader`)
- Sección "Notificaciones": email de admin, Telegram chat ID override
- Botón "Guardar cambios" por sección
- Toast de confirmación al guardar

`components/layout/Hero.tsx` — leer `hero_image` de SiteConfig:
```typescript
// En el page de la landing
const config = await getSiteConfig()
// Pasar hero_image a Hero component
```

---

## 8. Módulo 5: Fixes menores

### Botón "Nuevo Producto" deshabilitado

`front/app/admin/(protected)/productos/page.tsx` — eliminar el atributo `disabled` y el `title="Próximamente"`. El CRUD de productos ya funciona completamente en el backend.

### Seed data en COP

`back/prisma/seed.ts` — verificar que los precios estén en pesos colombianos (COP). Si están en ARS, actualizarlos con valores representativos en COP:
- Experiencias: rango COP 50,000 – 200,000
- Productos: rango COP 15,000 – 80,000

### Mock data en frontend

`front/lib/api/experiencias.ts` y `productos.ts` — actualizar los mocks hardcodeados con precios en COP y teléfonos con prefijo `+57`.

---

## 9. Variables de entorno requeridas (nuevas)

```env
# Resend (email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=hola@vuelocarmesi.com

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Admin (ya existe pero documentado)
ADMIN_PASSWORD=
ADMIN_EMAIL=
```

---

## 10. Estimación de trabajo

| Módulo | Estimado |
|---|---|
| ContactoModule (back + front) | 0.5 días |
| NotificacionesModule (email + Telegram + templates) | 1.5 días |
| UploadsModule (Cloudinary + frontend component) | 1 día |
| SiteConfigModule (back + admin config page) | 1 día |
| Fixes menores (botón, seed COP, mocks) | 0.5 días |
| **Total** | **~4.5 días** |

---

## 11. Criterios de aceptación

- [ ] `POST /contacto` guarda el mensaje y responde 201
- [ ] Cliente recibe email de confirmación al hacer una reserva
- [ ] Cliente recibe email de confirmación al hacer un pedido
- [ ] Admin recibe email al llegar una nueva reserva, pedido o mensaje
- [ ] Equipo recibe mensaje de Telegram al llegar una nueva reserva, pedido o mensaje
- [ ] Admin puede subir imagen desde el modal de Experiencia y queda guardada en Cloudinary
- [ ] Admin puede subir imagen desde el modal de Producto y queda guardada en Cloudinary
- [ ] Admin puede actualizar imagen del Hero desde `/admin/config`
- [ ] La landing muestra la imagen del Hero configurada en admin
- [ ] Botón "Nuevo Producto" en admin funciona (no está disabled)
- [ ] Precios en seed y mocks están en COP
- [ ] Un fallo de email/Telegram NO impide que una reserva o pedido se cree exitosamente
