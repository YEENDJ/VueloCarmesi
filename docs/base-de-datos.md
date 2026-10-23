# Base de datos: producción, reserva y respaldos

## Cómo está armado

| Pieza | Dónde | Para qué |
|---|---|---|
| **Producción** | Supabase (plan free), región `us-west-2` (Oregon, igual que Render) | La base que usa el sitio. `DATABASE_URL` de Render y de `back/.env` |
| **Reserva** | Neon (plan free) | Copia idéntica de producción, refrescada **cada 6 horas**. Nadie la usa: está lista para reemplazar a producción si cae |
| **Respaldos** | Backblaze B2, bucket privado | Una copia cifrada cada 6 horas, **30 días** de historia |

Las dos copias cubren problemas distintos:

| Problema | Se resuelve con | Tiempo | Se pierde |
|---|---|---|---|
| Supabase cae o pausa el proyecto | **Reserva** (Neon) | ~5 min | hasta 6 h de datos |
| Alguien borró o dañó datos | **Respaldo** (B2) | ~15 min | lo posterior al respaldo elegido |

La reserva solo guarda **la última** copia: un borrado que nadie note antes del
siguiente refresco pasa a la reserva también. Para eso está la historia de B2.

Todo lo hace el workflow [`respaldo-bd.yml`](../.github/workflows/respaldo-bd.yml)
con los scripts de [`scripts/bd/`](../scripts/bd/):

| Script | Hace |
|---|---|
| `respaldar.sh URL archivo.sql` | Copia el esquema `public` de una base |
| `restaurar.sh URL archivo.sql` | **Borra** `public` del destino y carga la copia, en una sola transacción |
| `verificar.sh URL archivo.sql` | Comprueba que cada tabla del destino tenga las mismas filas que la copia |

### Por qué se eligió así (octubre 2026)

- **Neon free** cobra el cómputo por horas: 100 CU-h al mes y, al agotarlas, la
  base **se suspende hasta el mes siguiente**. El cron de pagos (cada 15 min) la
  mantenía despierta ~8 h al día y se agotó. Como reserva casi no gasta: solo
  despierta unos minutos cada 6 h.
- **Supabase free** no cuenta horas: está siempre encendida. A cambio **no trae
  respaldos** (por eso B2) y **pausa el proyecto tras 7 días sin conexiones**. Lo
  evitan dos fuentes independientes: el cron de pagos (cada 15 min, vía Vercel y
  Render) y este workflow (cada 6 h, directo desde GitHub).
- En repos públicos, GitHub **desactiva los workflows programados tras 60 días
  sin commits**. Si el repo va a estar quieto tanto tiempo, entrar a *Actions* y
  volver a habilitarlo.

---

## Puesta en marcha (una sola vez)

### 1. Supabase

1. Crear el proyecto **cerca de Render, que está en Oregon (US West)**: elegir
   región específica *West US (Oregon)* o, si no aparece, *West US (North
   California)*. Si solo ofrece regiones generales, *Americas*. Cada consulta
   del backend viaja hasta la base: una región lejana suma ese viaje a todas.
   (Neon está en `us-east-1`, al otro lado del país.)
2. Guardar la contraseña de la base en el gestor de contraseñas.
3. **Desactivar la Data API**: *Project Settings → Data API → Enable Data API:
   off*. Si queda encendida, las tablas que crea Prisma (sin RLS) quedan
   expuestas por la API REST de Supabase a quien tenga la *anon key*.
4. *Connect → Connection string → **Session pooler***. Copiar esa URL, con la
   contraseña puesta. **No usar la conexión directa**: es solo IPv6 y ni Render
   ni GitHub Actions salen por IPv6.

### 2. Backblaze B2

(Se eligió B2 y no Cloudflare R2 porque R2 pide tarjeta de crédito aun en el
plan gratis. B2 da 10 GB sin tarjeta; los respaldos ocupan ~10 MB.)

1. *Buckets → Create a Bucket* → `vuelocarmesi-respaldos` (si el nombre está
   tomado, con un sufijo). **Private**, Object Lock **Disable**.
2. En el bucket: *Lifecycle Settings → Use custom lifecycle rules*: prefijo
   vacío, *Days till hide* **30**, *Days till delete* **1**.
3. Anotar el **Endpoint** que muestra el bucket (`s3.<región>.backblazeb2.com`).
4. *Application Keys → Add a New Application Key*: acceso **solo a ese bucket**,
   tipo **Write Only**. Anotar el *keyID* y la *applicationKey* (solo se
   muestra una vez). Con una llave de solo escritura, si el secret se filtra no
   se pueden leer ni borrar los respaldos. Para descargarlos se entra a la web
   de Backblaze con la cuenta.

### 3. Clave de cifrado

Generar una clave larga:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Guardarla en el **gestor de contraseñas, fuera de GitHub**. GitHub no deja leer
un secret después de guardarlo: sin una copia aparte, los respaldos no se pueden
abrir nunca.

### 4. GitHub

*Settings → Secrets and variables → Actions*.

**Secrets:**

| Nombre | Valor |
|---|---|
| `PROD_DATABASE_URL` | URL del *Session pooler* de Supabase |
| `RESERVA_DATABASE_URL` | URL **directa** de Neon: la de `back/.env` sin `-pooler` en el host. La restauración va en una sola transacción larga y es más segura sin el pooler de por medio |
| `RESPALDO_CLAVE` | La clave del paso 3 |
| `B2_ENDPOINT` | El endpoint del bucket, p. ej. `https://s3.us-west-004.backblazeb2.com` |
| `B2_BUCKET` | El nombre del bucket |
| `B2_KEY_ID` | El *keyID* de la llave |
| `B2_APPLICATION_KEY` | La *applicationKey* |

