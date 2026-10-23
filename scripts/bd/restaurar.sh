#!/usr/bin/env bash
# Reemplaza el esquema `public` de una base por el contenido de un respaldo.
#
#   bash scripts/bd/restaurar.sh "$DESTINO_URL" respaldo.sql
#
# ⚠ BORRA todo lo que haya en `public` del destino. Va en una sola transacción:
# si algo falla a mitad, el destino queda exactamente como estaba.
set -euo pipefail

destino="${1:?falta la URL de la base de destino}"
respaldo="${2:?falta el archivo de respaldo}"
aqui="$(dirname "$0")"

if ! grep -q '^COPY public\._prisma_migrations ' "$respaldo"; then
  echo "El respaldo no contiene _prisma_migrations: no se restaura." >&2
  exit 1
fi

psql "$destino" --no-psqlrc --quiet -v ON_ERROR_STOP=1 --single-transaction \
  -f "$aqui/vaciar-public.sql" \
  -f "$respaldo" \
  > /dev/null

echo "Restauración completa."
