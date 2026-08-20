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
    ],
    skipDuplicates: true,
  })

  console.log(`✅ SiteConfig listo (${count} claves nuevas)`)
  console.log('🎉 Seed completado')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
