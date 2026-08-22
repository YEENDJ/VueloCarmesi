import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'
import { publicIdDeCloudinary } from '../common/portada'
import { formatoDeBuffer } from './tipo-imagen'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Tope de subida. Son 4 MB y no 5 por el camino que hace el archivo: el panel
 * sube contra el propio front (ver front/app/api/admin/proxy.ts) y esa capa
 * corta el cuerpo de la petición en torno a 4,5 MB en la mayoría de los
 * alojamientos. Con el tope en 5 MB había una franja de archivos que el
 * backend habría aceptado pero que nunca le llegaban, y el error salía del
 * intermediario en vez de decir lo que pasaba.
 *
 * Su gemelo está en `MAX_SUBIDA_BYTES` de front/lib/admin/api.ts, que corta
 * antes de gastar la subida. Si cambia uno, cambia el otro.
 */
const MAX_BYTES = 4 * 1024 * 1024 // 4 MB

@Injectable()
export class UploadsService {
  async uploadImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    // El peso primero: es la comprobación barata y no depende de leer nada.
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('La foto pesa más de 4 MB, que es el máximo.')
    }

    // Y el formato por los bytes, no por `file.mimetype`. Ver tipo-imagen.ts:
    // el mimetype es lo que declara el navegador y llegaba mal —`image/jpg`,
    // `application/octet-stream`, vacío— con la foto perfectamente sana.
    const formato = formatoDeBuffer(file.buffer)

    if (formato === 'heic') {
      throw new BadRequestException(
        'Esa foto está en formato HEIC, el que usa el iPhone por defecto. ' +
        'Abre Ajustes › Cámara › Formatos y elige "Más compatible", o comparte ' +
        'la foto por WhatsApp y sube la que llega.',
      )
    }

    if (!formato) {
      // El mimetype declarado va al registro: si vuelve a rechazarse una foto
      // buena, aquí queda con qué llegó y con qué nombre.
      Logger.warn(
        `Archivo rechazado: no es JPG, PNG ni WebP. ` +
        `Declarado '${file.mimetype || '(vacío)'}', nombre '${file.originalname}'.`,
        'UploadsService',
      )
      throw new BadRequestException('Solo se aceptan imágenes JPG, PNG o WebP')
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'vuelo-carmesi', resource_type: 'image' },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary sin resultado'))
          resolve({ url: result.secure_url, publicId: result.public_id })
        },
      )
      stream.end(file.buffer)
    })
  }

  /**
   * Borra la imagen que hay detrás de una URL. Se llama cuando el panel quita
   * una foto de una galería: sin esto el archivo quedaba en Cloudinary para
   * siempre, y con varias fotos por ficha eso se acumula rápido.
   *
   * No lanza si la URL no es de Cloudinary (una foto de la biblioteca local, por
   * ejemplo) ni si el archivo ya no existe: el objetivo es que deje de estar, y
   * en ambos casos ya no está. Fallar ahí solo rompería el guardado del panel.
   */
  async deleteImage(url: string): Promise<{ borrada: boolean }> {
    const publicId = publicIdDeCloudinary(url)
    if (!publicId) return { borrada: false }

    try {
      const { result } = await cloudinary.uploader.destroy(publicId)
      return { borrada: result === 'ok' }
    } catch (err) {
      Logger.warn(`No se pudo borrar '${publicId}' de Cloudinary: ${String(err)}`, 'UploadsService')
      return { borrada: false }
    }
  }
}
