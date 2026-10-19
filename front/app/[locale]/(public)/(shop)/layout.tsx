import StepIndicator from '@/components/shop/StepIndicator'
import Toast from '@/components/shop/Toast'
import MiniCarrito from '@/components/shop/MiniCarrito'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toast />
      <MiniCarrito />
    </>
  )
}
