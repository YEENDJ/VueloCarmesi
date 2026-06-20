'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Experiencia, Reserva } from '@/lib/types'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ReservaForm({ experiencia }: { experiencia: Experiencia }) {
  const router = useRouter()
  const [form, setForm] = useState<Omit<Reserva, 'experienciaId'>>({
    fecha: '', cantidadPersonas: 1, nombre: '', email: '', telefono: '', notas: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.name === 'cantidadPersonas' ? Number(e.target.value) : e.target.value
    setForm(prev => ({ ...prev, [e.target.name]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, experienciaId: experiencia.id }),
      })
    } catch {
      // continuar a confirmacion aunque el back falle (demo)
    }
    router.push('/reservar/confirmacion')
  }

  const total = experiencia.precio * form.cantidadPersonas

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Input label="Fecha" name="fecha" type="date" required value={form.fecha} onChange={handleChange} />
      <Input label="Cantidad de personas" name="cantidadPersonas" type="number" required value={String(form.cantidadPersonas)} onChange={handleChange} />
      <Input label="Nombre completo" name="nombre" required value={form.nombre} onChange={handleChange} />
      <Input label="Email" name="email" type="email" required value={form.email} onChange={handleChange} />
      <Input label="Teléfono" name="telefono" type="tel" required value={form.telefono} onChange={handleChange} />
      <Input label="Notas adicionales" name="notas" value={form.notas ?? ''} onChange={handleChange} multiline />
      <div style={{ padding: '1rem', backgroundColor: 'var(--color-cream)', borderRadius: '4px', border: '1px solid var(--color-amber)' }}>
        <p style={{ fontWeight: 700, color: 'var(--color-brown)' }}>
          Total: ${total.toLocaleString('es-AR')} ({form.cantidadPersonas} persona{form.cantidadPersonas !== 1 ? 's' : ''})
        </p>
      </div>
      <Button type="submit" disabled={loading}>{loading ? 'Procesando...' : 'Confirmar reserva'}</Button>
    </form>
  )
}
