'use client'
import { createContext, useContext, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { formatPrecio } from '@/lib/format'
import { calcularAbono, type ConfigPagos } from '@/lib/pagos'

/**
 * Cuántas personas eligió el formulario, para la tarjeta de «Estás reservando».
 *
 * La tarjeta y el formulario son hermanos en una página de servidor: sin esto
 * el total solo se veía al final del formulario, y en móvil eso queda varias
 * pantallas por debajo de donde se elige.
 */
const PersonasContext = createContext<[number, (n: number) => void]>([1, () => {}])

export function ReservaPersonasProvider({ children }: { children: React.ReactNode }) {
  const estado = useState(1)
  return <PersonasContext.Provider value={estado}>{children}</PersonasContext.Provider>
}

export function usePersonasReserva() {
  return useContext(PersonasContext)
}

/**
 * El desglose de la tarifa: precio × personas, total y, con cobro en línea, lo
 * que se paga hoy y el saldo. Se recalcula al cambiar el selector del formulario.
 */
export function ResumenReservaVivo({ precio, pagos }: { precio: number; pagos: ConfigPagos }) {
  const t = useTranslations('reserva.pago')
  const idioma = useLocale()
  const [personas] = usePersonasReserva()
  const total = precio * personas
  // Mismo cálculo que el formulario y el backend: mismo porcentaje, mismo redondeo.
  const abono = calcularAbono(total, pagos.porcentajeAbono)
  const cobra = pagos.activo && abono > 0

  // El desglose ya da el total («$80.000 × 4 personas … $320.000»). Con cobro
  // en línea lo que se destaca es lo de hoy; sin él, el total.
  const filas = [
    { id: 'desglose', rotulo: t('desglose', { precio: formatPrecio(precio, idioma), n: personas }), valor: total, estilo: 'normal' },
    ...(cobra ? [
      { id: 'hoy', rotulo: t('hoy', { porcentaje: pagos.porcentajeAbono }), valor: abono, estilo: 'fuerte' },
      { id: 'saldo', rotulo: t('saldo'), valor: total - abono, estilo: 'tenue' },
    ] : [
      { id: 'total', rotulo: t('total', { n: personas }), valor: total, estilo: 'fuerte' },
    ]),
  ] as const

  return (
    <div
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        margin: '0 0 20px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(253,195,0,.3)',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-cream)',
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--color-gold)' }}>
        {t('titulo')}
      </p>
      {filas.map(f => (
        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
          <span style={{
            minWidth: 0, fontSize: '15px', fontWeight: f.estilo === 'fuerte' ? 700 : 400,
            color: f.estilo === 'tenue' ? 'rgba(255,234,202,.75)' : 'inherit',
          }}>
            {f.rotulo}
          </span>
          <span style={{
            flex: 'none', fontWeight: 700,
            fontSize: f.estilo === 'fuerte' ? '22px' : '15px',
            color: f.estilo === 'fuerte' ? 'var(--color-gold)' : f.estilo === 'tenue' ? 'rgba(255,234,202,.75)' : 'inherit',
          }}>
            {formatPrecio(f.valor, idioma)}
          </span>
        </div>
      ))}
    </div>
  )
}
