-- CreateTable
CREATE TABLE "ExperienciaTraduccion" (
    "id" TEXT NOT NULL,
    "experienciaId" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT '',
    "nombre" TEXT NOT NULL DEFAULT '',
    "descripcion" TEXT NOT NULL DEFAULT '',
    "descripcionLarga" TEXT NOT NULL DEFAULT '',
    "duracion" TEXT NOT NULL DEFAULT '',
    "horarios" TEXT NOT NULL DEFAULT '',
    "recomendaciones" TEXT NOT NULL DEFAULT '',
    "puntoEncuentro" TEXT NOT NULL DEFAULT '',
    "incluye" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "queTraer" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "noIncluye" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "origenHash" JSONB NOT NULL DEFAULT '{}',
    "revisados" JSONB NOT NULL DEFAULT '{}',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienciaTraduccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoTraduccion" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT '',
    "nombre" TEXT NOT NULL DEFAULT '',
    "descripcion" TEXT NOT NULL DEFAULT '',
    "descripcionLarga" TEXT NOT NULL DEFAULT '',
    "categoria" TEXT NOT NULL DEFAULT '',
    "origenHash" JSONB NOT NULL DEFAULT '{}',
    "revisados" JSONB NOT NULL DEFAULT '{}',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductoTraduccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExperienciaTraduccion_idioma_idx" ON "ExperienciaTraduccion"("idioma");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienciaTraduccion_experienciaId_idioma_key" ON "ExperienciaTraduccion"("experienciaId", "idioma");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienciaTraduccion_idioma_slug_key" ON "ExperienciaTraduccion"("idioma", "slug");

-- CreateIndex
CREATE INDEX "ProductoTraduccion_idioma_idx" ON "ProductoTraduccion"("idioma");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoTraduccion_productoId_idioma_key" ON "ProductoTraduccion"("productoId", "idioma");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoTraduccion_idioma_slug_key" ON "ProductoTraduccion"("idioma", "slug");

-- AddForeignKey
ALTER TABLE "ExperienciaTraduccion" ADD CONSTRAINT "ExperienciaTraduccion_experienciaId_fkey" FOREIGN KEY ("experienciaId") REFERENCES "Experiencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoTraduccion" ADD CONSTRAINT "ProductoTraduccion_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

