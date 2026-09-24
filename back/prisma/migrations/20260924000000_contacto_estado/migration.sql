-- AlterTable
-- Con valor por defecto: los mensajes que ya están en la base entran como
-- «nuevo», que es justo lo que son, porque nadie los ha podido ver desde el panel.
ALTER TABLE "Contacto" ADD COLUMN "estado" TEXT NOT NULL DEFAULT 'nuevo';
