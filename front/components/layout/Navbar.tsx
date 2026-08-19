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

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo" aria-label="Vuelo Carmesí — ir al inicio">
        <Image
          src="/images/marca/logo-crema.png"
          alt="Vuelo Carmesí"
          width={250}
          height={40}
          priority
        />
      </Link>

      {/* Navegación de escritorio */}
      <ul className="navbar-links">
        {LINKS.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="navbar-link">{label}</Link>
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

      <div id="navbar-panel" className={`navbar-panel${abierto ? ' open' : ''}`}>
        <ul>
          {LINKS.map(([label, href]) => (
            <li key={href}>
              <Link href={href} className="navbar-link">{label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
