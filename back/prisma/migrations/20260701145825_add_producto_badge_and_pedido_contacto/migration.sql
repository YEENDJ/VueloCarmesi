/*
  Warnings:

  - Added the required column `ciudad` to the `Pedido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigoPostal` to the `Pedido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telefono` to the `Pedido` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "ciudad" TEXT NOT NULL,
ADD COLUMN     "codigoPostal" TEXT NOT NULL,
ADD COLUMN     "telefono" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "badge" TEXT;
