'use client'
import { useCallback, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { uploadImage } from '@/lib/admin/api'

const ASPECTOS: { label: string; value: number | undefined }[] = [
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: 'Libre', value: undefined },
]

async function cropImageToBlob(src: string, px: Area): Promise<Blob> {
  const img = new window.Image()
  img.src = src
  await new Promise<void>(r => { img.onload = () => r() })
  const canvas = document.createElement('canvas')
  canvas.width = px.width
  canvas.height = px.height
  canvas.getContext('2d')!.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height)
  return new Promise((res, rej) =>
    canvas.toBlob(b => (b ? res(b) : rej(new Error('canvas empty'))), 'image/jpeg', 0.92)
  )
}

interface Props {
  value: string
  onChange: (url: string) => void
  onSave?: (url: string) => Promise<void>
  defaultAspect?: number
  previewAspect?: string
}

export default function HeroImageEditor({
  value,
  onChange,
  onSave,
  defaultAspect = 16 / 9,
  previewAspect = '16 / 9',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [srcLocal, setSrcLocal] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState<number | undefined>(defaultAspect)
  const [croppedAreaPx, setCroppedAreaPx] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setSrcLocal(reader.result as string)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setError('')
    }
    reader.readAsDataURL(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onCropComplete = useCallback((_: Area, px: Area) => {
    setCroppedAreaPx(px)
  }, [])

  async function handleGuardar() {
    if (!srcLocal || !croppedAreaPx) return
    setSaving(true)
    setError('')
    try {
      const blob = await cropImageToBlob(srcLocal, croppedAreaPx)
      const file = new File([blob], 'hero.jpg', { type: 'image/jpeg' })
      const { url } = await uploadImage(file)
      onChange(url)
      await onSave?.(url)
      setSrcLocal(null)
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancelar() {
    setSrcLocal(null)
    setError('')
  }

  /* ── Modo recorte ── */
  if (srcLocal) {
    return (
      <div>
        <div className="admin-field-label" style={{ marginBottom: 12 }}>
          Ajustá el recorte{' '}
          <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)' }}>
            — arrastrá para mover · scroll para hacer zoom
          </span>
        </div>

        <div style={{
          position: 'relative', width: '100%', height: 440,
          background: '#111', borderRadius: 10, overflow: 'hidden',
        }}>
          <Cropper
            image={srcLocal}
            crop={crop}
            zoom={zoom}
            {...(aspect !== undefined ? { aspect } : {})}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Controles */}
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>Proporción:</span>
            {ASPECTOS.map(a => (
              <button
                key={a.label}
                type="button"
                className={aspect === a.value ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                onClick={() => setAspect(a.value)}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '1 1 200px', minWidth: 180 }}>
            <span style={{ fontSize: 13, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>Zoom:</span>
            <input
              type="range" min={1} max={3} step={0.05}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 13, color: 'var(--admin-text-muted)', minWidth: 32 }}>
              {zoom.toFixed(1)}×
            </span>
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--color-crimson)', fontSize: 13, marginTop: 10 }}>{error}</div>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button type="button" className="btn-primary" onClick={handleGuardar} disabled={saving}>
            {saving ? 'Guardando…' : onSave ? 'Guardar imagen' : 'Guardar recorte'}
          </button>
          <button type="button" className="btn-secondary" onClick={handleCancelar} disabled={saving}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  /* ── Vista previa ── */
  return (
    <div>
      {/* Preview proporcional a la sección real */}
      <div style={{
        width: '100%',
        aspectRatio: previewAspect,
        maxHeight: 340,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid #e0d0c0',
        background: value
          ? undefined
          : 'repeating-linear-gradient(135deg, #F0D6A8 0 14px, #E9CB97 14px 28px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
      }}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Hero"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{
            color: 'rgba(135,43,19,.4)', fontSize: 13,
            letterSpacing: 1, fontFamily: 'monospace', textTransform: 'uppercase',
          }}>
            Sin imagen
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => inputRef.current?.click()}
        >
          {value ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
        {value && (
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => onChange('')}
            style={{ color: 'var(--color-crimson)' }}
          >
            Quitar
          </button>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 6 }}>
        JPG, PNG o WebP · máx. 5 MB
      </div>
    </div>
  )
}
