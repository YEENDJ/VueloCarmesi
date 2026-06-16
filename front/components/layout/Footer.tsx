export default function Footer() {
  return (
    <footer style={{
      padding: '2rem',
      backgroundColor: 'var(--color-brown)',
      color: 'var(--color-cream)',
      textAlign: 'center',
      fontFamily: 'var(--font-body)',
    }}>
      <p>© {new Date().getFullYear()} Vuelo Carmesí — Experiencias Agroecológicas con sabor a cacao</p>
    </footer>
  )
}
