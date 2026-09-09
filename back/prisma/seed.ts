import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// El catálogo de productos y experiencias lo administra el panel: ya no se siembra
// desde aquí. Este seed solo inicializa las claves de SiteConfig que la app espera
// encontrar, y es idempotente — no borra nada, se puede correr sobre una base viva.
async function main() {
  console.log('🌱 Inicializando configuración de Vuelo Carmesí...')

  const { count } = await prisma.siteConfig.createMany({
    data: [
      { key: 'hero_image', value: '' },
      { key: 'about_image', value: '' },
      { key: 'gallery_images', value: '[]' },
      { key: 'admin_email', value: '' },
      // Se escriben una vez y las usan TODAS las fichas de experiencia: pedirlos
      // en cada una sería repetir el mismo texto cinco veces y arriesgar que
      // quedaran distintos entre sí.
      // Arranca vacía a propósito: se escribe desde el panel (Configuración →
      // Datos comunes). El texto completo de la hoja 18 del portafolio
      // —dirección, coordenadas, parqueadero y los 15 minutos de antelación—
      // está redactado en prisma/cargar-experiencias.ts, por si se quiere
      // copiar de ahí en vez de volver a escribirlo.
      { key: 'punto_encuentro', value: '' },
      // Arranca con la condición real de la hoja 21 del portafolio, no vacía:
      // es la única de las tres que, mal escrita, promete dinero que no se va a
      // devolver. Ver front/app/(public)/politicas/cancelacion/page.tsx.
      {
        key: 'resumen_cancelacion',
        value:
          'Reembolso del 100 % cancelando dentro de las 24 horas siguientes a reservar y con más de 15 días de anticipación.',
      },
      { key: 'whatsapp', value: '' },
      // Las cifras de impacto de la home y de «sobre nosotros». Se siembran con
      // el dato con el que se publicaron las secciones y no vacías: son números
      // que ya están dichos en la web, y una clave vacía haría que el front
      // cayera a su respaldo, que es exactamente el mismo valor. Sembrarlas es
      // lo que hace que el panel las muestre con contenido desde el primer día
      // en vez de con ocho casillas en blanco que nadie sabe qué llevaban.
      { key: 'impacto_personas', value: '692' },
      { key: 'impacto_instituciones', value: '8' },
      { key: 'impacto_organizaciones', value: '7' },
      { key: 'impacto_familias', value: '28' },
      { key: 'impacto_extranjeros', value: '15' },
      { key: 'impacto_familias_directas', value: '2' },
      { key: 'impacto_familias_indirectas', value: '8' },
      { key: 'impacto_empleos', value: '6' },
      // Las cifras productivas de «La Finca». Van sin separador de miles: el
      // panel las pide como número y el front les pone el punto al pintarlas,
      // así un «1.300» tecleado a mano no llega aquí como 1,3.
      { key: 'finca_plantas', value: '1300' },
      { key: 'finca_variedades', value: '12' },
      { key: 'finca_produccion_kg', value: '900' },
    ],
    skipDuplicates: true,
  })

  console.log(`✅ SiteConfig listo (${count} claves nuevas)`)
  console.log('🎉 Seed completado')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
