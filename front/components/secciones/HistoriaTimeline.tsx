'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface Bloque {
  /** Clave dentro de `historia`: año, etiqueta, título, alt y párrafos. */
  clave: string
  imagen: string
  icono: string
  /** Cuántos párrafos tiene: t1, t2, … en el catálogo. */
  parrafos: number
}

// La foto y el icono no son idioma; el resto sale del catálogo.
const HISTORIA: Bloque[] = [
  { clave: 'origen', imagen: '/images/cacao/cacaotal.jpg', icono: '🌱', parrafos: 2 },
  { clave: 'tecnificacion', imagen: '/images/cacao/cacaotal-mazorcas-rojas.jpg', icono: '🔧', parrafos: 1 },
  { clave: 'aprendizaje', imagen: '/images/aves/tangara-azul.jpg', icono: '🦜', parrafos: 1 },
  { clave: 'pausa', imagen: '', icono: '🕰️', parrafos: 1 },
  { clave: 'camino', imagen: '/images/personas/equipo-cacao.jpg', icono: '🥾', parrafos: 1 },
  { clave: 'idea', imagen: '/images/personas/familia.jpg', icono: '💡', parrafos: 1 },
  { clave: 'apertura', imagen: '/images/personas/grupo-mural.jpg', icono: '🚪', parrafos: 1 },
  { clave: 'hoy', imagen: '', icono: '❤️', parrafos: 2 },
]

function BloqueImagen({ bloque }: { bloque: Bloque }) {
  const t = useTranslations('historia')

  if (!bloque.imagen) {
    return (
      <div className="historia-media historia-media-sin-foto">
        <span className="historia-sin-foto-icono">{bloque.icono}</span>
        <span className="historia-sin-foto-texto">{t(`${bloque.clave}.etiqueta`)}</span>
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
        {t(`${bloque.clave}.alt`)}
      </span>
    </div>
  )
}

export default function HistoriaTimeline() {
  const t = useTranslations('historia')

  return (
    <div className="historia-timeline">
      {HISTORIA.map((bloque, i) => {
        const invertido = i % 2 === 1
        return (
          <div key={`${t(`${bloque.clave}.anyo`)}-${i}`} className="historia-item">
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
                  <span className="historia-anyo">{t(`${bloque.clave}.anyo`)}</span>
                  <span className="historia-etiqueta">{t(`${bloque.clave}.etiqueta`)}</span>
                </div>
                <h3>{t(`${bloque.clave}.titulo`)}</h3>
                {Array.from({ length: bloque.parrafos }, (_, j) => (
                  <p key={j}>{t(`${bloque.clave}.t${j + 1}`)}</p>
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
