-- Cuándo llegó cada pedido a Pagado, Enviado y Entregado: lo que la página
-- «mi pedido» muestra bajo cada paso del avance.
ALTER TABLE "Pedido" ADD COLUMN "pagadoEn" TIMESTAMP(3);
ALTER TABLE "Pedido" ADD COLUMN "enviadoEn" TIMESTAMP(3);
ALTER TABLE "Pedido" ADD COLUMN "entregadoEn" TIMESTAMP(3);

-- Los anteriores: el pago aprobado en línea dice cuándo se pagó. Enviado y
-- entregado no tienen registro y quedan nulos: inventar una hora sería peor
-- que no mostrarla.
UPDATE "Pedido" p SET "pagadoEn" = (
  SELECT min(g."updatedAt") FROM "Pago" g WHERE g."pedidoId" = p.id AND g.estado = 'aprobado'
)
WHERE p.estado IN ('pagado', 'enviado', 'entregado');
