const DIFERENCIALES = [
  {
    numero: '01',
    titulo: 'Cacao de origen',
    // Las cifras van aquí y no en un texto genérico: es el primer bloque
    // después del hero y «variedades nativas» a secas es una promesa que no
    // se puede comprobar. «1.300 plantas» y «12 variedades» dicen lo mismo con
    // algo que el visitante puede contrastar cuando llega a la finca. Están
    // escritas y no vienen de SiteConfig porque este componente no recibe la
    // config; si cambian, se cambian aquí y en el panel a la vez.
    descripcion:
      'Conoces el cacao desde que nace en el árbol. 1.300 plantas con trazabilidad, 12 variedades nativas y un proceso que puedes seguir con tus propios ojos.',
  },
  {
    numero: '02',
    titulo: 'Producción sostenible',
    descripcion:
      'Ves en cada rincón un manejo agroecológico y Buenas Prácticas Agrícolas. Cada cosecha respeta el suelo, el agua y los ciclos naturales de la finca.',
  },
  {
    numero: '03',
    titulo: 'Proceso artesanal en vivo',
    descripcion:
      'No lees sobre el proceso: lo ves. Desde la fermentación en cajones hasta la molienda, cada etapa del grano al chocolate sucede frente a ti.',
  },
  {
    numero: '04',
    titulo: 'Biodiversidad protegida',
    descripcion:
      'Recorres un ecosistema vivo donde la flora y la fauna se cuidan como parte central del negocio, no como un complemento decorativo.',
  },
  {
    numero: '05',
    titulo: 'Experiencias auténticas',
    descripcion:
      'Vives la combinación de producción agrícola, educación ambiental y turismo vivencial en una sola visita que te conecta de verdad con el territorio.',
  },
  {
    numero: '06',
    titulo: 'Servicio seguro y cuidado',
    descripcion:
      'Cuentas con guianza especializada en cada salida, póliza de asistencia y grupos reducidos para disfrutar sin prisas ni aglomeraciones.',
  },
]

export default function Diferenciales() {
  return (
    <section
      style={{
        backgroundColor: '#FFF6E4',
        paddingBlock: 'clamp(48px, 8vw, 80px)',
      }}
    >
      <div className="contenido">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'var(--color-orange)',
              marginBottom: '16px',
            }}
          >
            ¿Por qué Vuelo Carmesí?
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              color: 'var(--color-crimson)',
              lineHeight: 1.2,
              marginBottom: '16px',
            }}
          >
            Seis razones para conocernos
          </h2>
          
        </div>

        {/* min(300px, 100%) y no 300px a secas: a 320px de viewport el interior
            de .contenido mide 288px —el padding-inline se lleva 2 x 16px— y una
            columna que exige 300 desborda la pantalla. Con min() el mínimo cede
            al ancho disponible cuando no cabe, que es el mismo patrón que usa
            .politicas-grid en globals.css. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
            gap: '24px',
          }}
        >
          {DIFERENCIALES.map((d) => (
            <div
              key={d.numero}
              style={{
                // Hijo de grid con texto dentro: sin esto su min-width es auto
                // y la celda se niega a bajar del ancho de su palabra más larga.
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                padding: '28px 24px',
                backgroundColor: '#FFF6E4',
                border: '1px solid rgba(135,43,19,.12)',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    flex: 'none',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-gold)',
                    color: 'var(--color-brown)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {d.numero}
                </span>
                <h3
                  style={{
                    // Va al lado del disco de 40px, que es flex:none: el que
                    // tiene que encoger es el título, y con min-width auto se
                    // niega y empuja la fila fuera de la tarjeta.
                    minWidth: 0,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: 'clamp(18px, 2vw, 20px)',
                    color: 'var(--color-brown)',
                    margin: 0,
                  }}
                >
                  {d.titulo}
                </h3>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '15px',
                  lineHeight: 1.65,
                  color: 'rgba(135,43,19,.75)',
                  margin: 0,
                }}
              >
                {d.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
