'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import AdminHeader from './AdminHeader'

/**
 * Cáscara del panel. Existe como client component porque el sidebar y el
 * header comparten el estado del menú: en pantallas chicas el sidebar sale
 * de la vista y se abre desde el botón del header.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const pathname = usePathname()
  const [pathAnterior, setPathAnterior] = useState(pathname)

  // Al navegar el menú se cierra solo (ajuste de estado en render:
  // cubre también los botones atrás/adelante del navegador)
  if (pathAnterior !== pathname) {
    setPathAnterior(pathname)
    setMenuAbierto(false)
  }

  useEffect(() => {
    if (!menuAbierto) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuAbierto(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuAbierto])

  return (
    <div className="admin-shell">
      <Sidebar abierto={menuAbierto} />

      {menuAbierto && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
      )}

      <div className="admin-main">
        <AdminHeader
          menuAbierto={menuAbierto}
          onToggleMenu={() => setMenuAbierto(v => !v)}
        />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  )
}
