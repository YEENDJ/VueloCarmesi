/**
 * Radiografia del estado de traduccion del catalogo.
 *
 * Correr:  npx ts-node scripts/estado-traducciones.ts
 *
 * Solo lee. Dice cuantas fichas hay, cuantas tienen version inglesa y cuales
 * se quedaron sin traducir, que es justo lo que no se ve desde el panel.
 */
import 'dotenv/config'
import { PrismaService } from '../src/prisma.service'

// Se reutiliza el servicio del proyecto: ya trae el adaptador de Neon, el pool
// y los reintentos del arranque en frio. Un PrismaClient pelado no lee la URL
// solo en Prisma 7.
const prisma = new PrismaService()

async function main() {
  const [experiencias, productos, reservas, pedidos] = await Promise.all([
    prisma.experiencia.findMany({ include: { traducciones: true } }),
    prisma.producto.findMany({ include: { traducciones: true } }),
    prisma.reserva.count(),
    prisma.pedido.count(),
  ])

  console.log('\n  DATOS EXISTENTES (no los toco, solo confirmo que siguen ahi)')
  console.log(`    experiencias : ${experiencias.length}`)
  console.log(`    productos    : ${productos.length}`)
  console.log(`    reservas     : ${reservas}`)
  console.log(`    pedidos      : ${pedidos}`)

  const conEn = <T extends { traducciones: { idioma: string }[] }>(xs: T[]) =>
    xs.filter(x => x.traducciones.some(t => t.idioma === 'en')).length

  console.log('\n  TRADUCCION AL INGLES')
  console.log(`    experiencias : ${conEn(experiencias)} de ${experiencias.length}`)
  console.log(`    productos    : ${conEn(productos)} de ${productos.length}`)

  const faltan = [
    ...experiencias
      .filter(e => !e.traducciones.some(t => t.idioma === 'en'))
      .map(e => `experiencia  ${e.slug}`),
    ...productos
      .filter(p => !p.traducciones.some(t => t.idioma === 'en'))
      .map(p => `producto     ${p.slug}`),
  ]

  if (faltan.length) {
    console.log('\n  SIN VERSION INGLESA')
    for (const f of faltan) console.log(`    ${f}`)
    console.log('\n  Se llenan con:  npx ts-node scripts/rellenar-traducciones.ts')
  } else {
    console.log('\n  Todo el catalogo tiene version inglesa.')
  }
  console.log()
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
