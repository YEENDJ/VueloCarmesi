import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AutoActualizar from '@/components/layout/AutoActualizar'
import WhatsappFlotante from '@/components/layout/WhatsappFlotante'
import { setRequestLocale } from 'next-intl/server'
import { connection } from 'next/server'

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

  // Temporal, mientras el sitio siga en Vercel Hobby: las páginas públicas se
  // generan en cada visita, como antes del 5 de octubre. Como ISR, cada
  // regeneración gastaba escrituras aunque el contenido fuera idéntico (~70-80
  // unidades por recarga de la portada) y el sitio se comía en dos semanas las
  // 200.000 del plan. Con páginas dinámicas el contador queda en 0.
  //
  // connection(), no `dynamic = 'force-dynamic'`: este último además pone
  // `no-store` a todos los fetch y cada visita llamaría a Render. Así los datos
  // siguen en caché con su `revalidate` y sus tags, y el panel sigue
  // invalidándolos al guardar.
  //
  // En Netlify esto se quita: allí cada visita dinámica cuesta cómputo, y las
  // páginas estáticas con `revalidate` largo salen más baratas.
  await connection()

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
