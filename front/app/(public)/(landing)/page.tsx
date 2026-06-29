import Hero from '@/components/layout/Hero'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import SobreNosotros from '@/components/secciones/SobreNosotros'
import { getSiteConfig } from '@/lib/api/site-config'

const experienciasPreview = [
  { slug: 'cacao-intenso', nombre: 'Cacao Intenso', descripcion: 'Recorrido por plantaciones y degustación guiada.', duracion: '4 horas', precio: 8500 },
  { slug: 'cacao-y-arte', nombre: 'Cacao & Arte', descripcion: 'Taller de chocolatería artesanal con artistas locales.', duracion: '3 horas', precio: 7000 },
  { slug: 'amanecer-agroecologico', nombre: 'Amanecer Agroecológico', descripcion: 'Tour al amanecer con desayuno orgánico incluido.', duracion: '5 horas', precio: 9500 },
]

export default async function HomePage() {
  const config = await getSiteConfig()
  return (
    <>
      <Hero
        titulo="El sabor maduro de la tierra"
        subtitulo="Cosechamos, fermentamos y catamos junto a vos. Conocé el cacao desde su raíz, en una finca que respira selva."
        ctaTexto="Reservá tu experiencia"
        ctaHref="/experiencias"
        imagen={config.hero_image || undefined}
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

      <SobreNosotros />

      {/* CTA Final */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', backgroundColor: 'var(--color-cream)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-brown)' }}>¿Listo para vivir la experiencia?</h2>
        <Button href="/experiencias" variant="primary">Reservar ahora</Button>
      </section>
    </>
  )
}
