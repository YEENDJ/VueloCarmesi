import { MAPA, whatsappCon, MENSAJE_WHATSAPP } from '@/lib/contacto'

/**
 * Los tres tramos de la hoja 18 del portafolio.
 *
 * Decían «vía terciaria» y «vía veredal», que se leen como destapado y son
 * justo lo contrario de lo que pasa: está pavimentado hasta la puerta de la
 * finca. El propio recuadro de más abajo ya lo decía —«entra autos, motos y
 * buses, vía pavimentada»—, así que la tarjeta se contradecía sola.
 *
 * No es un matiz de redacción: es el dato con el que un colegio o una agencia
 * deciden si pueden traer el bus, y en «terciaria» la respuesta es que no.
 */
const TRAMOS = [
  { rango: '86 km', tramo: 'Bogotá – Villavicencio (Vía al Llano)' },
  { rango: '60 km', tramo: 'Villavicencio – Cubarral (pavimentada, por Acacías y Guamal)' },
  { rango: '7 km', tramo: 'Cubarral – Finca La Fortuna (pavimentada)' },
]

export default function ComoLlegar() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        minWidth: 0,
        padding: '20px',
        marginTop: '4px',
        backgroundColor: '#FFEACA',
        border: '1px solid rgba(135,43,19,.14)',
        borderRadius: '12px',
      }}
    >
      {/* Trayecto */}
      <div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--color-amber)',
            marginBottom: '12px',
          }}
        >
          Cómo llegar · Desde Bogotá
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
            marginBottom: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 4vw, 36px)',
              color: 'var(--color-crimson)',
              lineHeight: 1,
            }}
          >
            150 km
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '17px',
              color: 'var(--color-brown)',
              opacity: 0.7,
            }}
          >
            / 4 h 30
          </span>
        </div>
      </div>

      {/* Tramos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {TRAMOS.map((t) => (
          <div
            key={t.rango}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              backgroundColor: '#FFF6E4',
              border: '1px solid rgba(135,43,19,.1)',
              borderRadius: '8px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '15px',
                color: 'var(--color-crimson)',
                minWidth: '52px',
              }}
            >
              {t.rango}
            </span>
            <span
              style={{
                // El rango de km va a su izquierda con minWidth fijo, así que
                // el que tiene que ceder ancho es este. Los nombres de tramo
                // crecieron al nombrar la vía y sin esto empujan la fila.
                minWidth: 0,
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '14px',
                color: 'var(--color-brown)',
                opacity: 0.8,
              }}
            >
              {t.tramo}
            </span>
          </div>
        ))}
      </div>

      {/* Transporte */}
      <div
        style={{
          padding: '14px 16px',
          backgroundColor: 'rgba(253,195,0,.1)',
          border: '1px solid rgba(253,195,0,.25)',
          borderRadius: '8px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '15px',
            color: 'var(--color-brown)',
            marginBottom: '4px',
          }}
        >
          Entra autos, motos y buses · vía pavimentada
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '13px',
            color: 'rgba(135,43,19,.6)',
          }}
        >
          Parqueadero para 4 autos + 1 bus
        </p>
      </div>

      {/* CTA */}
      <a
        href={MAPA.rutas}
        target="_blank"
        rel="noopener noreferrer"
        className="ubicacion-boton"
      >
        Trazar mi ruta
        <span aria-hidden="true"> ↗</span>
      </a>

      <a
        href={whatsappCon(MENSAJE_WHATSAPP.comoLlegar)}
        target="_blank"
        rel="noopener noreferrer"
        className="ubicacion-enlace"
        style={{ fontSize: '13px' }}
      >
        ¿Dudas para llegar? Escríbenos por WhatsApp
      </a>
    </div>
  )
}
