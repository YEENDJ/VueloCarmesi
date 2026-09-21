import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import {
  DoorOpen,
  FileSignature,
  FileText,
  Gavel,
  HeartHandshake,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import MigaSuperior from '@/components/layout/MigaSuperior'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'politicas.ninez' })
  return {
    title: t('metaTitulo'),
    description: t('metaDescripcion'),
    alternates: alternatesDeIdioma('/politicas/proteccion-infancia', locale),
  }
}

/**
 * Política oficial de protección de la niñez contra la Explotación Sexual
 * Comercial de Niños, Niñas y Adolescentes (ESCNNA). La fuente es la hoja 16
 * del portafolio 2026 —«Protección de la niñez (ESCNNA)»—, en
 * portafolio/src/portafolio.html.
 *
 * Es obligación legal del prestador inscrito en el RNT publicar su código de
 * conducta frente a la ESCNNA (Ley 679 de 2001 y Ley 1336 de 2009), y además
 * es requisito que revisan los colegios antes de contratar una salida
 * pedagógica. Por eso va transcrita, no reformulada, y por eso vive en el
 * código y no en el panel: si cambia en el portafolio, hay que cambiarla aquí
 * también.
 */

/** Los tres datos de la banda de resumen, en el orden en que se consultan. */
// Las cadenas son CLAVES del catálogo, no texto: se traducen al pintarlas.
const RESUMEN: { Icono: LucideIcon; cifra: string; texto: string }[] = [
  { Icono: Gavel, cifra: 'ley', texto: 'ley' },
  { Icono: FileSignature, cifra: 'autorizacionEscrita', texto: 'autorizacion' },
  { Icono: ShieldCheck, cifra: 'toleranciaCero', texto: 'tolerancia' },
]

/**
 * El aviso que abre la hoja 16, que es el código de conducta frente a la
 * ESCNNA que la ley exige publicar al prestador con RNT. Va como recuadro
 * destacado por delante de las tarjetas, igual que en el portafolio.
 */
const CALLOUT = 'intro'

type Seccion = {
  id: string
  titulo: string
  /** Rótulo corto para el índice de arriba, donde el título largo no cabe. */
  indice: string
  Icono: LucideIcon
  /** Lista numerada: pasos que hay que cumplir, en ese orden. */
  lista?: string[]
  /** Lista con viñetas: lo que debe traer un documento. */
  vinetas?: string[]
  /** Nota destacada al pie de la tarjeta. */
  nota?: string
}

const SECCIONES: Seccion[] = [
  {
    id: 'requisitos',
    titulo: 'ingresoTitulo',
    indice: 'requisitos',
    Icono: UserRound,
    lista: ['ingreso1', 'ingreso2', 'ingreso3'],
  },
  {
    id: 'autorizacion',
    titulo: 'autorizacionTitulo',
    indice: 'autorizacion',
    Icono: FileText,
    vinetas: ['auto1', 'auto2', 'auto3', 'auto4'],
    nota: 'autoNota',
  },
  {
    id: 'admision',
    titulo: 'controlesTitulo',
    indice: 'admision',
    Icono: DoorOpen,
    lista: ['control1', 'control2'],
  },
]

export default async function PoliticaProteccionInfanciaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations('nav')
  const t = await getTranslations('politicas.ninez')
  const tp = await getTranslations('politicas')

  return (
    <section className="page-shell politica">
      {/* El índice de políticas no está en el navbar, así que sin esto la única
          salida desde una política es el botón del navegador. */}
      <MigaSuperior href="/politicas" etiqueta={tNav('politicas')} actual={t('titulo')} />
      <h1 style={{ color: 'var(--color-brown)', marginBottom: '12px', minWidth: 0 }}>
        {t('titulo')}
      </h1>
      <p className="politica-fecha">
        <ShieldCheck size={15} strokeWidth={1.9} aria-hidden="true" style={{ flexShrink: 0 }} />
        {tp('actualizado', { fecha: tp('fecha') })}
      </p>

      {/* En inglés la política es una traducción informativa: Vuelo Carmesí
          opera bajo ley colombiana y el texto que rige es el español. Decirlo
          no es un formalismo — sin ese aviso, la versión inglesa se lee como
          si fuera el documento vinculante. La clave está vacía en español,
          donde el aviso no tiene sentido, y por eso no se pinta. */}
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
              <strong className="politica-cifra">{t(cifra)}</strong>{' '}
              {tp(`ninezResumen.${texto}`)}
            </p>
          </div>
        ))}
      </div>

      {/* El código de conducta frente a la ESCNNA, igual que en el portafolio:
          recuadro destacado antes que las tarjetas, sin resumir. */}
      <div className="politica-callout">
        <span className="politica-callout-icono" aria-hidden="true">
          <ShieldCheck size={24} strokeWidth={1.8} color="var(--color-gold)" />
        </span>
        <p>{t(CALLOUT)}</p>
      </div>

      <nav className="politica-indice" aria-label={tp('indiceAria')}>
        {SECCIONES.map(({ id, indice }) => (
          <a key={id} href={`#${id}`} className="politica-chip">
            {tp(`ninezIndice.${indice}`)}
          </a>
        ))}
      </nav>

      <div className="politica-grid">
        {SECCIONES.map(({ id, titulo, Icono, lista, vinetas, nota }) => (
          <article key={id} id={id} className="politica-card">
            <div className="politica-card-cabecera">
              <span className="politica-icono" aria-hidden="true">
                <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
              </span>
              <h2 className="politica-card-titulo">{t(titulo)}</h2>
            </div>

            {lista && (
              <ol className="politica-lista">
                {lista.map(clave => (
                  <li key={clave}>{t(clave)}</li>
                ))}
              </ol>
            )}

            {vinetas && (
              <ul className="politica-lista politica-lista--vinetas">
                {vinetas.map(clave => (
                  <li key={clave}>{t(clave)}</li>
                ))}
              </ul>
            )}

            {nota && (
              <p className="politica-nota">
                <strong className="politica-nota-etiqueta">{t('ademas')}</strong> {t(nota)}
              </p>
            )}
          </article>
        ))}
      </div>

      {/* El compromiso de cierre de la hoja 16, que es el aviso con el que la
          política vuelve a lo esencial después del detalle de los controles. */}
      <p className="politica-cierre politica-cierre--compromiso">
        <span className="politica-compromiso-icono" aria-hidden="true">
          <HeartHandshake size={20} strokeWidth={1.8} color="var(--color-crimson)" />
        </span>
        <span style={{ minWidth: 0 }}>
          <strong>{t('nuestroCompromiso')}</strong>{' '}
          {t('compromisoTexto')}
        </span>
      </p>
    </section>
  )
}