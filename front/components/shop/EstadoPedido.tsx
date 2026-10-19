'use client'
import { useEffect, useState } from 'react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import Button from '@/components/ui/Button'
import { formatPrecio } from '@/lib/format'
import { whatsappCon } from '@/lib/contacto'
import { ErrorConsulta, obtenerPedido, type EstadoPedido as Estado, type PedidoPublico } from '@/lib/pedidos'

/** Los pasos del avance. Cancelado y expirado no tienen avance que mostrar. */
const PASOS = ['recibido', 'pagado', 'enviado', 'entregado'] as const

const PASO_DE: Partial<Record<Estado, number>> = {
  pendiente: 0,
  pendiente_pago: 0,
  pagado: 1,
  requiere_revision: 1,
  enviado: 2,
  entregado: 3,
}

type Carga = { tipo: 'cargando' } | { tipo: 'listo'; pedido: PedidoPublico } | { tipo: 'noEncontrado' } | { tipo: 'error' }

/**
 * «Mi pedido»: cómo va una compra, sin cuenta. Se llega con el enlace del
 * correo, desde el carrito vacío (último pedido de este navegador) o
 * consultando con código y correo.
 */
export default function EstadoPedido({ token }: { token: string }) {
  const t = useTranslations('miPedido')
  const tw = useTranslations('whatsapp')
  const idioma = useLocale()
  const formato = useFormatter()

  const [carga, setCarga] = useState<Carga>({ tipo: 'cargando' })
  // Cada intento es un número más: «Volver a intentar» lo sube y el efecto
  // vuelve a pedir, sin llamar a setState dentro del efecto en cada render.
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    obtenerPedido(token)
      .then(pedido => { if (vigente) setCarga({ tipo: 'listo', pedido }) })
      .catch(err => {
        if (!vigente) return
        setCarga(err instanceof ErrorConsulta && err.status === 404 ? { tipo: 'noEncontrado' } : { tipo: 'error' })
      })
    return () => { vigente = false }
  }, [token, intento])

  if (carga.tipo === 'cargando') {
    return (
      <section className="page-shell pedido-estado">
        <p role="status" className="pedido-cargando">{t('cargando')}</p>
      </section>
    )
  }

  if (carga.tipo !== 'listo') {
    const noEncontrado = carga.tipo === 'noEncontrado'
    return (
      <section className="page-shell pedido-estado">
        <h1 className="cart-titulo">{noEncontrado ? t('noEncontradoTitulo') : t('errorRed')}</h1>
        {noEncontrado && <p className="pedido-consulta-texto">{t('noEncontradoTexto')}</p>}
        <div className="pedido-acciones">
          {noEncontrado
            ? <Button href="/mi-pedido" style={{ minHeight: 44 }}>{t('buscarOtro')}</Button>
            : <Button onClick={() => { setCarga({ tipo: 'cargando' }); setIntento(n => n + 1) }} style={{ minHeight: 44 }}>{t('reintentar')}</Button>}
        </div>
      </section>
    )
  }

  const { pedido } = carga
  const paso = PASO_DE[pedido.estado]
  const esperaPago = pedido.estado === 'pendiente_pago' && pedido.venceEn && new Date(pedido.venceEn) > new Date()
  const estadoTexto = t(`estados.${pedido.estado}.texto`, {
    hora: pedido.venceEn
      ? formato.dateTime(new Date(pedido.venceEn), { hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' })
      : '',
  })

  return (
    <section className="page-shell pedido-estado">
      <h1 className="cart-titulo">{t('titulo', { codigo: pedido.codigo })}</h1>
      <p className="pedido-fecha">
        {t('hecho', {
          fecha: formato.dateTime(new Date(pedido.creadoEn), {
            day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
            timeZone: 'America/Bogota',
          }),
        })}
      </p>

      <div className="pedido-tarjeta">
        {/* aria-live: si el cliente vuelve a cargar tras pagar, el lector de
            pantalla anuncia el estado nuevo. */}
        <div aria-live="polite">
          <h2 className={`pedido-estado-titulo pedido-estado-titulo--${pedido.estado}`}>
            {t(`estados.${pedido.estado}.titulo`)}
          </h2>
          <p className="pedido-estado-texto">{estadoTexto}</p>
        </div>

        {paso !== undefined && (
          <ol className="pedido-pasos" aria-label={t('progreso')}>
            {PASOS.map((clave, i) => (
              <li
                key={clave}
                className="pedido-paso"
                data-hecho={i <= paso}
                aria-current={i === paso ? 'step' : undefined}
              >
                <span className="pedido-paso-punto" aria-hidden="true">
                  {i <= paso && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="pedido-paso-rotulo">
                  {t(`pasos.${clave}`)}
                  {i === paso && <span className="solo-lectores"> ({t('pasoActual')})</span>}
                </span>
              </li>
            ))}
          </ol>
        )}

        {/* Esperando pago y aún a tiempo: la página de resultado ya sabe
            mostrar un pago en curso con el banco o reintentar uno rechazado. */}
        {esperaPago && pedido.referenciaPago && (
          <Button
            href={{ pathname: '/checkout/resultado', query: { ref: pedido.referenciaPago } }}
            style={{ minHeight: 48, width: '100%', borderRadius: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {t('irAPagar')}
          </Button>
        )}
      </div>

      <div className="pedido-tarjeta">
        <h2 className="cart-resumen-titulo">{t('productos')}</h2>
        <div className="checkout-lista">
          <ul className="checkout-items">
            {pedido.items.map(item => (
              <li key={item.slug} className="checkout-item">
                <span className="checkout-item-media">
                  {/* alt vacío: el nombre está escrito al lado. */}
                  {item.imagen
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.imagen} alt="" width={96} height={96} loading="lazy" decoding="async" />
                    : <span aria-hidden="true">🍫</span>}
                </span>
                <span className="checkout-item-info">
                  <span className="checkout-item-nombre">{item.nombre}</span>
                  <span className="checkout-item-detalle">
                    {t('cantidadPorPrecio', { q: item.cantidad, precio: formatPrecio(item.precio, idioma) })}
                  </span>
                </span>
                <span className="checkout-item-total">{formatPrecio(item.precio * item.cantidad, idioma)}</span>
              </li>
            ))}
          </ul>
          <div className="cart-resumen-total">
            <span>{t('total')}</span>
            <span className="cart-resumen-cifra">{formatPrecio(pedido.total, idioma)}</span>
          </div>
        </div>
      </div>

      <p className="pedido-consulta-ayuda">
        {t.rich('ayuda', {
          codigo: pedido.codigo,
          whatsapp: texto => (
            <a href={whatsappCon(tw('pedido', { codigo: pedido.codigo }))} target="_blank" rel="noopener noreferrer">{texto}</a>
          ),
        })}
      </p>
      <Link href="/tienda" className="checkout-editar pedido-consulta-volver">{t('volverTienda')}</Link>
    </section>
  )
}
