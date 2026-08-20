-- AlterTable
ALTER TABLE "Experiencia" ADD COLUMN     "horarios" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "noIncluye" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "puntoEncuentro" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "recomendaciones" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "descripcion" SET DEFAULT '';
-- AlterTable
ALTER TABLE "Producto" ALTER COLUMN "descripcion" SET DEFAULT '';
