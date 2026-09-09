import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'Protección de la niñez · Vuelo Carmesí',
  description:
    'Compromiso de Vuelo Carmesí con la protección de niños, niñas y adolescentes y contra la ESCNNA, en cumplimiento de la Ley 679 de 2001 y la Ley 1336 de 2009.',
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
const ACTUALIZADO = '9 de septiembre de 2026'

/** Los tres datos de la banda de resumen, en el orden en que se consultan. */
const RESUMEN: { Icono: LucideIcon; cifra: string; texto: string }[] = [
  { Icono: Gavel, cifra: 'Ley 1336 de 2009', texto: 'y la Ley 679 de 2001: prevención, control y protección' },
  { Icono: FileSignature, cifra: 'Autorización escrita', texto: 'para menores sin sus padres o representante legal' },
  { Icono: ShieldCheck, cifra: 'Tolerancia cero', texto: 'frente a cualquier forma de explotación o abuso' },
]

/**
 * El aviso que abre la hoja 16, que es el código de conducta frente a la
 * ESCNNA que la ley exige publicar al prestador con RNT. Va como recuadro
 * destacado por delante de las tarjetas, igual que en el portafolio.
 */
const CALLOUT =
  'La Finca Agroturística Vuelo Carmesí está comprometida con la protección integral de los niños, niñas y adolescentes y rechaza cualquier forma de Explotación Sexual Comercial de Niños, Niñas y Adolescentes (ESCNNA). En cumplimiento de la Ley 679 de 2001 y la Ley 1336 de 2009, el establecimiento adopta medidas de prevención, control y protección frente a cualquier situación que vulnere los derechos de los menores de edad en el contexto de los servicios turísticos.'

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
    titulo: 'Ingreso de menores · requisitos',
    indice: 'Requisitos',
    Icono: UserRound,
    lista: [
      'No se permite el ingreso ni la permanencia de menores de edad sin el cumplimiento de los requisitos legales establecidos por la legislación colombiana.',
      'Todo menor deberá estar acompañado por sus padres, representante legal o un adulto debidamente autorizado, presentando la documentación requerida al momento del registro (check-in).',
      'Cuando un menor participe en actividades, eventos, recorridos o servicios sin la compañía de sus padres o representantes legales, deberá presentar una autorización escrita firmada por estos.',
    ],
  },
  {
    id: 'autorizacion',
    titulo: 'Qué debe contener la autorización',
    indice: 'La autorización',
    Icono: FileText,
    vinetas: [
      'Nombre completo e identificación del menor de edad.',
      'Nombre e identificación del adulto responsable que lo acompañará.',
      'Fechas de la actividad o del servicio contratado.',
      'Datos de contacto de los padres o representantes legales.',
    ],
    nota:
      'El establecimiento podrá solicitar copia de los documentos de identidad y, cuando lo considere necesario, una autorización autenticada ante notaría.',
  },
  {
    id: 'admision',
    titulo: 'Controles · derecho de admisión',
    indice: 'Derecho de admisión',
    Icono: DoorOpen,
    lista: [
      'La finca se reserva el derecho de negar el ingreso o la prestación del servicio cuando no se acredite adecuadamente la autorización o existan indicios que puedan comprometer la seguridad, bienestar o protección del menor.',
      'Se reserva el derecho de admisión y pondrá en conocimiento de las autoridades competentes cualquier conducta sospechosa relacionada con la explotación, abuso o vulneración de los derechos de niños, niñas y adolescentes.',
    ],
  },
]

export default function PoliticaProteccionInfanciaPage() {
  return (
    <section className="page-shell politica">
      <h1 style={{ color: 'var(--color-brown)', marginBottom: '12px', minWidth: 0 }}>
        Compromiso con niños, niñas y adolescentes
      </h1>
      <p className="politica-fecha">
        <ShieldCheck size={15} strokeWidth={1.9} aria-hidden="true" style={{ flexShrink: 0 }} />
        Última actualización: {ACTUALIZADO}
      </p>

      <div className="politica-resumen">
        {RESUMEN.map(({ Icono, cifra, texto }) => (
          <div key={cifra} className="politica-resumen-dato">
            <span className="politica-icono" aria-hidden="true">
              <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <p style={{ minWidth: 0 }}>
              <strong className="politica-cifra">{cifra}</strong> {texto}
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
        <p>{CALLOUT}</p>
      </div>

      <nav className="politica-indice" aria-label="Apartados de la política">
        {SECCIONES.map(({ id, indice }) => (
          <a key={id} href={`#${id}`} className="politica-chip">
            {indice}
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
              <h2 className="politica-card-titulo">{titulo}</h2>
            </div>

            {lista && (
              <ol className="politica-lista">
                {lista.map((texto, i) => (
                  <li key={i}>{texto}</li>
                ))}
              </ol>
            )}

            {vinetas && (
              <ul className="politica-lista politica-lista--vinetas">
                {vinetas.map((texto, i) => (
                  <li key={i}>{texto}</li>
                ))}
              </ul>
            )}

            {nota && (
              <p className="politica-nota">
                <strong className="politica-nota-etiqueta">Además</strong> {nota}
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
          <strong>Nuestro compromiso.</strong>{' '}
          La Finca Agroturística Vuelo Carmesí promueve un turismo responsable, seguro y comprometido con la
          protección integral de la niñez y la adolescencia.
        </span>
      </p>
    </section>
  )
}