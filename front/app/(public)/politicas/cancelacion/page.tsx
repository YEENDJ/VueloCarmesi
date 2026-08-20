import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de cancelación · Vuelo Carmesí',
  description:
    'Condiciones para cancelar o reprogramar una experiencia reservada en Vuelo Carmesí.',
}

/**
 * ⚠️ BORRADOR SIN VALIDAR. Los plazos y porcentajes de aquí abajo —48 horas,
 * 50 %, tres meses— son un punto de partida redactado por defecto, NO las
 * condiciones reales de Vuelo Carmesí. Hay que revisarlos con el negocio antes
 * de publicar: son las reglas con las que se van a resolver reclamos de dinero.
 *
 * Texto legal, no contenido comercial: vive en el código y no en el panel. La
 * razón es que cambiarlo afecta a reservas ya hechas, y conviene que quede
 * registrado en el historial de versiones —con fecha y autor— en vez de
 * sobrescribirse en un campo sin rastro.
 *
 * PENDIENTE: faltan dos textos que este negocio necesita y aún no existen.
 * Tratamiento de datos personales, porque se recogen nombre, correo, teléfono y
 * dirección (Ley 1581 de 2012), y términos y condiciones de la tienda.
 */
const ACTUALIZADO = '20 de agosto de 2026'

const SECCIONES: { titulo: string; parrafos: string[] }[] = [
  {
    titulo: 'Cancelación por parte del visitante',
    parrafos: [
      'Puedes cancelar tu reserva sin costo hasta 48 horas antes de la hora de inicio de la experiencia. Escríbenos por WhatsApp o al correo de contacto indicando el nombre con el que reservaste y la fecha.',
      'Entre 48 y 24 horas antes, se retiene el 50 % del valor para cubrir los insumos que ya se compraron y el personal reservado para tu grupo.',
      'Con menos de 24 horas de antelación, o si no te presentas, la reserva no es reembolsable.',
    ],
  },
  {
    titulo: 'Reprogramación',
    parrafos: [
      'Puedes mover tu reserva a otra fecha una vez, sin costo, avisando con al menos 48 horas de antelación y sujeto a disponibilidad. La nueva fecha debe quedar dentro de los tres meses siguientes.',
    ],
  },
  {
    titulo: 'Cancelación por parte de Vuelo Carmesí',
    parrafos: [
      'Algunas experiencias dependen del clima y del comportamiento de la fauna. Si tenemos que cancelar por lluvia intensa, condiciones inseguras del terreno o cualquier motivo atribuible a nosotros, puedes elegir entre reprogramar sin costo o recibir el reembolso completo.',
      'El avistamiento de aves no se cancela por ausencia de avistamientos: la observación de fauna silvestre nunca puede garantizarse, y el recorrido guiado se realiza igual.',
    ],
  },
  {
    titulo: 'Reembolsos',
    parrafos: [
      'Los reembolsos se hacen por el mismo medio de pago y pueden tardar hasta 10 días hábiles en verse reflejados, según tu banco.',
    ],
  },
]

export default function PoliticaCancelacionPage() {
  return (
    <section className="page-shell" style={{ maxWidth: '760px' }}>
      <h1 style={{ color: 'var(--color-brown)', marginBottom: '12px', minWidth: 0 }}>
        Política de cancelación
      </h1>
      <p style={{ opacity: 0.65, fontSize: '0.9rem', marginBottom: 'clamp(28px, 5vw, 44px)' }}>
        Última actualización: {ACTUALIZADO}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(28px, 5vw, 40px)', minWidth: 0 }}>
        {SECCIONES.map(seccion => (
          <div key={seccion.titulo} style={{ minWidth: 0 }}>
            <h2
              style={{
                color: 'var(--color-brown)',
                fontSize: 'clamp(1.15rem, 3.5vw, 1.4rem)',
                marginBottom: '12px',
                minWidth: 0,
              }}
            >
              {seccion.titulo}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
              {seccion.parrafos.map((p, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 'clamp(0.95rem, 2.5vw, 1.03rem)',
                    lineHeight: 1.75,
                    opacity: 0.85,
                    minWidth: 0,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 'clamp(32px, 6vw, 48px)', fontSize: '0.95rem', minWidth: 0 }}>
        ¿Dudas sobre tu reserva?{' '}
        <Link href="/contacto" style={{ color: 'var(--color-crimson)', fontWeight: 700 }}>
          Escríbenos
        </Link>
        .
      </p>
    </section>
  )
}
