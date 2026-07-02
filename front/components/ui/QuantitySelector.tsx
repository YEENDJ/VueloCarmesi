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
  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: 40,
    height: 40,
    border: '1px solid var(--color-brown)',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: 'var(--color-brown)',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    fontSize: '1.25rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  })

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        style={btnStyle(value <= min)}
      >
        −
      </button>
      <span style={{
        minWidth: 40,
        textAlign: 'center',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: '1.125rem',
        color: 'var(--color-brown)',
      }}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        style={btnStyle(value >= max)}
      >
        +
      </button>
    </div>
  )
}
