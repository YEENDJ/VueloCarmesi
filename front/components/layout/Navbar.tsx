'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import CartBadge from '@/components/shop/CartBadge'

const LINKS: [string, string][] = [
  ['Inicio', '/'],
  ['Experiencias', '/experiencias'],
  ['Tienda', '/tienda'],
  ['Contacto', '/contacto'],
]

export default function Navbar() {
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
  const esActiva = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav className="navbar">
      {/* .contenido alinea el logo y los enlaces con el resto de la página;
          la franja crimson de .navbar sigue llegando a los bordes. */}
      <div className="navbar-inner contenido">
      <Link href="/" className="navbar-logo" aria-label="Vuelo Carmesí — ir al inicio">
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
        {LINKS.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className={`navbar-link${esActiva(href) ? ' activo' : ''}`}
              aria-current={esActiva(href) ? 'page' : undefined}
            >
              {label}
            </Link>
          </li>
        ))}
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
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setAbierto(v => !v)}
        >
          {abierto ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      </div>

      <div id="navbar-panel" className={`navbar-panel${abierto ? ' open' : ''}`}>
        <ul>
          {LINKS.map(([label, href]) => (
            <li key={href}>
              <Link
              href={href}
              className={`navbar-link${esActiva(href) ? ' activo' : ''}`}
              aria-current={esActiva(href) ? 'page' : undefined}
            >
              {label}
            </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
