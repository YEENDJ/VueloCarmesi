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

- Probar en la *Deploy Preview* del PR o en un *branch deploy*, que no gastan créditos, y hacer merge a `main` por lotes (una o dos veces por semana).
- `front/netlify.toml` salta el build cuando un merge no toca el front.
- Cambiar una variable de entorno exige redeploy: agrupar esos cambios.
- Revisar el consumo en *Netlify → Usage* cada semana el primer mes.

## Fase 1 — Código (hecho en el PR de la migración)

- `front/netlify.toml`: build del monorepo, Node 22, salto de builds que no tocan el front y caché de un año para `/images`, `/certificaciones` y `/fonts` (Netlify no aplica a `public/` la regla de `next.config.ts`).
- `back/src/main.ts`: `CORS_ORIGENES_EXTRA` deja que el `*.netlify.app` use los formularios mientras se prueba.
- `front/app/[locale]/(public)/layout.tsx`: fija el idioma para next-intl. Sin eso todas las páginas públicas se generaban en cada visita (~1 s la portada en Netlify); ahora son estáticas con revalidación, lo que además ahorra créditos de cómputo.
- Se retiró la ruta `/portafolio`, que respondía 404 en producción.

## Fase 2 — Crear el sitio (hecho el 5 de octubre de 2026)

Sitio **peppy-meringue-52cfd3** en el equipo *yeisonenciso-dev's team*,
conectado a `YEENDJ/VueloCarmesi`, rama de producción `main`. El primer deploy
gastó 15 créditos.

- **Build:** Base directory vacío, Package directory `front`. El resto sale de `front/netlify.toml`.
- **Visibilidad:** *Project configuration → Access & security → Visitor access*. Netlify crea los proyectos nuevos en **privado** (todo responde 401 y pide iniciar sesión en Netlify); se dejó en *Private* + *Previews only*: producción pública, previews privadas. **Si producción queda privada al mover el dominio, nadie ve el sitio** y cron-job.org recibe 401.
- **Variables de entorno** (las mismas 6 de Vercel):

  | Variable | Valor | Secreta |
  |---|---|---|
  | `NEXT_PUBLIC_API_URL` | `https://vuelocarmesi.onrender.com` | No (va incrustada en el JS) |
  | `NEXT_PUBLIC_SITE_URL` | `https://www.vuelocarmesi.com` | No. Solo afecta SEO: la copia se declara duplicado del sitio real |
  | `ADMIN_PASSWORD` | La del panel | Sí |
  | `ADMIN_SESSION_SECRET` | Nueva (cambiarla solo cierra sesiones) | Sí |
  | `ADMIN_API_KEY` | **La misma de Render** (*Environment* del backend) | Sí |
  | `CRON_SECRET` | Nueva | Sí |

  Las secretas quedan con ámbitos *Builds*, *Functions* y *Runtime* y todos los contextos menos *Local development*: es lo que Netlify fuerza para los secretos. Para generar una clave:
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

## Fase 3 — Probar sin gastar créditos

Las *Deploy Previews* (una por PR) y los *branch deploys* **no gastan créditos**;
solo los deploys a producción. Se prueba en la preview del PR y se detienen los
builds antes de mergear, para que el merge a `main` no dispare un deploy pagado.

1. **Abrir el PR** de `Yeison_DEV` a `main`. Netlify construye la *Deploy Preview* sola: aparece como check en el PR y en *Netlify → Deploys*, con una URL tipo `https://deploy-preview-<N>--peppy-meringue-52cfd3.netlify.app`.
2. **Hacer pública la preview mientras se prueba** (opcional, para poder revisarla con `curl` o desde otro equipo): *Visitor access* → *Public* en *Production and previews*. Volver a *Private* + *Previews only* al terminar la fase.
3. **Probar en la preview lo que no necesita el backend nuevo:**
   - [ ] Portada, experiencias, una ficha, tienda y grupos, en español e inglés (`/en`)
   - [ ] `/portafolio` responde 404
   - [ ] Portada cacheada: la segunda petición a `/` trae `Cache-Status: … hit`
   - [ ] Una imagen de `/images/` trae `Cache-Control: public, max-age=31536000, immutable`
   - [ ] Panel: login, editar una experiencia y ver el cambio en la ficha y en la portada **al recargar**. Lo mismo con un producto y con Configuración (foto del hero). Si tarda, anotar cuánto: el respaldo es `revalidate = 60`
   - [ ] Panel: subir una imagen
