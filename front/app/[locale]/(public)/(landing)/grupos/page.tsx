import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { alternatesDeIdioma } from '@/lib/i18n/alternates'
import { SITIO } from '@/lib/sitio'
import { ID_NEGOCIO } from '@/lib/jsonld'
import {
  Bus, Check, ExternalLink, FileText, GraduationCap, Handshake, MapPin,
  Receipt, School, ShieldCheck, Users, X, type LucideIcon,
} from 'lucide-react'
import { MAPA, MENSAJE_WHATSAPP, whatsappCon } from '@/lib/contacto'
import { getSiteConfig } from '@/lib/api/site-config'
import { getExperiencias } from '@/lib/api/experiencias'
import { formatPrecio } from '@/lib/format'
import { INSTITUCIONES_EDUCATIVAS, ORGANIZACIONES } from '@/lib/clientes'
import RutaTramos from '@/components/grupos/RutaTramos'
import FormularioGrupo from '@/components/grupos/FormularioGrupo'

/**
 * Página de grupos: colegios, universidades y empresas.
 *
 * La fuente son las hojas 17 a 22 del portafolio 2026
 * (`portafolio/src/portafolio.html`), que es contenido comercial ya aprobado.
 * Esta página no lo reescribe: lo publica.
 *
 * Por qué existe. La finca ya vende a instituciones —8 educativas y 7
 * organizaciones dentro de las 692 personas atendidas desde 2023— y el sitio no
 * le hablaba a ese comprador en ninguna página. El problema no era de tono: el
 * formulario de `/reservar/[slug]` construye el selector de personas sobre
 * `experiencia.capacidad`, que es 12 y 8, así que un coordinador con 40
 * estudiantes abre el formulario, ve que el número más alto es 12 y se va. Ese
 * tráfico caía en `/contacto`, que pide tres campos y no pregunta nada de lo
 * que decide una cotización.
 *
 * Por qué es una página y no un párrafo en la ficha: mismo argumento que
 * sostiene `/aviturismo`. Una ficha vende UNA salida y se lee en dos minutos;
 * no aguanta una tabla de facturación, una política de autorización de menores
 * ni un esquema de ruta por tramos, que es justo lo que este visitante busca.
 *
 * Y no son tres páginas —colegios, universidades, empresas— porque comparten el
 * 70 % de lo que necesitan: logística, póliza, qué incluye y condiciones. Tres
 * URLs delgadas repartirían la misma autoridad y competirían entre sí.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'grupos.meta' })

  return {
    metadataBase: new URL(SITIO),
    alternates: alternatesDeIdioma('/grupos', locale),
    // Sin la marca: el layout ya la añade con title.template («%s · Vuelo
    // Carmesí»). Escribirla también aquí la duplicaba —«… | Vuelo Carmesí ·
    // Vuelo Carmesí»— y empujaba el título a 90 caracteres, que la SERP trunca.
    title: t('titulo'),
    description: t('descripcion'),
    // Términos del gremio, no del diccionario: es lo que escribe un coordinador
    // académico o de bienestar, que casi nunca busca «turismo rural».
    keywords: [
      'salida pedagógica Meta',
      'salidas escolares Villavicencio',
      'turismo escolar Cubarral',
      'visita empresarial finca cacao',
      'actividad de integración empresarial Meta',
      'salida de campo universidad agroecología',
      'school field trip Colombia',
      'corporate day trip Meta Colombia',
    ],
    openGraph: {
      title: t('titulo'),
      description: t('descripcion'),
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_CO',
      siteName: 'Vuelo Carmesí',
      images: [
        {
          url: '/images/personas/grupo-mural.jpg',
          width: 1152,
          height: 864,
          alt: t('ogAlt'),
        },
      ],
    },
  }
}

/** Rótulos del índice de anclas. */
const APARTADOS = [
  'clientes', 'perfiles', 'tarifas', 'incluye', 'logistica', 'menores', 'pasos', 'faq',
] as const

