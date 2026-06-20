'use client'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' })
  const [enviado, setEnviado] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO conectar con endpoint POST /contacto cuando exista
    setEnviado(true)
  }

  return (
    <section style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: 'var(--color-brown)' }}>Contacto</h1>
      {enviado ? (
        <p style={{ color: 'var(--color-crimson)', fontSize: '1.1rem' }}>
          ¡Gracias! Te respondemos a la brevedad.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input label="Nombre" name="nombre" required value={form.nombre} onChange={handleChange} />
          <Input label="Email" name="email" type="email" required value={form.email} onChange={handleChange} />
          <Input label="Mensaje" name="mensaje" required value={form.mensaje} onChange={handleChange} multiline />
          <Button type="submit">Enviar mensaje</Button>
        </form>
      )}
    </section>
  )
}
