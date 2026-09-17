'use client'
import { useEffect } from 'react'
import { publicarSlugs } from '@/lib/i18n/slugs-store'

/**
 * No pinta nada: le pasa al selector de idioma los slugs de esta ficha.
 *
 * Lo renderizan las páginas de detalle —experiencia y producto—, que son las
 * únicas cuya URL lleva un slug que cambia con el idioma. Sin esto, cambiar a
 * inglés desde /experiencias/experiencia-cacaotera llevaría a
 * /en/experiences/experiencia-cacaotera: resuelve, porque el backend busca el
 * slug en los dos idiomas, pero no es la URL canónica.
 *
 * Se limpia al desmontar para que el selector no siga ofreciendo el slug de una
 * ficha que el visitante ya abandonó.
 */
export default function PublicarSlugs({ slugs }: { slugs?: Record<string, string> }) {
  useEffect(() => {
    publicarSlugs(slugs ?? null)
    return () => publicarSlugs(null)
  }, [slugs])

  return null
}
