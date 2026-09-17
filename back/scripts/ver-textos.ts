/**
 * Vuelca el catalogo en espanol y en ingles, lado a lado, para revisar a ojo
 * como quedo la traduccion automatica.
 *
 *   npx ts-node scripts/ver-textos.ts             (resumen: nombres y slugs)
 *   npx ts-node scripts/ver-textos.ts --completo  (todos los campos)
 */
import 'dotenv/config'
import { PrismaService } from '../src/prisma.service'

const COMPLETO = process.argv.includes('--completo')

/** Terminos que NO pueden aparecer en el ingles: senal de que fallo el glosario. */
const PROHIBIDOS = [
  'Crimson Flight', 'Red Brunette', 'Wild Dream', 'Corner coffee',
  'cocoa', 'Cocoa', 'mucilago wine', 'ear of', 'cob',
]

async function main() {
  const prisma = new PrismaService()
  const [exp, prod] = await Promise.all([
    prisma.experiencia.findMany({ include: { traducciones: true }, orderBy: { createdAt: 'asc' } }),
    prisma.producto.findMany({ include: { traducciones: true }, orderBy: { createdAt: 'asc' } }),
  ])

  const en = <T extends { traducciones: { idioma: string }[] }>(x: T) =>
    x.traducciones.find(t => t.idioma === 'en') as Record<string, unknown> | undefined

  console.log('\n================ EXPERIENCIAS ================')
  for (const e of exp) {
    const t = en(e)
    console.log(`\n  ES  ${e.nombre}`)
    console.log(`  EN  ${t?.nombre ?? '(sin traducir)'}`)
    console.log(`      /experiencias/${e.slug}`)
    console.log(`      /en/experiences/${t?.slug ?? '(sin slug)'}`)
    if (COMPLETO && t) {
      for (const campo of ['descripcion', 'duracion', 'horarios', 'recomendaciones', 'puntoEncuentro']) {
        const v = t[campo]
        if (v) console.log(`      ${campo}: ${v}`)
      }
      if (Array.isArray(t.incluye) && t.incluye.length) {
        console.log(`      incluye: ${(t.incluye as string[]).join(' | ')}`)
      }
      if (t.descripcionLarga) {
        console.log(`      relato: ${String(t.descripcionLarga).slice(0, 200)}...`)
      }
    }
  }

  console.log('\n\n================ PRODUCTOS ================')
  for (const p of prod) {
    const t = en(p)
    console.log(`\n  ES  ${p.nombre}   [${p.categoria}]`)
    console.log(`  EN  ${t?.nombre ?? '(sin traducir)'}   [${t?.categoria ?? '?'}]`)
    if (COMPLETO && t?.descripcion) console.log(`      ${t.descripcion}`)
  }

  // Comprobacion automatica sobre TODO el catalogo traducido.
  const todo = JSON.stringify([...exp.map(en), ...prod.map(en)])
  console.log('\n\n================ CONTROL ================')
  let problemas = 0
  for (const mal of PROHIBIDOS) {
    if (todo.includes(mal)) {
      console.log(`  APARECE "${mal}"  <-- el glosario no lo cubrio`)
      problemas++
    }
  }
  for (const marca of ['ARICAO', 'CARAO', 'MUJARI', 'Rinc', 'Paradiso', 'Vuelo Carmes']) {
    if (!todo.includes(marca)) {
      console.log(`  FALTA la marca "${marca}" en el ingles`)
      problemas++
    }
  }
  console.log(problemas === 0 ? '  Sin problemas detectados.' : `  ${problemas} problemas.`)
  console.log()

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
