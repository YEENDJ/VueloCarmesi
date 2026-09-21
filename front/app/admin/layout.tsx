import type { Metadata } from 'next'

import './admin.css'

/**
 * El panel nunca entra al índice.
 *
 * Hoy /admin/login responde 200 y se sirve sin ninguna señal: cualquiera que
 * lo enlace lo mete al buscador. `noindex` es lo que robots.txt no puede
 * hacer —bloquear el rastreo no impide indexar una URL enlazada desde fuera—,
 * y `follow: false` evita además que el rastreador siga los enlaces internos
 * de la herramienta.
 *
 * Va en el layout y no en cada página porque todo lo que cuelga de /admin
 * comparte la regla, incluida cualquier pantalla que se añada después.
 */
export const metadata: Metadata = {
  title: 'Panel · Vuelo Carmesí',
  robots: { index: false, follow: false, nocache: true },
}

/**
 * El panel abre su propio <html>, porque la raíz ya no lo hace.
 *
 * `lang` es siempre español y no lleva segmento de idioma: lo usa una sola
 * persona y traducir la herramienta interna no aporta nada. Por eso el
 * middleware de idioma excluye /admin — si lo tocara, intentaría reescribirlo
 * a /es/admin y el panel dejaría de existir.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
