/**
 * Migración de datos posterior a `20260819000000_galeria_y_descripcion_larga`.
 *
 * Hace dos cosas, ninguna destructiva:
 *
 * 1. Adopta la portada suelta como galería. Las fichas creadas antes de que
 *    existiera `imagenes` tienen su foto en `imagen` y la galería vacía. Sin
 *    esto, la primera edición desde el panel las dejaría sin portada.
 *
 * 2. Normaliza los slugs viejos. Se generaron desde el nombre sin pasar por
 *    `toSlug`, así que hay mayúsculas, espacios y hasta un espacio final: URLs
 *    con %20 que ya causaron 404. Usa el mismo `slugUnico` que el service, de
 *    modo que dos nombres que colapsan en el mismo slug reciben sufijo.
 *
 * Imprime el mapa viejo -> nuevo para alimentar las redirecciones del front.
 *
 * Uso:
 *   npx ts-node prisma/migrar-galeria-y-slugs.ts            # simula
 *   npx ts-node prisma/migrar-galeria-y-slugs.ts --aplicar  # escribe
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { toSlug, slugUnico } from '../src/common/slug'

const APLICAR = process.argv.includes('--aplicar')

type Cambio = { id: string; nombre: string; viejo: string; nuevo: string }

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const resumen = { galeriasExperiencia: 0, galeriasProducto: 0 }
  const cambiosExperiencia: Cambio[] = []
  const cambiosProducto: Cambio[] = []

  // ── 1. portada suelta -> galería ────────────────────────────────────────
  const expsConPortada = await prisma.experiencia.findMany({
    where: { NOT: { imagen: '' }, imagenes: { isEmpty: true } },
    select: { id: true, imagen: true },
  })
  for (const e of expsConPortada) {
    resumen.galeriasExperiencia++
    if (APLICAR) {
      await prisma.experiencia.update({ where: { id: e.id }, data: { imagenes: [e.imagen] } })
    }
  }

  const prodsConPortada = await prisma.producto.findMany({
    where: { NOT: { imagen: '' }, imagenes: { isEmpty: true } },
    select: { id: true, imagen: true },
  })
  for (const p of prodsConPortada) {
    resumen.galeriasProducto++
    if (APLICAR) {
      await prisma.producto.update({ where: { id: p.id }, data: { imagenes: [p.imagen] } })
    }
  }

  // ── 2. slugs ────────────────────────────────────────────────────────────
  // Los slugs ya asignados en esta corrida se reservan aparte: en simulación no
  // se escriben en la base, así que sin esto dos nombres parecidos "encontrarían"
  // el mismo hueco libre y el mapa mentiría sobre lo que haría al aplicar.
  const reservados = new Set<string>()

  const experiencias = await prisma.experiencia.findMany({ select: { id: true, nombre: true, slug: true } })
  for (const e of experiencias) {
    const base = toSlug(e.nombre)
    if (base === e.slug) { reservados.add(e.slug); continue }
    const nuevo = await slugUnico(base, async (candidato) => {
      if (reservados.has(candidato)) return true
      const dueno = await prisma.experiencia.findUnique({ where: { slug: candidato }, select: { id: true } })
      return dueno !== null && dueno.id !== e.id
    })
    reservados.add(nuevo)
    cambiosExperiencia.push({ id: e.id, nombre: e.nombre, viejo: e.slug, nuevo })
    if (APLICAR) await prisma.experiencia.update({ where: { id: e.id }, data: { slug: nuevo } })
  }

  const reservadosProd = new Set<string>()
  const productos = await prisma.producto.findMany({ select: { id: true, nombre: true, slug: true } })
  for (const p of productos) {
    const base = toSlug(p.nombre)
    if (base === p.slug) { reservadosProd.add(p.slug); continue }
    const nuevo = await slugUnico(base, async (candidato) => {
      if (reservadosProd.has(candidato)) return true
      const dueno = await prisma.producto.findUnique({ where: { slug: candidato }, select: { id: true } })
      return dueno !== null && dueno.id !== p.id
    })
    reservadosProd.add(nuevo)
    cambiosProducto.push({ id: p.id, nombre: p.nombre, viejo: p.slug, nuevo })
    if (APLICAR) await prisma.producto.update({ where: { id: p.id }, data: { slug: nuevo } })
  }

  // ── informe ─────────────────────────────────────────────────────────────
  console.log(APLICAR ? '=== APLICADO ===' : '=== SIMULACIÓN (usa --aplicar para escribir) ===')
  console.log(`Portadas adoptadas como galería: ${resumen.galeriasExperiencia} experiencias, ${resumen.galeriasProducto} productos`)
  console.log(`\nSlugs a cambiar: ${cambiosExperiencia.length} experiencias, ${cambiosProducto.length} productos\n`)

  const imprimir = (titulo: string, cambios: Cambio[]) => {
    if (cambios.length === 0) return
    console.log(titulo)
    for (const c of cambios) console.log(`  ${JSON.stringify(c.viejo)}\n    -> ${c.nuevo}`)
    console.log()
  }
  imprimir('EXPERIENCIAS:', cambiosExperiencia)
  imprimir('PRODUCTOS:', cambiosProducto)

  // Bloque listo para pegar en front/lib/slugs-legados.ts
  const mapa = (cambios: Cambio[]) =>
    cambios.map(c => `  ${JSON.stringify(c.viejo)}: ${JSON.stringify(c.nuevo)},`).join('\n')
  console.log('--- para front/lib/slugs-legados.ts ---')
  console.log('EXPERIENCIAS:\n' + mapa(cambiosExperiencia))
  console.log('PRODUCTOS:\n' + mapa(cambiosProducto))

  await prisma.$disconnect()
  await pool.end()
}

main().catch((err) => {
  console.error('Falló la migración de datos:', err)
  process.exit(1)
})
