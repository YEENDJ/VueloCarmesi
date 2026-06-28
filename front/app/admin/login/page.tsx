'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.refresh()
      router.push('/admin')
    } else {
      setError('Contraseña incorrecta')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--admin-bg)', fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '40px 48px',
        boxShadow: '0 2px 8px rgba(135,43,19,.06)', width: '100%', maxWidth: 380,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-crimson)' }}>
            Vuelo Carmesí
          </div>
          <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            Panel de administración
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--admin-border)',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                color: 'var(--color-brown)', background: 'var(--admin-bg)', outline: 'none',
              }}
            />
          </div>
          {error && (
            <div style={{ fontSize: 13, color: 'var(--color-crimson)', textAlign: 'center' }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'var(--color-crimson)', color: 'var(--color-cream)',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
