import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import { Link } from '@/lib/i18n/navigation'
import {
  Banknote,
  CalendarCheck,
  CalendarX,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  CloudRain,
  Coins,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'politicas.cancelacion' })
  return {
    title: t('metaTitulo'),
    description: t('metaDescripcion'),
    alternates: alternatesDeIdioma('/politicas/cancelacion', locale),
  }
}

/**
 * Condiciones comerciales aprobadas. La fuente es la hoja 21 del portafolio
 * 2026 —«Reservas, cancelación y pagos»—, en portafolio/src/portafolio.html.
 * Los plazos y porcentajes van transcritos, no reformulados: son las reglas con
 * las que se resuelven reclamos de dinero y cualquier matiz cambia lo que se
 * puede exigir. Si cambian en el portafolio, hay que cambiarlas aquí también.
 *
 * Texto legal, no contenido comercial: vive en el código y no en el panel. La
 * razón es que cambiarlo afecta a reservas ya hechas, y conviene que quede
 * registrado en el historial de versiones —con fecha y autor— en vez de
 * sobrescribirse en un campo sin rastro.
 *
 * PENDIENTE: la hoja 21 no dice qué pasa con el dinero cuando quien cancela es
 * la finca, ni en cuánto tiempo se devuelve un reembolso. Aquí no se inventa
 * ninguna de las dos cosas; hay que preguntarlas al negocio y añadirlas.
 *
 * PENDIENTE: faltan dos textos que este negocio necesita y aún no existen.
 * Tratamiento de datos personales, porque se recogen nombre, correo, teléfono y
 * dirección (Ley 1581 de 2012), y términos y condiciones de la tienda.
 */

/** Los tres datos de la banda de resumen de la hoja 21, en el mismo orden. */
// Cadenas = claves del catálogo. Ver proteccion-infancia.
const RESUMEN: { Icono: LucideIcon; cifra: string; texto: string }[] = [
  { Icono: Clock, cifra: 'cifraHoras', texto: 'horas' },
  { Icono: Coins, cifra: 'cifraPago', texto: 'pago' },
  { Icono: CircleCheck, cifra: 'cifraReembolso', texto: 'reembolso' },
]

/**
 * La escala de plazos, que es lo que casi todo el mundo viene a mirar. Va como
 * fila con su plazo y su consecuencia, y no como párrafo, porque la pregunta
 * real es «a cuántos días estoy» y en prosa hay que leerse las tres condiciones
 * enteras para saberlo.
 *
 * El texto sale partido de las cláusulas 1 a 3 de la hoja 21 por sus dos
 * puntos: a la izquierda la condición y a la derecha el efecto, palabra por
 * palabra. Ninguna de las dos mitades se resume.
 */
const ESCALA: { clave: string; tono: 'bien' | 'medio' | 'alto'; Icono: LucideIcon }[] = [
  { clave: 'completo', tono: 'bien', Icono: CircleCheck },
  { clave: 'medio', tono: 'medio', Icono: CircleAlert },
  { clave: 'nada', tono: 'alto', Icono: CircleX },
]

type Seccion = {
  id: string
  titulo: string
  /** Rótulo corto para el índice de arriba, donde el título largo no cabe. */
  indice: string
  Icono: LucideIcon
  parrafos: string[]
  /** Ocupa la fila entera de la rejilla. Solo la escala de plazos lo necesita. */
  ancha?: boolean
}

const SECCIONES: Seccion[] = [
  { id: 'reserva', titulo: 'reserva', indice: 'reserva', Icono: CalendarCheck,
    parrafos: ['reserva1', 'reserva2', 'reserva3', 'reserva4', 'reserva5'] },
  { id: 'pago', titulo: 'pago', indice: 'pago', Icono: Coins,
    parrafos: ['pago1', 'pago2'] },
  { id: 'cancelacion', titulo: 'visitanteTitulo', indice: 'cancelacion', Icono: CircleX,
    parrafos: ['visitante1', 'visitante2'], ancha: true },
  { id: 'reprogramacion', titulo: 'reprogramacionTitulo', indice: 'reprogramacion', Icono: CalendarX,
    parrafos: ['repro1', 'repro2'] },
  { id: 'cambios', titulo: 'fincaTitulo', indice: 'cambios', Icono: RefreshCw,
    parrafos: ['finca1', 'finca2', 'finca3'] },
]

export default async function PoliticaCancelacionPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('politicas.cancelacion')
  const tp = await getTranslations('politicas')

  return (
    <section className="page-shell politica">
      <h1 style={{ color: 'var(--color-brown)', marginBottom: '12px', minWidth: 0 }}>
        {t('titulo')}
      </h1>
      <p className="politica-fecha">
        <Clock size={15} strokeWidth={1.9} aria-hidden="true" style={{ flexShrink: 0 }} />
        {tp('actualizado', { fecha: tp('fecha') })}
      </p>

      {/* Los tres datos que resuelven la consulta de casi todo el que entra. La
          letra fina sigue abajo entera: esto no la reemplaza, la adelanta. */}
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
              <strong className="politica-cifra">{tp(`cancelResumen.${cifra}`)}</strong>{' '}
              {tp(`cancelResumen.${texto}`)}
            </p>
          </div>
        ))}
      </div>

      {/* Índice: la página es larga y quien llega casi siempre viene por UNA de
          las cinco secciones. Son enlaces de ancla, así que funcionan sin JS y
          se pueden compartir apuntando al apartado exacto. */}
      <nav className="politica-indice" aria-label={tp('indiceAria')}>
        {SECCIONES.map(({ id, indice }) => (
          <a key={id} href={`#${id}`} className="politica-chip">
            {tp(`cancelIndice.${indice}`)}
          </a>
        ))}
      </nav>

      <div className="politica-grid">
        {SECCIONES.map(({ id, titulo, Icono, parrafos, ancha }) => (
          <article
            key={id}
            id={id}
            className={`politica-card${ancha ? ' politica-card--ancha' : ''}`}
          >
            <div className="politica-card-cabecera">
              <span className="politica-icono" aria-hidden="true">
                <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
              </span>
              <h2 className="politica-card-titulo">{t(titulo)}</h2>
            </div>

            {/* La escala vive dentro de su sección y por delante de los
                párrafos: es el cuerpo de la cláusula, no un resumen aparte. */}
            {id === 'cancelacion' && (
              <ol className="politica-escala">
                {ESCALA.map(({ clave, tono, Icono: IconoTono }) => (
                  <li key={clave} className={`politica-escala-fila politica-escala-fila--${tono}`}>
                    <IconoTono size={20} strokeWidth={2} aria-hidden="true" style={{ flexShrink: 0 }} />
                    <span className="politica-escala-plazo">{t(`escala.${clave}.cuando`)}</span>
                    <span className="politica-escala-efecto">{t(`escala.${clave}.que`)}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="politica-parrafos">
              {parrafos.map(clave => (
                <p key={clave}>{t(clave)}</p>
              ))}
            </div>
          </article>
        ))}
      </div>

      <p className="politica-cierre">
        {t('dudasReserva')}{' '}
        <Link href="/contacto" style={{ color: 'var(--color-crimson)', fontWeight: 700 }}>
          {t('escribenos')}
        </Link>
        .
      </p>
    </section>
  )
}
