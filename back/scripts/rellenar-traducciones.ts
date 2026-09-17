/**
 * Traduce de una pasada todo el catalogo que ya existia.
 *
 *   npx ts-node scripts/rellenar-traducciones.ts --prueba   (no escribe nada)
 *   npx ts-node scripts/rellenar-traducciones.ts            (escribe)
 *
 * Hace falta una sola vez: las fichas creadas antes de que existiera la
 * traduccion automatica no pasan por el formulario hasta que alguien las edite,
 * asi que se quedarian invisibles en ingles indefinidamente.
 *
 * Es idempotente. Volver a correrlo no retraduce nada que no haya cambiado:
 * el sincronizador compara las huellas por campo y salta lo que ya esta al dia.
 * Tampoco pisa nada que haya revisado un humano.
 *
 * Va de una ficha en una, no en paralelo: el plan gratuito de DeepL limita la
 * concurrencia y con 22 fichas no hay ninguna prisa que justifique arriesgarse
 * a un 429 a mitad del relleno.
 */
import 'dotenv/config'
import { PrismaService } from '../src/prisma.service'
import { TraduccionService } from '../src/traduccion/traduccion.service'
import { SincronizadorTraduccion } from '../src/traduccion/sincronizador.service'

const PRUEBA = process.argv.includes('--prueba')
/**
 * Rehace TODAS las fichas, no solo las que no tienen ingles.
 *
 * Es lo que hay que correr despues de tocar el glosario o las instrucciones:
 * las fichas no cambiaron, pero la traduccion de ayer se hizo con reglas
 * peores. Lo revisado por un humano se respeta igual.
 */
const FORZAR = process.argv.includes('--forzar')

async function main() {
  const prisma = new PrismaService()
  const traduccion = new TraduccionService()

  if (!traduccion.disponible) {
    console.log('\n  DEEPL_API_KEY vacia en back/.env. Nada que hacer.\n')
    process.exit(1)
  }

  const sincronizador = new SincronizadorTraduccion(prisma, traduccion)

  const [experiencias, productos] = await Promise.all([
    prisma.experiencia.findMany({
      include: { traducciones: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.producto.findMany({
      include: { traducciones: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const sinIngles = <T extends { traducciones: { idioma: string }[] }>(x: T) =>
    !x.traducciones.some(t => t.idioma === 'en')

  const filtro = FORZAR ? () => true : sinIngles
  const pendientes = [
    ...experiencias.filter(filtro).map(e => ({ tipo: 'experiencia' as const, id: e.id, slug: e.slug })),
    ...productos.filter(filtro).map(p => ({ tipo: 'producto' as const, id: p.id, slug: p.slug })),
  ]

  console.log(
    FORZAR
      ? `\n  ${pendientes.length} fichas a RETRADUCIR (--forzar)`
      : `\n  ${pendientes.length} fichas sin version inglesa`,
  )
  if (PRUEBA) {
    console.log('  MODO PRUEBA — no se escribe ni se llama a DeepL\n')
    for (const p of pendientes) console.log(`    ${p.tipo.padEnd(12)} ${p.slug}`)
    console.log(`\n  Para ejecutarlo de verdad, quita --prueba\n`)
    await prisma.$disconnect()
    return
  }

  console.log()
  let ok = 0
  let fallos = 0

  for (const [i, p] of pendientes.entries()) {
    const etiqueta = `[${String(i + 1).padStart(2)}/${pendientes.length}] ${p.tipo.padEnd(12)} ${p.slug}`
    const t0 = Date.now()
    try {
      const opts = { forzar: FORZAR }
      if (p.tipo === 'experiencia') await sincronizador.experiencia(p.id, opts)
      else await sincronizador.producto(p.id, opts)

      // El sincronizador se traga sus errores para no tumbar un guardado, asi
      // que no basta con que no lance: hay que comprobar que la fila existe.
      const tabla = p.tipo === 'experiencia'
        ? prisma.experienciaTraduccion
        : prisma.productoTraduccion
      const escrita = await (tabla as { count: (a: unknown) => Promise<number> }).count({
        where: p.tipo === 'experiencia'
          ? { experienciaId: p.id, idioma: 'en' }
          : { productoId: p.id, idioma: 'en' },
      })

      if (escrita > 0) {
        ok++
        console.log(`  OK    ${etiqueta}  (${Date.now() - t0} ms)`)
      } else {
        fallos++
        console.log(`  FALLA ${etiqueta}  — no se escribio la traduccion`)
      }
    } catch (err) {
      fallos++
      console.log(`  FALLA ${etiqueta}  — ${(err as Error).message}`)
    }
  }

  console.log(`\n  ${ok} traducidas, ${fallos} fallidas`)
  if (fallos) console.log('  Volver a correr el script reintenta solo las que fallaron.')
  console.log()

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
