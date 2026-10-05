-- Productos que se renombraron DESPUÉS de escribirse front/lib/slugs-legados.ts.
--
-- Con la regla de entonces, cada renombre regeneraba el slug, así que estos
-- seis cambiaron dos veces: la lista mandaba `chocolates` a
-- `chocolate-aricao-100-x-125-gramos`, que a su vez ya no existía, y las dos
-- URLs daban 404. La migración anterior (20261005000000) los saltó porque une
-- por el slug de destino y ese destino ya no estaba.
--
-- Acá van las dos generaciones de cada uno —la URL original y la intermedia—
-- hacia el slug de hoy. Mismo criterio que la anterior: JOIN por el slug
-- vigente, para que si alguno ya no existe la pareja no entre en vez de
-- colgar una redirección a la nada, y ON CONFLICT por si ya estuviera.
--
-- Los slugs ingleses que tuvieran antes de renombrarse no quedaron guardados
-- en ningún lado y no se pueden recuperar.
INSERT INTO "ProductoSlugAnterior" ("id", "productoId", "idioma", "slug")
SELECT gen_random_uuid()::text, p."id", 'es', v.viejo
FROM (VALUES
    ('chocolates', 'chocolate-aricao-x-125-gramos'),
    ('chocolate-aricao-100-x-125-gramos', 'chocolate-aricao-x-125-gramos'),
    ('chocolate ARICAO', 'chocolate-aricao-x-250-gramos'),
    ('chocolate-aricao-100-x-250-gramos', 'chocolate-aricao-x-250-gramos'),
    ('Chocolate ARICAO ', 'chocolate-aricao-x-500-gramos'),
    ('chocolate-aricao-100-x-500-gramos', 'chocolate-aricao-x-500-gramos'),
    ('chocolatina', 'chocolatina-aricao-x-60-gramos'),
    ('chocolatina-aricao-100-85-y-50-x-60-gramos', 'chocolatina-aricao-x-60-gramos'),
    ('chocolatina CARAO', 'chocolatina-carao-70-gramos'),
    ('chocolatina-carao-70-y-80-x-50-gramos', 'chocolatina-carao-70-gramos'),
    ('mermelada de mucilago', 'mermelada-de-mucilago-de-cacao-x-200-gramos'),
    ('mermelada-de-mucilago-de-cacao-x-150-y-200-gramos', 'mermelada-de-mucilago-de-cacao-x-200-gramos')
) AS v(viejo, vigente)
JOIN "Producto" p ON p."slug" = v.vigente
ON CONFLICT ("idioma", "slug") DO NOTHING;
