import Hero from '@/components/layout/Hero'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const experienciasPreview = [
  { slug: 'cacao-intenso', nombre: 'Cacao Intenso', descripcion: 'Recorrido por plantaciones y degustación guiada.', duracion: '4 horas', precio: 8500 },
  { slug: 'cacao-y-arte', nombre: 'Cacao & Arte', descripcion: 'Taller de chocolatería artesanal con artistas locales.', duracion: '3 horas', precio: 7000 },
  { slug: 'amanecer-agroecologico', nombre: 'Amanecer Agroecológico', descripcion: 'Tour al amanecer con desayuno orgánico incluido.', duracion: '5 horas', precio: 9500 },
]

export default function HomePage() {
  return (
    <>
      <Hero
        titulo="Vuelo Carmesí"
        subtitulo="Experiencias agroecológicas con sabor a cacao"
        ctaTexto="Explorar experiencias"
        ctaHref="/experiencias"
        imagen="/images/hero-bg.jpg"
      />

      {/* Sección: Experiencias preview */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: 'var(--color-brown)' }}>
          Nuestras Experiencias
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {experienciasPreview.map((exp) => (
            <Card key={exp.slug}>
              <div style={{ height: '200px', backgroundColor: 'var(--color-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '3rem' }}>🍫</span>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-brown)' }}>{exp.nombre}</h3>
                <p style={{ opacity: 0.8, marginBottom: '1rem', fontSize: '0.95rem' }}>{exp.descripcion}</p>
                <p style={{ fontWeight: 700, color: 'var(--color-crimson)', marginBottom: '1rem' }}>
                  ${exp.precio.toLocaleString('es-AR')} — {exp.duracion}
                </p>
                <Button href={`/experiencias/${exp.slug}`} variant="outline">Ver detalle</Button>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button href="/experiencias">Ver todas las experiencias</Button>
        </div>
      </section>

      {/* Sección: Sobre nosotros */}
      <section style={{ backgroundColor: 'var(--color-brown)', color: 'var(--color-cream)', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--color-gold)' }}>Sobre Vuelo Carmesí</h2>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, opacity: 0.9 }}>
            Somos un proyecto agroecológico dedicado a rescatar y celebrar la cultura del cacao.
            Ofrecemos experiencias inmersivas donde los visitantes conectan con la tierra,
            los productores y el proceso artesanal detrás de cada pieza de chocolate.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', backgroundColor: 'var(--color-cream)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-brown)' }}>¿Listo para vivir la experiencia?</h2>
        <Button href="/experiencias" variant="primary">Reservar ahora</Button>
      </section>
    </>
  )
}
