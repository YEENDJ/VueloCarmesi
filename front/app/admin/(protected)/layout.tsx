import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { COOKIE_SESION, sesionValida } from '@/lib/admin/sesion'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()

  // La firma, no la mera existencia de la cookie: antes bastaba con escribir
  // una a mano para ver el panel.
  if (!sesionValida(cookieStore.get(COOKIE_SESION)?.value)) {
    redirect('/admin/login')
  }

  return <AdminShell>{children}</AdminShell>
}
