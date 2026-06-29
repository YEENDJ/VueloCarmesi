'use client'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' })
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstado('loading')
    try {
      const res = await fetch(`${API}/contacto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setEstado('ok')
    } catch {
      setEstado('error')
    }
  }

  return (
    <section style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--color-brown)' }}>Contacto</h1>
      {estado === 'ok' ? (
        <p style={{ color: 'var(--color-crimson)', fontSize: '1.1rem' }}>
          ¡Gracias! Te respondemos a la brevedad. Revisá tu correo.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input label="Nombre" name="nombre" required value={form.nombre} onChange={handleChange} />
          <Input label="Email" name="email" type="email" required value={form.email} onChange={handleChange} />
          <Input label="Mensaje" name="mensaje" required value={form.mensaje} onChange={handleChange} multiline />
          {estado === 'error' && (
            <p style={{ color: 'var(--color-crimson)', fontSize: 14, margin: 0 }}>
              Hubo un error al enviar. Intentá de nuevo o escribinos directamente a hola@vuelocarmesi.com.
            </p>
          )}
          <Button type="submit" disabled={estado === 'loading'}>
            {estado === 'loading' ? 'Enviando…' : 'Enviar mensaje'}
          </Button>
        </form>
      )}
    </section>
  )
}
