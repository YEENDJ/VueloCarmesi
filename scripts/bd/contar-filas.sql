-- Una línea `public."Tabla"|filas` por tabla de `public`, con el nombre escrito
-- como lo escribe pg_dump para poder compararlas con verificar.sh.
SELECT format(
  'SELECT %L || ''|'' || count(*) FROM public.%I',
  'public.' || quote_ident(tablename),
  tablename
)
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename
\gexec
