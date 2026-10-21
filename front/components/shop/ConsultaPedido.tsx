'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarSearch, Hash, Mail, PackageSearch } from 'lucide-react'
import { Link, useRouter } from '@/lib/i18n/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { consultarPedido, ErrorConsulta } from '@/lib/pedidos'
import { consultarReserva } from '@/lib/reservas-consulta'
import { whatsappCon } from '@/lib/contacto'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Las claves que «mi pedido» y «mi reserva» tienen con el mismo nombre en sus catálogos. */
type Clave =
  | 'antetitulo' | 'consultaTitulo' | 'consultaTexto' | 'pistaTitulo' | 'pistaCorreo' | 'pistaCodigo'
  | 'codigo' | 'placeholderCodigo' | 'email' | 'placeholderEmail' | 'errorCodigo' | 'errorEmail'
  | 'consultar' | 'consultando' | 'noEncontrado' | 'demasiados' | 'errorRed'

/**
 * «Consulta tu pedido» y «Consulta tu reserva»: código y correo. Sin cuenta, es
 * la forma de llegar al estado cuando no se tiene el enlace del correo. Los dos
 * datos tienen que coincidir; el backend limita los intentos por IP.
 *
 * Un solo formulario para los dos: cambian los textos, la llamada y a dónde lleva.
 */
export default function ConsultaPedido({ tipo = 'pedido' }: { tipo?: 'pedido' | 'reserva' }) {
  const tp = useTranslations('miPedido')
  const tr = useTranslations('miReserva')
  const tw = useTranslations('whatsapp')
  const t = (clave: Clave) => (tipo === 'pedido' ? tp(clave) : tr(clave))
  const router = useRouter()
  const Icono = tipo === 'pedido' ? PackageSearch : CalendarSearch

  const [codigo, setCodigo] = useState('')
  const [email, setEmail] = useState('')
  const [errores, setErrores] = useState<{ codigo?: string; email?: string }>({})
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    const nuevos = {
      codigo: codigo.trim() ? undefined : t('errorCodigo'),
      email: EMAIL.test(email.trim()) ? undefined : t('errorEmail'),
    }
    setErrores(nuevos)
    setError('')
    if (nuevos.codigo || nuevos.email) return

    setBuscando(true)
    try {
      if (tipo === 'pedido') {
        const { token } = await consultarPedido(codigo.trim(), email.trim())
        router.push({ pathname: '/mi-pedido/[token]', params: { token } })
      } else {
        const { token } = await consultarReserva(codigo.trim(), email.trim())
        router.push({ pathname: '/mi-reserva/[token]', params: { token } })
      }
    } catch (err) {
      const status = err instanceof ErrorConsulta ? err.status : 0
      // 400 llega si el correo no pasa la validación del backend: para el
      // cliente es lo mismo que no encontrarlo.
      setError(status === 404 || status === 400 ? t('noEncontrado') : status === 429 ? t('demasiados') : t('errorRed'))
      setBuscando(false)
    }
  }

  const whatsapp = (texto: React.ReactNode) => (
    <a href={whatsappCon(tw(tipo === 'pedido' ? 'miPedido' : 'miReserva'))} target="_blank" rel="noopener noreferrer">{texto}</a>
  )

  return (
    <section className="page-shell pedido pedido-consulta">
      <div className="pedido-consulta-intro">
        <span className="pedido-disco pedido-disco--grande" aria-hidden="true"><Icono size={30} strokeWidth={2.25} /></span>
        <p className="pedido-antetitulo">{t('antetitulo')}</p>
        <h1 className="pedido-titulo">{t('consultaTitulo')}</h1>
        <p className="pedido-consulta-texto">{t('consultaTexto')}</p>

        {/* Dónde encontrar el código: la duda de casi todos los que llegan aquí. */}
        <h2 className="pedido-pistas-titulo">{t('pistaTitulo')}</h2>
        <ul className="pedido-pistas">
          <li>
            <span className="pedido-disco" aria-hidden="true"><Mail size={20} strokeWidth={2.25} /></span>
            <span>{t('pistaCorreo')}</span>
          </li>
          <li>
            <span className="pedido-disco" aria-hidden="true"><Hash size={20} strokeWidth={2.25} /></span>
            <span>{t('pistaCodigo')}</span>
          </li>
        </ul>
      </div>

      <div className="pedido-consulta-columna">
        <form onSubmit={enviar} noValidate className="form-tarjeta">
          <Input
            label={t('codigo')} required autoComplete="off" maxLength={40}
            placeholder={t('placeholderCodigo')}
            value={codigo} onChange={e => setCodigo(e.target.value)} error={errores.codigo}
          />
          <Input
            label={t('email')} type="email" required autoComplete="email" maxLength={255}
            placeholder={t('placeholderEmail')}
            value={email} onChange={e => setEmail(e.target.value)} error={errores.email}
          />
          {error && <p role="alert" className="checkout-error">{error}</p>}
          <Button type="submit" disabled={buscando}
            style={{ width: '100%', minHeight: 50, borderRadius: '8px', fontSize: '17px' }}>
            {buscando ? t('consultando') : t('consultar')}
          </Button>
        </form>

        <p className="pedido-consulta-ayuda">
          {tipo === 'pedido' ? tp.rich('ayudaWhatsapp', { whatsapp }) : tr.rich('ayudaWhatsapp', { whatsapp })}
        </p>
        {tipo === 'pedido'
          ? <Link href="/tienda" className="checkout-editar">{tp('volverTienda')}</Link>
          : <Link href="/experiencias" className="checkout-editar">{tr('verExperiencias')}</Link>}
      </div>
    </section>
  )
}
