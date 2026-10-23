#!/usr/bin/env bash
# Comprueba que cada tabla del destino tenga las mismas filas que el respaldo.
#
#   bash scripts/bd/verificar.sh "$DESTINO_URL" respaldo.sql
#
# Se compara contra el archivo y no contra la base de origen: la de origen
# sigue recibiendo pedidos mientras tanto y los conteos nunca cuadrarían.
# Solo imprime nombres de tabla y números, nunca datos (los logs del repo son
# públicos).
set -euo pipefail

destino="${1:?falta la URL de la base de destino}"
respaldo="${2:?falta el archivo de respaldo}"
aqui="$(dirname "$0")"

# En un respaldo plano cada tabla es un bloque `COPY public."Tabla" … FROM stdin;`
# con una fila por línea, hasta `\.`.
esperado="$(awk '
  /^COPY public\./ { tabla = $2; filas = 0; dentro = 1; next }
  dentro && /^\\\.$/ { print tabla "|" filas; dentro = 0; next }
  dentro { filas++ }
' "$respaldo" | sort)"

obtenido="$(psql "$destino" --no-psqlrc -At -v ON_ERROR_STOP=1 \
  -f "$aqui/contar-filas.sql" | sort)"

if [ "$esperado" != "$obtenido" ]; then
  echo "Las filas no coinciden (respaldo ← → destino):" >&2
  diff <(echo "$esperado") <(echo "$obtenido") >&2 || true
  exit 1
fi

echo "Verificado: $(echo "$esperado" | wc -l) tablas con las mismas filas."
