import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarX, ShieldCheck, type LucideIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Políticas · Vuelo Carmesí',
  description:
    'Políticas oficiales de la Finca Agroturística Vuelo Carmesí: protección de la niñez frente a la ESCNNA y condiciones de reserva y cancelación.',
}

type Politica = {
  href: string
  titulo: string
  resumen: string
  fuente: string
  Icono: LucideIcon
}

/**
 * Índice de políticas del prestador turístico. Cada tarjeta es un enlace a la
 * política completa; se agrega una entrada aquí conforme exista el texto.
 * PENDIENTE: cuando existan, se suman el tratamiento de datos personales
 * (Ley 1581 de 2012) y los términos y condiciones de la tienda.
 */
const POLITICAS: Politica[] = [
  {
    href: '/politicas/proteccion-infancia',
    titulo: 'Protección de la niñez',
    resumen:
      'Compromiso contra la Explotación Sexual Comercial de Niños, Niñas y Adolescentes (ESCNNA): requisitos de ingreso de menores, contenido de la autorización y derecho de admisión.',
    fuente: 'Ley 679 de 2001 · Ley 1336 de 2009',
    Icono: ShieldCheck,
  },
  {
    href: '/politicas/cancelacion',
    titulo: 'Cancelación de reservas',
    resumen:
      'Condiciones de reserva, pago y cancelación de las experiencias, con la escala de plazos y penalidades según la anticipación con la que canceles.',
    fuente: 'Reservas, cancelación y pagos',
    Icono: CalendarX,
  },
]

export default function PoliticasPage() {
  return (
    <section className="page-shell politicas">
      <h1 style={{ color: 'var(--color-brown)', marginBottom: '12px', minWidth: 0 }}>
        Políticas
      </h1>
      <p className="politica-fecha">
        Los textos oficiales que rigen la relación entre Vuelo Carmesí y sus visitantes.
      </p>

      <div className="politicas-grid">
        {POLITICAS.map(({ href, titulo, resumen, fuente, Icono }) => (
          <Link key={href} href={href} className="politicas-tarjeta">
            <span className="politicas-tarjeta-encabezado">
              <span className="politica-icono" aria-hidden="true">
                <Icono size={22} strokeWidth={1.85} color="var(--color-orange)" />
              </span>
              <span className="politicas-tarjeta-titulo">{titulo}</span>
              <ArrowRight
                size={20}
                strokeWidth={1.9}
                className="politicas-tarjeta-flecha"
                aria-hidden="true"
              />
            </span>
            <p className="politicas-tarjeta-resumen">{resumen}</p>
            <span className="politicas-tarjeta-fuente">{fuente}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}