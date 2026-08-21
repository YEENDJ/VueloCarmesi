/**
 * Migración de datos: la descripción corta cambió de trabajo.
 *
 * Antes alimentaba la tarjeta del listado. Ahora la tarjeta no lleva texto y ese
 * campo pasa a ser la meta description de Google, donde el recorte cae en ~160
 * caracteres. Cuatro experiencias tienen ahí entre 250 y 374 caracteres, y su
 * `descripcionLarga` vacía: lo que escribieron es en realidad el relato, guardado
 * en el campo equivocado.
 *
 * Este script lo pone en su sitio, sin perder una sola palabra:
 *   - copia el texto a `descripcionLarga` cuando esta esté vacía
 *   - deja la corta vacía para que la meta description se derive sola de la larga
 *
 * No toca las fichas que ya tienen relato propio ni las cortas que ya caben.
 *
 * Uso:
 *   npx ts-node prisma/migrar-descripciones.ts            # simula
 *   npx ts-node prisma/migrar-descripciones.ts --aplicar  # escribe
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const APLICAR = process.argv.includes('--aplicar')
const TOPE_META = 160

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const acciones: string[] = []

  const experiencias = await prisma.experiencia.findMany({
    select: { id: true, nombre: true, descripcion: true, descripcionLarga: true },
  })

  for (const e of experiencias) {
    const corta = e.descripcion.trim()
    const larga = e.descripcionLarga.trim()

    // Nada que mover: o no hay corta, o ya cabe como meta description.
    if (!corta || corta.length <= TOPE_META) continue

    if (larga) {
      // Tiene relato propio: la corta se queda, solo se avisa que no cabrá en
      // el snippet de Google y conviene acortarla a mano desde el panel.
      acciones.push(`  AVISO  ${e.nombre}: corta de ${corta.length} con relato propio; se deja como está`)
      continue
    }

    acciones.push(`  MUEVE  ${e.nombre}: ${corta.length} caracteres pasan de corta a relato; la corta queda vacía`)
    if (APLICAR) {
      await prisma.experiencia.update({
        where: { id: e.id },
        data: { descripcionLarga: corta, descripcion: '' },
      })
    }
  }

  // Mismo criterio en productos.
  const productos = await prisma.producto.findMany({
    select: { id: true, nombre: true, descripcion: true, descripcionLarga: true },
  })
  for (const p of productos) {
    const corta = p.descripcion.trim()
    const larga = p.descripcionLarga.trim()
    if (!corta || corta.length <= TOPE_META) continue
    if (larga) {
      acciones.push(`  AVISO  ${p.nombre}: corta de ${corta.length} con relato propio; se deja como está`)
      continue
    }
    acciones.push(`  MUEVE  ${p.nombre}: ${corta.length} caracteres pasan de corta a relato`)
    if (APLICAR) {
      await prisma.producto.update({
        where: { id: p.id },
        data: { descripcionLarga: corta, descripcion: '' },
      })
    }
  }

  console.log(APLICAR ? '=== APLICADO ===' : '=== SIMULACIÓN (usa --aplicar para escribir) ===')
  console.log(acciones.length ? acciones.join('\n') : '  nada que mover')

  await prisma.$disconnect()
  await pool.end()
}

main().catch((err) => {
  console.error('Falló la migración de descripciones:', err)
  process.exit(1)
})
