import { UploadsService } from './uploads.service'

// Cloudinary queda cortado: ninguna prueba de este archivo debe salir a la red,
// ni siquiera si el entorno tuviera credenciales cargadas. El corte además da
// un error reconocible, que es como se comprueba que un archivo válido llegó
// hasta el final en vez de caerse en la validación.
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: (_opts: unknown, cb: (e: Error) => void) => ({
        end: () => cb(new Error('cloudinary-cortado')),
      }),
    },
  },
}))

/**
 * Solo el tramo de validación: peso y formato se comprueban antes de tocar
 * Cloudinary, y con el mock de arriba nada de esto toca la red.
 */
describe('UploadsService.uploadImage — validación', () => {
  const service = new UploadsService()

  const archivo = (buf: Buffer, extra: Partial<Express.Multer.File> = {}) => ({
    buffer: buf,
    size: buf.length,
    mimetype: 'image/jpeg',
    originalname: 'foto.jpg',
    ...extra,
  }) as Express.Multer.File

  const jpegDe = (bytes: number) => Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.alloc(Math.max(0, bytes - 4)),
  ])

  it('rechaza por encima de 4 MB', async () => {
    const grande = archivo(jpegDe(4 * 1024 * 1024 + 1))
    await expect(service.uploadImage(grande)).rejects.toThrow('4 MB')
  })

  // El tope tiene que ser inclusivo: 4 MB exactos es un archivo válido. Que
  // llegue al error del mock demuestra que pasó las dos validaciones enteras.
  it('deja pasar un JPEG de exactamente 4 MB', async () => {
    const justo = archivo(jpegDe(4 * 1024 * 1024))
    await expect(service.uploadImage(justo)).rejects.toThrow('cloudinary-cortado')
  })

  // El peso se mira antes que el formato: es la comprobación barata y no
  // depende de leer el contenido.
  it('a un archivo enorme le reclama el peso, no el formato', async () => {
    const basura = archivo(Buffer.alloc(5 * 1024 * 1024), { mimetype: 'application/pdf' })
    await expect(service.uploadImage(basura)).rejects.toThrow('4 MB')
  })

  it('rechaza lo que no es imagen aunque se declare JPG', async () => {
    const pdf = archivo(Buffer.from('%PDF-1.7 y algo más de relleno'))
    await expect(service.uploadImage(pdf)).rejects.toThrow('JPG, PNG o WebP')
  })

  // El caso de producción: la foto está bien, pero es HEIC de iPhone. El aviso
  // tiene que decir dónde cambiarlo, no repetir la lista de formatos.
  it('explica el HEIC en vez de rechazarlo a secas', async () => {
    const heic = Buffer.concat([
      Buffer.from([0, 0, 0, 0x18]),
      Buffer.from('ftypheic'),
      Buffer.alloc(32),
    ])
    await expect(service.uploadImage(archivo(heic))).rejects.toThrow('HEIC')
    await expect(service.uploadImage(archivo(heic))).rejects.toThrow('Más compatible')
  })
})
