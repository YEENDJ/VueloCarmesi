'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'

interface Paso {
  numero: string
  titulo: string
  descripcion: string
  imagen: string
  alt: string
}

/* Las fotos de `experiencias/paso-*.jpg` documentan exactamente estas etapas y
   hasta ahora solo se usaban en el PDF del portafolio. La 01 no tiene paso
   propio —conservar variedades no es algo que el visitante haga en la visita—
   así que va con una foto del cacaotal. */
const PROCESO: Paso[] = [
  {
    numero: '01',
    titulo: 'Conservación del material genético',
    // FEAR5 y FSV41 se nombran aquí y en ningún otro sitio de la web: en la
    // portada no le dicen nada a nadie, pero en este paso el contexto ya es
    // técnico y son lo que separa «conservamos variedades» de una afirmación
    // que un cacaocultor puede verificar.
    descripcion:
      'Conservamos 12 variedades de cacao de la región —entre ellas FEAR5 y FSV41—, parte de la historia productiva de nuestro territorio.',
    imagen: '/images/cacao/mazorcas-en-arbol.jpg',
    alt: 'Mazorcas de cacao madurando en el árbol',
  },
  {
    numero: '02',
    titulo: 'Cosecha',
    descripcion:
      'Recolectamos a mano los frutos maduros y seleccionamos el cacao que va a nuestros procesos y experiencias.',
    imagen: '/images/experiencias/paso-1.jpg',
    alt: 'Visitantes cortando mazorcas maduras en el cultivo',
  },
  {
    numero: '03',
    titulo: 'Fermentación',
    descripcion:
      'Fermentamos el grano en cajones de madera, donde se desarrollan los aromas y sabores propios del cacao.',
    imagen: '/images/experiencias/paso-3.jpg',
    alt: 'Grano de cacao secándose en la marquesina',
  },
  {
    numero: '04',
    titulo: 'Transformación artesanal',
    descripcion:
      'Tostamos y molemos el grano para hacer chocolate artesanal, y los visitantes lo viven de cerca.',
    imagen: '/images/experiencias/paso-4.jpg',
    alt: 'Tostión del grano de cacao en paila sobre fogón de leña',
  },
]

export default function ProcesoLinea() {
  const reducir = useReducedMotion()

  /* El riel se dibuja de izquierda a derecha y los pasos van cayendo detrás,
     como si la línea los fuera dejando a su paso. Es a propósito el movimiento
     contrario al de la historia, que entra por los lados sobre un eje vertical:
     son dos secciones distintas y no deben leerse como la misma pieza. */
  const contenedor: Variants = {
    oculto: {},
    visible: {
      transition: { delayChildren: reducir ? 0 : 0.3, staggerChildren: reducir ? 0 : 0.14 },
    },
  }

  const paso: Variants = {
    oculto: reducir ? { opacity: 1 } : { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducir ? 0 : 0.55, ease: 'easeOut' },
    },
  }

  return (
    <div className="proceso-linea">
      <motion.div
        className="proceso-riel"
        aria-hidden
        initial={reducir ? { scaleX: 1 } : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: reducir ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="proceso-grid"
        variants={contenedor}
        initial="oculto"
        whileInView="visible"
        viewport={{ once: true, margin: '-15%' }}
      >
        {PROCESO.map((p) => (
          <motion.div key={p.numero} className="proceso-paso" variants={paso}>
            {/* El número es el nodo del riel: lo tapa con el fondo marrón en vez
                de dibujar un círculo encima. */}
            <div className="proceso-numero">{p.numero}</div>
            <h3 className="proceso-titulo">{p.titulo}</h3>
            <p className="proceso-texto">{p.descripcion}</p>
            <div className="proceso-foto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imagen} alt={p.alt} loading="lazy" decoding="async" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
