const colorMap = {
  crimson: { bg: 'var(--color-crimson)', text: 'var(--color-cream)' },
  amber:   { bg: 'var(--color-amber)',   text: 'var(--color-brown)' },
  orange:  { bg: 'var(--color-orange)',  text: 'var(--color-cream)' },
}

export default function Badge({ children, color = 'crimson' }: { children: React.ReactNode; color?: 'crimson'|'amber'|'orange' }) {
  const { bg, text } = colorMap[color]
  return (
    <span style={{
      backgroundColor: bg, color: text,
      padding: '0.25rem 0.75rem', borderRadius: '999px',
      fontSize: '0.8rem', fontWeight: 700,
    }}>
      {children}
    </span>
  )
}
