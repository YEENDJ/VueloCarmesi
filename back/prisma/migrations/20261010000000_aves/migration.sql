-- CreateTable
CREATE TABLE "Ave" (
    "id" TEXT NOT NULL,
    "cientifico" TEXT NOT NULL,
    "ingles" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'residente',
    "imagen" TEXT NOT NULL DEFAULT '',
    "foco" TEXT NOT NULL DEFAULT '50% 50%',
    "alt" TEXT NOT NULL DEFAULT '',
    "altEn" TEXT NOT NULL DEFAULT '',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ave_cientifico_key" ON "Ave"("cientifico");
CREATE INDEX "Ave_tipo_orden_idx" ON "Ave"("tipo", "orden");

-- Las nueve especies que estaban escritas en aviturismo/page.tsx, con sus
-- textos alternativos de messages/es.json y en.json. Van en la migración y no
-- en un seed para que la página no quede vacía entre el despliegue y la
-- primera vez que alguien abra el panel. El encuadre es el medido sobre cada
-- foto para el marco 4:5.
INSERT INTO "Ave" ("id", "cientifico", "ingles", "local", "tipo", "imagen", "foco", "alt", "altEn", "orden") VALUES
  ('ave_aracari', 'Pteroglossus castanotis', 'Chestnut-eared Aracari', 'Pichí de collar', 'residente', '/images/aves/aracari.jpg', '31% 50%',
   'Pichí de collar posado en una rama, con el pecho amarillo y la banda roja',
   'Chestnut-eared Aracari perched on a branch, yellow breast and red band visible', 1),
  ('ave_carpintero', 'Campephilus melanoleucos', 'Crimson-crested Woodpecker', 'Carpintero real', 'residente', '/images/aves/carpintero.jpg', '55% 50%',
   'Carpintero real de cresta carmesí trepado en el tronco de un árbol',
   'Crimson-crested Woodpecker climbing a tree trunk', 2),
  ('ave_currucutu', 'Glaucidium brasilianum', 'Ferruginous Pygmy-Owl', 'Currucutú común', 'residente', '/images/aves/currucutu.jpg', '73% 50%',
   'Currucutú de ojos amarillos mirando de frente a la cámara',
   'Ferruginous Pygmy-Owl looking straight at the camera with yellow eyes', 3),
  ('ave_tigana', 'Eurypyga helias', 'Sunbittern', 'Tigana', 'residente', '/images/aves/tigana.jpg', '50% 50%',
   'Tigana caminando entre la hierba a la orilla del agua',
   'Sunbittern walking through grass at the water''s edge', 4),
  ('ave_carriqui', 'Cyanocorax violaceus', 'Violaceous Jay', 'Carriquí violáceo', 'residente', '/images/aves/carriqui.jpg', '8% 50%',
   'Carriquí violáceo posado entre el follaje',
   'Violaceous Jay perched among the foliage', 5),
  ('ave_azulejo', 'Thraupis palmarum', 'Palm Tanager', 'Azulejo palmero', 'residente', '/images/aves/azulejo-palmero.jpg', '36% 50%',
   'Azulejo palmero sobre una rama con el plumaje verde oliva',
   'Palm Tanager on a branch with olive-green plumage', 6),
  ('ave_tangara', 'Cissopis leverianus', 'Magpie Tanager', 'Tangara urraca', 'residente', '/images/aves/tangara-urraca.jpg', '50% 26%',
   'Tángara urraca en blanco y negro posada en una rama',
   'Magpie Tanager, black and white, perched on a branch', 7),
  ('ave_piranga', 'Piranga rubra', 'Summer Tanager', 'Piranga roja', 'migratoria', '', '50% 50%', '', '', 1),
  ('ave_candelita', 'Setophaga ruticilla', 'American Redstart', 'Candelita norteña', 'migratoria', '', '50% 50%', '', '', 2);
