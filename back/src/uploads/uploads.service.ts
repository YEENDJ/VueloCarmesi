import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'
import { publicIdDeCloudinary } from '../common/portada'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

@Injectable()
export class UploadsService {
  async uploadImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Solo se aceptan imágenes JPG, PNG o WebP')
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('El archivo supera el límite de 5 MB')
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
