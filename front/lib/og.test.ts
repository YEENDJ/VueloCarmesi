import { describe, it, expect } from 'vitest'
import { portadaOg, tarjetaOg } from './og'

const BASE = 'https://res.cloudinary.com/demo/image/upload'

describe('tarjetaOg', () => {
  it('elige el archivo del idioma y cae al español', () => {
    expect(tarjetaOg('en', 'x').url).toBe('/images/og/portada-en.jpg')
    expect(tarjetaOg('es', 'x').url).toBe('/images/og/portada-es.jpg')
    expect(tarjetaOg('fr', 'x').url).toBe('/images/og/portada-es.jpg')
  })
})

describe('portadaOg', () => {
  it('pone la portada entera sobre su propio fondo desenfocado, en JPG', () => {
    const og = portadaOg(`${BASE}/v123/vuelo-carmesi/abc.jpg`, 'Ruta')
    expect(og).toEqual({
      url: `${BASE}/c_fill,w_1200,h_630/e_blur:1200/e_brightness:-25/l_vuelo-carmesi:abc,c_limit,w_1200,h_630/fl_layer_apply,q_auto:good,f_jpg/v123/vuelo-carmesi/abc.jpg`,
      width: 1200,
      height: 630,
      alt: 'Ruta',
    })
  })

  it('funciona sin versión en la URL', () => {
    expect(portadaOg(`${BASE}/vuelo-carmesi/abc.jpg`, 'a').url).toBe(
      `${BASE}/c_fill,w_1200,h_630/e_blur:1200/e_brightness:-25/l_vuelo-carmesi:abc,c_limit,w_1200,h_630/fl_layer_apply,q_auto:good,f_jpg/vuelo-carmesi/abc.jpg`,
    )
  })

  // La capa partiría del original: con un recorte del panel se rellena sin capa.
  it('respeta el recorte del panel', () => {
    expect(portadaOg(`${BASE}/c_crop,w_800,h_600,x_10,y_20/v9/vuelo-carmesi/a.jpg`, 'a').url).toBe(
      `${BASE}/c_crop,w_800,h_600,x_10,y_20/c_lpad,w_1200,h_630,b_auto,q_auto:good,f_jpg/v9/vuelo-carmesi/a.jpg`,
    )
  })

  it('un PNG o WebP sale con extensión .jpg', () => {
    expect(portadaOg(`${BASE}/v1/x/logo.png`, 'a').url).toMatch(/l_x:logo,.*\/v1\/x\/logo\.jpg$/)
  })

  it('una foto local vuelve intacta y sin medidas', () => {
    expect(portadaOg('/images/cacao/x.jpg', 'a')).toEqual({ url: '/images/cacao/x.jpg', alt: 'a' })
  })
})
