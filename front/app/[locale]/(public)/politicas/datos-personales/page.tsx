import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import { Link } from '@/lib/i18n/navigation'
import { CONTACTO } from '@/lib/contacto'
import {
  Ban,
  Baby,
  Clock,
  Cookie,
  Database,
  FileSignature,
  Gavel,
  Goal,
  Lock,
  MailCheck,
  ScrollText,
  Server,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import MigaSuperior from '@/components/layout/MigaSuperior'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'politicas.datos' })
  return {
    title: t('metaTitulo'),
    description: t('metaDescripcion'),
    alternates: alternatesDeIdioma('/politicas/datos-personales', locale),
  }
}

/**
 * Política de tratamiento de datos personales (Ley 1581 de 2012 y Decreto
 * 1074 de 2015). Es obligatoria desde el momento en que un formulario pide un
 * nombre y un correo, y este sitio tiene cuatro: contacto, reserva, pedido de
 * la tienda y cotización de grupos.
 *
 * El contenido no se inventó: se levantó de lo que los formularios realmente
 * piden —ver los campos en `prisma/schema.prisma` y en `lib/schemas/`— y de
 * dónde terminan esos datos —Vercel, Render, Neon, el correo de Google y
 * Telegram, según el README de la raíz—. Si cambia un formulario o cambia un
 * proveedor, este texto queda desactualizado y hay que tocarlo: una política
 * que enumera datos que ya no se piden es tan incumplidora como no tenerla.
 *
 * Texto legal, no contenido comercial: vive en el código y no en el panel, por
 * lo mismo que la política de cancelación. Cambiarlo afecta a autorizaciones
 * ya dadas y conviene que quede en el historial de versiones, con fecha y
 * autor, en vez de sobrescribirse en un campo sin rastro.
 *
 * Los datos de contacto —correo, teléfono, dirección— NO van escritos en el
 * catálogo: se interpolan desde `lib/contacto.ts`, que es la fuente única del
 * proyecto. Si el negocio cambia de número, esta página cambia sola.
 *
 * PENDIENTE: la ley pide identificar al responsable del tratamiento con su
 * razón social y su NIT, y aquí solo tenemos el nombre comercial, la dirección
 * y los canales. Hay que pedirle al negocio los datos del registro mercantil y
 * sumarlos al recuadro de arriba. Tampoco está resuelto si le aplica el
 * registro de bases de datos ante la SIC (RNBD): depende del tamaño de sus
 * activos y hay que verificarlo, no suponerlo.
 */

/** Los tres datos de la banda de resumen, en el orden en que se consultan. */
// Las cadenas son CLAVES del catálogo, no texto: se traducen al pintarlas.
const RESUMEN: { Icono: LucideIcon; cifra: string; texto: string }[] = [
  { Icono: Gavel, cifra: 'cifraLey', texto: 'ley' },
  { Icono: Clock, cifra: 'cifraPlazos', texto: 'plazos' },
  { Icono: Ban, cifra: 'cifraVenta', texto: 'venta' },
]

type Seccion = {
  id: string
  titulo: string
  /** Rótulo corto para el índice de arriba, donde el título largo no cabe. */
  indice: string
  Icono: LucideIcon
  /** Lista con viñetas: inventarios —qué se recoge, para qué, qué derechos hay—. */
  vinetas?: string[]
  /** Prosa: lo que es una explicación y no un inventario. */
  parrafos?: string[]
  /** Nota destacada al pie de la tarjeta, con su propio rótulo. */
  nota?: { etiqueta: string; texto: string }
  /** Enlace a otra política, cuando el apartado remite a ella. */
  enlace?: { href: '/politicas/proteccion-infancia'; clave: string }
}

const SECCIONES: Seccion[] = [
  {
    id: 'datos',
    titulo: 'datosTitulo',
    indice: 'datos',
    Icono: Database,
    vinetas: ['d1', 'd2', 'd3', 'd4'],
    nota: { etiqueta: 'datosEtiqueta', texto: 'datosNota' },
  },
  {
    id: 'finalidades',
    titulo: 'finalidadesTitulo',
    indice: 'finalidades',
    Icono: Goal,
    vinetas: ['f1', 'f2', 'f3', 'f4', 'f5'],
    nota: { etiqueta: 'finalidadesEtiqueta', texto: 'finalidadesNota' },
  },
  {
    id: 'autorizacion',
    titulo: 'autorizacionTitulo',
    indice: 'autorizacion',
    Icono: FileSignature,
    parrafos: ['a1', 'a2', 'a3'],
  },
  {
    id: 'derechos',
    titulo: 'derechosTitulo',
    indice: 'derechos',
    Icono: UserCheck,
    vinetas: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'],
  },
  {
    id: 'canal',
    titulo: 'canalTitulo',
    indice: 'canal',
    Icono: MailCheck,
    parrafos: ['c1', 'c2', 'c3', 'c4'],
    nota: { etiqueta: 'canalEtiqueta', texto: 'canalNota' },
  },
  {
    id: 'conservacion',
    titulo: 'conservacionTitulo',
    indice: 'conservacion',
    Icono: Server,
    parrafos: ['cs1', 'cs2', 'cs3', 'cs4'],
  },
  {
    id: 'menores',
    titulo: 'menoresTitulo',
    indice: 'menores',
    Icono: Baby,
    parrafos: ['m1', 'm2'],
    enlace: { href: '/politicas/proteccion-infancia', clave: 'menoresEnlace' },
  },
  {
    id: 'cookies',
    titulo: 'cookiesTitulo',
    indice: 'cookies',
    Icono: Cookie,
    parrafos: ['k1', 'k2', 'k3'],
    nota: { etiqueta: 'cookiesEtiqueta', texto: 'cookiesNota' },
  },
]

export default async function PoliticaDatosPersonalesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations('nav')
  const t = await getTranslations('politicas.datos')
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
        <Lock size={15} strokeWidth={1.9} aria-hidden="true" style={{ flexShrink: 0 }} />
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
              <strong className="politica-cifra">{tp(`datosResumen.${cifra}`)}</strong>{' '}
              {tp(`datosResumen.${texto}`)}
            </p>
          </div>
        ))}
      </div>

      {/* Quién responde por los datos. Va primero y destacado porque es el
          dato que la ley exige que el titular encuentre sin buscar: sin saber
          a quién reclamar, el resto de la política no sirve de nada. */}
      <div className="politica-callout">
        <span className="politica-callout-icono" aria-hidden="true">
          <ScrollText size={24} strokeWidth={1.8} color="var(--color-gold)" />
        </span>
        <p>
          {t('responsable', {
            direccion: CONTACTO.direccionCompleta,
            email: CONTACTO.email,
            telefono: CONTACTO.telefono,
          })}
        </p>
      </div>

      <nav className="politica-indice" aria-label={tp('indiceAria')}>
        {SECCIONES.map(({ id, indice }) => (
          <a key={id} href={`#${id}`} className="politica-chip">
            {tp(`datosIndice.${indice}`)}
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
                  <p key={clave}>
                    {t(clave, { email: CONTACTO.email })}
                  </p>
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

      <p className="politica-cierre">
        {t('dudas')}{' '}
        <Link href="/contacto" style={{ color: 'var(--color-crimson)', fontWeight: 700 }}>
          {t('escribenos')}
        </Link>
        .
      </p>
    </section>
  )
}
