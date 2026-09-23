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
// refresh limpia la caché del router en el cliente. Sin esto el propio admin
// puede navegar al sitio público y seguir viendo la versión anterior, servida
// desde su caché de cliente aunque el servidor ya tenga la nueva.

export async function revalidateExperiencias() {
  await exigirSesion()
  updateTag('experiencias')
  revalidatePath('/experiencias', 'page')
  revalidatePath('/experiencias/[slug]', 'page')
  revalidatePath('/reservar/[slug]', 'page')
  revalidatePath('/', 'page') // la portada lista las destacadas
  refresh()
}

export async function revalidateProductos() {
  await exigirSesion()
  updateTag('productos')
  revalidatePath('/tienda', 'page')
  revalidatePath('/tienda/[slug]', 'page')
  refresh()
}

export async function revalidateSiteConfig() {
  await exigirSesion()
  updateTag('site-config')
  revalidatePath('/', 'page') // hero_image y about_image viven en la portada
  // La ficha de experiencia también lee de acá —punto de encuentro, resumen de
  // cancelación, WhatsApp—, y es una ruta de detalle: si su fetch etiquetado
  // nunca llegó a cachear, el tag no la alcanza y el admin guarda sin ver nada.
  revalidatePath('/experiencias/[slug]', 'page')
  refresh()
}
