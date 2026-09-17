/**
 * Traduce las claves de texto de SiteConfig que ya estaban en la base.
 *
 *   npx ts-node scripts/rellenar-siteconfig.ts --prueba   (no escribe nada)
 *   npx ts-node scripts/rellenar-siteconfig.ts            (escribe)
 *
 * Hace falta una sola vez, por el mismo motivo que rellenar-traducciones.ts: el
 * servicio traduce al guardar desde el panel, y estos textos llevan ahí desde
 * antes de que existiera esa traduccion. Nadie los ha vuelto a guardar, asi que
 * su version inglesa nunca se genero y el sitio en ingles mostraba el espanol
 * por respaldo — correcto, pero no es lo que queremos.
 *
 * Es idempotente: vuelve a traducir solo si el espanol cambio desde la ultima
 * vez, porque el servicio compara huellas por campo.
 */
import 'dotenv/config'
import { PrismaService } from '../src/prisma.service'
import { TraduccionService } from '../src/traduccion/traduccion.service'

const PRUEBA = process.argv.includes('--prueba')

/** Debe coincidir con CLAVES_TRADUCIBLES de site-config.service.ts. */
const CLAVES = ['punto_encuentro', 'resumen_cancelacion'] as const
const IDIOMA = 'en'

async function main() {
  const prisma = new PrismaService()
  const traduccion = new TraduccionService()

  if (!traduccion.disponible) {
    console.log('\n  DEEPL_API_KEY vacia en back/.env. Nada que hacer.\n')
    process.exit(1)
  }

  const filas = await prisma.siteConfig.findMany()
  const actual = Object.fromEntries(filas.map(f => [f.key, f.value]))

  const origen: Record<string, string> = {}
  for (const clave of CLAVES) {
    const valor = actual[clave]?.trim()
    if (valor) origen[clave] = valor
  }

  const pendientes = Object.keys(origen)
  if (pendientes.length === 0) {
    console.log('\n  Ninguna clave de texto tiene valor en espanol. Nada que traducir.\n')
    await prisma.$disconnect()
    return
  }

  console.log('\n  A traducir:')
  for (const clave of pendientes) {
    const ya = actual[`${clave}__${IDIOMA}`]
    console.log(`    ${clave}`)
    console.log(`      ES  ${origen[clave]}`)
    console.log(`      EN  ${ya ? ya + '  (ya existia)' : '(sin traducir)'}`)
  }

  if (PRUEBA) {
    console.log('\n  MODO PRUEBA — no se escribe ni se llama a DeepL\n')
    await prisma.$disconnect()
    return
  }

  const res = await traduccion.traducir(origen, pendientes, [])
  if (!res) {
    console.log('\n  La traduccion fallo. Revisa el log de arriba.\n')
    await prisma.$disconnect()
    process.exit(1)
  }

  console.log('\n  Resultado:')
  for (const [clave, valor] of Object.entries(res.campos)) {
    const key = `${clave}__${IDIOMA}`
    const value = String(valor)
    await prisma.siteConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
    console.log(`    ${key}`)
    console.log(`      ${value}`)
  }

  console.log(`\n  ${Object.keys(res.campos).length} claves guardadas.\n`)
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
