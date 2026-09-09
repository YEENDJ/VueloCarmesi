import type { Metadata } from 'next'
import Link from 'next/link'
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

export const metadata: Metadata = {
  title: 'Política de cancelación · Vuelo Carmesí',
  description:
    'Condiciones de reserva, cancelación y pago de las experiencias de Vuelo Carmesí.',
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
const ACTUALIZADO = '9 de septiembre de 2026'

/** Los tres datos de la banda de resumen de la hoja 21, en el mismo orden. */
const RESUMEN: { Icono: LucideIcon; cifra: string; texto: string }[] = [
  { Icono: Clock, cifra: '48 horas', texto: 'de anticipación para confirmar la reserva' },
  { Icono: Coins, cifra: '30 % + 70 %', texto: 'al reservar y en efectivo el día de la actividad' },
  { Icono: CircleCheck, cifra: '100 %', texto: 'de reembolso cancelando dentro de las 24 h y a más de 15 días' },
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
const ESCALA: { plazo: string; efecto: string; tono: 'bien' | 'medio' | 'alto'; Icono: LucideIcon }[] = [
  {
    plazo: 'Cancelación dentro de las 24 horas siguientes a la reserva y con más de 15 días de anticipación',
    efecto: 'Reembolso del 100 % del valor pagado',
    tono: 'bien',
    Icono: CircleCheck,
  },
  {
    plazo: 'Entre 15 y 7 días antes de la actividad',
    efecto: 'Penalidad del 30 % del valor total abonado',
    tono: 'medio',
    Icono: CircleAlert,
  },
  {
    plazo: 'Entre 7 días y 24 horas antes, o el mismo día del servicio',
    efecto: 'Penalidad del 100 % del valor abonado',
    tono: 'alto',
    Icono: CircleX,
  },
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
  {
    id: 'reserva',
    titulo: 'Reserva',
    indice: 'Reserva',
    Icono: CalendarCheck,
    parrafos: [
      'Todas las actividades deben reservarse con anticipación y estar pagadas en su totalidad antes de su realización.',
      'Las reservas virtuales deben confirmarse con un mínimo de 48 horas de anticipación, enviando el comprobante de pago por los medios autorizados por la finca.',
      'Las cotizaciones tienen carácter informativo y no constituyen una confirmación de reserva. Todas las reservas están sujetas a disponibilidad.',
      'Una vez confirmada la reserva, cualquier cambio de fecha, actividad o itinerario queda sujeto a disponibilidad y a las condiciones del servicio contratado.',
      'El visitante debe suministrar información veraz y completa, incluyendo nombres, documento de identificación y demás datos requeridos para el cumplimiento de la normatividad vigente.',
    ],
  },
  {
    id: 'pago',
    titulo: 'Pago',
    indice: 'Pago',
    Icono: Banknote,
    parrafos: [
      'Al reservar se cancela el 30 % del valor del servicio; el 70 % restante se paga en efectivo el día de la actividad.',
      'El pago se realiza por transferencia bancaria a la cuenta autorizada de la finca, o por NEQUI y BreB. Escríbenos y te indicamos los datos.',
    ],
  },
  {
    id: 'cancelacion',
    titulo: 'Cancelación por parte del visitante',
    indice: 'Cancelación',
    Icono: CalendarX,
    ancha: true,
    parrafos: [
      'Las penalidades por cambios o cancelaciones se aplican únicamente una vez confirmada la reserva.',
      'Para cancelar, escríbenos por WhatsApp o al correo de contacto indicando el nombre con el que reservaste y la fecha.',
    ],
  },
  {
    id: 'reprogramacion',
    titulo: 'Reprogramación y no presentación',
    indice: 'Reprogramación',
    Icono: RefreshCw,
    parrafos: [
      'Quien no se presente o llegue después de la hora establecida pierde su cupo y la reserva se cancela.',
      'La reprogramación procede solo si hay disponibilidad y previo acuerdo entre las partes. Todo cambio de fecha, actividad, itinerario o devolución queda sujeto a las condiciones del servicio contratado y a la disponibilidad existente.',
    ],
  },
  {
    id: 'cambios',
    titulo: 'Cambios por parte de Vuelo Carmesí',
    indice: 'Cambios de la finca',
    Icono: CloudRain,
    parrafos: [
      'La Finca Agroturística Vuelo Carmesí realizará todos los esfuerzos razonables para cumplir con los horarios establecidos. Podrán modificarse por causas de fuerza mayor, razones de seguridad o circunstancias extraordinarias ajenas a su control, sin que ello genere responsabilidad para la empresa.',
      'Si tenemos que mover tu experiencia por alguno de esos motivos, nos comunicamos contigo para acordar una nueva fecha según disponibilidad.',
      'El avistamiento de aves no se cancela por ausencia de avistamientos: la observación de fauna silvestre nunca puede garantizarse, y el recorrido guiado se realiza igual.',
    ],
  },
]

export default function PoliticaCancelacionPage() {
  return (
    <section className="page-shell politica">
      <h1 style={{ color: 'var(--color-brown)', marginBottom: '12px', minWidth: 0 }}>
        Política de cancelación
      </h1>
      <p className="politica-fecha">
        <Clock size={15} strokeWidth={1.9} aria-hidden="true" style={{ flexShrink: 0 }} />
        Última actualización: {ACTUALIZADO}
      </p>

      {/* Los tres datos que resuelven la consulta de casi todo el que entra. La
          letra fina sigue abajo entera: esto no la reemplaza, la adelanta. */}
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

      {/* Índice: la página es larga y quien llega casi siempre viene por UNA de
          las cinco secciones. Son enlaces de ancla, así que funcionan sin JS y
          se pueden compartir apuntando al apartado exacto. */}
      <nav className="politica-indice" aria-label="Apartados de la política">
        {SECCIONES.map(({ id, indice }) => (
          <a key={id} href={`#${id}`} className="politica-chip">
            {indice}
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
              <h2 className="politica-card-titulo">{titulo}</h2>
            </div>

            {/* La escala vive dentro de su sección y por delante de los
                párrafos: es el cuerpo de la cláusula, no un resumen aparte. */}
            {id === 'cancelacion' && (
              <ol className="politica-escala">
                {ESCALA.map(({ plazo, efecto, tono, Icono: IconoTono }) => (
                  <li key={plazo} className={`politica-escala-fila politica-escala-fila--${tono}`}>
                    <IconoTono size={20} strokeWidth={2} aria-hidden="true" style={{ flexShrink: 0 }} />
                    <span className="politica-escala-plazo">{plazo}</span>
                    <span className="politica-escala-efecto">{efecto}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="politica-parrafos">
              {parrafos.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </article>
        ))}
      </div>

      <p className="politica-cierre">
        ¿Dudas sobre tu reserva?{' '}
        <Link href="/contacto" style={{ color: 'var(--color-crimson)', fontWeight: 700 }}>
          Escríbenos
        </Link>
        .
      </p>
    </section>
  )
}
