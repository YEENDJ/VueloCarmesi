import { formatoDeBuffer } from './tipo-imagen'

/** Cabecera de cada formato seguida de relleno, que es lo único que se mira. */
const relleno = (cabecera: number[]) => Buffer.concat([
  Buffer.from(cabecera),
  Buffer.alloc(64),
])

const ascii = (s: string) => Array.from(s).map(c => c.charCodeAt(0))

describe('formatoDeBuffer', () => {
  it('reconoce un JPEG por su marcador SOI', () => {
    expect(formatoDeBuffer(relleno([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg')
  })

  // Exif (cámaras y móviles) y JFIF se diferencian recién en el cuarto byte,
  // así que los dos tienen que entrar por la misma puerta.
  it('reconoce el JPEG de cámara, que difiere en el cuarto byte', () => {
    expect(formatoDeBuffer(relleno([0xff, 0xd8, 0xff, 0xe1]))).toBe('jpeg')
  })

  it('reconoce un PNG', () => {
    expect(formatoDeBuffer(relleno([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png')
  })

  it('reconoce un WebP dentro de su contenedor RIFF', () => {
    const buf = relleno([...ascii('RIFF'), 0x24, 0x00, 0x00, 0x00, ...ascii('WEBP')])
    expect(formatoDeBuffer(buf)).toBe('webp')
  })

  // Es el caso que rompía en producción: la foto está bien, pero es HEIC.
  it('distingue el HEIC del iPhone para poder explicarlo', () => {
    const buf = relleno([0, 0, 0, 0x18, ...ascii('ftyp'), ...ascii('heic')])
    expect(formatoDeBuffer(buf)).toBe('heic')
  })

  it('reconoce las otras marcas de la familia HEIF', () => {
    for (const marca of ['heix', 'mif1', 'msf1']) {
      const buf = relleno([0, 0, 0, 0x18, ...ascii('ftyp'), ...ascii(marca)])
      expect(formatoDeBuffer(buf)).toBe('heic')
    }
  })

  // El mimetype no entra en esta función: lo que decide son los bytes. Un PDF
  // renombrado a .jpg llega declarándose `image/jpeg` y tiene que caer igual.
  it('rechaza un PDF aunque venga con nombre de imagen', () => {
    expect(formatoDeBuffer(relleno(ascii('%PDF-1.7')))).toBeNull()
  })

  it('rechaza un GIF, que no está en la lista', () => {
    expect(formatoDeBuffer(relleno(ascii('GIF89a')))).toBeNull()
  })

  it('no revienta con un archivo más corto que las firmas', () => {
    expect(formatoDeBuffer(Buffer.from([0xff, 0xd8]))).toBeNull()
    expect(formatoDeBuffer(Buffer.alloc(0))).toBeNull()
  })

  // RIFF también envuelve WAV y AVI: sin mirar los bytes 8 a 12 entrarían como
  // imagen.
  it('rechaza un RIFF que no es WebP', () => {
    const wav = relleno([...ascii('RIFF'), 0x24, 0x00, 0x00, 0x00, ...ascii('WAVE')])
    expect(formatoDeBuffer(wav)).toBeNull()
  })
})
