import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import './admin.css'
import Sidebar from '@/components/admin/Sidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <AdminHeader />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  )
}
