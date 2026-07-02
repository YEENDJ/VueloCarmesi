'use client'
export default function Toggle({ checked, onChange, disabled }: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 42, height: 24, borderRadius: 100, border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: checked ? '#1F8A5B' : 'rgba(135,43,19,.2)',
        position: 'relative', transition: 'background 200ms', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </button>
  )
}
