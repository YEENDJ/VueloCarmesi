-- Página pública «mi reserva»: la llave del enlace del correo y la hora de
-- cada paso del avance (abono pagado y confirmada).
ALTER TABLE "Reserva" ADD COLUMN "tokenConsulta" TEXT;
ALTER TABLE "Reserva" ADD COLUMN "abonoPagadoEn" TIMESTAMP(3);
ALTER TABLE "Reserva" ADD COLUMN "confirmadaEn" TIMESTAMP(3);
CREATE UNIQUE INDEX "Reserva_tokenConsulta_key" ON "Reserva"("tokenConsulta");

-- Las anteriores: el abono aprobado dice cuándo se pagó. Cuándo se confirmó no
-- tiene registro y queda nulo: inventar una hora sería peor que no mostrarla.
UPDATE "Reserva" r SET "abonoPagadoEn" = (
  SELECT min(g."updatedAt") FROM "Pago" g WHERE g."reservaId" = r.id AND g.estado = 'aprobado'
);
