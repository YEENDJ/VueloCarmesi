import Link from 'next/link'
import Hero from '@/components/layout/Hero'
import Button from '@/components/ui/Button'
import ExperienciaCard from '@/components/booking/ExperienciaCard'
import SobreNosotros from '@/components/secciones/SobreNosotros'
import Certificaciones from '@/components/secciones/Certificaciones'
import { getSiteConfig } from '@/lib/api/site-config'
import { getExperienciasDestacadas } from '@/lib/api/experiencias'

export const revalidate = 60

export default async function HomePage() {
  const [config, destacadas] = await Promise.all([
    getSiteConfig(),
    getExperienciasDestacadas(),
  ])
  const preview = destacadas.slice(0, 3)

  return (
    <>
      <Hero
        titulo="El sabor maduro de la tierra"
        subtitulo="Cosechamos, fermentamos y catamos junto a ti. Conoce el cacao desde su raíz, en una finca que respira selva."
        ctaTexto="Reserva tu experiencia"
        ctaHref="/experiencias"
        imagen={config.hero_image || undefined}
      />

      {preview.length > 0 && (
        <section style={{ paddingBlock: 'clamp(3rem, 8vw, 5rem)' }}>
          <div className="contenido">
          <h2 style={{ textAlign: 'center', fontSize: 'var(--fs-h2)', marginBottom: '3rem', color: 'var(--color-brown)' }}>
            Nuestras Experiencias
          </h2>
          {/* La misma rejilla del catálogo: si la vitrina usara la suya, las
              destacadas se verían más grandes que la página a la que llevan. */}
          <div className="experiencias-grid" style={{ marginBottom: '2rem' }}>
            {preview.map((exp) => (
              // La misma tarjeta del catálogo: una sola definición de cómo se ve una
              // experiencia. La copia que vivía acá ignoraba exp.imagen y dejaba el
              // placeholder aunque la foto ya estuviera cargada desde el admin.
              <ExperienciaCard key={exp.slug} experiencia={exp} mostrarBadgeDestacada={false} />
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Button href="/experiencias">Ver todas las experiencias</Button>
          </div>
          </div>
        </section>
      )}

      <SobreNosotros imagen={config.about_image || undefined} />

      <Certificaciones />

      {/* Banda CTA en crimson para mantener la alternancia de fondos tras la sección cream de certificaciones */}
      <section style={{ paddingBlock: 'clamp(3rem, 8vw, 5rem)', backgroundColor: 'var(--color-crimson)' }}>
        <div className="contenido" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', marginBottom: '1rem', color: 'var(--color-cream)' }}>¿Listo para vivir la experiencia?</h2>
          <Link href="/experiencias" className="btn-ghost-cream">Reservar ahora</Link>
        </div>
      </section>
    </>
  )
}
