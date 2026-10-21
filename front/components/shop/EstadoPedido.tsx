'use client'
import { useEffect, useState } from 'react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import {
  Check, CircleX, Clock, CreditCard, MessageCircle, PackageCheck, Receipt, ScanSearch,
  SearchX, TimerOff, Truck, WifiOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import Button from '@/components/ui/Button'
import { formatPrecio } from '@/lib/format'
import { whatsappCon } from '@/lib/contacto'
import { CopiarCodigo, Esqueleto } from './SeguimientoPartes'
import BotonPagar from '@/components/pagos/BotonPagar'
import { ErrorConsulta, obtenerPedido, type EstadoPedido as Estado, type PedidoPublico } from '@/lib/pedidos'

/** Los pasos del avance, con su icono. Cancelado y expirado no tienen avance que mostrar. */
const PASOS = [
  { clave: 'recibido', Icono: Receipt },
  { clave: 'pagado', Icono: CreditCard },
  { clave: 'enviado', Icono: Truck },
  { clave: 'entregado', Icono: PackageCheck },
] as const

const PASO_DE: Partial<Record<Estado, number>> = {
  pendiente: 0,
  pendiente_pago: 0,
  pagado: 1,
  requiere_revision: 1,
  enviado: 2,
  entregado: 3,
}

/**
 * Icono y tono de la tarjeta de estado. El tono es una clase de CSS
 * (.pedido-tono--<tono>, en la portada) con los colores de estado del sitio: ámbar lo que
 * espera, verde lo que avanzó, azul lo que va en camino, apagado lo que cerró.
 */
const ASPECTO: Record<Estado, { Icono: LucideIcon; tono: 'espera' | 'avance' | 'camino' | 'listo' | 'revision' | 'cerrado' }> = {
  pendiente: { Icono: Receipt, tono: 'espera' },
  pendiente_pago: { Icono: Clock, tono: 'espera' },
  pagado: { Icono: CreditCard, tono: 'avance' },
  requiere_revision: { Icono: ScanSearch, tono: 'revision' },
  enviado: { Icono: Truck, tono: 'camino' },
  entregado: { Icono: PackageCheck, tono: 'listo' },
  cancelado: { Icono: CircleX, tono: 'cerrado' },
  expirado: { Icono: TimerOff, tono: 'cerrado' },
}

type Carga = { tipo: 'cargando' } | { tipo: 'listo'; pedido: PedidoPublico } | { tipo: 'noEncontrado' } | { tipo: 'error' }

