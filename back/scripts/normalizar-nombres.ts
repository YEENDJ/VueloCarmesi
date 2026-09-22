/**
 * Aplica `capitalizarNombre` al catalogo que ya estaba guardado.
 *
 *   npx ts-node scripts/normalizar-nombres.ts --prueba   (no escribe nada)
 *   npx ts-node scripts/normalizar-nombres.ts            (escribe)
 *
 * Hace falta una sola vez. Los servicios normalizan al crear y al editar, pero
 * eso solo alcanza a las fichas que alguien vuelva a guardar: las 22 que ya
 * estaban se quedarian con su capitalizacion de siempre hasta que a alguien se
 * le ocurriera abrirlas. Corre sobre las dos lenguas.
 *
 * Escribe con Prisma y no por el servicio a proposito. Pasar por `update()`
 * regeneraria el slug y dispararia una retraduccion de cada ficha: gastaria
 * caracteres del plan de DeepL para volver a pedir un texto que ya esta bien y,
 * peor, el nombre ingles saldria otra vez del motor y podria cambiar de forma,
 * que es justo lo que no queremos tocar. Aqui la caja es lo unico que se mueve.
 *
 * Es idempotente: la funcion es estable, asi que la segunda pasada no reporta
 * ningun cambio.
 *
 * ⚠ `DATABASE_URL` apunta a produccion — no hay entorno de pruebas. Correlo con
 * `--prueba` primero y lee la lista antes de dejarlo escribir.
 */
import 'dotenv/config'
import { PrismaService } from '../src/prisma.service'
import { capitalizarNombre } from '../src/common/nombre'
import { toSlug } from '../src/common/slug'

const PRUEBA = process.argv.includes('--prueba')

type Fila = { id: string; nombre: string; slug: string }

async function main() {
  const prisma = new PrismaService()

  const [experiencias, productos, expTrad, prodTrad] = await Promise.all([
    prisma.experiencia.findMany({ select: { id: true, nombre: true, slug: true } }),
    prisma.producto.findMany({ select: { id: true, nombre: true, slug: true } }),
    prisma.experienciaTraduccion.findMany({
      select: { id: true, nombre: true, slug: true, idioma: true },
    }),
    prisma.productoTraduccion.findMany({
      select: { id: true, nombre: true, slug: true, idioma: true },
    }),
  ])

  const grupos = [
    { etiqueta: 'experiencias (es)', filas: experiencias, tabla: prisma.experiencia },
    { etiqueta: 'productos (es)', filas: productos, tabla: prisma.producto },
    { etiqueta: 'experiencias (traducidas)', filas: expTrad, tabla: prisma.experienciaTraduccion },
    { etiqueta: 'productos (traducidos)', filas: prodTrad, tabla: prisma.productoTraduccion },
  ]

  console.log(PRUEBA ? '\n  MODO PRUEBA — no se escribe nada\n' : '\n  ESCRIBIENDO EN PRODUCCION\n')

  let cambiados = 0
  let saltados = 0

  for (const { etiqueta, filas, tabla } of grupos) {
    const pendientes = (filas as Fila[]).filter(f => capitalizarNombre(f.nombre) !== f.nombre)
    if (pendientes.length === 0) continue

    console.log(`  ${etiqueta}`)
    for (const fila of pendientes) {
      const nombre = capitalizarNombre(fila.nombre)

      // El seguro del script. La capitalizacion no deberia mover el slug —
      // toSlug baja a minusculas y quita acentos— pero si alguna vez lo mueve,
      // esa fila sale de aqui sin tocar: cambiarle el slug a una ficha viva
      // rompe el enlace que alguien compartio, y eso no lo arregla un script
      // que corre desatendido. Se avisa para hacerlo a mano con su redireccion.
      if (toSlug(nombre) !== fila.slug) {
        console.log(`    ! ${fila.nombre}`)
        console.log(`      saltada: el slug pasaria de '${fila.slug}' a '${toSlug(nombre)}'`)
        saltados++
        continue
      }

      console.log(`    - ${fila.nombre}`)
      console.log(`    + ${nombre}`)
      cambiados++

      if (!PRUEBA) {
        await (tabla as { update: (a: unknown) => Promise<unknown> }).update({
          where: { id: fila.id },
          data: { nombre },
        })
      }
    }
    console.log('')
  }

  console.log(
    `  ${cambiados} ${PRUEBA ? 'por corregir' : 'corregidos'}` +
      (saltados ? `, ${saltados} saltados por cambio de slug` : '') +
      '\n',
  )

  // Sin purga manual: las listas y las fichas de los dos catalogos declaran
  // `export const revalidate = 60`, asi que la pagina cacheada caduca sola
  // dentro del minuto siguiente. La purga del panel hace falta cuando se guarda
  // desde el formulario y se quiere ver el cambio al instante; aca no.
  if (!PRUEBA && cambiados > 0) {
    console.log('  El front lo recoge solo dentro de 60 s (revalidate de las paginas).\n')
  }

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
