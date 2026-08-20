-- AlterTable
ALTER TABLE "Experiencia" ADD COLUMN     "descripcionLarga" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "incluye" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "queTraer" TEXT[] DEFAULT ARRAY[]::TEXT[];
-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "descripcionLarga" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[];
