'use client'
import { useState, useEffect, useMemo } from 'react'
import type { AdminProducto } from '@/lib/admin/types'
import { getProductosAdmin, updateProducto, deleteProducto } from '@/lib/admin/api'

const CATEGORIAS = ['Todos', 'Cacao', 'Chocolates', 'Kits']

export default function ProductosPage() {
  const [productos, setProductos] = useState<AdminProducto[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('Todos')
  const [stockEdit, setStockEdit] = useState<Record<string, number>>({})
  const [savingStock, setSavingStock] = useState<string | null>(null)

  useEffect(() => {
    getProductosAdmin().then(data => { setProductos(data); setLoading(false) })
  }, [])

  const lista = useMemo(() => {
    if (cat === 'Todos') return productos
    return productos.filter(p => p.categoria.toLowerCase() === cat.toLowerCase())
  }, [productos, cat])

  const stockBajoCount = productos.filter(p => p.stock > 0 && p.stock < 5).length

  async function guardarStock(id: string) {
    const newStock = stockEdit[id]
    if (newStock === undefined) return
    setSavingStock(id)
    const updated = await updateProducto(id, { stock: newStock })
    setProductos(prev => prev.map(p => p.id === updated.id ? updated : p))
    setStockEdit(prev => { const n = { ...prev }; delete n[id]; return n })
    setSavingStock(null)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    await deleteProducto(id)
    setProductos(prev => prev.filter(p => p.id !== id))
  }

  function stockStyle(stock: number): React.CSSProperties {
    if (stock === 0) return { background: 'var(--status-cancelada-bg)', color: 'var(--status-cancelada-txt)' }
    if (stock < 5) return { background: 'var(--stock-alert-bg)', color: 'var(--stock-alert-txt)' }
    return {}
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <div className="admin-page-title">Productos</div>
          <div className="admin-page-subtitle">
            {productos.length} productos
            {stockBajoCount > 0 && (
              <span style={{ color: '#B45309', marginLeft: 8 }}>⚠️ {stockBajoCount} con stock bajo</span>
            )}
          </div>
        </div>
        <button className="btn-primary" onClick={() => alert('Modal de nuevo producto — Task 8')}>
          + Nuevo producto
        </button>
      </div>

      <div className="admin-pills" style={{ marginBottom: 20 }}>
        {CATEGORIAS.map(c => (
          <button key={c} className={`admin-pill${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Cargando…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Precio</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(p => {
                const currentStock = stockEdit[p.id] ?? p.stock
                const editado = stockEdit[p.id] !== undefined
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{p.descripcion.slice(0, 50)}{p.descripcion.length > 50 ? '…' : ''}</div>
                    </td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--admin-bg)', fontSize: 12, fontWeight: 700 }}>
                        {p.categoria}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--color-amber)', fontWeight: 700 }}>
                      ${p.precio.toLocaleString('es-CO')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.stock === 0 ? (
                        <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, ...stockStyle(p.stock) }}>
                          Agotado
                        </span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {p.stock < 5 && <span title="Stock bajo">⚠️</span>}
                          <input
                            type="number"
                            min={0}
                            value={currentStock}
                            onChange={e => setStockEdit(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                            onBlur={() => editado && guardarStock(p.id)}
                            onKeyDown={e => e.key === 'Enter' && guardarStock(p.id)}
                            disabled={savingStock === p.id}
                            style={{
                              width: 64, textAlign: 'center', borderRadius: 6, padding: '5px 4px',
                              border: '1.5px solid var(--admin-border)',
                              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                              ...stockStyle(currentStock),
                            }}
                          />
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn-secondary btn-sm" onClick={() => alert(`Editar ${p.nombre}`)}>Editar</button>
                        <button className="btn-ghost btn-sm" onClick={() => eliminar(p.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 10 }}>
        El stock se guarda al salir del campo (Tab) o presionar Enter.
      </p>
    </>
  )
}
