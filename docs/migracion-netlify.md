# Migración del front de Vercel a Netlify

El plan Hobby de Vercel es solo para uso no comercial, y el sitio vende y cobra.
El plan gratuito de Netlify permite uso comercial, pero tiene un límite fijo de
**300 créditos al mes**: si se acaban, **el sitio se pausa** («Site not available»)
hasta el mes siguiente o hasta pasar a Pro.

Lo que no cambia: el backend sigue en Render, la base en Neon, las imágenes del
panel en Cloudinary, el correo en Resend y el DNS en Cloudflare.

## Presupuesto de créditos

Medido en Vercel del 5 de septiembre al 5 de octubre de 2026:

| Concepto | Tarifa | Uso | Créditos/mes |
|---|---|---|---|
| Deploys a producción | 15 c/u | 6 a 8 (moderados) | 90–120 |
| Bandwidth | 20 por GB | 0,65 GB | ~13 |
| Peticiones | 2 por 10.000 | 43.000 | ~9 |
| Cómputo (funciones) | 10 por GB-hora | 54.000 invocaciones | 30–75 (estimado) |
| **Total** | | | **~140–215** |

**Lo que más gasta son los deploys.** Reglas para no pasarse:

- Probar en el *branch deploy* de `Yeison_DEV`, que no gasta créditos, y hacer merge a `main` por lotes (una o dos veces por semana).
- `front/netlify.toml` salta el build cuando un merge no toca el front.
- Cambiar una variable de entorno exige redeploy: agrupar esos cambios.
- Revisar el consumo en *Netlify → Usage* cada semana el primer mes.

## Fase 1 — Código (hecho en el PR de la migración)

- `front/netlify.toml`: build del monorepo, Node 22, salto de builds que no tocan el front y caché de un año para `/images`, `/certificaciones` y `/fonts` (Netlify no aplica a `public/` la regla de `next.config.ts`).
- `back/src/main.ts`: `CORS_ORIGENES_EXTRA` deja que el `*.netlify.app` use los formularios mientras se prueba.

## Fase 2 — Crear el sitio y probarlo (sin tocar el dominio)

1. En Netlify: *Add new project → Import an existing project → GitHub →* `YEENDJ/VueloCarmesi`.
2. Configuración del build:
   - **Branch to deploy:** `main`
   - **Base directory:** vacío (la raíz)
   - **Package directory:** `front`
   - El resto lo lee de `front/netlify.toml`. Si el panel muestra otro comando o directorio de publicación, deben quedar `npm run build:front` y `front/.next`.
3. **Variables de entorno**, en *Project configuration → Environment variables*:

   | Variable | Valor | De dónde sacarlo |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | `https://vuelocarmesi.onrender.com` | El mismo de Vercel |
   | `NEXT_PUBLIC_SITE_URL` | `https://www.vuelocarmesi.com` desde el primer deploy | Solo afecta SEO (canonical, hreflang, sitemap, JSON-LD). Así la copia `*.netlify.app` se declara duplicado del sitio real y no hace falta redeployar al mover el dominio. No es secreta |
   | `ADMIN_PASSWORD` | La del panel | La conocen |
   | `ADMIN_SESSION_SECRET` | La de Vercel o una nueva | Si Vercel la oculta como *Sensitive*, generar otra: solo cierra las sesiones abiertas |
   | `ADMIN_API_KEY` | **La misma de Render** | Render la muestra en *Environment* |
   | `CRON_SECRET` | La de Vercel o una nueva | Si es nueva, actualizar también la cabecera del trabajo en cron-job.org |

   Para generar una clave nueva:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

4. **Deploy.** El primero gasta 15 créditos.
5. **Quitar la protección de acceso.** Netlify activa por defecto en los proyectos nuevos una protección que responde 401 y pide iniciar sesión en Netlify a todo el que entra. Se apaga en *Project configuration → Access & security → Visitor access* → público. Aplica al momento, sin redeploy. **Si queda activa al mover el dominio, nadie ve el sitio** y cron-job.org recibe 401.
6. **En Render:** poner `CORS_ORIGENES_EXTRA=https://<sitio>.netlify.app` y guardar con redeploy.
7. **Probar en `https://<sitio>.netlify.app`:**
   - [ ] Portada, experiencias, una ficha, tienda y grupos, en `/es` y `/en`
   - [ ] Formularios de contacto, grupos y reserva: llega el acuse y el aviso de Telegram
   - [ ] Checkout hasta la pantalla de Wompi (**no pagar** en producción)
   - [ ] Panel: login, editar una experiencia y ver el cambio en la ficha pública **y en la portada** en menos de un minuto (revalidación). Lo mismo con un producto y con Configuración (foto del hero)
   - [ ] Portada cacheada: la segunda petición a `/` trae `Cache-Status: "Netlify Durable"; hit` o `"Netlify Edge"; hit`
   - [ ] Panel: subir una imagen
   - [ ] Cron: `curl -H "Authorization: Bearer <CRON_SECRET>" https://<sitio>.netlify.app/api/cron/pagos` responde sin 401
   - [ ] Cabeceras: `curl -I https://<sitio>.netlify.app/es` trae `Content-Security-Policy`; `curl -I` a una imagen de `/images/` trae `max-age=31536000, immutable`

## Fase 3 — Mover el dominio

Hacerlo en un horario de poco tráfico: entre el cambio de DNS y el certificado
nuevo puede haber unos minutos de errores de HTTPS.

1. En Netlify: *Domain management → Add a domain →* `www.vuelocarmesi.com`. Netlify agrega también el apex. Marcar `www` como **primary domain**, para que el apex redirija a `www`.
2. En **Cloudflare → DNS**, editar los dos registros, siempre en **Solo DNS** (nube gris):
   - `A` `@` → `75.2.60.5` (antes `216.198.79.1`, Vercel)
   - `CNAME` `www` → `<sitio>.netlify.app` (antes `…vercel-dns-017.com`)
   - No tocar `send`, `rsend`, `resend._domainkey`, `_dmarc`, los MX ni los TXT de la raíz.
3. En Netlify: esperar a que *HTTPS* muestre el certificado emitido (*Verify DNS configuration* si hace falta).
4. Comprobar `https://www.vuelocarmesi.com` y `https://vuelocarmesi.com` (debe redirigir a `www`), un formulario y el panel.
5. En Render: vaciar `CORS_ORIGENES_EXTRA` y redeploy.
6. cron-job.org sigue llamando a `https://www.vuelocarmesi.com/api/cron/pagos`. **Si en Netlify se usó un `CRON_SECRET` nuevo, actualizar ahora la cabecera `Authorization: Bearer …` del trabajo**, no antes: mientras el dominio apunte a Vercel, la cabecera tiene que llevar el secreto viejo. Revisar que la siguiente ejecución salga bien.

**Volver atrás** si algo falla: restaurar los dos registros de Cloudflare a los valores de Vercel. Con TTL Auto se nota en unos 5 minutos, y el proyecto de Vercel sigue intacto.

## Fase 4 — Cerrar

Después de unos días sin problemas:

1. En Vercel: quitar los dominios del proyecto y desconectar el repo de Git para que no siga desplegando. Borrar el proyecto cuando ya no haga falta como respaldo.
2. Actualizar la tabla de despliegues del README, `back/AGENTS.md` («el front en Vercel») y los comentarios de `front/.env.example` que nombran Vercel.
3. Anotar Netlify en el Mapa de cuentas (cuenta, plan y fecha).
