import StepIndicator from '@/components/shop/StepIndicator'
import Toast from '@/components/shop/Toast'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StepIndicator />
      {children}
      <Toast />
    </>
  )
}
