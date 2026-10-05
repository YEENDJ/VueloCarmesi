# Front en Netlify: respaldo listo para Vercel

## Situación (5 de octubre de 2026)

- **El sitio lo sirve Vercel** (plan Hobby). Ese plan es solo para uso no
  comercial y el sitio vende y cobra: Vercel puede pausarlo **sin avisar**, y
  los visitantes verían `503 DEPLOYMENT_PAUSED`.
- **Netlify queda como respaldo probado y en espera.** El código de `main` es el
  mismo para los dos. En Netlify están creado el sitio, las variables, el build
  y la purga del CDN. Los builds están **detenidos**, así que no gasta créditos.
- Si Vercel pausa el sitio, se sigue el [plan de emergencia](#plan-de-emergencia):
  unos **15 a 20 minutos** con el sitio caído.
- Si se decide migrar con calma, es el mismo plan a una hora de poco tráfico.

Lo que no depende de Vercel y sigue funcionando durante una pausa: backend
(Render), base (Neon), imágenes del panel (Cloudinary), correo (Resend), DNS y
buzones (Cloudflare). Los pagos de Wompi quedan registrados porque el webhook
va al backend, pero el cliente vuelve del pago a una página caída. Tampoco
funcionan el panel (`/admin` vive en el front) ni el cron de pagos.

## Cómo enterarse

- Un correo de Vercel avisando la pausa, a la cuenta del proyecto.
- `https://www.vuelocarmesi.com` responde `503` con `DEPLOYMENT_PAUSED`.

## Plan de emergencia

Todo en este orden. Las cuentas: Netlify (*yeisonenciso-dev's team*, sitio
**peppy-meringue-52cfd3**), Cloudflare (DNS de `vuelocarmesi.com`) y Render
(backend).

1. **Netlify → reactivar los builds.** *Project configuration → Build & deploy →
   Continuous deployment → Build settings → Configure → Build status: Active
   builds → Save*.
2. **Netlify → deploy de producción.** *Deploys → Trigger deploy → Deploy
   project*. Esperar a que diga *Published* (~1 a 2 min). Gasta 15 créditos.
   - [ ] `https://peppy-meringue-52cfd3.netlify.app` carga la portada y `/experiencias` muestra las experiencias.
3. **Netlify → dominio.** Si no se agregó en la [preparación](#preparación-una-sola-vez):
   *Domain management → Add a domain →* `www.vuelocarmesi.com`. Netlify agrega
   también el apex. `www` debe quedar como **primary domain**.
4. **Cloudflare → DNS de `vuelocarmesi.com`.** Editar **solo** estos dos
   registros, los dos en **Solo DNS** (nube gris):

   | Registro | Valor de Vercel (para volver atrás) | Valor de Netlify |
   |---|---|---|
   | `A` `@` | `216.198.79.1` | `75.2.60.5` |
   | `CNAME` `www` | `c195e8280cddfe6b.vercel-dns-017.com` | `peppy-meringue-52cfd3.netlify.app` |

   **No tocar** `send`, `rsend`, `resend._domainkey`, `_dmarc` (Resend), los
   MX ni los TXT de la raíz (Email Routing y Search Console).
5. **Netlify → HTTPS.** En *Domain management → HTTPS*, esperar a que el
   certificado diga emitido. Si no avanza en unos minutos: *Verify DNS
   configuration*. Mientras tanto el sitio puede dar error de certificado.
6. **Comprobar:**
   - [ ] `https://www.vuelocarmesi.com` carga, y `https://vuelocarmesi.com` redirige a `www`
   - [ ] El formulario de contacto envía y llega el aviso de Telegram
   - [ ] El panel entra y carga las listas
   - [ ] La siguiente ejecución de cron-job.org sale bien (no hace falta cambiarle nada: usa el mismo `CRON_SECRET` que Netlify)
7. **Avisar** a quien use el panel: **las sesiones abiertas se cerraron**, hay que volver a entrar.

**Volver a Vercel** (por ejemplo, si reactivan la cuenta o algo falla en Netlify):
restaurar los dos registros de Cloudflare a los valores de Vercel de la tabla.
Con TTL Auto se nota en unos 5 minutos.

**Después de la emergencia,** con calma: [cerrar Vercel](#cerrar-vercel) y
revisar el consumo en *Netlify → Usage* cada semana el primer mes.

## Preparación (una sola vez)

Para que el día de la emergencia sean solo los pasos de arriba:

- [ ] **Dominio pre-agregado en Netlify** (paso 3 del plan). Queda «pendiente de DNS» sin afectar a Vercel.
- [ ] **Render:** vaciar `CORS_ORIGENES_EXTRA`. Solo hacía falta para probar en las Deploy Previews.
- [ ] **Netlify → Visitor access:** *Private* + *Previews only*. Producción pública, previews privadas. Si producción queda privada, nadie ve el sitio y cron-job.org recibe 401.
- [ ] **Netlify → `ADMIN_SESSION_SECRET` nuevo.** Una cookie de sesión de las pruebas quedó expuesta. Se aplica en el próximo deploy, que será el de la emergencia (por eso el paso 7 del plan).
- [ ] **Builds detenidos** (*Stopped builds*).

## Mantener el respaldo vigente

Con los builds detenidos, Netlify no ve los cambios nuevos de `main`. El riesgo
es descubrir en plena emergencia que algo nuevo no funciona allí. Para evitarlo:

- **En cada PR que toque `front/`:** activar los builds mientras el PR está
  abierto, revisar su *Deploy Preview* (gratis), y **detenerlos antes de
  mergear**. El merge a `main` con builds activos gasta 15 créditos.
- Si un mes no hubo PRs así, no hace falta nada: el código de Netlify es el
  último que se probó.
- Una Deploy Preview necesita el CORS para probar formularios y panel:
  `CORS_ORIGENES_EXTRA=https://deploy-preview-<N>--peppy-meringue-52cfd3.netlify.app`
  en Render, y vaciarlo al terminar.

## Lo que está resuelto en el código

- `front/netlify.toml`: build del monorepo (Base directory vacío, Package
  directory `front`), Node 22, `ignore` para no construir el front cuando un
  merge no lo toca, y caché de un año para `/images`, `/certificaciones` y
  `/fonts` (Netlify no aplica a `public/` la regla de `next.config.ts`).
- `front/app/[locale]/(public)/layout.tsx`: fija el idioma para next-intl. Sin
  eso las páginas públicas se generaban en cada visita; ahora son estáticas con
  revalidación (60 s; 300 s en *nosotros*).
- `front/app/actions/revalidate.ts`: al guardar en el panel purga el CDN de
  Netlify con `purgeCache` (`@netlify/functions`). Sin eso el cambio tardaba
  hasta 60 s: `updateTag`, `revalidatePath` y `revalidateTag` no llegan a su
  CDN, tampoco con Next 16.3.8. Medido: con la purga, el cambio se ve en menos
  de 5 s. En Vercel no hace nada.
- `back/src/main.ts`: `CORS_ORIGENES_EXTRA` para probar en las Deploy Previews.

## Variables de entorno en Netlify

Las mismas 6 de Vercel:

| Variable | Valor | Secreta |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://vuelocarmesi.onrender.com` | No: va incrustada en el JS. Marcarla secreta hace fallar el build |
| `NEXT_PUBLIC_SITE_URL` | `https://www.vuelocarmesi.com` | No |
| `ADMIN_PASSWORD` | La del panel | Sí |
| `ADMIN_SESSION_SECRET` | Propia de Netlify (cambiarla cierra las sesiones) | Sí |
| `ADMIN_API_KEY` | **La misma de Render**; si no, el panel responde 401 | Sí |
| `CRON_SECRET` | La misma de Vercel y de cron-job.org | Sí |

Las secretas quedan con ámbitos *Builds*, *Functions* y *Runtime* y todos los
contextos menos *Local development*, que es lo que Netlify fuerza. Para generar
una clave: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

**Pendiente:** el `CRON_SECRET` quedó expuesto durante las pruebas. Rotarlo
cuando el sitio esté en Netlify: valor nuevo en Netlify (con deploy) y en la
cabecera `Authorization: Bearer …` de cron-job.org, a la vez.

## Créditos de Netlify

Plan gratuito: **300 créditos al mes, límite fijo**. Si se acaban, **el sitio se
pausa** hasta el mes siguiente o hasta pasar a Pro. Estimado con el uso medido
en Vercel (5 de septiembre a 5 de octubre de 2026):

| Concepto | Tarifa | Uso | Créditos/mes |
|---|---|---|---|
| Deploys a producción | 15 c/u | 6 a 8 (moderados) | 90–120 |
| Bandwidth | 20 por GB | 0,65 GB | ~13 |
| Peticiones | 2 por 10.000 | 43.000 | ~9 |
| Cómputo | 10 por GB-hora | menos desde que las páginas son estáticas | 30–75 |
| **Total** | | | **~140–215** |

Lo que más gasta son los deploys: probar en Deploy Previews (gratis), mergear a
`main` por lotes y agrupar los cambios de variables de entorno.

## Cerrar Vercel

Unos días después de pasar a Netlify sin problemas:

1. En Vercel: quitar los dominios del proyecto y desconectar el repo de Git. Borrar el proyecto cuando ya no haga falta como respaldo.
2. Actualizar la tabla de despliegues del README, `back/AGENTS.md` y `front/AGENTS.md` («el front en Vercel»), y los comentarios de `front/.env.example` que nombran Vercel.
3. Rotar `CRON_SECRET` (ver arriba).
4. Anotar Netlify en el Mapa de cuentas: cuenta, plan y fecha.
