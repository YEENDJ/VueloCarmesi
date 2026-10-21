import { ETIQUETA_ESTADO, type OpcionEstado } from '@/lib/admin/transiciones'

/**
 * Por qué hay opciones desactivadas: «Pagado y Cancelado: hay un pago en curso…».
 * Las que comparten motivo van juntas, para no repetir la misma frase.
 */
export function BloqueosEstado({ opciones }: { opciones: OpcionEstado[] }) {
  const porMotivo = new Map<string, string[]>()
  for (const o of opciones) {
    if (o.bloqueo) porMotivo.set(o.bloqueo, [...(porMotivo.get(o.bloqueo) ?? []), ETIQUETA_ESTADO[o.destino]])
  }
  if (porMotivo.size === 0) return null
  return (
    <div role="note" style={{ width: '100%', fontSize: 13, color: 'var(--admin-text-muted)', lineHeight: 1.45 }}>
      {[...porMotivo].map(([motivo, estados]) => (
        <p key={motivo} style={{ margin: '0 0 6px' }}>
          <strong style={{ color: 'var(--admin-text)' }}>{estados.join(' y ')}</strong>: {motivo}.
        </p>
      ))}
    </div>
  )
}