4. **Detener los builds de Netlify:** *Project configuration → Build & deploy → Continuous deployment → Build settings → Configure → **Stop builds***. La preview ya construida sigue disponible.
5. **Mergear el PR.** Se despliegan Vercel (el sitio real, que también gana las páginas estáticas) y Render (el CORS). Netlify no construye nada.
   - [ ] En `www.vuelocarmesi.com` (Vercel): editar algo en el panel y verlo al recargar
6. **En Render:** `CORS_ORIGENES_EXTRA=https://deploy-preview-<N>--peppy-meringue-52cfd3.netlify.app` y guardar con redeploy.
7. **Probar en la preview lo que usa el backend.** Todo es real: misma base, mismos correos, mismo Telegram.
   - [ ] Formularios de contacto, grupos y reserva: llega el acuse y el aviso de Telegram
   - [ ] Checkout hasta la pantalla de Wompi (**no pagar**)
   - [ ] Cron: `curl -H "Authorization: Bearer <CRON_SECRET de Netlify>" https://deploy-preview-<N>--peppy-meringue-52cfd3.netlify.app/api/cron/pagos` responde sin 401

## Fase 4 — Mover el dominio

Hacerlo en un horario de poco tráfico: entre el cambio de DNS y el certificado
nuevo puede haber unos minutos de errores de HTTPS.

1. **Reactivar los builds** (*Build settings → Configure → Activate builds*) y en *Deploys → Trigger deploy → Deploy project*. Es el único deploy a producción de la migración: **15 créditos**. Esperar a que termine.
2. **Visibilidad:** confirmar *Private* + *Previews only* (producción pública).
3. En Netlify: *Domain management → Add a domain →* `www.vuelocarmesi.com`. Netlify agrega también el apex. Marcar `www` como **primary domain**, para que el apex redirija a `www`.
4. En **Cloudflare → DNS**, editar los dos registros, siempre en **Solo DNS** (nube gris):
   - `A` `@` → `75.2.60.5` (antes `216.198.79.1`, Vercel)
   - `CNAME` `www` → `peppy-meringue-52cfd3.netlify.app` (antes `…vercel-dns-017.com`)
   - No tocar `send`, `rsend`, `resend._domainkey`, `_dmarc`, los MX ni los TXT de la raíz.
5. En Netlify: esperar a que *HTTPS* muestre el certificado emitido (*Verify DNS configuration* si hace falta).
6. Comprobar `https://www.vuelocarmesi.com` y `https://vuelocarmesi.com` (debe redirigir a `www`), un formulario y el panel.
7. **cron-job.org:** actualizar la cabecera `Authorization: Bearer …` del trabajo con el `CRON_SECRET` de Netlify, ahora y no antes: mientras el dominio apuntaba a Vercel tenía que llevar el secreto viejo. Revisar que la siguiente ejecución salga bien.
8. En Render: vaciar `CORS_ORIGENES_EXTRA` y redeploy.

**Volver atrás** si algo falla: restaurar los dos registros de Cloudflare a los
valores de Vercel (y la cabecera de cron-job.org al secreto viejo). Con TTL Auto
se nota en unos 5 minutos, y el proyecto de Vercel sigue intacto.

## Fase 5 — Cerrar

Después de unos días sin problemas:

1. En Vercel: quitar los dominios del proyecto y desconectar el repo de Git para que no siga desplegando. Borrar el proyecto cuando ya no haga falta como respaldo.
2. Actualizar la tabla de despliegues del README, `back/AGENTS.md` («el front en Vercel») y los comentarios de `front/.env.example` que nombran Vercel.
3. Anotar Netlify en el Mapa de cuentas (cuenta, plan y fecha).
