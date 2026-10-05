'use server'
import { cookies } from 'next/headers'
import { updateTag, revalidatePath, refresh } from 'next/cache'
import { after } from 'next/server'
import { purgeCache } from '@netlify/functions'
import { COOKIE_SESION, sesionValida } from '@/lib/admin/sesion'

/**
 * Una Server Action es un endpoint público: cualquiera que tenga su id puede
 * invocarla con un POST, venga o no del panel. Estas solo vacían caché, pero
 * sin esta comprobación cualquiera podía obligar al sitio a rehacer todas sus
 * páginas una y otra vez.
 */
async function exigirSesion() {
  if (!sesionValida((await cookies()).get(COOKIE_SESION)?.value)) {
    throw new Error('Sin sesión de administrador')
  }
}

// updateTag, no revalidateTag: en Next 16 revalidateTag exige un perfil de
// cacheLife y el que usábamos, 'default', deja la entrada servible como stale
// durante 5 minutos. Es decir, el admin guardaba y el sitio seguía mostrando lo
// viejo un buen rato. updateTag expira la entrada de inmediato y hace que la
// siguiente petición espere el dato fresco en vez de servir el cacheado, que es
// la semántica read-your-own-writes que queremos acá. Solo funciona dentro de
// Server Actions, que es exactamente lo que son estas funciones.
//
// revalidatePath se mantiene además del tag: alcanza a las rutas de detalle que
// nunca llegaron a cachear un fetch etiquetado, incluidas las que dejaron un 404
// guardado cuando el slug todavía no existía.
//
// Va sobre el layout `/[locale]`, no sobre rutas sueltas. revalidatePath recibe
// la estructura de archivos, y las páginas viven bajo `[locale]`: las rutas que
// había antes (`/experiencias`, `/`) no casaban con ninguna página. Daba igual
// mientras todo el sitio se generaba en cada visita; desde que las páginas
// públicas son estáticas con revalidación, el respaldo tiene que acertar. El
// sitio es chico y cada página se rehace recién cuando alguien la visita, así
// que invalidar todo el árbol público no cuesta nada que se note.
//
// refresh limpia la caché del router en el cliente. Sin esto el propio admin
// puede navegar al sitio público y seguir viendo la versión anterior, servida
// desde su caché de cliente aunque el servidor ya tenga la nueva.
function invalidar(tag: string) {
  updateTag(tag)
  revalidatePath('/[locale]', 'layout')
  refresh()
  after(purgarCdnNetlify)
}

/**
 * En Netlify, lo de arriba no alcanza a su CDN. Medido en Deploy Previews con
 * la caché fresca (29 y 40 s de antigüedad al guardar): la acción responde 200
 * y aun así Edge y Durable siguen sirviendo la página vieja hasta cumplir sus
 * 60 s. No lo arreglaron ni revalidateTag con `{ expire: 0 }` ni subir a Next
 * 16.3.8, la versión a la que se ajustó el adaptador (5.16.2). Las páginas en
 * su CDN solo llevan etiquetas de ruta, no `experiencias` ni `productos`.
 *
 * Así que se purga el CDN entero con la API de Netlify. El sitio es chico y
 * cada página se rehace recién cuando alguien la visita: purgar todo cuesta lo
 * mismo que purgar lo justo y no depende de adivinar qué etiquetas usa.
 *
 * Va en `after`, cuando la respuesta de la acción ya salió: así Next ya dejó
 * escritas sus propias invalidaciones y una visita que llegue justo después
 * no vuelve a guardar en el CDN la página vieja.
 *
 * Solo corre donde existe el token de purga, que Netlify pone en el entorno
 * de sus funciones; en Vercel y en local no hace nada. Un fallo no rompe el
 * guardado: queda en el log y la página se renueva igual a los 60 s.
 */
async function purgarCdnNetlify() {
  if (!process.env.NETLIFY_PURGE_API_TOKEN) {
    if (process.env.SITE_ID) console.warn('[revalidate] En Netlify pero sin NETLIFY_PURGE_API_TOKEN: no se purga el CDN')
    return
  }
  try {
    await purgeCache()
    console.log('[revalidate] CDN de Netlify purgado')
  } catch (err) {
    console.error('[revalidate] Falló la purga del CDN de Netlify:', err)
  }
}

export async function revalidateExperiencias() {
  await exigirSesion()
  invalidar('experiencias')
}

export async function revalidateProductos() {
  await exigirSesion()
  invalidar('productos')
}

export async function revalidateSiteConfig() {
  await exigirSesion()
  // La portada (hero_image, about_image) y la ficha de experiencia (punto de
  // encuentro, resumen de cancelación, WhatsApp) leen de acá.
  invalidar('site-config')
}
