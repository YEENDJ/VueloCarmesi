'use client'
import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { formatPrecio } from '@/lib/format'

interface Props {
  nombre: string
  imagenes: string[]
  duracion: string
  capacidad: number
  precio: number
  slug: string
  /** Resumen de la política, de Configuración. Vacío = no se muestra la línea. */
  avisoCancelacion?: string
}

function Punto() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-gold)',
        flexShrink: 0,
      }}
    />
  )
}

/**
 * Portada de la ficha de experiencia: la foto ocupa la pantalla, el velo la
 * oscurece hacia abajo y encima flotan el título, los datos duros y la tarjeta
 * de precio. La tira de miniaturas cambia la foto de portada, así que vive aquí
 * y no en un componente aparte.
 */
export default function HeroExperiencia({
  nombre, imagenes, duracion, capacidad, precio, slug, avisoCancelacion,
}: Props) {
  const [activa, setActiva] = useState(0)
  const portada = imagenes[activa]

  return (
    <>
      <div className="ficha-exp-hero">
        {portada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portada}
            alt={nombre}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--color-brown)' }} />
        )}
        <div className="ficha-exp-velo" />

        <div className="ficha-exp-hero-contenido">
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vw, 20px)' }}>
            <span className="ficha-eyebrow" style={{ color: 'var(--color-gold)' }}>
              Vuelo Carmesí · Experiencia
            </span>

            <h1 className="ficha-exp-titulo">{nombre}</h1>

            <div className="ficha-exp-datos">
              <span style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)', color: 'rgba(255,234,202,0.88)' }}>
                <Punto />{duracion}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, fontSize: 'clamp(0.85rem, 2.2vw, 0.95rem)', color: 'rgba(255,234,202,0.88)' }}>
                <Punto />Hasta {capacidad} personas
              </span>
            </div>
          </div>

          <div className="ficha-exp-precio-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <span className="ficha-eyebrow" style={{ color: 'rgba(135,43,19,0.55)' }}>Desde</span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(30px, 5vw, 42px)',
                  fontWeight: 700,
                  color: 'var(--color-brown)',
                  lineHeight: 1,
                  overflowWrap: 'anywhere',
                }}
              >
                {formatPrecio(precio)}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'rgba(135,43,19,0.65)' }}>por persona</span>
            </div>
            <Button href={`/reservar/${slug}`} style={{ display: 'block', textAlign: 'center', width: '100%' }}>
              Reservar ahora
            </Button>
            {/* La duda sobre cancelar aparece justo aquí, en el momento de
                decidir. Resolverla en una línea evita que el visitante tenga
                que irse de la página a buscarla. */}
            {avisoCancelacion && (
              <p style={{
                margin: 0, fontSize: '0.8rem', lineHeight: 1.5,
                color: 'rgba(135,43,19,0.7)', minWidth: 0, overflowWrap: 'anywhere',
              }}>
                {avisoCancelacion}{' '}
                <Link
                  href="/politicas/cancelacion"
                  style={{ color: 'var(--color-crimson)', fontWeight: 700, textDecoration: 'underline' }}
                >
                  Ver política
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {imagenes.length > 1 && (
        <div className="ficha-exp-tira">
          {imagenes.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiva(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === activa}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  opacity: i === activa ? 1 : 0.5,
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  boxSizing: 'border-box',
                  border: i === activa ? '3px solid var(--color-gold)' : '3px solid transparent',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </>
  )
}
