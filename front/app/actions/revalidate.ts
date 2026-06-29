'use server'
import { revalidateTag } from 'next/cache'

export async function revalidateExperiencias() {
  revalidateTag('experiencias', 'max')
}

export async function revalidateProductos() {
  revalidateTag('productos', 'max')
}

export async function revalidateSiteConfig() {
  revalidateTag('site-config', 'max')
}
