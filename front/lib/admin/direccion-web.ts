import { routing, IDIOMA_POR_DEFECTO, type Idioma } from '@/lib/i18n/routing'

export type EntidadConSlug = 'experiencia' | 'producto'

const RUTA: Record<EntidadConSlug, '/experiencias/[slug]' | '/tienda/[slug]'> = {
  experiencia: '/experiencias/[slug]',
  producto: '/tienda/[slug]',
}

/**
 * La ruta pública de una ficha en un idioma, tal como la ve el visitante:
 * `/experiencias/ruta-del-cacao` o `/en/experiences/cacao-trail`.
 *
 * Sale de `routing.pathnames` y no de un prefijo escrito acá, para que el día
 * que cambie un segmento traducido el panel muestre la URL de verdad.
 */
export function rutaPublica(entidad: EntidadConSlug, idioma: Idioma, slug: string): string {
  const plantilla = routing.pathnames[RUTA[entidad]][idioma].replace('[slug]', slug)
  // `as-needed`: el español va sin prefijo, el resto con el suyo.
  return idioma === IDIOMA_POR_DEFECTO ? plantilla : `/${idioma}${plantilla}`
}

/**
 * Cómo va a quedar lo que se escribe, para enseñarlo antes de guardar.
 *
 * Es el gemelo de `toSlug` en back/src/common/slug.ts, que es el que manda:
 * el backend normaliza igual lo que le llegue. Este solo existe para que nadie
 * escriba «Ruta del Cacao» y se sorprenda al ver `ruta-del-cacao` en la URL.
 * Si cambias uno, cambia el otro.
 */
export function vistaPreviaSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
