import { capitalizarNombre } from './nombre'
import { toSlug } from './slug'

describe('capitalizarNombre', () => {
  it('baja las versalitas y deja mayúscula de frase, no de título', () => {
    expect(capitalizarNombre('AVISTAMIENTO DE AVES')).toBe('Avistamiento de aves')
    expect(capitalizarNombre('MASCARILLA DE CACAO + REFRIGERIO'))
      .toBe('Mascarilla de cacao + refrigerio')
    expect(capitalizarNombre('EXPERIENCIA AVES + CACAO')).toBe('Experiencia aves + cacao')
  })

  it('sube la inicial de un nombre que empieza en minúscula', () => {
    expect(capitalizarNombre('chocolate ARICAO 100% x 125 gramos'))
      .toBe('Chocolate ARICAO 100% x 125 gramos')
    expect(capitalizarNombre('coffee Rincón x 250 gramos')).toBe('Coffee Rincón x 250 gramos')
  })

  // La razón de ser de la lista: sin ella estos tres salen como «aricao»,
  // «carao» y «mujari», que es peor que el problema que vino a arreglar.
  it('respeta las marcas del glosario', () => {
    expect(capitalizarNombre('chocolatina CARAO 70 gramos')).toBe('Chocolatina CARAO 70 gramos')
    expect(capitalizarNombre('Grageas MUJARI x 70 gramos')).toBe('Grageas MUJARI x 70 gramos')
    expect(capitalizarNombre('Destilado de cacao PARADISO x 300 ml'))
      .toBe('Destilado de cacao PARADISO x 300 ml')
    expect(capitalizarNombre('chocolatina ARICAO 100, 85 y 50% x 60 gramos'))
      .toBe('Chocolatina ARICAO 100, 85 y 50% x 60 gramos')
  })

  it('reconoce la marca aunque venga sin tilde o pegada a un signo', () => {
    expect(capitalizarNombre('café RINCON x 250 gramos')).toBe('Café RINCON x 250 gramos')
    expect(capitalizarNombre('chocolate (ARICAO) x 125 gramos'))
      .toBe('Chocolate (ARICAO) x 125 gramos')
  })

  it('no toca lo que ya está bien escrito', () => {
    const buenos = [
      'Chocolate instantáneo en polvo x 250 gramos',
      'Miel de abejas x 450 gramos',
      'Vino de café x 375 ml',
      'Mermelada de mucílago de cacao x 150 y 200 gramos',
    ]
    for (const nombre of buenos) expect(capitalizarNombre(nombre)).toBe(nombre)
  })

  it('deja los números y las unidades en paz', () => {
    expect(capitalizarNombre('VINO DE CAFE X 375 ML')).toBe('Vino de cafe x 375 ml')
  })

  // Si la primera palabra no tiene letras, no se mueve la mayuscula a la
  // siguiente: quedaria a mitad de frase, que es otro error distinto.
  it('no inventa una mayúscula cuando el nombre abre con un número', () => {
    expect(capitalizarNombre('70% cacao en barra')).toBe('70% cacao en barra')
    expect(capitalizarNombre('100% CACAO')).toBe('100% cacao')
  })

  it('busca la letra dentro de la primera palabra, no el primer carácter', () => {
    expect(capitalizarNombre('(chocolate) ARICAO')).toBe('(Chocolate) ARICAO')
  })

  it('recorta y colapsa los espacios de más', () => {
    expect(capitalizarNombre('  Chocolate ARICAO ')).toBe('Chocolate ARICAO')
    expect(capitalizarNombre('Vino  de   café')).toBe('Vino de café')
  })

  // Lo que hace que esto se pueda aplicar al catálogo vivo sin romper enlaces:
  // toSlug baja a minúsculas y quita acentos, así que corregir la capitalización
  // deja el slug idéntico. Si alguien cambia toSlug, este test avisa.
  it('no cambia el slug que se deriva del nombre', () => {
    const nombres = [
      'chocolate ARICAO 100% x 125 gramos',
      'AVISTAMIENTO DE AVES',
      'coffee Rincón x 250 gramos',
      'MASCARILLA DE CACAO + REFRIGERIO',
    ]
    for (const nombre of nombres) {
      expect(toSlug(capitalizarNombre(nombre))).toBe(toSlug(nombre))
    }
  })

  it('aguanta un nombre sin letras sin romperse', () => {
    expect(capitalizarNombre('   ')).toBe('')
    expect(capitalizarNombre('125')).toBe('125')
  })
})
