'use client'
import { useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CreditCard } from 'lucide-react'
import { formatPrecio } from '@/lib/format'

/**
 * El aviso antes de ir a la pasarela: a dónde lo llevamos, cuánto paga ahora
 * (el abono) y cuánto queda para el día de la actividad. Se abre antes de crear
 * la reserva, así que «Cancelar» no deja nada apartado.
 *
 * Las cifras llegan calculadas por el formulario, con el mismo redondeo que el
 * backend (lib/pagos.ts → calcularAbono).
 */
export default function ModalPago({
  total, abono, porcentaje, personas, onContinuar, onCancelar,
}: {
  total: number
  abono: number
  porcentaje: number
  personas: number
  onContinuar: () => void
  onCancelar: () => void
}) {
  const t = useTranslations('reserva.pago')
  const idioma = useLocale()
  const continuar = useRef<HTMLButtonElement>(null)

  // El foco entra al modal (en la acción principal) y Escape lo cierra, como
  // cualquier diálogo; al cerrarse, el navegador lo devuelve al botón de enviar.
  useEffect(() => {
    continuar.current?.focus()
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancelar() }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [onCancelar])

  return (
    <div className="modal-pago-fondo" onClick={onCancelar}>
      <div
        className="modal-pago"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-pago-titulo"
        aria-describedby="modal-pago-texto"
        onClick={e => e.stopPropagation()}
      >
        <span className="modal-pago-icono" aria-hidden="true"><CreditCard size={26} strokeWidth={2.25} /></span>
        <h2 id="modal-pago-titulo" className="modal-pago-titulo">{t('modal.titulo')}</h2>
        <p id="modal-pago-texto" className="modal-pago-texto">{t('modal.texto')}</p>

        <dl className="modal-pago-cifras">
          <div className="modal-pago-fila modal-pago-fila--ahora">
            <dt>{t('modal.ahora', { porcentaje })}</dt>
            <dd>{formatPrecio(abono, idioma)}</dd>
          </div>
          <div className="modal-pago-fila">
            <dt>
              {t('modal.pendiente', { porcentaje: 100 - porcentaje })}
              <span className="modal-pago-nota">{t('modal.pendienteNota')}</span>
            </dt>
            <dd>{formatPrecio(total - abono, idioma)}</dd>
          </div>
          <div className="modal-pago-fila modal-pago-fila--total">
            <dt>{t('total', { n: personas })}</dt>
            <dd>{formatPrecio(total, idioma)}</dd>
          </div>
        </dl>

        <div className="modal-pago-acciones">
          <button type="button" className="modal-pago-cancelar" onClick={onCancelar}>
            {t('modal.cancelar')}
          </button>
          <button type="button" ref={continuar} className="modal-pago-continuar" onClick={onContinuar}>
            {t('modal.continuar')} · {formatPrecio(abono, idioma)}
          </button>
        </div>
      </div>
    </div>
  )
}