/**
 * «Mi pedido»: cómo va una compra, sin cuenta. Se llega con el enlace del
 * correo, desde el carrito vacío (último pedido de este navegador), desde la
 * confirmación o el resultado del pago, o consultando con código y correo.
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

  if (carga.tipo === 'cargando') return <Esqueleto texto={t('cargando')} />

  if (carga.tipo !== 'listo') {
    const noEncontrado = carga.tipo === 'noEncontrado'
    const Icono = noEncontrado ? SearchX : WifiOff
    return (
      <section className="page-shell pedido">
        <div className="pedido-vacio">
          <span className="pedido-disco pedido-disco--grande" aria-hidden="true"><Icono size={32} strokeWidth={2.25} /></span>
          <h1 className="pedido-vacio-titulo">{noEncontrado ? t('noEncontradoTitulo') : t('errorRed')}</h1>
          {noEncontrado && <p className="pedido-vacio-texto">{t('noEncontradoTexto')}</p>}
          <div className="pedido-acciones">
            {noEncontrado
              ? <Button href="/mi-pedido" style={{ minHeight: 44 }}>{t('buscarOtro')}</Button>
              : <Button onClick={() => { setCarga({ tipo: 'cargando' }); setIntento(n => n + 1) }} style={{ minHeight: 44 }}>{t('reintentar')}</Button>}
            <Button href="/tienda" variant="outline" style={{ minHeight: 44 }}>{t('volverTienda')}</Button>
          </div>
        </div>
      </section>
    )
  }

  const { pedido } = carga
  const paso = PASO_DE[pedido.estado]
  const { Icono: IconoEstado, tono } = ASPECTO[pedido.estado]
  const esperaPago = pedido.estado === 'pendiente_pago' && pedido.venceEn && new Date(pedido.venceEn) > new Date()
  const unidades = pedido.items.reduce((n, i) => n + i.cantidad, 0)
  const estadoTexto = t(`estados.${pedido.estado}.texto`, {
    hora: pedido.venceEn
      ? formato.dateTime(new Date(pedido.venceEn), { hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' })
      : '',
  })
  const fecha = formato.dateTime(new Date(pedido.creadoEn), {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota',
  })

  return (
    <section className="page-shell pedido">
      {/* La portada del pedido: cuál es, cómo va y su avance, en un solo bloque.
          Es lo que se viene a ver; lo de abajo es el detalle. El tono (borde de
          arriba y recuadro del estado) dice de un vistazo si espera, avanzó o cerró. */}
      <div className={`pedido-portada pedido-tono--${tono}`}>
        <div className="pedido-portada-fila">
          <header className="pedido-cabecera">
            <p className="pedido-antetitulo">{t('antetitulo')}</p>
            <h1 className="pedido-titulo">{t('titulo', { codigo: pedido.codigo })}</h1>
            <p className="pedido-fecha">
              {t('hecho', {
                fecha: formato.dateTime(new Date(pedido.creadoEn), {
                  day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
                  timeZone: 'America/Bogota',
                }),
              })}
            </p>
          </header>

          {/* aria-live: si el cliente vuelve a cargar tras pagar, el lector de
              pantalla anuncia el estado nuevo. */}
          <div className="pedido-estado" aria-live="polite">
            <span className="pedido-disco pedido-disco--grande" aria-hidden="true">
              <IconoEstado size={30} strokeWidth={2.25} />
            </span>
            <div className="pedido-estado-cuerpo">
              <h2 className="pedido-estado-titulo">{t(`estados.${pedido.estado}.titulo`)}</h2>
              <p className="pedido-estado-texto">{estadoTexto}</p>
              {/* Esperando pago y aún a tiempo: abre un intento nuevo y va a la
                  pasarela. Si el banco ya tiene uno en curso, se espera: otro
                  intento podría terminar en un cobro doble. */}
              {esperaPago && pedido.pagoEnCurso && (
                <p className="pedido-estado-texto" style={{ marginTop: '0.75rem', fontWeight: 700 }}>{t('pagoEnCurso')}</p>
              )}
              {esperaPago && !pedido.pagoEnCurso && pedido.referenciaPago && (
                <BotonPagar referencia={pedido.referenciaPago} tipo="pedido">{t('irAPagar')}</BotonPagar>
              )}
            </div>
          </div>
        </div>

        {paso !== undefined && (
          <section className="pedido-portada-avance" aria-labelledby="pedido-avance-titulo">
            <h2 id="pedido-avance-titulo" className="pedido-portada-avance-titulo">{t('progreso')}</h2>
            <ol className="pedido-pasos">
              {PASOS.map(({ clave, Icono }, i) => {
                const estado = i < paso ? 'hecho' : i === paso ? 'actual' : 'pendiente'
                // Solo los pasos alcanzados, y si hay registro: un pedido viejo no
                // sabe cuándo se envió, y una hora inventada sería peor que ninguna.
                const cuando = estado !== 'pendiente' ? pedido.fechas?.[clave] : null
                return (
                  <li
                    key={clave}
                    className={`pedido-paso pedido-paso--${estado}`}
                    aria-current={estado === 'actual' ? 'step' : undefined}
                  >
                    <span className="pedido-paso-disco" aria-hidden="true">
                      {estado === 'hecho' ? <Check size={20} strokeWidth={3} /> : <Icono size={20} strokeWidth={2.25} />}
                    </span>
                    <span className="pedido-paso-texto">
                      <span className="pedido-paso-rotulo">
                        {t(`pasos.${clave}`)}
                        {estado !== 'pendiente' && (
                          <span className="solo-lectores"> ({estado === 'actual' ? t('pasoActual') : t('pasoHecho')})</span>
                        )}
                      </span>
                      <span className="pedido-paso-detalle">{t(`pasosDetalle.${clave}`)}</span>
                      {cuando && (
                        <time className="pedido-paso-fecha" dateTime={cuando}>
                          {formato.dateTime(new Date(cuando), {
                            day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota',
                          })}
                        </time>
                      )}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>
        )}
      </div>

      <div className="pedido-rejilla">
        <section className="pedido-tarjeta pedido-resumen" aria-labelledby="pedido-resumen-titulo">
          <h2 id="pedido-resumen-titulo" className="pedido-tarjeta-titulo">{t('resumen')}</h2>
          <dl className="pedido-datos">
            <div className="pedido-dato">
              <dt>{t('resumenCodigo')}</dt>
              <dd className="pedido-dato-codigo">
                <span>{pedido.codigo}</span>
                <CopiarCodigo codigo={pedido.codigo} etiqueta={t('copiar')} copiadoTexto={t('copiado')} />
              </dd>
            </div>
            <div className="pedido-dato">
              <dt>{t('resumenFecha')}</dt>
              <dd>{fecha}</dd>
            </div>
            <div className="pedido-dato">
              <dt>{t('resumenProductos')}</dt>
              <dd>{t('unidades', { n: unidades })}</dd>
            </div>
            <div className="pedido-dato pedido-dato--total">
              <dt>{t('total')}</dt>
              <dd>{formatPrecio(pedido.total, idioma)}</dd>
            </div>
          </dl>
        </section>

        <section className="pedido-tarjeta pedido-productos" aria-labelledby="pedido-productos-titulo">
          <h2 id="pedido-productos-titulo" className="pedido-tarjeta-titulo">{t('productos')}</h2>
          <ul className="pedido-items">
            {pedido.items.map((item, i) => {
              const nombre = item.slug
                // Sin slug el producto ya no está en la tienda: el nombre queda sin enlace.
                ? <Link href={{ pathname: '/tienda/[slug]', params: { slug: item.slug } }} className="pedido-item-nombre">{item.nombre}</Link>
                : <span className="pedido-item-nombre">{item.nombre}</span>
              return (
                <li key={item.slug ?? `sin-ficha-${i}`} className="pedido-item">
                  <span className="pedido-item-media">
                    {/* alt vacío: el nombre está escrito al lado. */}
                    {item.imagen
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.imagen} alt="" width={64} height={64} loading="lazy" decoding="async" />
                      : <span aria-hidden="true">🍫</span>}
                  </span>
                  <span className="pedido-item-info">
                    {nombre}
                    <span className="pedido-item-detalle">
                      {t('cantidadPorPrecio', { q: item.cantidad, precio: formatPrecio(item.precio, idioma) })}
                    </span>
                  </span>
                  <span className="pedido-item-total">{formatPrecio(item.precio * item.cantidad, idioma)}</span>
                </li>
              )
            })}
          </ul>
          <div className="pedido-items-total">
            <span>{t('total')}</span>
            <span className="cart-resumen-cifra">{formatPrecio(pedido.total, idioma)}</span>
          </div>
        </section>

        {/* Cierre, a todo el ancho: ayuda por WhatsApp y las dos salidas. Quien
            sigue varias compras (o la de un familiar) pasa a la siguiente sin volver atrás. */}
        <section className="pedido-tarjeta pedido-cierre" aria-labelledby="pedido-ayuda-titulo">
          <div className="pedido-ayuda">
            <span className="pedido-disco" aria-hidden="true"><MessageCircle size={22} strokeWidth={2.25} /></span>
            <div className="pedido-ayuda-cuerpo">
              <h2 id="pedido-ayuda-titulo" className="pedido-tarjeta-titulo">{t('ayudaTitulo')}</h2>
              <p>{t('ayudaTexto', { codigo: pedido.codigo })}</p>
              <a
                className="pedido-ayuda-boton"
                href={whatsappCon(tw('pedido', { codigo: pedido.codigo }))}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('ayudaBoton')}
              </a>
            </div>
          </div>
          <div className="pedido-salidas">
            <Button href="/mi-pedido" variant="outline" style={{ minHeight: 44, width: '100%', textAlign: 'center' }}>
              {t('consultarOtro')}
            </Button>
            <Link href="/tienda" className="checkout-editar">{t('volverTienda')}</Link>
          </div>
        </section>
      </div>
    </section>
  )
}

