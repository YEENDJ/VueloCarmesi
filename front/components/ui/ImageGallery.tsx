'use client'
import { useState } from 'react'

interface ImageGalleryProps {
  images: string[]
  alt: string
  aspectRatio?: '1/1' | '4/3'
}

export default function ImageGallery({ images, alt, aspectRatio = '1/1' }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div style={{
        aspectRatio,
        backgroundColor: 'var(--color-cream)',
        border: '2px dashed var(--color-brown)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.5,
      }}>
        <span style={{ fontSize: '3rem' }}>🍫</span>
      </div>
    )
  }

  const displayed = images.slice(0, 4)

  return (
    <div>
      {/* Main image */}
      <div style={{ aspectRatio, borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
        <img
          src={displayed[activeIndex]}
          alt={`${alt} ${activeIndex + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Miniaturas — se achican en móvil, no se ocultan: son la única
          forma de llegar al resto de las fotos */}
      {displayed.length > 1 && (
        <div className="gallery-thumbnails">
          {displayed.map((src, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ver foto ${i + 1} de ${displayed.length}`}
              aria-pressed={i === activeIndex}
              onClick={() => setActiveIndex(i)}
              style={{
                padding: 0,
                borderRadius: '6px',
                overflow: 'hidden',
                border: i === activeIndex
                  ? '2px solid var(--color-crimson)'
                  : '2px solid transparent',
                cursor: 'pointer',
                flexShrink: 0,
                background: 'none',
              }}
            >
              <img
                src={src}
                alt={`${alt} miniatura ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
