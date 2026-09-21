'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Menu, X } from 'lucide-react'
import { Link, usePathname } from '@/lib/i18n/navigation'
import CartBadge from '@/components/shop/CartBadge'
import SelectorIdioma from '@/components/layout/SelectorIdioma'

/**
 * Las pestañas, como par (clave de traducción, ruta interna).
 *
 * La ruta es siempre la española —la que coincide con las carpetas de
 * app/[locale]—; el Link de next-intl la reescribe al idioma activo, así que
 * '/tienda' sale como /tienda en español y como /en/shop en inglés sin que este
 * componente sepa nada de ese mapeo.
 */
// `as const` no es cosmetico: next-intl tipa las rutas como union literal de
// las declaradas en routing.ts, y sin el las cadenas se ensanchan a `string` y
// el Link deja de compilar. A cambio, una ruta mal escrita la caza el compilador
// en vez de aparecer como 404 en produccion.
const LINKS = [
  ['inicio', '/'],
  ['experiencias', '/experiencias'],
  // Grupos y Aviturismo NO van acá, por la misma razón: son puertas de entrada
  // de públicos que llegan buscando, no pestañas del sitio. Viven en el pie,
  // que es donde se enlazan desde todas las páginas, y a quien ya está dentro
  // lo recogen los avisos de /contacto, /experiencias y el formulario de
  // reserva —que es justo donde ese visitante se estaba perdiendo—.
  ['tienda', '/tienda'],
  ['nosotros', '/sobre-nosotros'],
  ['contacto', '/contacto'],
] as const

export default function Navbar() {
  const t = useTranslations('nav')
  const [abierto, setAbierto] = useState(false)
  const pathname = usePathname()
  const [pathAnterior, setPathAnterior] = useState(pathname)

  // Al navegar el panel se cierra solo (ajuste de estado en render:
  // cubre también los botones atrás/adelante del navegador)
  if (pathAnterior !== pathname) {
    setPathAnterior(pathname)
    setAbierto(false)
  }

  // Escape cierra el panel
  useEffect(() => {
    if (!abierto) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [abierto])

  // Una pestaña queda activa si estamos en su ruta o en cualquier página que
  // cuelgue de ella (/experiencias/kayak enciende «Experiencias»). Inicio es la
  // excepción: sólo en la raíz, si no estaría siempre encendida.
  //
  // `usePathname` de next-intl devuelve la ruta interna, así que esta
  // comparación sigue hecha contra las rutas españolas y funciona igual en
  // inglés sin tener que duplicar la lista.
  const esActiva = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav className="navbar">
      {/* .contenido alinea el logo y los enlaces con el resto de la página;
          la franja crimson de .navbar sigue llegando a los bordes. */}
      <div className="navbar-inner contenido">
      <Link href="/" className="navbar-logo" aria-label={t('irAlInicio')}>
        <Image
          src="/images/marca/logo-crema.png"
          alt="Vuelo Carmesí"
          width={220}
          height={35}
          // El ancho real lo fija .navbar-logo, que baja a 46vw en pantallas
          // angostas; sizes se lo dice al optimizador para que no sirva de mas.
          sizes="(max-width: 478px) 46vw, 220px"
          priority
        />
      </Link>

      {/* Navegación de escritorio */}
      <ul className="navbar-links">
        {LINKS.map(([clave, href]) => (
          <li key={href}>
            <Link
              href={href}
              className={`navbar-link${esActiva(href) ? ' activo' : ''}`}
              aria-current={esActiva(href) ? 'page' : undefined}
            >
              {t(clave)}
            </Link>
          </li>
        ))}
        <li><SelectorIdioma /></li>
        <li><CartBadge /></li>
      </ul>

      {/* Navegación móvil */}
      <div className="navbar-mobile-actions">
        <CartBadge />
        <button
          type="button"
          className="navbar-toggle"
          aria-expanded={abierto}
          aria-controls="navbar-panel"
          aria-label={abierto ? t('cerrarMenu') : t('abrirMenu')}
          onClick={() => setAbierto(v => !v)}
        >
          {abierto ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      </div>

      <div id="navbar-panel" className={`navbar-panel${abierto ? ' open' : ''}`}>
        <ul>
          {LINKS.map(([clave, href]) => (
            <li key={href}>
              <Link
              href={href}
              className={`navbar-link${esActiva(href) ? ' activo' : ''}`}
              aria-current={esActiva(href) ? 'page' : undefined}
            >
              {t(clave)}
            </Link>
            </li>
          ))}
        </ul>
        {/* Fuera de la <ul>: cambiar de idioma no es navegar a una sexta
            página, y dentro de la lista se leería como una pestaña más. */}
        <SelectorIdioma variante="panel" />
      </div>
    </nav>
  )
}
