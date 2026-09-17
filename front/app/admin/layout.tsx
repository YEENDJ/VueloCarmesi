import './admin.css'

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
