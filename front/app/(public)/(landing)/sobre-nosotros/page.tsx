// Placeholder rayado oscuro (para fondos brown)
function ImgDark({ label, height = 420 }: { label: string; height?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: '12px',
        background: 'repeating-linear-gradient(135deg, #9A3417 0 14px, #8A2E14 14px 28px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(135,43,19,.20)',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '1px',
          color: 'rgba(255,234,202,.3)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  )
}

// Placeholder rayado claro (para fondos cream)
function ImgLight({ label, height = 420 }: { label: string; height?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: '12px',
        background: 'repeating-linear-gradient(135deg, #F0D6A8 0 14px, #E9CB97 14px 28px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(135,43,19,.10)',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '1px',
          color: 'rgba(135,43,19,.35)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  )
}

const VALORES = [
  {
    icon: '🌱',
    titulo: 'Agroecología',
    descripcion:
      'Cultivamos sin agroquímicos, respetando los ciclos naturales de la selva y el suelo vivo que nos sostiene.',
  },
  {
    icon: '🤝',
    titulo: 'Comunidad',
    descripcion:
      'Trabajamos junto a familias cacaoteras de la región, fortaleciendo la economía local y el saber ancestral.',
  },
  {
    icon: '🍫',
    titulo: 'Bean to bar',
    descripcion:
      'Del árbol a la tablilla sin intermediarios: controlamos cada paso para garantizar calidad y trazabilidad total.',
  },
]

const PROCESO = [
  {
    numero: '01',
    titulo: 'Siembra',
    descripcion:
      'Seleccionamos y propagamos variedades nativas de cacao fino de aroma, resistentes y adaptadas al microclima del Meta.',
  },
  {
    numero: '02',
    titulo: 'Cosecha',
    descripcion:
      'Recolectamos los frutos maduros a mano, uno a uno, para asegurar que solo el mejor cacao llegue a la siguiente etapa.',
  },
  {
    numero: '03',
    titulo: 'Fermentación',
    descripcion:
      'Fermentamos en cajones de madera durante 5–7 días. Este proceso es el corazón del sabor y el aroma del chocolate.',
  },
  {
    numero: '04',
    titulo: 'Chocolate',
    descripcion:
      'Tostamos, refinamos y conchamos en nuestra pequeña planta artesanal para crear barras con carácter y personalidad propios.',
  },
]

const EQUIPO = [
  {
    cargo: 'Fundador · Agrónomo',
    bio: 'Lleva más de diez años investigando variedades nativas del Meta y liderando proyectos de agricultura regenerativa en la región.',
  },
  {
    cargo: 'Coordinadora de Experiencias',
    bio: 'Diseña y acompaña cada visita para que los huéspedes vivan el cacao desde adentro: con los pies en la tierra y todos los sentidos abiertos.',
  },
  {
    cargo: 'Maestro Chocolatero',
    bio: 'Transforma cada lote de cacao en chocolate fino, explorando perfiles de sabor que reflejan el terroir único de la finca.',
  },
]

const GALERIA = [
  { label: 'MAZORCA EN EL ÁRBOL', h: 280 },
  { label: 'FERMENTACIÓN EN CAJONES', h: 340 },
  { label: 'PAISAJE DE LA FINCA', h: 280 },
  { label: 'COSECHA A MANO', h: 320 },
  { label: 'TALLER DE CHOCOLATE', h: 280 },
  { label: 'DEGUSTACIÓN GUIADA', h: 320 },
]

export default function SobreNosotrosPage() {
  return (
    <>
      {/* ── Hero interno ── */}
      <div
        style={{
          height: 'clamp(240px, 28vw, 320px)',
          background: 'repeating-linear-gradient(135deg, #9A3417 0 14px, #8A2E14 14px 28px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(135,43,19,.55)' }} />
        <div style={{ position: 'relative' }}>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'var(--color-gold)',
              marginBottom: '12px',
            }}
          >
            Nuestra historia
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 6vw, 56px)',
              color: 'var(--color-cream)',
              lineHeight: 1.1,
              marginBottom: '12px',
            }}
          >
            Quiénes somos
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '16px',
              color: 'rgba(255,234,202,.8)',
            }}
          >
            Un proyecto agroecológico nacido en las tierras del Meta, Colombia
          </p>
        </div>
      </div>

      {/* ── Origen ── */}
      <section
        style={{
          backgroundColor: 'var(--color-cream)',
          padding: 'clamp(64px, 8vw, 100px) 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="sobre-nosotros-grid">
            <ImgLight label="FOTO · FUNDADORES EN LA FINCA" height={460} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
                El origen
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  color: 'var(--color-crimson)',
                  lineHeight: 1.2,
                  marginBottom: '20px',
                }}
              >
                Cómo nació Vuelo Carmesí
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 'clamp(15px, 1.5vw, 17px)',
                  color: 'var(--color-brown)',
                  lineHeight: 1.8,
                  marginBottom: '16px',
                  opacity: 0.9,
                }}
              >
                Todo comenzó con una pregunta simple: ¿por qué el cacao más fino del mundo se exporta
                sin identidad y vuelve convertido en productos que no reflejan su origen? Esa inquietud
                fue la semilla de Vuelo Carmesí.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 'clamp(15px, 1.5vw, 17px)',
                  color: 'var(--color-brown)',
                  lineHeight: 1.8,
                  marginBottom: '16px',
                  opacity: 0.9,
                }}
              >
                En 2018 establecimos la Finca La Fortuna en Cubarral, Meta, con la convicción de que
                el camino era cultivar, transformar y vivir el cacao en el mismo lugar. Sin
                intermediarios. Sin atajos.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 'clamp(15px, 1.5vw, 17px)',
                  color: 'var(--color-brown)',
                  lineHeight: 1.8,
                  opacity: 0.9,
                }}
              >
                Hoy somos una finca productora, una pequeña chocolatería artesanal y un espacio de
                experiencias que invita a quienes quieran entender —y saborear— de dónde viene
                realmente el chocolate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Misión y Valores ── */}
      <section
        style={{
          backgroundColor: 'var(--color-brown)',
          padding: 'clamp(64px, 8vw, 100px) 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: 'var(--color-gold)',
                marginBottom: '12px',
              }}
            >
              Lo que nos guía
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 40px)',
                color: 'var(--color-cream)',
                lineHeight: 1.2,
                marginBottom: '16px',
              }}
            >
              Misión y valores
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '17px',
                color: 'rgba(255,234,202,.8)',
                maxWidth: '560px',
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Cultivar cacao con respeto, transformarlo con pasión y compartirlo con honestidad.
            </p>
          </div>
          <div className="valores-grid">
            {VALORES.map((v) => (
              <div
                key={v.titulo}
                style={{
                  backgroundColor: 'rgba(255,234,202,.07)',
                  border: '1px solid rgba(255,234,202,.12)',
                  borderRadius: '12px',
                  padding: '32px',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{v.icon}</div>
                <h3
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '20px',
                    color: 'var(--color-cream)',
                    marginBottom: '12px',
                  }}
                >
                  {v.titulo}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '15px',
                    color: 'rgba(255,234,202,.75)',
                    lineHeight: 1.7,
                  }}
                >
                  {v.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── La Finca ── */}
      <section
        style={{
          backgroundColor: 'var(--color-cream)',
          padding: 'clamp(64px, 8vw, 100px) 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="sobre-nosotros-grid">
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
                Nuestro hogar
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  color: 'var(--color-crimson)',
                  lineHeight: 1.2,
                  marginBottom: '20px',
                }}
              >
                Finca La Fortuna
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 'clamp(15px, 1.5vw, 17px)',
                  color: 'var(--color-brown)',
                  lineHeight: 1.8,
                  marginBottom: '32px',
                  opacity: 0.9,
                }}
              >
                Ubicada en la Vereda Brisas del Tonoa, Cubarral, Meta — una de las zonas con mayor
                diversidad de cacao nativo de Colombia, a 600 metros sobre el nivel del mar, donde el
                calor de los Llanos se mezcla con la humedad de la Orinoquía.
              </p>
              <div className="finca-stats">
                {[
                  ['📍', 'Cubarral, Meta', 'Colombia'],
                  ['🌳', '+15 hectáreas', 'de cultivo agroecológico'],
                  ['🍫', 'Cacao fino de aroma', 'variedades nativas'],
                  ['🌿', 'Cero agroquímicos', 'desde el primer día'],
                ].map(([icon, titulo, sub]) => (
                  <div
                    key={titulo}
                    style={{
                      padding: '16px',
                      backgroundColor: '#FFF6E4',
                      borderRadius: '8px',
                      border: '1px solid rgba(135,43,19,.12)',
                    }}
                  >
                    <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{icon}</div>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '14px',
                        color: 'var(--color-brown)',
                        marginBottom: '2px',
                      }}
                    >
                      {titulo}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '12px',
                        color: 'var(--color-brown)',
                        opacity: 0.6,
                      }}
                    >
                      {sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <ImgLight label="FOTO · VISTA DE LA FINCA" height={460} />
          </div>
        </div>
      </section>

      {/* ── El Proceso ── */}
      <section
        style={{
          backgroundColor: 'var(--color-brown)',
          padding: 'clamp(64px, 8vw, 100px) 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: 'var(--color-gold)',
                marginBottom: '12px',
              }}
            >
              De la mata al chocolate
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 40px)',
                color: 'var(--color-cream)',
                lineHeight: 1.2,
              }}
            >
              Nuestro proceso
            </h2>
          </div>
          <div className="proceso-grid">
            {PROCESO.map((p) => (
              <div key={p.numero}>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '48px',
                    color: 'var(--color-amber)',
                    lineHeight: 1,
                    marginBottom: '16px',
                    opacity: 0.9,
                  }}
                >
                  {p.numero}
                </div>
                <div
                  style={{
                    width: '40px',
                    height: '2px',
                    backgroundColor: 'var(--color-gold)',
                    marginBottom: '20px',
                    opacity: 0.4,
                  }}
                />
                <h3
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '20px',
                    color: 'var(--color-cream)',
                    marginBottom: '10px',
                  }}
                >
                  {p.titulo}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '15px',
                    color: 'rgba(255,234,202,.75)',
                    lineHeight: 1.7,
                  }}
                >
                  {p.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── El Equipo ── */}
      <section
        style={{
          backgroundColor: 'var(--color-cream)',
          padding: 'clamp(64px, 8vw, 100px) 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: 'var(--color-orange)',
                marginBottom: '12px',
              }}
            >
              Las personas detrás
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 40px)',
                color: 'var(--color-crimson)',
                lineHeight: 1.2,
              }}
            >
              El equipo
            </h2>
          </div>
          <div className="equipo-grid">
            {EQUIPO.map((m) => (
              <div
                key={m.cargo}
                style={{
                  backgroundColor: '#FFF6E4',
                  border: '1px solid rgba(135,43,19,.12)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(135,43,19,.08)',
                }}
              >
                <div
                  style={{
                    height: '200px',
                    background:
                      'repeating-linear-gradient(135deg, #F0D6A8 0 14px, #E9CB97 14px 28px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      letterSpacing: '1px',
                      color: 'rgba(135,43,19,.35)',
                      textTransform: 'uppercase',
                    }}
                  >
                    FOTO · EQUIPO
                  </span>
                </div>
                <div style={{ padding: '24px' }}>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: 'var(--color-amber)',
                      letterSpacing: '0.5px',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {m.cargo}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: 'var(--color-brown)',
                      lineHeight: 1.7,
                      opacity: 0.85,
                    }}
                  >
                    {m.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Galería ── */}
      <section
        style={{
          backgroundColor: 'var(--color-cream)',
          padding: '0 24px clamp(64px, 8vw, 100px)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 40px)',
                color: 'var(--color-crimson)',
              }}
            >
              La finca en imágenes
            </h2>
          </div>
          <div className="galeria-sobre">
            {GALERIA.map(({ label, h }) => (
              <div
                key={label}
                style={{
                  height: h,
                  borderRadius: '8px',
                  background:
                    'repeating-linear-gradient(135deg, #F0D6A8 0 14px, #E9CB97 14px 28px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    color: 'rgba(135,43,19,.35)',
                    textTransform: 'uppercase',
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banda ── */}
      <section
        style={{
          backgroundColor: 'var(--color-crimson)',
          padding: 'clamp(64px, 8vw, 80px) 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 48px)',
              color: 'var(--color-cream)',
              lineHeight: 1.15,
              marginBottom: '16px',
            }}
          >
            ¿Querés vivir el cacao en persona?
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '18px',
              color: 'rgba(255,234,202,.85)',
              lineHeight: 1.7,
              marginBottom: '32px',
            }}
          >
            Reservá tu lugar en alguna de nuestras experiencias y descubrí la finca de primera mano.
          </p>
          <a href="/experiencias" className="btn-ghost-cream">
            Ver experiencias
          </a>
        </div>
      </section>
    </>
  )
}