**Variables** (pestaña *Variables*): se crean **el día de la migración**, en el
último paso, no antes.

| Nombre | Valor |
|---|---|
| `RESPALDO_ACTIVO` | `true` |
| `RESERVA_ACTIVA` | `true` |

---

## Día de la migración (Neon → Supabase)

A una hora de poco tráfico. Unos 30 minutos.

Los pasos 2 a 4 necesitan Postgres 17 y bash. Si no están instalados, con
Docker sirve el mismo contenedor de la prueba:

```bash
docker run --rm -it -v "$PWD":/repo -w /repo postgres:17 bash
```

1. **cron-job.org:** pausar el cron de pagos. Sin él no entra ningún vencimiento
   a mitad de la copia.
2. Copiar Neon:
   ```bash
   bash scripts/bd/respaldar.sh "$NEON_URL" migracion.sql
   ```
3. Cargar en Supabase y verificar:
   ```bash
   bash scripts/bd/restaurar.sh "$SUPABASE_URL" migracion.sql
   bash scripts/bd/verificar.sh "$SUPABASE_URL" migracion.sql
   ```
   `verificar` tiene que terminar en *«Verificado: 15 tablas…»* (o las que haya).
4. Comprobar que Prisma ve todas las migraciones aplicadas:
   ```bash
   cd back && DATABASE_URL="$SUPABASE_URL" npx prisma migrate status
   ```
   Tiene que decir *Database schema is up to date*.
5. **Render:** cambiar `DATABASE_URL` a la de Supabase → se redespliega solo.
   Esperar a que el deploy quede *Live*.
6. Comprobar en el sitio:
   - [ ] `/experiencias` y `/tienda` cargan
   - [ ] El panel entra y guarda un cambio
   - [ ] El formulario de contacto llega a Telegram
7. **cron-job.org:** reactivar el cron. Que la siguiente ejecución salga bien.
8. **`back/.env` local:** cambiar `DATABASE_URL` a la de Supabase.
9. **GitHub:** crear las variables `RESPALDO_ACTIVO=true` y `RESERVA_ACTIVA=true`.
   *Actions → Respaldo de la base → Run workflow* y comprobar que:
   - [ ] todos los pasos salen en verde
   - [ ] el archivo aparece en el bucket de B2
10. Borrar `migracion.sql` del equipo: tiene datos de clientes sin cifrar.

Después, en el código: política de privacidad (es/en) y README dicen «Neon»;
pasan a decir Supabase.

### Volver atrás

Si algo falla antes del paso 9, Neon sigue intacta: en Render, devolver
`DATABASE_URL` a la de Neon. Lo que se haya escrito en Supabase mientras tanto
no pasa solo a Neon.

---

## Emergencias

### A. Supabase cayó o pausó el proyecto → pasar a la reserva

1. **Primero, GitHub:** variable `RESERVA_ACTIVA` → `false`. **Si no se apaga, el
   próximo respaldo pisa la reserva**, que ahora es producción, con la copia
   vieja de Supabase en cuanto Supabase vuelva.
2. **Render:** `DATABASE_URL` → la URL de Neon. Esperar el deploy.
3. Comprobar lo mismo que en el paso 6 de la migración.

Se pierden los pedidos y reservas de las últimas horas (hasta 6). Wompi los
tiene: revisar en su panel los pagos posteriores al último respaldo.

Mientras Neon sea producción vuelve a gastar cómputo como antes (las 100 CU-h).
Sirve para días, no para meses.

**Si solo se pausó:** se reactiva desde el panel de Supabase en unos minutos.
Muchas veces es más rápido que cambiar a la reserva.

**Volver a Supabase:** copiar Neon → Supabase con los pasos 1 a 7 de la
migración y luego volver a poner `RESERVA_ACTIVA=true`.

### B. Se borraron o dañaron datos → recuperar de B2

1. **GitHub:** `RESPALDO_ACTIVO` → `false`, para que no siga respaldando el
   daño y empujando los respaldos buenos hacia los 30 días.
2. Descargar de B2 el archivo anterior al problema (web de Backblaze →
   bucket → *Browse Files* → archivo → *Download*). Se llaman `vuelocarmesi-AAAA-MM-DD-HHMM`,
   en hora UTC (Colombia + 5 h).
3. Descifrar:
   ```bash
   gpg --decrypt vuelocarmesi-AAAA-MM-DD-HHMM.sql.gpg > recuperado.sql
   ```
   Pide la clave del gestor de contraseñas.
4. **Si solo faltan unos registros:** no restaurar entero. Buscar en
   `recuperado.sql` lo que falta y volver a crearlo.
5. **Si hay que restaurar entero** (se pierde todo lo posterior al respaldo):
   pausar cron-job.org y luego
   ```bash
   bash scripts/bd/restaurar.sh "$SUPABASE_URL" recuperado.sql
   bash scripts/bd/verificar.sh "$SUPABASE_URL" recuperado.sql
   ```
   Reactivar el cron.
6. Volver a poner `RESPALDO_ACTIVO=true` y borrar `recuperado.sql`.

### Probar que los respaldos sirven

Un respaldo que nunca se restauró no es un respaldo. Una vez al trimestre:
descargar el último de B2, descifrarlo y restaurarlo en un Postgres local
(nunca en producción):

```bash
docker run -d --rm --name prueba -e POSTGRES_PASSWORD=x -p 5433:5432 postgres:17
bash scripts/bd/restaurar.sh "postgresql://postgres:x@localhost:5433/postgres" recuperado.sql
bash scripts/bd/verificar.sh "postgresql://postgres:x@localhost:5433/postgres" recuperado.sql
docker stop prueba
```
