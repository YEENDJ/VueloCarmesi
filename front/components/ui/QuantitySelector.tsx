import { useTranslations } from 'next-intl'
interface QuantitySelectorProps {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = Infinity,
}: QuantitySelectorProps) {
  const t = useTranslations('tienda')

  return (
    <div className="qty">
      <button
        type="button"
        className="qty-btn"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={t('quitarUno')}
      >
        −
      </button>
      <span className="qty-valor">{value}</span>
      <button
        type="button"
        className="qty-btn"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={t('agregarUno')}
      >
        +
      </button>
    </div>
  )
}
