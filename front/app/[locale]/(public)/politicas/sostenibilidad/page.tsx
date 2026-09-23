import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import { Link } from '@/lib/i18n/navigation'
import {
  Footprints,
  HandCoins,
  Leaf,
  Recycle,
  Scale,
  Sprout,
  TreePine,
  Users,
  type LucideIcon,
} from 'lucide-react'
import MigaSuperior from '@/components/layout/MigaSuperior'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'politicas.sostenibilidad' })
  return {
    title: t('metaTitulo'),
    description: t('metaDescripcion'),
    alternates: alternatesDeIdioma('/politicas/sostenibilidad', locale),
  }
}

/**
 * Política de sostenibilidad del prestador.
 *
 * El sitio exhibe el distintivo de Calidad Turística en la tira de avales
 * (`lib/certificaciones.ts`), y las Normas Técnicas Sectoriales de Turismo
 * Sostenible exigen que el prestador certificado tenga su política de
 * sostenibilidad documentada, divulgada y accesible. Tener el sello publicado
 * sin el documento detrás es justamente lo que revisa una auditoría de
 * renovación, y lo que puede costar el distintivo.
 *
 * Los compromisos NO se inventaron: son los que el propio sitio ya afirma en
 * otras páginas —el manejo agroecológico y las BPA del ICA, la conservación de
 * especies nativas y de fuentes hídricas, las doce variedades de cacao, el
 * trabajo con familias de la región, la guianza profesional y la póliza— y que
 * aquí quedan redactados como compromiso del prestador en los tres ámbitos que
 * pide la norma: ambiental, sociocultural y económico.
 *
 * El apartado de lo que le pedimos al visitante no es relleno: la norma pide
 * que el prestador comunique al huésped las prácticas que espera de él, y es
 * además lo único de esta página que el visitante puede cumplir hoy mismo.
 *
 * PENDIENTE: la norma pide metas con indicador y un responsable nombrado —por
 * ejemplo, cuánta agua y cuánta energía por visitante, cuánto residuo y qué
 * porcentaje de compras locales, con cifra y fecha—. El negocio todavía no las
 * ha fijado y aquí no se inventan: lo que hay es el compromiso de medirlas y
 * revisarlas al año. Hay que sentarse con la finca a poner los números.
 *
 * PENDIENTE: falta el número de la NTS-TS concreta que le aplica al negocio y
 * la fecha del certificado. El sello dice «MinCIT · NTS-TS» y no más, así que
 * aquí se cita la familia de normas y no una en particular. Pedirle a la finca
 * el certificado y precisarlo.
 */

/** Los tres datos de la banda de resumen, en el orden en que se consultan. */
// Las cadenas son CLAVES del catálogo, no texto: se traducen al pintarlas.
const RESUMEN: { Icono: LucideIcon; cifra: string; texto: string }[] = [
  { Icono: Sprout, cifra: 'cifraCultivo', texto: 'cultivo' },
  { Icono: Users, cifra: 'cifraTerritorio', texto: 'territorio' },
  { Icono: Recycle, cifra: 'cifraRevision', texto: 'revision' },
]

type Seccion = {
  id: string
  titulo: string
  /** Rótulo corto para el índice de arriba, donde el título largo no cabe. */
  indice: string
  Icono: LucideIcon
  /** Lista con viñetas: compromisos sueltos, sin orden entre ellos. */
  vinetas?: string[]
  /** Prosa: lo que es explicación y no inventario. */
  parrafos?: string[]
  /** Nota destacada al pie de la tarjeta, con su propio rótulo. */
  nota?: { etiqueta: string; texto: string }
  /** Enlace a otra política, cuando el apartado remite a ella. */
  enlace?: { href: '/politicas/proteccion-infancia'; clave: string }
}

const SECCIONES: Seccion[] = [
  {
    id: 'ambiental',
    titulo: 'ambientalTitulo',
    indice: 'ambiental',
    Icono: Leaf,
    vinetas: ['am1', 'am2', 'am3', 'am4', 'am5', 'am6'],
  },
  {
    id: 'sociocultural',
    titulo: 'socioculturalTitulo',
    indice: 'sociocultural',
    Icono: Users,
    vinetas: ['so1', 'so2', 'so3', 'so4', 'so5', 'so6'],
    enlace: { href: '/politicas/proteccion-infancia', clave: 'socioculturalEnlace' },
  },
  {
    id: 'economico',
    titulo: 'economicoTitulo',
    indice: 'economico',
    Icono: HandCoins,
    vinetas: ['ec1', 'ec2', 'ec3', 'ec4', 'ec5'],
  },
  {
    id: 'legal',
    titulo: 'legalTitulo',
    indice: 'legal',
    Icono: Scale,
    vinetas: ['le1', 'le2', 'le3', 'le4', 'le5'],
  },
  {
    id: 'visitante',
    titulo: 'visitanteTitulo',
    indice: 'visitante',
    Icono: Footprints,
    vinetas: ['vi1', 'vi2', 'vi3', 'vi4', 'vi5', 'vi6'],
  },
  {
    id: 'seguimiento',
    titulo: 'seguimientoTitulo',
    indice: 'seguimiento',
    Icono: Recycle,
    parrafos: ['se1', 'se2', 'se3'],
    nota: { etiqueta: 'seguimientoEtiqueta', texto: 'seguimientoNota' },
  },
]

export default async function PoliticaSostenibilidadPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations('nav')
  const t = await getTranslations('politicas.sostenibilidad')
  const tp = await getTranslations('politicas')

  return (
    <section className="page-shell page-shell--con-miga politica">
      {/* El índice de políticas no está en el navbar, así que sin esto la única
          salida desde una política es el botón del navegador. */}
      <MigaSuperior href="/politicas" etiqueta={tNav('politicas')} actual={t('titulo')} />
      <h1 style={{ color: 'var(--color-brown)', marginBottom: '12px', minWidth: 0 }}>
        {t('titulo')}
      </h1>
      <p className="politica-fecha">
        <Leaf size={15} strokeWidth={1.9} aria-hidden="true" style={{ flexShrink: 0 }} />
        {tp('actualizado', { fecha: t('fecha') })}
      </p>

      {/* En inglés la política es una traducción informativa: Vuelo Carmesí
          opera bajo ley colombiana y el texto que rige es el español. La clave
          está vacía en español, donde el aviso no tiene sentido. */}
      {tp('avisoTraduccion') && (
        <p className="politica-aviso-traduccion">{tp('avisoTraduccion')}</p>
      )}

      <div className="politica-resumen">
        {RESUMEN.map(({ Icono, cifra, texto }) => (
          <div key={cifra} className="politica-resumen-dato">
            <span className="politica-icono" aria-hidden="true">
              <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <p style={{ minWidth: 0 }}>
              <strong className="politica-cifra">{tp(`sosResumen.${cifra}`)}</strong>{' '}
              {tp(`sosResumen.${texto}`)}
            </p>
          </div>
        ))}
      </div>

      {/* La declaración de la política, que es lo que la norma pide que exista
          por escrito y accesible. Va como recuadro y no como primer párrafo de
          una tarjeta: es el documento, el resto son sus compromisos. */}
      <div className="politica-callout">
        <span className="politica-callout-icono" aria-hidden="true">
          <TreePine size={24} strokeWidth={1.8} color="var(--color-gold)" />
        </span>
        <p>{t('compromiso')}</p>
      </div>

      <nav className="politica-indice" aria-label={tp('indiceAria')}>
        {SECCIONES.map(({ id, indice }) => (
          <a key={id} href={`#${id}`} className="politica-chip">
            {tp(`sosIndice.${indice}`)}
          </a>
        ))}
      </nav>

      <div className="politica-grid">
        {SECCIONES.map(({ id, titulo, Icono, vinetas, parrafos, nota, enlace }) => (
          <article key={id} id={id} className="politica-card">
            <div className="politica-card-cabecera">
              <span className="politica-icono" aria-hidden="true">
                <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
              </span>
              <h2 className="politica-card-titulo">{t(titulo)}</h2>
            </div>

            {vinetas && (
              <ul className="politica-lista politica-lista--vinetas">
                {vinetas.map(clave => (
                  <li key={clave}>{t(clave)}</li>
                ))}
              </ul>
            )}

            {parrafos && (
              <div className="politica-parrafos">
                {parrafos.map(clave => (
                  <p key={clave}>{t(clave)}</p>
                ))}
              </div>
            )}

            {nota && (
              <p className="politica-nota">
                <strong className="politica-nota-etiqueta">{t(nota.etiqueta)}</strong>{' '}
                {t(nota.texto)}
              </p>
            )}

            {enlace && (
              <div className="politica-parrafos" style={{ marginTop: '14px' }}>
                <p>
                  <Link
                    href={enlace.href}
                    style={{ color: 'var(--color-crimson)', fontWeight: 700 }}
                  >
                    {t(enlace.clave)}
                  </Link>
                </p>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* El cierre vuelve a lo esencial después del detalle de los
          compromisos, igual que en la política de protección de la niñez. */}
      <p className="politica-cierre politica-cierre--compromiso">
        <span className="politica-compromiso-icono" aria-hidden="true">
          <Leaf size={20} strokeWidth={1.8} color="var(--color-crimson)" />
        </span>
        <span style={{ minWidth: 0 }}>
          <strong>{t('nuestroCompromiso')}</strong> {t('compromisoTexto')}
        </span>
      </p>
    </section>
  )
}
