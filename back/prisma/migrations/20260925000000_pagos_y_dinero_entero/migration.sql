-- Primer paso de la pasarela de pagos.
-- Diseño: docs/superpowers/specs/2026-09-25-pasarela-pagos-design.md

-- Verificación previa
-- El dinero pasa de double a integer (pesos enteros). Postgres redondea al
-- convertir sin decir nada, así que antes se comprueba que no haya decimales:
-- si hay uno solo, la migración aborta entera y no cambia nada. Los precios del
-- tarifario son enteros; un decimal acá sería un dato que hay que mirar a mano.
DO $$
DECLARE
  con_decimales INTEGER;
BEGIN
  SELECT
    (SELECT count(*) FROM "Experiencia" WHERE "precio" <> round("precio")) +
    (SELECT count(*) FROM "Producto"    WHERE "precio" <> round("precio")) +
    (SELECT count(*) FROM "Pedido"      WHERE "total"  <> round("total"))  +
    (SELECT count(*) FROM "ItemPedido"  WHERE "precio" <> round("precio"))
  INTO con_decimales;

  IF con_decimales > 0 THEN
    RAISE EXCEPTION 'Hay % importes con decimales; revisarlos antes de pasar a pesos enteros', con_decimales;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "Experiencia" ALTER COLUMN "precio" SET DATA TYPE INTEGER USING round("precio")::integer;

-- AlterTable
ALTER TABLE "Producto" ALTER COLUMN "precio" SET DATA TYPE INTEGER USING round("precio")::integer;

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "venceEn" TIMESTAMP(3),
ADD COLUMN     "stockApartado" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "total" SET DATA TYPE INTEGER USING round("total")::integer;

-- Los cancelados ya devolvieron sus unidades al cancelarse; el resto las tiene.
UPDATE "Pedido" SET "stockApartado" = false WHERE "estado" = 'cancelado';

-- AlterTable
ALTER TABLE "ItemPedido" ALTER COLUMN "precio" SET DATA TYPE INTEGER USING round("precio")::integer;

-- AlterTable
-- Nulas: las reservas de antes de la pasarela no tienen estas cifras, y
-- rellenarlas con el precio de hoy sería inventar lo que se les ofreció.
ALTER TABLE "Reserva" ADD COLUMN     "montoAbono" INTEGER,
ADD COLUMN     "porcentajeAbono" INTEGER,
ADD COLUMN     "total" INTEGER,
ADD COLUMN     "venceEn" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "pedidoId" TEXT,
    "reservaId" TEXT,
    "monto" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'COP',
    "proveedor" TEXT NOT NULL,
    "proveedorTxId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "metodo" TEXT,
    "motivo" TEXT,
    "modo" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id"),
    -- De un pedido o de una reserva, exactamente uno. Prisma no modela CHECK,
    -- así que vive solo acá; el service valida lo mismo antes de insertar.
    CONSTRAINT "Pago_un_solo_dueno" CHECK (("pedidoId" IS NULL) <> ("reservaId" IS NULL)),
    CONSTRAINT "Pago_monto_positivo" CHECK ("monto" > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "Pago_referencia_key" ON "Pago"("referencia");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_proveedorTxId_key" ON "Pago"("proveedorTxId");

-- CreateIndex
CREATE INDEX "Pago_estado_createdAt_idx" ON "Pago"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "Pago_pedidoId_idx" ON "Pago"("pedidoId");

-- CreateIndex
CREATE INDEX "Pago_reservaId_idx" ON "Pago"("reservaId");

-- CreateIndex
-- Para el vencimiento: busca lo que espera pago y ya pasó su plazo.
CREATE INDEX "Reserva_estado_venceEn_idx" ON "Reserva"("estado", "venceEn");

-- CreateIndex
CREATE INDEX "Pedido_estado_venceEn_idx" ON "Pedido"("estado", "venceEn");

-- AddForeignKey
-- RESTRICT: un cobro no se borra con su pedido o su reserva.
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
