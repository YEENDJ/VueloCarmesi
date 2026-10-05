-- CreateTable
CREATE TABLE "ExperienciaSlugAnterior" (
    "id" TEXT NOT NULL,
    "experienciaId" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienciaSlugAnterior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoSlugAnterior" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductoSlugAnterior_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExperienciaSlugAnterior_idioma_slug_key" ON "ExperienciaSlugAnterior"("idioma", "slug");
CREATE INDEX "ExperienciaSlugAnterior_slug_idx" ON "ExperienciaSlugAnterior"("slug");
CREATE INDEX "ExperienciaSlugAnterior_experienciaId_idx" ON "ExperienciaSlugAnterior"("experienciaId");

CREATE UNIQUE INDEX "ProductoSlugAnterior_idioma_slug_key" ON "ProductoSlugAnterior"("idioma", "slug");
CREATE INDEX "ProductoSlugAnterior_slug_idx" ON "ProductoSlugAnterior"("slug");
CREATE INDEX "ProductoSlugAnterior_productoId_idx" ON "ProductoSlugAnterior"("productoId");

-- AddForeignKey
ALTER TABLE "ExperienciaSlugAnterior" ADD CONSTRAINT "ExperienciaSlugAnterior_experienciaId_fkey" FOREIGN KEY ("experienciaId") REFERENCES "Experiencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductoSlugAnterior" ADD CONSTRAINT "ProductoSlugAnterior_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Datos: los slugs que hasta hoy rescataba a mano front/lib/slugs-legados.ts.
--
-- Se insertan uniéndolos por el slug vigente y no por id: los ids no se
-- conocen desde aquí, y si alguna ficha ya cambió de slug o se borró, el JOIN
-- simplemente no la encuentra y esa pareja no entra, en vez de colgar una
-- redirección hacia una ficha que no es. ON CONFLICT por si la migración se
-- aplica sobre una base donde alguien ya cargó alguno a mano.
--
-- El id no es un cuid como los que genera Prisma, pero la columna es TEXT y
-- nada en el código depende de su forma. gen_random_uuid() es nativo desde
-- Postgres 13, no hace falta extensión.
INSERT INTO "ExperienciaSlugAnterior" ("id", "experienciaId", "idioma", "slug")
SELECT gen_random_uuid()::text, e."id", 'es', v.viejo
FROM (VALUES
    ('EXPERIENCIA BIENESTAR', 'mascarilla-de-cacao-refrigerio'),
    ('VIVE UNA EXPERIENCIA INMERCIVA EN EL MUNDO DEL CACAO ', 'experiencia-cacaotera'),
    ('DESPIERTA ENTRE AVES Y CACAO', 'experiencia-aves-cacao'),
    ('AVITURISMO', 'avistamiento-de-aves')
) AS v(viejo, vigente)
JOIN "Experiencia" e ON e."slug" = v.vigente
ON CONFLICT ("idioma", "slug") DO NOTHING;

INSERT INTO "ProductoSlugAnterior" ("id", "productoId", "idioma", "slug")
SELECT gen_random_uuid()::text, p."id", 'es', v.viejo
FROM (VALUES
    ('chocolates', 'chocolate-aricao-100-x-125-gramos'),
    ('vino-de-cafe-x-375ml', 'vino-de-cafe-x-375-ml'),
    ('vino-de-mucilago-de-cacao-x-375ml', 'vino-de-mucilago-de-cacao-x-375-ml'),
    ('chocolatina', 'chocolatina-aricao-100-85-y-50-x-60-gramos'),
    ('chocolatina CARAO', 'chocolatina-carao-70-y-80-x-50-gramos'),
    ('Mascarilla de cacao', 'mascarilla-de-cacao'),
    ('Chocolate ARICAO ', 'chocolate-aricao-100-x-500-gramos'),
    ('chocolate ARICAO', 'chocolate-aricao-100-x-250-gramos'),
    ('mermelada de mucilago', 'mermelada-de-mucilago-de-cacao-x-150-y-200-gramos'),
    ('grageas-x-70-gramos', 'grageas-mujari-x-70-gramos'),
    ('destilado-de-cacao-paradiso-x-300ml', 'destilado-de-cacao-paradiso-x-300-ml')
) AS v(viejo, vigente)
JOIN "Producto" p ON p."slug" = v.vigente
ON CONFLICT ("idioma", "slug") DO NOTHING;
