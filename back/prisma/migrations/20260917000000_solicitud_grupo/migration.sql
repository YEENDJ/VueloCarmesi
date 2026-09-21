-- CreateTable
CREATE TABLE "SolicitudGrupo" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "institucion" TEXT NOT NULL,
    "nit" TEXT,
    "contacto" TEXT NOT NULL,
    "cargo" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "personas" INTEGER NOT NULL,
    "edades" TEXT,
    "fechaTentativa" TIMESTAMP(3),
    "experiencias" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiereTransporte" BOOLEAN NOT NULL DEFAULT false,
    "requiereFactura" BOOLEAN NOT NULL DEFAULT false,
    "mensaje" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL DEFAULT 'nueva',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudGrupo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- El panel las va a listar por fecha y filtrar por estado en cuanto exista la
-- pantalla. El índice se crea ahora porque la tabla está vacía: hacerlo sobre
-- una tabla con datos, en la única base que hay —la de producción—, cuesta.
CREATE INDEX "SolicitudGrupo_estado_createdAt_idx" ON "SolicitudGrupo"("estado", "createdAt" DESC);
