export default function ReservarPage({ params }: { params: { slug: string } }) {
  return (
    <section style={{ padding: '4rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-crimson)' }}>Reservar: {params.slug}</h1>
    </section>
  )
}
