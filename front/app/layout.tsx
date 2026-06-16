import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vuelo Carmesí — Experiencias Agroecológicas',
  description: 'Experiencias agroecológicas con sabor a cacao',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
