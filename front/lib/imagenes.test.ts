import { describe, it, expect } from 'vitest'
import { esCloudinary, fotoCloudinary } from './imagenes'

// La del hero real, tal como la devuelve /site-config.
const HERO =
  'https://res.cloudinary.com/dl2pxtqjq/image/upload/v1787706935/vuelo-carmesi/b6kvdkcivynxozbxz3oc.jpg'

describe('esCloudinary', () => {
  it('reconoce una URL de entrega de Cloudinary', () => {
    expect(esCloudinary(HERO)).toBe(true)
  })

  it('rechaza lo que no sabemos transformar', () => {
    expect(esCloudinary('/images/cacao/cacaotal-mazorcas-rojas.jpg')).toBe(false)
    expect(esCloudinary('https://otro-cdn.com/image/upload/v1/foto.jpg')).toBe(false)
    expect(esCloudinary(undefined)).toBe(false)
    expect(esCloudinary('')).toBe(false)
  })
})

describe('fotoCloudinary', () => {
  it('inserta la transformación delante de la versión, no pegada a /upload/', () => {
    // Al final de la cadena: si la URL trajera un recorte del panel, se
    // aplicaría antes que nuestra reducción.
    expect(fotoCloudinary(HERO, 560).src).toBe(
      'https://res.cloudinary.com/dl2pxtqjq/image/upload/f_auto,q_auto,c_limit,w_560/v1787706935/vuelo-carmesi/b6kvdkcivynxozbxz3oc.jpg',
    )
  })

  it('conserva el recorte que ya traiga la URL y se encadena detrás', () => {
    const recortada =
      'https://res.cloudinary.com/dl2pxtqjq/image/upload/c_fill,w_1600,h_900/v1787706935/vuelo-carmesi/foto.jpg'
    expect(fotoCloudinary(recortada, 560).src).toContain(
      '/upload/c_fill,w_1600,h_900/f_auto,q_auto,c_limit,w_560/v1787706935/',
    )
  })

  it('el srcset llega al doble del ancho pintado y no lo pasa', () => {
    const { srcSet } = fotoCloudinary(HERO, 560)
    const anchos = srcSet!.split(', ').map((entrada) => Number(entrada.split(' ')[1].replace('w', '')))

    // 1120 = 560 × 2, el ancho de una pantalla 2×. Más allá el archivo pesa
    // más sin verse mejor.
    expect(anchos[anchos.length - 1]).toBe(1120)
    expect(anchos.every((ancho) => ancho <= 1120)).toBe(true)
    expect(anchos).toEqual([...anchos].sort((a, b) => a - b))
    expect(new Set(anchos).size).toBe(anchos.length)
  })

  it('un ancho que coincide con uno de la lista no sale repetido', () => {
    const { srcSet } = fotoCloudinary(HERO, 320) // tope = 640, que está en ANCHOS
    const anchos = srcSet!.split(', ').map((entrada) => entrada.split(' ')[1])
    expect(anchos).toEqual(['320w', '480w', '640w'])
  })

  it('cada entrada del srcset pide su propio ancho a Cloudinary', () => {
    const { srcSet } = fotoCloudinary(HERO, 185)
    for (const entrada of srcSet!.split(', ')) {
      const [url, descriptor] = entrada.split(' ')
      expect(url).toContain(`f_auto,q_auto,c_limit,w_${descriptor.replace('w', '')}/`)
    }
  })

  it('una URL que no es de Cloudinary vuelve intacta y sin srcSet', () => {
    const local = '/images/cacao/cacaotal-mazorcas-rojas.jpg'
    expect(fotoCloudinary(local, 560)).toEqual({ src: local })
  })
})
