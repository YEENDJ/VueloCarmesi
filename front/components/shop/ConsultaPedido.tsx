'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/lib/i18n/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { consultarPedido, ErrorConsulta } from '@/lib/pedidos'
import { whatsappCon } from '@/lib/contacto'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * «Consulta tu pedido»: código y correo de la compra. Sin cuenta, es la forma
 * de llegar al estado del pedido cuando no se tiene el enlace del correo.
 * Los dos datos tienen que coincidir; el backend limita los intentos por IP.
 */
export default function ConsultaPedido() {
  const t = useTranslations('miPedido')
  const tw = useTranslations('whatsapp')
  const router = useRouter()

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
      const { token } = await consultarPedido(codigo.trim(), email.trim())
      router.push({ pathname: '/mi-pedido/[token]', params: { token } })
    } catch (err) {
      const status = err instanceof ErrorConsulta ? err.status : 0
      // 400 llega si el correo no pasa la validación del backend: para el
      // cliente es lo mismo que no encontrarlo.
      setError(status === 404 || status === 400 ? t('noEncontrado') : status === 429 ? t('demasiados') : t('errorRed'))
      setBuscando(false)
    }
  }

  return (
    <section className="page-shell pedido-consulta">
      <h1 className="cart-titulo">{t('consultaTitulo')}</h1>
      <p className="pedido-consulta-texto">{t('consultaTexto')}</p>

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
        {t.rich('ayudaWhatsapp', {
          whatsapp: texto => (
            <a href={whatsappCon(tw('miPedido'))} target="_blank" rel="noopener noreferrer">{texto}</a>
          ),
        })}
      </p>
      <Link href="/tienda" className="checkout-editar pedido-consulta-volver">{t('volverTienda')}</Link>
    </section>
  )
}
