'use client'

import { motion } from 'framer-motion'

interface Bloque {
  anyo: string
  etiqueta: string
  titulo: string
  texto: string[]
  imagen: string
  alt: string
  icono: string
}

const HISTORIA: Bloque[] = [
  {
    anyo: 'Hace 40 años',
    etiqueta: 'El origen',
    titulo: 'Todo comenzó con el cacao',
    texto: [
      'Nuestra historia comenzó mucho antes de que llegaran los primeros visitantes. Comenzó con el cacao.',
      'Desde hace cerca de 40 años, en estas tierras se cultiva cacao. Durante buena parte de ese tiempo eran cultivos tradicionales, con árboles híbridos, poco tecnificados y mezclados con café. Era una forma de producción aprendida con el tiempo, basada principalmente en el conocimiento y la experiencia de la familia.',
    ],
    imagen: '/images/cacao/cacaotal.jpg',
    alt: 'El cultivo de cacao, origen de todo',
    icono: '🌱',
  },
  {
    anyo: '2006',
    etiqueta: 'La transformación',
    titulo: 'Tecnificar el cultivo',
    texto: [
      'En 2006, comenzó una nueva etapa. Decidimos transformar la manera de producir: se eliminó el café que compartía espacio con el cacao y se inició un proceso de tecnificación del cultivo, incorporando variedades de cacao con mejores características productivas.',
    ],
    imagen: '/images/cacao/cacaotal-mazorcas-rojas.jpg',
    alt: 'Mazorcas rojas del cultivo de cacao tecnificado',
    icono: '🔧',
  },
  {
    anyo: 'Años de aprendizaje',
    etiqueta: 'La vida rural',
    titulo: 'El campo nos enseñaba',
    texto: [
      'Fueron años de aprendizaje, de trabajo y de entender cada vez mejor el cultivo. Pero la finca no solo nos enseñaba sobre cacao. También nos mostraba todo aquello que hacía especial la vida rural: los animales, los paisajes, los sonidos de la naturaleza, las labores del campo y las historias que forman parte de nuestra tradición campesina.',
    ],
    imagen: '/images/aves/tangara-azul.jpg',
    alt: 'La naturaleza que acompaña la finca',
    icono: '🦜',
  },
  {
    anyo: '2020',
    etiqueta: 'La pausa',
    titulo: 'Detenernos a mirar',
    texto: [
      'Y entonces llegó 2020. La pandemia nos obligó a detenernos y mirar nuestro entorno de una manera diferente. Nos hizo pensar que todo aquello que durante años habíamos considerado parte de nuestra vida cotidiana podía convertirse también en una experiencia para compartir con otras personas.',
    ],
    imagen: '',
    alt: '',
    icono: '🕰️',
  },
  {
    anyo: 'Desde 2012',
    etiqueta: 'Un nuevo camino',
    titulo: 'La experiencia que encontró su lugar',
    texto: [
      'Cristian, uno de los fundadores, ya tenía experiencia en turismo desde 2012, principalmente en el turismo de aventura. Después de la pandemia, esa experiencia encontró un nuevo camino: llevar el turismo a la finca y convertir el campo, el cacao y la naturaleza en una experiencia cercana, auténtica y familiar.',
    ],
    imagen: '/images/personas/equipo-cacao.jpg',
    alt: 'Cristian y el equipo en el cultivo de cacao',
    icono: '🥾',
  },
  {
    anyo: 'El proyecto',
    etiqueta: 'La idea que tomó forma',
    titulo: 'Nace una idea sencilla',
    texto: [
      'Así nació la idea de crear un proyecto turístico que permitiera mostrar las bondades del campo, acercar a los visitantes a la tradición campesina y contar la historia del cacao desde su cultivo hasta su transformación artesanal.',
    ],
    imagen: '/images/personas/familia.jpg',
    alt: 'La familia que dio origen al proyecto',
    icono: '💡',
  },
  {
    anyo: '2021',
    etiqueta: 'Abrimos las puertas',
    titulo: 'Nace Vuelo Carmesí',
    texto: [
      'En 2021 abrimos las puertas de Vuelo Carmesí. Lo que comenzó como una finca familiar productora de cacao empezó a convertirse también en un espacio para recibir, enseñar, compartir y conectar.',
    ],
    imagen: '/images/personas/grupo-mural.jpg',
    alt: 'Visitantes compartiendo en la finca',
    icono: '🚪',
  },
  {
    anyo: 'Hoy',
    etiqueta: 'Nuestro presente',
    titulo: 'Una historia abierta al mundo',
    texto: [
      'Desde entonces, hemos ido construyendo una propuesta que une cacao, agroecología, naturaleza, cultura campesina y turismo, sin dejar de lado aquello que nos dio origen: la tierra y el trabajo de nuestra familia.',
      'Vuelo Carmesí no nació de la idea de crear una experiencia turística. Nació de una historia que ya existía y que decidimos abrirle las puertas al mundo. Hoy queremos que cada persona que nos visita pueda conocer esa historia, caminarla, sentirla y llevarse consigo un pedacito de la vida del campo.',
    ],
    imagen: '',
    alt: '',
    icono: '❤️',
  },
]

function BloqueImagen({ bloque }: { bloque: Bloque }) {
  if (!bloque.imagen) {
    return (
      <div className="historia-media historia-media-sin-foto">
        <span className="historia-sin-foto-icono">{bloque.icono}</span>
        <span className="historia-sin-foto-texto">{bloque.etiqueta}</span>
      </div>
    )
  }

  return (
    <div
      className="historia-media"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bloque.imagen})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(135,43,19,0) 40%, rgba(135,43,19,.55))',
        }}
      />
      <span
        style={{
          position: 'relative',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '11px',
          letterSpacing: '1px',
          color: 'var(--color-cream)',
          textTransform: 'uppercase',
          padding: '6px 12px',
          marginBottom: '14px',
          borderRadius: '999px',
          backgroundColor: 'rgba(135,43,19,.55)',
          backdropFilter: 'blur(2px)',
        }}
      >
        {bloque.alt}
      </span>
    </div>
  )
}

export default function HistoriaTimeline() {
  return (
    <div className="historia-timeline">
      {HISTORIA.map((bloque, i) => {
        const invertido = i % 2 === 1
        return (
          <div key={`${bloque.anyo}-${i}`} className="historia-item">
            <div className="historia-linea" />

            <motion.div
              className="historia-nodo"
              initial={{ scale: 0, rotate: -45 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true, margin: '-20%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <span>{bloque.icono}</span>
            </motion.div>

            <div className={invertido ? 'historia-bloque historia-bloque-invertido' : 'historia-bloque'}>
              <motion.div
                className="historia-carta"
                initial={{ opacity: 0, x: invertido ? -60 : 60, y: 40 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: '-15%' }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <div className="historia-cabecera">
                  <span className="historia-anyo">{bloque.anyo}</span>
                  <span className="historia-etiqueta">{bloque.etiqueta}</span>
                </div>
                <h3>{bloque.titulo}</h3>
                {bloque.texto.map((t, j) => (
                  <p key={j}>{t}</p>
                ))}
              </motion.div>

              <motion.div
                className="historia-imagen"
                initial={{ opacity: 0, x: invertido ? 60 : -60, y: 40 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: '-15%' }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
              >
                <BloqueImagen bloque={bloque} />
              </motion.div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
