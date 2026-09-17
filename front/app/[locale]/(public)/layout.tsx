import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AutoActualizar from '@/components/layout/AutoActualizar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* No pinta nada: sólo hace que una pestaña abierta recoja los cambios
          del admin sin que el visitante tenga que recargar. */}
      <AutoActualizar />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