/**
 * Las tres pistas, con su foto del archivo propio.
 *
 * Las familias salen a propósito, aunque el portafolio las tenga en la misma
 * lámina: ya tienen `/experiencias` y ahí el formulario de reserva les funciona.
 * Meterlas acá diluiría la página justo donde tiene que ser específica.
 *
 * `credito` solo lo lleva la de universidades: es un grupo real identificable
 * —Unillanos, Ingeniería Forestal— y frente a una facultad «ya trabajamos con
 * la Unillanos» pesa más que cualquier viñeta.
 */
const PERFILES = [
  {
    clave: 'colegio',
    Icono: School,
    foto: '/images/personas/grupo-mural.jpg',
    ancho: 1280,
    alto: 960,
    foco: 'center 40%',
    credito: false,
  },
  {
    clave: 'universidad',
    Icono: GraduationCap,
    foto: '/images/personas/estudiantes.jpg',
    ancho: 1280,
    alto: 960,
    foco: 'center 45%',
    credito: true,
  },
  {
    clave: 'empresa',
    Icono: Users,
    foto: '/images/personas/corporativos.jpg',
    ancho: 1600,
    alto: 1200,
    foco: 'center center',
    credito: false,
  },
] as const

const PUNTOS = ['punto1', 'punto2', 'punto3', 'punto4', 'punto5'] as const
const INCLUIDOS = ['si1', 'si2', 'si3', 'si4', 'si5'] as const
const EXCLUIDOS = ['no1', 'no2', 'no3', 'no4', 'no5'] as const
const EXTRAS = ['extra1', 'extra2', 'extra3'] as const
const ACCESO = ['acceso1', 'acceso2', 'acceso3', 'acceso4'] as const
const TERRENO = ['terreno1', 'terreno2', 'terreno3', 'terreno4'] as const
const LLEVAR = [
  'llevar1', 'llevar2', 'llevar3', 'llevar4', 'llevar5', 'llevar6', 'llevar7', 'llevar8',
] as const
const AUTORIZACION = [
  'autorizacion1', 'autorizacion2', 'autorizacion3', 'autorizacion4',
] as const
const PASOS = ['paso1', 'paso2', 'paso3', 'paso4'] as const
const PREGUNTAS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const

/**
 * Datos estructurados.
 *
 * `Service` y no `TouristAttraction`: la atracción ya la declara `/aviturismo`,
 * y repetirla acá haría que las dos páginas compitan por la misma entidad. Esto
 * es un servicio a medida con un público declarado, que es lo que `audience`
 * expresa.
 */
