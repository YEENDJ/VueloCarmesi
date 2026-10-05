'use server'
import { cookies } from 'next/headers'
import { updateTag, revalidatePath, refresh } from 'next/cache'
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

export async function revalidateExperiencias() {
  await exigirSesion()
  updateTag('experiencias')
  revalidatePath('/[locale]', 'layout')
  refresh()
}

export async function revalidateProductos() {
  await exigirSesion()
  updateTag('productos')
  revalidatePath('/[locale]', 'layout')
  refresh()
}

export async function revalidateSiteConfig() {
  await exigirSesion()
  updateTag('site-config')
  // La portada (hero_image, about_image) y la ficha de experiencia (punto de
  // encuentro, resumen de cancelación, WhatsApp) leen de acá.
  revalidatePath('/[locale]', 'layout')
  refresh()
}
