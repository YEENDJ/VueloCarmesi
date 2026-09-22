'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface Paso {
  numero: string
  clave: string
  imagen: string
  /* Las medidas del archivo, que `next/image` necesita para reservar el hueco
     y para no generar anchos que no existen. Ninguna es 4:5 exacto. */
  ancho: number
  alto: number
}

/* Las fotos de `experiencias/paso-*.jpg` documentan exactamente estas etapas y
   hasta ahora solo se usaban en el PDF del portafolio. La 01 no tiene paso
   propio —conservar variedades no es algo que el visitante haga en la visita—
   así que va con una foto del cacaotal. */
const PROCESO: Paso[] = [
  {
    numero: '01',
    clave: 'genetico',
    // FEAR5 y FSV41 se nombran aquí y en ningún otro sitio de la web: en la
    // portada no le dicen nada a nadie, pero en este paso el contexto ya es
    // técnico y son lo que separa «conservamos variedades» de una afirmación
    // que un cacaocultor puede verificar.
    imagen: '/images/cacao/mazorcas-en-arbol.jpg',
    ancho: 1024,
    alto: 1280,
  },
  {
    numero: '02',
    clave: 'cosecha',
    imagen: '/images/experiencias/paso-1.jpg',
    ancho: 1035,
    alto: 1280,
  },
  {
    numero: '03',
    clave: 'fermentacion',
    imagen: '/images/experiencias/paso-3.jpg',
    ancho: 1043,
    alto: 1280,
  },
  {
    numero: '04',
    clave: 'transformacion',
    imagen: '/images/experiencias/paso-4.jpg',
    ancho: 1026,
    alto: 1280,
  },
]

export default function ProcesoLinea() {
  const t = useTranslations('nosotros.proceso')

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
            <h3 className="proceso-titulo">{t(`${p.clave}.titulo`)}</h3>
            <p className="proceso-texto">{t(`${p.clave}.texto`)}</p>
            <div className="proceso-foto">
              {/* Se sirve el JPEG de `public/` tal cual, sin pasar por el
                  optimizador del despliegue: recomprimido se notaba. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imagen}
                alt={t(`${p.clave}.alt`)}
                width={p.ancho}
                height={p.alto}
                loading="lazy"
                style={{ display: 'block', width: '100%', maxWidth: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
