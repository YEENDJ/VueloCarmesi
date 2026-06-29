'use server'
import { revalidateTag } from 'next/cache'

export async function revalidateExperiencias() {
  revalidateTag('experiencias')
}

export async function revalidateProductos() {
  revalidateTag('productos')
}

export async function revalidateSiteConfig() {
  revalidateTag('site-config')
}