const jsonLd = (t: (k: string) => string, locale: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${SITIO}${locale === 'en' ? '/en/group-visits' : '/grupos'}`,
  url: `${SITIO}${locale === 'en' ? '/en/group-visits' : '/grupos'}`,
  name: t('meta.titulo'),
  description: t('meta.descripcion'),
  serviceType: locale === 'en' ? 'Group educational and corporate farm visits' : 'Jornadas agroturísticas para grupos escolares, universitarios y corporativos',
  // Por `@id` contra el negocio que el layout ya publica en cada página: una
  // copia aquí era la tercera dirección de la URL y podía desincronizarse.
  provider: { '@id': ID_NEGOCIO },
  areaServed: [
    { '@type': 'AdministrativeArea', name: 'Meta' },
    { '@type': 'AdministrativeArea', name: 'Cundinamarca' },
    { '@type': 'City', name: 'Bogotá' },
  ],
  audience: [
    { '@type': 'EducationalAudience', educationalRole: 'student' },
    { '@type': 'BusinessAudience', name: 'Corporate wellbeing programmes' },
  ],
})

export default async function GruposPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('grupos')

  // Las dos fuentes de datos vivos de la página. `getSiteConfig` devuelve {} si
  // la API no responde y `getExperiencias` devuelve []: ninguna de las dos
  // lanza, así que una caída del backend deja la página con menos filas, no
  // rota. Van en paralelo porque no dependen entre sí.
  const [config, experiencias] = await Promise.all([
    getSiteConfig(locale),
    getExperiencias(locale),
  ])

  /**
   * Un dato comercial, o nada.
   *
   * Al revés que `PruebaSocial`, que cae a un número escrito en el código. Ahí
   * está bien: una cifra de impacto algo vieja no le cuesta nada a nadie. Acá
   * no. «Póliza con cobertura de X» o «tarifa de menores Y» son compromisos que
   * un colegio lleva a su comité y aprueba con ese número, y la diferencia la
   * paga la finca. Mientras el dato no exista, la página no lo menciona.
   */
  const dato = (clave: string): string | null => config[clave]?.trim() || null

  const cupoDia = dato('grupos_cupo_dia')
  const facturacion = dato('grupos_facturacion')
  const aseguradora = dato('grupos_aseguradora')
  const transporte = dato('grupos_transporte')
  const minimo = dato('grupos_minimo')
  const descuentoVolumen = dato('grupos_descuento_volumen')
  const tarifaNeta = dato('grupos_tarifa_neta')
  // La anticipación sí tiene respaldo: 48 horas es la condición publicada en la
  // hoja 21 y en /politicas/cancelacion, así que no es un número sin revisar.
  const anticipacion = dato('grupos_anticipacion') ?? (locale === 'en' ? '48 hours' : '48 horas')

  // Guardada como número pelado para poder pasarla por formatPrecio y respetar
  // la regla de moneda: `$45.000` en español, `COP 45,000` en /en. Si alguien
  // escribe texto en esa clave, la fila no se pinta antes que mentir el importe.
  const menoresRaw = dato('grupos_tarifa_menores')
  const menoresNum = menoresRaw ? Number(menoresRaw.replace(/[^\d]/g, '')) : NaN
  const tarifaMenores = Number.isFinite(menoresNum) && menoresNum > 0
    ? formatPrecio(menoresNum, locale)
    : null

  const negrita = (trozos: React.ReactNode) => <b>{trozos}</b>

  /** Las cuatro tarjetas del resumen. Las que dependen de un dato ausente se caen. */
  const RESUMEN: { Icono: LucideIcon; cifra: string; texto: string }[] = [
    ...(cupoDia
      ? [{ Icono: Users, cifra: t('resumen.cupoCifra', { cupo: cupoDia }), texto: t('resumen.cupo') }]
      : []),
    { Icono: Bus, cifra: t('resumen.busCifra'), texto: t('resumen.bus') },
    { Icono: ShieldCheck, cifra: t('resumen.polizaCifra'), texto: t('resumen.poliza') },
    ...(facturacion
      ? [{ Icono: Receipt, cifra: t('resumen.facturaCifra'), texto: t('resumen.factura') }]
      : []),
  ]

  return (
    <section className="page-shell grp">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(t, locale)) }}
      />

      <p className="grp-kicker">
        <Users size={15} strokeWidth={1.9} aria-hidden="true" style={{ flexShrink: 0 }} />
        {t('kicker')}
      </p>
      <h1 className="grp-titulo">{t('h1')}</h1>
      <p className="grp-lead">{t.rich('lead', { b: negrita })}</p>

      <div className="grp-resumen">
        {RESUMEN.map(({ Icono, cifra, texto }) => (
          <div key={cifra} className="grp-resumen-dato">
            <span className="grp-icono" aria-hidden="true">
              <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <p style={{ minWidth: 0 }}>
              <strong className="grp-cifra">{cifra}</strong> {texto}
            </p>
          </div>
        ))}
      </div>

      <nav className="grp-indice" aria-label={t('indiceAria')}>
        {APARTADOS.map(id => (
          <a key={id} href={`#${id}`} className="grp-chip">
            {t(`apartados.${id}`)}
          </a>
        ))}
        <a href="#cotizar" className="grp-chip grp-chip--fuerte">
          {t('apartados.cotizar')}
        </a>
      </nav>

      <div className="grp-grid">
        {/* ── Quiénes ya vinieron ──
            Tercero y no al final, como en la mayoría de las webs. Para este
            comprador es el bloque más persuasivo: tiene que defender la salida
            ante un rector o un comité de compras, y el freno real es
            reputacional. «Ya vino la Unillanos» resuelve eso antes que la
            tarifa. Los nombres van en texto y nunca como logotipos: listar
            clientes por nombre es práctica normal, usar sus marcas exige
            autorización escrita de cada una. */}
        <article id="clientes" className="grp-card grp-card--ancha">
          <div className="grp-card-cabecera">
            <span className="grp-icono" aria-hidden="true">
              <Handshake size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="grp-card-titulo">{t('clientes.titulo')}</h2>
          </div>
          <p className="grp-card-texto">{t('clientes.texto')}</p>

          <p className="grp-clientes-cifra">
            <strong>{config.impacto_personas?.trim() || '692'}</strong> {t('clientes.personas')}
          </p>

          <p className="grp-subtitulo">{t('clientes.educativas')}</p>
          <ul className="grp-pills">
            {INSTITUCIONES_EDUCATIVAS.map(nombre => (
              <li key={nombre} className="grp-pill">{nombre}</li>
            ))}
          </ul>

          <p className="grp-subtitulo">{t('clientes.organizaciones')}</p>
          <ul className="grp-pills">
            {ORGANIZACIONES.map(nombre => (
              <li key={nombre} className="grp-pill">{nombre}</li>
            ))}
          </ul>
        </article>

        {/* ── Las tres pistas ── */}
        <article id="perfiles" className="grp-card grp-card--ancha">
          <div className="grp-card-cabecera">
            <span className="grp-icono" aria-hidden="true">
              <Users size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="grp-card-titulo">{t('perfiles.titulo')}</h2>
          </div>
          <p className="grp-card-texto">{t('perfiles.texto')}</p>

          <div className="grp-perfiles">
            {PERFILES.map(({ clave, Icono, foto, ancho, alto, foco, credito }) => (
              <div key={clave} className="grp-perfil">
                <div className="grp-perfil-foto">
                  {/* Medidas y no `fill`: `fill` pinta el <img> sin width/height.
                      El marco ya reserva el 3:2; el 100% lo hace llenarlo. */}
                  <Image
                    src={foto}
                    alt={t(`perfiles.${clave}.alt`)}
                    width={ancho}
                    height={alto}
                    sizes="(min-width: 1100px) 340px, (min-width: 700px) 45vw, 90vw"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: foco }}
                  />
                  {credito && (
                    <span className="grp-perfil-credito">{t(`perfiles.${clave}.credito`)}</span>
                  )}
                </div>
                <div className="grp-perfil-cuerpo">
                  <span className="grp-perfil-kicker">
                    <Icono size={15} strokeWidth={2} aria-hidden="true" style={{ flexShrink: 0 }} />
                    {t(`perfiles.${clave}.kicker`)}
                  </span>
                  <h3 className="grp-perfil-titulo">{t(`perfiles.${clave}.titulo`)}</h3>
                  <ul className="grp-marks">
                    {PUNTOS.map(p => (
                      <li key={p}>{t(`perfiles.${clave}.${p}`)}</li>
                    ))}
                  </ul>
                  <p className="grp-perfil-nota">{t(`perfiles.${clave}.nota`)}</p>
                  <a href="#cotizar" className="grp-boton grp-boton--perfil">
                    {t(`perfiles.${clave}.cta`)}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* ── Tarifas ──
            Los precios NO se escriben acá: salen de la API y pasan por
            formatPrecio. Mismo motivo que en /aviturismo — el panel es el dueño
            del precio y un número a mano queda desactualizado sin que nadie se
            entere. De paso, la regla de moneda del proyecto (`$70.000` en
            español, `COP 70,000` en /en) se cumple sola. */}
        <article id="tarifas" className="grp-card grp-card--ancha">
          <div className="grp-card-cabecera">
            <span className="grp-icono" aria-hidden="true">
              <Receipt size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="grp-card-titulo">{t('tarifas.titulo')}</h2>
          </div>
          <p className="grp-card-texto">{t('tarifas.texto')}</p>

          {/* La tabla scrollea en su propio contenedor: cuatro columnas no caben
              en 320px y el body nunca debe scrollear en horizontal. */}
          <div className="grp-tabla-marco">
            <table className="grp-tabla">
              <thead>
                <tr>
                  <th>{t('tarifas.colServicio')}</th>
                  <th>{t('tarifas.colDuracion')}</th>
                  <th>{t('tarifas.colGrupo')}</th>
                  <th className="grp-tabla-derecha">{t('tarifas.colPersona')}</th>
                </tr>
              </thead>
              <tbody>
                {experiencias.map(exp => (
                  <tr key={exp.id}>
                    <td><b>{exp.nombre}</b></td>
                    <td>{exp.duracion}</td>
                    <td>{t('tarifas.personas', { min: 2, max: exp.capacidad })}</td>
                    <td className="grp-tabla-derecha grp-tabla-precio">
                      {formatPrecio(exp.precio, locale)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td><b>{t('tarifas.aMedida')}</b></td>
                  <td>{t('tarifas.aMedidaDuracion')}</td>
                  <td>{t('tarifas.aMedidaGrupo')}</td>
                  <td className="grp-tabla-derecha">
                    <a href="#cotizar" className="grp-tabla-enlace">{t('tarifas.cotizacion')}</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {(minimo || tarifaMenores || descuentoVolumen) && (
            <ul className="grp-notas">
              {minimo && <li>{t('tarifas.minimo', { valor: minimo })}</li>}
              {tarifaMenores && <li>{t('tarifas.menores', { valor: tarifaMenores })}</li>}
              {descuentoVolumen && <li>{t('tarifas.volumen', { valor: descuentoVolumen })}</li>}
            </ul>
          )}
          <p className="grp-card-nota">{t('tarifas.nota')}</p>
        </article>

        {/* ── Qué incluye y qué no ──
            La columna de la derecha es la más valiosa de la página y la que
            nadie publica. La hoja 19 del portafolio lo dice sin rodeos: si el
            colegio asume que hay almuerzo y no lo hay, la queja la recibe la
            finca. Publicarlo antes de la cotización cuesta una cotización
            perdida y ahorra una jornada arruinada. */}
        <article id="incluye" className="grp-card grp-card--ancha">
          <div className="grp-card-cabecera">
            <span className="grp-icono" aria-hidden="true">
              <Check size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="grp-card-titulo">{t('incluye.titulo')}</h2>
          </div>
          <p className="grp-card-texto">{t('incluye.texto')}</p>

          <div className="grp-dos-columnas">
            <div>
              <p className="grp-subtitulo">{t('incluye.siTitulo')}</p>
              <ul className="grp-checks-lista">
                {INCLUIDOS.map(k => (
                  <li key={k}>
                    <Check size={16} strokeWidth={2.4} aria-hidden="true" />
                    <span style={{ minWidth: 0 }}>{t(`incluye.${k}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="grp-subtitulo">{t('incluye.noTitulo')}</p>
              <ul className="grp-checks-lista grp-checks-lista--no">
                {EXCLUIDOS.map(k => (
                  <li key={k}>
                    <X size={16} strokeWidth={2.4} aria-hidden="true" />
                    <span style={{ minWidth: 0 }}>{t(`incluye.${k}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="grp-subtitulo">{t('incluye.extrasTitulo')}</p>
          <ul className="grp-marks">
            {EXTRAS.map(k => (
              <li key={k}>{t(`incluye.${k}`)}</li>
            ))}
          </ul>
        </article>

        {/* ── Transporte y logística ── */}
        <article id="logistica" className="grp-card grp-card--ancha">
          <div className="grp-card-cabecera">
            <span className="grp-icono" aria-hidden="true">
              <MapPin size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="grp-card-titulo">{t('logistica.titulo')}</h2>
          </div>
          <p className="grp-card-texto">{t('logistica.texto')}</p>

          <RutaTramos />

          <div className="grp-dos-columnas">
            <div>
              <p className="grp-subtitulo">{t('logistica.accesoTitulo')}</p>
              <ul className="grp-marks">
                {ACCESO.map(k => (
                  <li key={k}>{t.rich(`logistica.${k}`, { b: negrita })}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="grp-subtitulo">{t('logistica.terrenoTitulo')}</p>
              <ul className="grp-marks">
                {TERRENO.map(k => (
                  <li key={k}>{t.rich(`logistica.${k}`, { b: negrita })}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="grp-subtitulo">{t('logistica.llevarTitulo')}</p>
          <ul className="grp-llevar">
            {LLEVAR.map(k => (
              <li key={k}>
                <Check size={15} strokeWidth={2.4} aria-hidden="true" />
                <span style={{ minWidth: 0 }}>{t(`logistica.${k}`)}</span>
              </li>
            ))}
          </ul>
          <p className="grp-card-nota">{t('logistica.llevarNota')}</p>

          {/* Se oculta entero si el dato no existe: es la primera pregunta de un
              coordinador y hoy la finca no tiene respuesta escrita. Un texto
              inventado acá es una promesa que alguien va a cobrar. */}
          {transporte && (
            <div className="grp-aviso">
              <span className="grp-aviso-rotulo">{t('logistica.transporteTitulo')}</span>
              <span className="grp-aviso-texto">{transporte}</span>
            </div>
          )}

          <div className="grp-aviso">
            <span className="grp-aviso-rotulo">{t('logistica.sitioTitulo')}</span>
            <span className="grp-aviso-texto">{t('logistica.sitio')}</span>
          </div>

          <div className="grp-acciones">
            <a className="grp-boton" href={MAPA.rutas} target="_blank" rel="noopener noreferrer">
              {t('logistica.comoLlegar')}
              <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
            </a>
          </div>
        </article>

        {/* ── Menores, póliza y papeleo ──
            El bloque que un colegio exige por escrito antes de aprobar nada. El
            texto legal no se reformula: se resume y se enlaza a la política
            completa, que ya existe en /politicas/proteccion-infancia. */}
        <article id="menores" className="grp-card">
          <div className="grp-card-cabecera">
            <span className="grp-icono" aria-hidden="true">
              <ShieldCheck size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="grp-card-titulo">{t('menores.titulo')}</h2>
          </div>
          <p className="grp-card-texto">{t('menores.texto')}</p>

          <p className="grp-subtitulo">{t('menores.polizaTitulo')}</p>
          <p className="grp-card-texto">
            {t('menores.poliza')}
            {aseguradora && <> {aseguradora}</>}
          </p>

          <p className="grp-subtitulo">{t('menores.proteccionTitulo')}</p>
          <p className="grp-card-texto">{t('menores.proteccion')}</p>
          <p className="grp-card-nota">
            <Link href="/politicas/proteccion-infancia">{t('menores.proteccionEnlace')}</Link>
          </p>

          <p className="grp-subtitulo">{t('menores.autorizacionTitulo')}</p>
          <p className="grp-card-texto">{t('menores.autorizacion')}</p>
          <ul className="grp-marks">
            {AUTORIZACION.map(k => (
              <li key={k}>{t(`menores.${k}`)}</li>
            ))}
          </ul>

          <p className="grp-subtitulo">{t('menores.guiaTitulo')}</p>
          <p className="grp-card-texto">{t('menores.guia')}</p>

          {facturacion && (
            <>
              <p className="grp-subtitulo">{t('menores.facturacionTitulo')}</p>
              <p className="grp-card-texto">{facturacion}</p>
            </>
          )}

          {/* El portafolio ya existe y ya está publicado: es literalmente lo que
              un coordinador adjunta a una solicitud de aprobación interna. */}
          <div className="grp-aviso grp-aviso--pdf">
            <span className="grp-aviso-rotulo">
              <FileText size={15} strokeWidth={2} aria-hidden="true" />
              {t('menores.portafolioTitulo')}
            </span>
            <span className="grp-aviso-texto">{t('menores.portafolio')}</span>
            <a className="grp-boton grp-boton--fantasma" href="/portafolio" target="_blank" rel="noopener noreferrer">
              {t('menores.portafolioEnlace')}
              <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
            </a>
          </div>
        </article>

        {/* ── Cómo se reserva ── */}
        <article id="pasos" className="grp-card">
          <div className="grp-card-cabecera">
            <span className="grp-icono" aria-hidden="true">
              <Check size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="grp-card-titulo">{t('pasos.titulo')}</h2>
          </div>
          <ol className="grp-timeline">
            {PASOS.map((k, i) => (
              <li key={k} className="grp-paso">
                <span className="grp-paso-rotulo">{t(`pasos.paso${i + 1}Rotulo`)}</span>
                <span className="grp-paso-texto">{t(`pasos.${k}`)}</span>
              </li>
            ))}
          </ol>
          <p className="grp-card-nota">{t('pasos.anticipacion', { valor: anticipacion })}</p>
          <p className="grp-card-nota">
            <Link href="/politicas/cancelacion">{t('pasos.politicas')}</Link>
          </p>
        </article>

        {/* ── Preguntas frecuentes ──
            <details> nativo: funciona sin JavaScript y es accesible sin trabajo
            extra. Sin marcado FAQPage a propósito — desde 2023 Google reserva
            ese resultado enriquecido a sitios de gobierno y salud, así que el
            JSON-LD no traería nada. El bloque se queda porque contesta lo que
            este comprador pregunta y le ahorra un correo a la finca. */}
        <article id="faq" className="grp-card grp-card--ancha">
          <div className="grp-card-cabecera">
            <span className="grp-icono" aria-hidden="true">
              <FileText size={22} strokeWidth={1.85} color="var(--color-orange)" />
            </span>
            <h2 className="grp-card-titulo">{t('faq.titulo')}</h2>
          </div>
          <div className="grp-faq">
            {PREGUNTAS.map(n => (
              <details key={n} className="grp-faq-item">
                <summary>{t(`faq.p${n}`)}</summary>
                <p>{t(`faq.r${n}`)}</p>
              </details>
            ))}
          </div>
        </article>
      </div>

      {/* ── El formulario ── */}
      <div id="cotizar" className="grp-cotizar">
        <h2 className="grp-cotizar-titulo">{t('formulario.titulo')}</h2>
        <p className="grp-cotizar-texto">{t('formulario.texto')}</p>
        <FormularioGrupo />
      </div>

      {/* ── Agencias ──
          Bloque corto y no una cuarta pista: la conversación con una agencia es
          económica —tarifa neta, comisión— y no comparte casi nada con la de un
          colegio. Lleva al mismo formulario. */}
      <div className="grp-agencias">
        <h2 className="grp-agencias-titulo">{t('agencias.titulo')}</h2>
        <p className="grp-agencias-texto">{t('agencias.texto')}</p>
        {tarifaNeta && (
          <p className="grp-agencias-dato">{t('agencias.tarifaNeta', { valor: tarifaNeta })}</p>
        )}
        <a href="#cotizar" className="grp-boton grp-boton--fantasma">{t('agencias.cta')}</a>
      </div>

      {/* ── Cierre ── */}
      <div className="grp-cta">
        <h2 className="grp-cta-titulo">{t('cta.titulo')}</h2>
        <p className="grp-cta-texto">{t('cta.texto')}</p>
        <div className="grp-acciones grp-acciones--centrada">
          <a href="#cotizar" className="grp-boton">{t('cta.cotizar')}</a>
          <a
            className="grp-boton grp-boton--fantasma"
            href={whatsappCon(MENSAJE_WHATSAPP.contacto)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('cta.whatsapp')}
          </a>
        </div>
      </div>
    </section>
  )
}
