import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AutoActualizar from '@/components/layout/AutoActualizar'
import WhatsappFlotante from '@/components/layout/WhatsappFlotante'
import { setRequestLocale } from 'next-intl/server'

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Footer es componente de servidor y traduce con useTranslations. Sin fijar
  // el idioma en ESTE layout, next-intl lo lee de las cabeceras con headers(),
  // y eso volvía dinámicas todas las páginas públicas: se generaban en cada
  // visita aunque declararan `revalidate`. No basta con fijarlo en el layout de
  // idioma ni en la página; next-intl pide hacerlo en cada layout y página.
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      {/* No pinta nada: sólo hace que una pestaña abierta recoja los cambios
          del admin sin que el visitante tenga que recargar. */}
      <AutoActualizar />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsappFlotante />
    </>
  )
}
