#!/usr/bin/env bash
# Copia el esquema `public` de una base a un .sql plano.
#
#   bash scripts/bd/respaldar.sh "$ORIGEN_URL" respaldo.sql
#
# Solo `public`: ahí viven todas las tablas de Prisma y `_prisma_migrations`.
# Supabase tiene sus propios esquemas (auth, storage…) que no son nuestros y
# no se pueden restaurar en Neon.
#
# Requiere pg_dump de la misma versión mayor que el servidor o más nueva.
set -euo pipefail

origen="${1:?falta la URL de la base de origen}"
salida="${2:?falta el archivo de salida}"

# pg_dump 17 escribe `SET transaction_timeout`, que Postgres 16 no conoce: la
# reserva en Neon es 16 y la restauración fallaría entera por esa línea.
pg_dump "$origen" \
  --schema=public --no-owner --no-privileges --no-comments \
  --no-publications --no-subscriptions --format=plain \
  | sed -e '/^SET transaction_timeout = /d' \
        -e 's/^CREATE SCHEMA public;$/CREATE SCHEMA IF NOT EXISTS public;/' \
  > "$salida"

# Una URL equivocada (una base vacía, otro proyecto) daría un respaldo vacío
# que luego borraría la reserva. Sin la tabla de migraciones no es nuestra base.
if ! grep -q '^COPY public\._prisma_migrations ' "$salida"; then
  echo "El respaldo no contiene _prisma_migrations: ¿es la base correcta?" >&2
  exit 1
fi

echo "Respaldo listo: $(du -h "$salida" | cut -f1)"
