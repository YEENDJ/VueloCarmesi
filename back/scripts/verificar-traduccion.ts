/**
 * Comprobacion de la traduccion automatica contra la API real de DeepL.
 *
 * Correr despues de tocar glosario.ts:  npm run verificar:traduccion
 *
 * Traduce una ficha de prueba que contiene a proposito todo lo que puede salir
 * mal —nombre de marca, aves con nombre popular colombiano, vocabulario del
 * cacao, parrafos y listas— y comprueba que el glosario hizo su trabajo.
 * Sin glosario, «Vuelo Carmesi» se traduce como «Crimson Flight»: esto es lo
 * que avisa cuando eso vuelve a pasar.
 *
 * Gasta caracteres de la cuota mensual de DeepL, asi que no va en los tests.
 */
import 'dotenv/config'
import { TraduccionService } from '../src/traduccion/traduccion.service'
import {
  TEXTO_EXPERIENCIA,
  LISTA_EXPERIENCIA,
} from '../src/traduccion/campos'

// Ficha de prueba con lo que de verdad va a atravesar el motor: nombre de
// marca, aves con nombre popular colombiano, vocabulario del cacao y una
// lista de viñetas.
const FICHA = {
  nombre: 'Ruta del Cacao en Vuelo Carmesí',
  descripcion:
    'Recorrido guiado por el cacaotal de la Finca La Fortuna, con degustación final.',
  descripcionLarga:
    'Caminamos entre cacao en sombrío mientras el guía abre una mazorca recién cortada y te deja probar la baba.\n\nDespués subimos al mirador, donde con suerte aparecen la tángara azul y el carriquí, y cerramos con una chocoterapia junto al río Ariari.',
  duracion: '3 horas',
  horarios: 'Martes a domingo, 8:00 a. m. y 2:00 p. m.',
  recomendaciones: 'Desde 8 años. Llevar calzado cerrado y repelente.',
  puntoEncuentro: 'Portería de la Finca La Fortuna, Vereda Brisas del Tonoa, Cubarral.',
  incluye: ['Guía especializado', 'Degustación de cacao', 'Refrigerio'],
  queTraer: ['Calzado cerrado', 'Binoculares si tienes'],
  noIncluye: ['Transporte hasta la finca'],
}

async function main() {
  const servicio = new TraduccionService()

  if (!servicio.disponible) {
    console.log('\n  DEEPL_API_KEY vacía en back/.env — no hay nada que probar.\n')
    process.exit(1)
  }

  console.log('\n  Traduciendo ficha de prueba...\n')
  const t0 = Date.now()
  const res = await servicio.traducir(FICHA, TEXTO_EXPERIENCIA, LISTA_EXPERIENCIA)
  const ms = Date.now() - t0

  if (!res) {
    console.log('  FALLÓ. Revisa el log de arriba.\n')
    process.exit(1)
  }

  for (const [campo, valor] of Object.entries(res.campos)) {
    console.log(`  ${campo}`)
    console.log(`    ES  ${JSON.stringify((FICHA as Record<string, unknown>)[campo])}`)
    console.log(`    EN  ${JSON.stringify(valor)}`)
    console.log()
  }

  console.log(`  ${Object.keys(res.campos).length} campos en ${ms} ms  (1er guardado tras arrancar)`)

  // El segundo guardado en el mismo proceso: el glosario ya esta resuelto en
  // memoria, asi que esto es lo que espera el admin el 99% de las veces.
  const t1 = Date.now()
  await servicio.traducir(FICHA, TEXTO_EXPERIENCIA, LISTA_EXPERIENCIA)
  console.log(`  segundo guardado: ${Date.now() - t1} ms  <-- el caso normal`)
  console.log(`  huellas guardadas: ${Object.keys(res.huellas).length} campos\n`)

  // Comprobaciones de lo que el glosario tenía que garantizar sí o sí.
  const todo = JSON.stringify(res.campos)
  const reglas: Array<[string, boolean]> = [
    ['«Vuelo Carmesí» intacto', todo.includes('Vuelo Carmes')],
    ['«Finca La Fortuna» intacto', todo.includes('Finca La Fortuna')],
    ['«Brisas del Tonoa» intacto', todo.includes('Brisas del Tonoa')],
    ['tángara azul → Blue-gray Tanager', todo.includes('Blue-gray Tanager')],
    ['mazorca → cacao pod', /cacao pod/i.test(todo)],
    ['cacaotal → cacao grove', /cacao grove/i.test(todo)],
    ['párrafos conservados', String(res.campos.descripcionLarga).includes('\n\n')],
  ]
  console.log('  GLOSARIO')
  for (const [etiqueta, ok] of reglas) {
    console.log(`    ${ok ? 'OK  ' : 'FALLA'} ${etiqueta}`)
  }
  console.log()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
