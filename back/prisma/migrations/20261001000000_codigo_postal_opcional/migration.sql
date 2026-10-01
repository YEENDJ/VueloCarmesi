-- El checkout deja de pedir el código postal. La columna se vuelve opcional en
-- vez de borrarse: los pedidos anteriores conservan el suyo.
ALTER TABLE "Pedido" ALTER COLUMN "codigoPostal" DROP NOT NULL;
