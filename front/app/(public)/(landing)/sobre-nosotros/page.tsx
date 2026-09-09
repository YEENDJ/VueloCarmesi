import Link from "next/link";
import EquipoCarrusel from "@/components/secciones/EquipoCarrusel";
import {
  CONTACTO,
  MAPA,
} from "@/lib/contacto";
import HistoriaTimeline from "@/components/secciones/HistoriaTimeline";
import ProcesoLinea from "@/components/secciones/ProcesoLinea";
import ImpactoSocial from "@/components/secciones/ImpactoSocial";
import ComoLlegar from "@/components/secciones/ComoLlegar";
import { getSiteConfig } from "@/lib/api/site-config";

// Placeholder rayado oscuro (para fondos brown)
function ImgDark({ label, height = 420 }: { label: string; height?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: "12px",
        background:
          "repeating-linear-gradient(135deg, #9A3417 0 14px, #8A2E14 14px 28px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(135,43,19,.20)",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "11px",
          letterSpacing: "1px",
          color: "rgba(255,234,202,.3)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// Placeholder rayado claro (para fondos cream)
function ImgLight({ label, height = 420 }: { label: string; height?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: "12px",
        background:
          "repeating-linear-gradient(135deg, #F0D6A8 0 14px, #E9CB97 14px 28px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(135,43,19,.10)",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "11px",
          letterSpacing: "1px",
          color: "rgba(135,43,19,.35)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

const VALORES = [
  {
    icon: "🌱",
    titulo: "Agroecología",
    descripcion:
      "Cultivamos sin agroquímicos, promoviendo prácticas responsables con el suelo, el agua, la biodiversidad y los ciclos naturales de la finca.",
  },
  {
    icon: "🤝",
    titulo: "Comunidad",
    descripcion:
      "Trabajamos junto a familias cacaoteras de la región, fortaleciendo la economía local y el saber ancestral.",
  },
  {
    icon: "🌿",
    titulo: "Del cultivo a la experiencia",
    descripcion:
      "Conectamos el cultivo, la transformación y el turismo para compartir con nuestros visitantes una experiencia auténtica alrededor del cacao.",
  },
];

const GALERIA = [
  { label: "MAZORCA EN EL ÁRBOL", h: 280 },
  { label: "FERMENTACIÓN EN CAJONES", h: 340 },
  { label: "PAISAJE DE LA FINCA", h: 280 },
  { label: "COSECHA A MANO", h: 320 },
  { label: "TALLER DE CHOCOLATE", h: 280 },
  { label: "DEGUSTACIÓN GUIADA", h: 320 },
];

/**
 * 1300 → «1.300». Las cifras de la finca se guardan en el panel como número
 * pelado —el input es de tipo number y un «1.300» tecleado a mano llegaría
 * como 1,3— así que el separador de miles se pone aquí, al pintarlas.
 *
 * A mano y no con `toLocaleString('es-CO')` para que el string no dependa del
 * ICU con el que se haya compilado el Node que renderiza. Si el valor trae
 * algo que no son dígitos se devuelve tal cual: es un texto que alguien
 * escribió a propósito y no nos toca reformatearlo.
 */
function miles(valor: string) {
  return /^\d+$/.test(valor)
    ? valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : valor;
}

// El segmento caduca siempre, haya respondido el backend o no. `getSiteConfig`
// se traga el error y devuelve {}, así que sin esto una caída del backend
// durante el build dejaría la página cacheada con las cifras de respaldo y sin
// nada que la invalidara. Mismo criterio que la ficha de experiencia.
export const revalidate = 300;

export default async function SobreNosotrosPage() {
  const config = await getSiteConfig();

  /* El respaldo no es decorativo, igual que en PruebaSocial: `getSiteConfig`
     devuelve {} cuando la API no responde —no lanza, para que una caída del
     backend no tumbe la página— y sin él la sección de la finca se quedaría
     anunciando « plantas» y « kg al año». Con respaldo, lo peor que pasa es
     que las cifras se queden en las de la última publicación. */
  const cifraFinca = (clave: string, respaldo: string) =>
    miles(config[clave]?.trim() || respaldo);

  return (
    <>
      {/* ── Origen · Nuestra historia ── */}
      <section
        style={{
          backgroundColor: "var(--color-cream)",
          padding: "clamp(64px, 8vw, 100px) 24px",
        }}
      >
        <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: "13px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "var(--color-orange)",
                marginBottom: "16px",
              }}
            >
              El origen
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 5vw, 48px)",
                color: "var(--color-crimson)",
                lineHeight: 1.15,
                marginBottom: "16px",
              }}
            >
              Nuestra historia
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: "17px",
                color: "var(--color-brown)",
                opacity: 0.8,
                maxWidth: "620px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Una historia que ya existía y que decidimos abrirle las puertas al
              mundo.
            </p>
          </div>

          <HistoriaTimeline />
        </div>
      </section>

      {/* ── Misión y Valores ── */}
      <section
        style={{
          backgroundColor: "var(--color-brown)",
          padding: "clamp(64px, 8vw, 100px) 24px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: "13px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "var(--color-gold)",
                marginBottom: "12px",
              }}
            >
              Lo que nos guía
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 40px)",
                color: "var(--color-cream)",
                lineHeight: 1.2,
                marginBottom: "16px",
              }}
            >
              Misión y valores
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: "17px",
                color: "rgba(255,234,202,.8)",
                maxWidth: "560px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Cultivar cacao con respeto, transformarlo con pasión y compartirlo
              con honestidad.
            </p>
          </div>
          <div className="valores-grid">
            {VALORES.map((v) => (
              <div
                key={v.titulo}
                style={{
                  backgroundColor: "rgba(255,234,202,.07)",
                  border: "1px solid rgba(255,234,202,.12)",
                  borderRadius: "12px",
                  padding: "32px",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>
                  {v.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: "20px",
                    color: "var(--color-cream)",
                    marginBottom: "12px",
                  }}
                >
                  {v.titulo}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "rgba(255,234,202,.75)",
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
          backgroundColor: "var(--color-cream)",
          padding: "clamp(64px, 8vw, 100px) 24px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="sobre-nosotros-grid">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: "13px",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: "var(--color-orange)",
                  marginBottom: "16px",
                }}
              >
                Nuestro hogar
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(28px, 4vw, 40px)",
                  color: "var(--color-crimson)",
                  lineHeight: 1.2,
                  marginBottom: "20px",
                }}
              >
                Finca La Fortuna
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: "clamp(16px, 1.5vw, 17px)",
                  color: "var(--color-brown)",
                  lineHeight: 1.8,
                  marginBottom: "32px",
                  opacity: 0.9,
                }}
              >
                Ubicada en la vereda Brisas del Tonoa, Cubarral, Meta, a 800
                metros sobre el nivel del mar, Vuelo Carmesí se encuentra en un
                lugar donde el calor de los Llanos se encuentra con la frescura
                de las montañas del Sumapaz. Aquí, el cacao, la naturaleza y la
                vida campesina se encuentran en un paisaje que invita a
                detenerse, explorar y sentir el territorio. En sus 1.2 hectáreas
                crecen {cifraFinca("finca_plantas", "1300")} plantas de cacao de{" "}
                {cifraFinca("finca_variedades", "12")} variedades, todas con
                trazabilidad, de las que sale una cosecha cercana a los{" "}
                {cifraFinca("finca_produccion_kg", "900")} kilos de grano seco
                al año.
              </p>
              {/* Las tres cifras productivas salen de SiteConfig y las otras
                  tres son fijas: la ubicación y el tamaño del predio no
                  cambian de temporada en temporada, y meterlas al panel sería
                  darle a alguien la oportunidad de dejar la finca sin
                  hectáreas por un dedo mal puesto. */}
              <div className="finca-stats">
                {[
                  ["📍", "Cubarral, Meta", "Colombia"],
                  ["🌳", "1.2 hectáreas", "de cultivo agroecológico"],
                  [
                    "🌱",
                    `${cifraFinca("finca_plantas", "1300")} plantas`,
                    "de cacao en producción",
                  ],
                  [
                    "🍫",
                    `${cifraFinca("finca_variedades", "12")} variedades`,
                    "de cacao fino de sabor y aroma",
                  ],
                  [
                    "🍂",
                    `${cifraFinca("finca_produccion_kg", "900")} kg al año`,
                    "de grano seco",
                  ],
                  ["🌿", "Manejo agroecológico", "desde el primer día"],
                ].map(([icon, titulo, sub]) => (
                  <div
                    key={titulo}
                    style={{
                      // Hijo de grid con texto: su min-width por defecto es el
                      // de su palabra más larga y a 420px —donde .finca-stats
                      // todavía es de dos columnas— eso basta para empujar la
                      // rejilla fuera de la tarjeta.
                      minWidth: 0,
                      padding: "16px",
                      backgroundColor: "#FFF6E4",
                      borderRadius: "8px",
                      border: "1px solid rgba(135,43,19,.12)",
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{ fontSize: "1.4rem", marginBottom: "6px" }}
                    >
                      {icon}
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "var(--color-brown)",
                        marginBottom: "2px",
                      }}
                    >
                      {titulo}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "var(--color-brown)",
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

      {/* ── Dónde estamos ── */}
      {/* El id hace enlazable el mapa por sí solo: /sobre-nosotros#dondeestamos
          cae directo acá en vez de obligar a bajar toda la historia, el equipo y
          el proceso. Es la sección que más se comparte por WhatsApp cuando
          alguien pregunta cómo llegar.
          El scrollMarginTop no es adorno: la navbar es sticky y mide unos 56 px
          en móvil y 67 en escritorio, así que sin él el salto deja el borde de
          esta franja escondido debajo de la banda carmesí. El mismo clamp que
          usan .avi-card y .politica-card, para que las tres se detengan igual. */}
      <section
        id="dondeestamos"
        style={{
          backgroundColor: "#FFF6E4",
          padding: "clamp(64px, 8vw, 100px) 24px",
          borderTop: "1px solid rgba(135,43,19,.10)",
          scrollMarginTop: "clamp(80px, 10vw, 100px)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 40px)",
                color: "var(--color-crimson)",
                lineHeight: 1.2,
              }}
            >
              Dónde estamos
            </h2>
          </div>

          <div className="ubicacion-grid">
            <div className="ubicacion-mapa">
              <iframe
                src={MAPA.embed}
                title="Mapa de la ubicación de Vuelo Carmesí en Cubarral, Meta"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="ubicacion-datos">
              {/* <div className="ubicacion-dato">
                <span className="ubicacion-dato-titulo">Dirección</span>
                <span className="ubicacion-dato-valor">
                  {CONTACTO.direccion}
                </span>
                <span className="ubicacion-dato-nota">
                  {CONTACTO.municipio}
                </span>
              </div>

              <div className="ubicacion-dato">
                <span className="ubicacion-dato-titulo">Altura</span>
                <span className="ubicacion-dato-valor">800 m s. n. m.</span>
                <span className="ubicacion-dato-nota">
                  Donde el calor de los Llanos se encuentra con la frescura del
                  Sumapaz
                </span>
              </div>

              <div className="ubicacion-dato">
                <span className="ubicacion-dato-titulo">La finca</span>
                <span className="ubicacion-dato-valor">
                  1.2 hectáreas de cultivo agroecológico
                </span>
                <span className="ubicacion-dato-nota">
                  Cacao fino de sabor y aroma, variedades nativas
                </span>
              </div> */}

              <ComoLlegar />
            </div>
          </div>
        </div>
      </section>

      {/* ── El Proceso ── */}
      <section
        style={{
          backgroundColor: "var(--color-brown)",
          padding: "clamp(64px, 8vw, 100px) 24px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: "13px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "var(--color-gold)",
                marginBottom: "12px",
              }}
            >
              De la mata al chocolate
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 40px)",
                color: "var(--color-cream)",
                lineHeight: 1.2,
              }}
            >
              Nuestro proceso
            </h2>
          </div>
          <ProcesoLinea />
        </div>
      </section>

      {/* ── Impacto social ── */}
      <ImpactoSocial cifras={config} />

      {/* ── El Equipo ── */}
      {/* /sobre-nosotros#equipo cae directo en el carrusel. Lo enlaza la ficha
          del guía en /aviturismo, donde la promesa es «conoce a quien te va a
          guiar»: sin el ancla, esa promesa aterrizaba al principio de la página
          y había que bajar seis secciones para cumplirla.
          Mismo scrollMarginTop que #dondeestamos por la navbar sticky, que mide
          unos 56 px en móvil y 67 en escritorio. */}
      <section
        id="equipo"
        style={{
          backgroundColor: "var(--color-cream)",
          padding: "clamp(64px, 8vw, 100px) 24px",
          scrollMarginTop: "clamp(80px, 10vw, 100px)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: "13px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "var(--color-orange)",
                marginBottom: "12px",
              }}
            >
              Las personas detrás
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 40px)",
                color: "var(--color-crimson)",
                lineHeight: 1.2,
              }}
            >
              El equipo
            </h2>
          </div>
          <EquipoCarrusel />
        </div>
      </section>

      {/* ── Galería ── */}
      <section
        style={{
          backgroundColor: "var(--color-cream)",
          padding: "0 24px clamp(64px, 8vw, 100px)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 40px)",
                color: "var(--color-crimson)",
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
                  borderRadius: "8px",
                  background:
                    "repeating-linear-gradient(135deg, #F0D6A8 0 14px, #E9CB97 14px 28px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    letterSpacing: "1px",
                    color: "rgba(135,43,19,.35)",
                    textTransform: "uppercase",
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
          backgroundColor: "var(--color-crimson)",
          padding: "clamp(64px, 8vw, 80px) 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 5vw, 48px)",
              color: "var(--color-cream)",
              lineHeight: 1.15,
              marginBottom: "16px",
            }}
          >
            ¿Quieres vivir el cacao en persona?
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: "18px",
              color: "rgba(255,234,202,.85)",
              lineHeight: 1.7,
              marginBottom: "32px",
            }}
          >
            Reserva tu lugar en alguna de nuestras experiencias y descubre la
            finca de primera mano.
          </p>
          {/* Link y no <a>: con la etiqueta cruda el navegador recarga la
              aplicación entera para ir a una ruta propia, y además ESLint lo
              marca como error, que con esta configuración tumba `next build`. */}
          <Link href="/experiencias" className="btn-ghost-cream">
            Ver experiencias
          </Link>
        </div>
      </section>
    </>
  );
}
