import { portadaDe, publicIdDeCloudinary } from './portada'

describe('portadaDe', () => {
  it('toma la primera foto de la galería', () => {
    expect(portadaDe(['a.jpg', 'b.jpg'])).toBe('a.jpg')
  })

  it('devuelve cadena vacía sin galería, para no dejar la columna en null', () => {
    expect(portadaDe([])).toBe('')
    expect(portadaDe(undefined)).toBe('')
  })
})

describe('publicIdDeCloudinary', () => {
  const base = 'https://res.cloudinary.com/dl2pxtqjq/image/upload'

  it('descarta la versión y la extensión', () => {
    expect(publicIdDeCloudinary(`${base}/v1782953553/vuelo-carmesi/abc.jpg`))
      .toBe('vuelo-carmesi/abc')
  })

  it('funciona sin versión', () => {
    expect(publicIdDeCloudinary(`${base}/vuelo-carmesi/abc.png`))
      .toBe('vuelo-carmesi/abc')
  })

  it('descarta las transformaciones que Cloudinary intercala', () => {
    expect(publicIdDeCloudinary(`${base}/w_500,h_300/v1782953553/vuelo-carmesi/abc.jpg`))
      .toBe('vuelo-carmesi/abc')
  })

  it('conserva las carpetas anidadas', () => {
    expect(publicIdDeCloudinary(`${base}/v1/vuelo-carmesi/experiencias/abc.webp`))
      .toBe('vuelo-carmesi/experiencias/abc')
  })

  // Una foto de la biblioteca local no vive en Cloudinary: borrarla allá no
  // tiene sentido y el llamador debe poder distinguir ese caso sin excepciones.
  it('devuelve null si la URL no es de Cloudinary', () => {
    expect(publicIdDeCloudinary('/images/aves/tigana.jpg')).toBeNull()
    expect(publicIdDeCloudinary('https://ejemplo.com/foto.jpg')).toBeNull()
  })
})
