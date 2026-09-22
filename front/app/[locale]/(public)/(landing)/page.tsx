import { Link } from '@/lib/i18n/navigation'
import Hero from '@/components/layout/Hero'
import Button from '@/components/ui/Button'
import ExperienciaCard from '@/components/booking/ExperienciaCard'
import Diferenciales from '@/components/secciones/Diferenciales'
import SobreNosotros from '@/components/secciones/SobreNosotros'
import Certificaciones from '@/components/secciones/Certificaciones'
import PruebaSocial from '@/components/secciones/PruebaSocial'
import { getSiteConfig } from '@/lib/api/site-config'
import { getExperienciasDestacadas } from '@/lib/api/experiencias'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import type { Metadata } from 'next'

export const revalidate = 60

/**
 * La portada tenía `alternates` pero heredaba título y descripción del layout
 * de idioma. Se decidió no repetirlos para no mantener el mismo texto en dos
 * archivos, y mientras el texto fuera el mismo el argumento valía. Ya no lo es:
 * heredar significaba servir «Vuelo Carmesí» y «Experiencias agroecológicas con
 * sabor a cacao» en la URL de más autoridad del sitio, sin que Cubarral, el
 * Meta ni Colombia aparecieran en ninguna señal. El nombre de la marca no es
 * una consulta que nadie busque todavía.
 *
 * El título dice «cacao y visitas», no «cacao y aviturismo», a propósito:
 * /aviturismo ya se titula «Aviturismo en Cubarral, Meta · 180 especies
 * registradas». Repetir ese sintagma aquí pondría dos URLs propias a competir
 * por la misma consulta, y la portada, con más autoridad y menos contenido de
 * aves, taparía a la página que sí tiene el hotspot de eBird y los horarios.
 * Las aves y los grupos van en la descripción, que no compite: reclama la
 * consulta paraguas de la finca y reparte hacia las hijas especializadas.
 *
 * `metadataBase` no se declara: se hereda del layout de idioma, y es lo que
 * vuelve absoluta la ruta relativa de la og:image.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'portada.meta' })

  return {
    alternates: alternatesDeIdioma('/', locale),
    // Sin la marca: el layout ya la añade con title.template («%s · Vuelo
    // Carmesí»), y el resultado queda en 58 caracteres. Ojo: `title.default`
    // del layout NO pasa por el template, así que hasta ahora la portada era
    // la única página que servía la marca a secas.
    title: t('titulo'),
    description: t('descripcion'),
    openGraph: {
      title: t('titulo'),
      description: t('descripcion'),
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_CO',
      siteName: 'Vuelo Carmesí',
      // Las medidas son las reales del archivo. Es vertical porque no hay
      // ninguna foto de cacao en horizontal en el repositorio: la tarjeta de
      // WhatsApp y Facebook saldrá recortada hasta que se suba un recorte
      // 1200×630 de esta misma imagen.
      images: [
        {
          url: '/images/cacao/cacaotal-mazorcas-rojas.jpg',
          width: 812,
          height: 1280,
          alt: t('ogAlt'),
        },
      ],
    },
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Sin esto, leer traducciones marca la pagina como dinamica y se pierde el
  // prerenderizado que pidio generateStaticParams en el layout de idioma.
  setRequestLocale(locale)

  const [config, destacadas, t] = await Promise.all([
    getSiteConfig(locale),
    getExperienciasDestacadas(locale),
    getTranslations('portada'),
  ])
  const preview = destacadas.slice(0, 3)

  return (
    <>
      <Hero
        titulo={t('heroTitulo')}
        subtitulo={t('heroSubtitulo')}
        ctaTexto={t('heroCta')}
        ctaHref="/experiencias"
        imagen={config.hero_image || undefined}
      />

      <Diferenciales />

      {preview.length > 0 && (
        <section style={{ paddingBlock: 'clamp(3rem, 8vw, 5rem)' }}>
          <div className="contenido">
          <h2 style={{ textAlign: 'center', fontSize: 'var(--fs-h2)', marginBottom: '3rem', color: 'var(--color-brown)' }}>
            {t('experiencias')}
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
            <Button href="/experiencias">{t('verTodas')}</Button>
          </div>
          </div>
        </section>
      )}

      <SobreNosotros imagen={config.about_image || undefined} />

      <Certificaciones />

      {/* Las cifras salen de SiteConfig, que esta página ya carga para el hero:
          se editan en el panel sin desplegar. Si la API no responde, el
          componente cae a las de la última publicación. */}
      <PruebaSocial cifras={config} />

      {/* Banda CTA en degradado brown→crimson: empata con la sección de
          impacto de arriba y suaviza el salto con el rojo de la acción */}
      <section style={{ paddingBlock: 'clamp(3rem, 8vw, 5rem)', background: 'linear-gradient(135deg, var(--color-brown), var(--color-crimson))' }}>
        <div className="contenido" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', marginBottom: '1rem', color: 'var(--color-cream)' }}>{t('ctaTitulo')}</h2>
          <Link href="/experiencias" className="btn-ghost-cream">{t('ctaBoton')}</Link>
        </div>
      </section>
    </>
  )
}
