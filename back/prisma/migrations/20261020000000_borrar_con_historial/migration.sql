-- Productos y experiencias se pueden eliminar sin perder el historial.
-- Cada línea de pedido y cada reserva guardan una copia del nombre (y la
-- imagen, en los productos), y la relación pasa a SET NULL al borrar.
-- El backend solo deja borrar si no hay pedidos por despachar ni reservas en curso.

ALTER TABLE "ItemPedido" ADD COLUMN "nombre" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ItemPedido" ADD COLUMN "imagen" TEXT NOT NULL DEFAULT '';
UPDATE "ItemPedido" i SET "nombre" = p."nombre", "imagen" = p."imagen"
  FROM "Producto" p WHERE p."id" = i."productoId";

ALTER TABLE "ItemPedido" DROP CONSTRAINT "ItemPedido_productoId_fkey";
ALTER TABLE "ItemPedido" ALTER COLUMN "productoId" DROP NOT NULL;
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reserva" ADD COLUMN "experienciaNombre" TEXT NOT NULL DEFAULT '';
UPDATE "Reserva" r SET "experienciaNombre" = e."nombre"
  FROM "Experiencia" e WHERE e."id" = r."experienciaId";

ALTER TABLE "Reserva" DROP CONSTRAINT "Reserva_experienciaId_fkey";
ALTER TABLE "Reserva" ALTER COLUMN "experienciaId" DROP NOT NULL;
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_experienciaId_fkey" FOREIGN KEY ("experienciaId") REFERENCES "Experiencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
