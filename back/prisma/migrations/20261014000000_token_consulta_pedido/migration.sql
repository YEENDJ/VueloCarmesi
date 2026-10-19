-- Página pública «mi pedido»: el token que va en el enlace del correo.
-- Nula en los pedidos anteriores; se genera la primera vez que se consultan.
ALTER TABLE "Pedido" ADD COLUMN "tokenConsulta" TEXT;
CREATE UNIQUE INDEX "Pedido_tokenConsulta_key" ON "Pedido"("tokenConsulta");
