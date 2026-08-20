'use client'
import { useId, useRef, useState } from 'react'
import { uploadImage, deleteImage } from '@/lib/admin/api'

export const MAX_IMAGENES = 8

interface Props {
  value: string[]
  onChange: (urls: string[]) => void
  label?: string
  max?: number
}

/**
 * Galería de una ficha. La portada no es un campo aparte: es la primera foto de
 * la lista, y "Hacer portada" la mueve al principio. Con dos campos separados se
 * podía guardar una portada que no estaba en la galería, o una galería vacía con
 * portada puesta; así ese estado no existe.
 *
 * Las fotos se suben de a una aunque el input acepte varias: el endpoint recibe
 * un archivo por petición, y subirlas en serie deja ver el progreso y permite que
 * una falle sin arrastrar a las demás.
 */
export default function ImagesUploader({
  value, onChange, label = 'Fotos', max = MAX_IMAGENES,
}: Props) {
  const inputId = useId()
  const [subiendo, setSubiendo] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const lleno = value.length >= max

  async function alElegirArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? [])
    if (archivos.length === 0) return

    setError('')
    const cabenAun = max - value.length
    if (archivos.length > cabenAun) {
      setError(`Solo caben ${cabenAun} foto${cabenAun === 1 ? '' : 's'} más. Se subirán las primeras.`)
    }

    const aSubir = archivos.slice(0, cabenAun)
    const subidas: string[] = []

    for (let i = 0; i < aSubir.length; i++) {
      setSubiendo(i + 1)
      try {
        const { url } = await uploadImage(aSubir[i])
        subidas.push(url)
      } catch {
        setError(`No se pudo subir "${aSubir[i].name}". Revisa formato y tamaño (máx. 5 MB).`)
      }
    }

    setSubiendo(0)
    if (inputRef.current) inputRef.current.value = ''
    if (subidas.length > 0) onChange([...value, ...subidas])
  }

  function quitar(indice: number) {
    const url = value[indice]
    onChange(value.filter((_, i) => i !== indice))
    // Se dispara sin esperar: el archivo remoto ya no lo referencia nadie y el
    // panel no debe quedarse bloqueado por una llamada de limpieza.
    void deleteImage(url)
  }

  function hacerPortada(indice: number) {
    if (indice === 0) return
    const copia = [...value]
    const [foto] = copia.splice(indice, 1)
    onChange([foto, ...copia])
  }

  function mover(indice: number, direccion: -1 | 1) {
    const destino = indice + direccion
    if (destino < 0 || destino >= value.length) return
    const copia = [...value]
    ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
    onChange(copia)
  }

  return (
    <div style={{ minWidth: 0 }}>
      <div className="admin-field-label">
        {label} <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)' }}>
          · {value.length} de {max} · la primera es la portada
        </span>
      </div>

      {value.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(120px, 100%), 1fr))',
          gap: 12, marginBottom: 12,
        }}>
          {value.map((url, i) => (
            <figure key={url} style={{ margin: 0, minWidth: 0 }}>
              <div style={{
                position: 'relative', width: '100%', aspectRatio: '1 / 1',
                borderRadius: 8, overflow: 'hidden',
                border: i === 0 ? '2px solid var(--color-crimson)' : '1px solid #e0d0c0',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url} alt={`Foto ${i + 1}`}
                  style={{ width: '100%', height: '100%', maxWidth: '100%', objectFit: 'cover', display: 'block' }}
                />
                {i === 0 && (
                  <span style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'var(--color-crimson)', color: '#fff',
                    fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '2px 0',
                  }}>Portada</span>
                )}
                <button
                  type="button" onClick={() => quitar(i)} title="Quitar foto" aria-label={`Quitar foto ${i + 1}`}
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                    borderRadius: 6, minWidth: 44, minHeight: 44,
                    fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: 0,
                  }}
                >✕</button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                <button
                  type="button" onClick={() => mover(i, -1)} disabled={i === 0}
                  aria-label={`Mover foto ${i + 1} hacia atrás`}
                  className="btn-ghost btn-sm"
                  style={{ minWidth: 44, minHeight: 44, opacity: i === 0 ? 0.35 : 1 }}
                >←</button>
                <button
                  type="button" onClick={() => mover(i, 1)} disabled={i === value.length - 1}
                  aria-label={`Mover foto ${i + 1} hacia adelante`}
                  className="btn-ghost btn-sm"
                  style={{ minWidth: 44, minHeight: 44, opacity: i === value.length - 1 ? 0.35 : 1 }}
                >→</button>
                {i !== 0 && (
                  <button
                    type="button" onClick={() => hacerPortada(i)}
                    className="btn-ghost btn-sm"
                    style={{ minHeight: 44, flex: '1 1 auto', minWidth: 0, fontSize: 12 }}
                  >Hacer portada</button>
                )}
              </div>
            </figure>
          ))}
        </div>
      )}

      <input
        ref={inputRef} id={inputId} type="file" multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={alElegirArchivos}
        style={{ display: 'none' }}
      />
      <label
        htmlFor={inputId}
        className="btn-secondary btn-sm"
        style={{
          display: 'inline-flex', alignItems: 'center', minHeight: 44,
          cursor: subiendo || lleno ? 'not-allowed' : 'pointer',
          opacity: subiendo || lleno ? 0.6 : 1,
        }}
      >
        {subiendo ? `Subiendo ${subiendo}…` : value.length === 0 ? 'Subir fotos' : 'Agregar más'}
      </label>

      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
        {lleno ? `Alcanzaste el máximo de ${max} fotos.` : 'JPG, PNG o WebP · máx. 5 MB cada una'}
      </div>
      {error && (
        <div style={{ color: 'var(--color-crimson)', fontSize: 12, marginTop: 4 }}>{error}</div>
      )}
    </div>
  )
}
