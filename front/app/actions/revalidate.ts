'use server'
import { revalidateTag } from 'next/cache'

export async function revalidateExperiencias() {
  revalidateTag('experiencias', 'default')
}

export async function revalidateProductos() {
  revalidateTag('productos', 'default')
}

export async function revalidateSiteConfig() {
  revalidateTag('site-config', 'default')
}
