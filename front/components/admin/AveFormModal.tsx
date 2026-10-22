'use client'
import { useRef, useState } from 'react'
import type { AdminAve } from '@/lib/admin/types'
import { createAve, updateAve } from '@/lib/admin/api'
import ImageUploader from './ImageUploader'

/** Mismo tope que valida el backend (MAX_ALT). */
const MAX_ALT = 200

type Tipo = AdminAve['tipo']

type FormData = {
  cientifico: string
  ingles: string
  local: string
  tipo: Tipo
  imagen: string
  foco: string
  alt: string
  altEn: string
}

const EMPTY: FormData = {
  cientifico: '', ingles: '', local: '', tipo: 'residente',
  imagen: '', foco: '50% 50%', alt: '', altEn: '',
}

export default function AveFormModal({
  ave,
  onClose,
  onSaved,
}: {
  ave: AdminAve | null
  onClose: () => void
  onSaved: (a: AdminAve) => void
}) {
  const isEdit = !!ave
  const [form, setForm] = useState<FormData>(
    ave
      ? {
          cientifico: ave.cientifico, ingles: ave.ingles, local: ave.local, tipo: ave.tipo,
          imagen: ave.imagen, foco: ave.foco, alt: ave.alt, altEn: ave.altEn,
        }
      : EMPTY,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  // Las residentes llevan foto siempre; en las migratorias es opcional.
  const fotoObligatoria = form.tipo === 'residente'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.cientifico.trim() || !form.ingles.trim() || !form.local.trim()) {
      setError('Los tres nombres son obligatorios')
      return
    }
    if (fotoObligatoria && !form.imagen) {
      setError('Las especies residentes necesitan foto')
      return
    }
    if (form.imagen && !form.alt.trim()) {
      setError('Describe la foto: es lo que oye quien navega con lector de pantalla y lo que lee Google')
      return
    }
    setSaving(true)
    setError('')
    try {
      // Sin foto no hay nada que describir ni encuadrar: se limpia para que no
      // quede una descripción de una foto que ya se quitó.
      const data = form.imagen ? form : { ...form, foco: '50% 50%', alt: '', altEn: '' }
      const saved = isEdit ? await updateAve(ave!.id, data) : await createAve(data)
      setSaving(false)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error && err.message && !err.message.startsWith('API error')
        ? err.message
        : 'No se pudo guardar. Revisa la conexión e inténtalo de nuevo.')
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--grande" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div style={{ fontSize: 17, fontWeight: 700 }}>{isEdit ? 'Editar especie' : 'Nueva especie'}</div>
          <button
            onClick={onClose} aria-label="Cerrar"
            style={{
              background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
              color: 'var(--admin-text-muted)', minWidth: 44, minHeight: 44, padding: 0,
            }}
          >✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
          <div className="ave-form">
          {/* La vista previa va primero en el DOM: en móvil queda arriba, a la
              vista mientras se escribe; en escritorio el grid la pasa a la
              columna derecha y la deja fija al hacer scroll. */}
          <VistaPrevia form={form} />
          <div className="ave-form-campos">
            <div className="admin-form-row-3">
              <FormRow label="Nombre científico *">
                <input className="admin-input" value={form.cientifico} onChange={e => set('cientifico', e.target.value)} placeholder="Ej: Eurypyga helias" style={{ fontStyle: 'italic' }} />
              </FormRow>
              <FormRow label="Nombre en inglés *" ayuda="El que busca el birder">
                <input className="admin-input" value={form.ingles} onChange={e => set('ingles', e.target.value)} placeholder="Ej: Sunbittern" />
              </FormRow>
              <FormRow label="Nombre local *">
                <input className="admin-input" value={form.local} onChange={e => set('local', e.target.value)} placeholder="Ej: Tigana" />
              </FormRow>
            </div>

            <FormRow label="Tipo">
              <div className="admin-pills">
                {(['residente', 'migratoria'] as const).map(t => (
                  <button
                    key={t} type="button"
                    className={`admin-pill${form.tipo === t ? ' active' : ''}`}
                    style={{ minHeight: 44 }}
                    onClick={() => set('tipo', t)}
                  >
                    {t === 'residente' ? 'Residente · con foto' : 'Migratoria · foto opcional'}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 6 }}>
                {fotoObligatoria
                  ? 'Va en la rejilla de fotos. Usa solo fotos tomadas en la finca: es lo que prueba el avistamiento.'
                  : 'Va en la sección de migratorias. Si tienes una foto tomada en la finca, súbela y sale con tarjeta, igual que las residentes; si no, queda como ficha de texto.'}
              </div>
            </FormRow>

            <ImageUploader
              value={form.imagen}
              onChange={url => set('imagen', url)}
              label={fotoObligatoria ? 'Foto *' : 'Foto (opcional)'}
            />

            {form.imagen && (
              <>
                <SelectorEncuadre
                  imagen={form.imagen}
                  foco={form.foco}
                  onChange={foco => set('foco', foco)}
                />

                <FormRow label="Descripción de la foto *" ayuda="Qué se ve, en una frase">
                  <input
                    className="admin-input" maxLength={MAX_ALT}
                    value={form.alt} onChange={e => set('alt', e.target.value)}
                    placeholder="Ej: Tigana caminando entre la hierba a la orilla del agua"
                  />
                </FormRow>
                <FormRow label="Descripción en inglés" ayuda="Si la dejas vacía, o cambias la de español, se traduce sola al guardar">
                  <input
                    className="admin-input" maxLength={MAX_ALT}
                    value={form.altEn} onChange={e => set('altEn', e.target.value)}
                    placeholder="Se rellena automáticamente"
                  />
                </FormRow>
              </>
            )}

            {error && <div style={{ color: 'var(--color-crimson)', fontSize: 13 }}>{error}</div>}
          </div>
          </div>
          </div>
          <div className="admin-modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose} style={{ minHeight: 44 }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ minHeight: 44 }}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** El marco de la tarjeta pública (.avi-especie, aspect-ratio 4 / 5). */
const MARCO = 4 / 5

/**
 * Elegir el encuadre como en la foto de perfil de una red social: la foto
 * entera, con el recuadro 4:5 de la tarjeta encima y lo que queda fuera
 * oscurecido. Se arrastra el recuadro (o se toca donde se quiere centrar) y lo
 * que se ve dentro es exactamente lo que va a salir.
 *
 * Por qué es exacto: la tarjeta pinta la foto con `object-fit: cover`, que la
 * escala hasta cubrir el marco por el lado justo; sobra por un solo eje, y
 * `object-position: p%` corre el recorte a p · (lo que sobra). El recuadro hace
 * la misma cuenta al revés, así que se guarda el mismo «X% Y%» de siempre y las
 * aves ya encuadradas no cambian.
 *
 * Solo se mueve sobre el eje que sobra: en una foto apaisada, de lado a lado;
 * en una vertical, de arriba abajo. No hay zoom, porque `object-position` no lo
 * tiene y la tarjeta no podría reproducirlo.
 */
function SelectorEncuadre({ imagen, foco, onChange }: {
  imagen: string
  foco: string
  onChange: (foco: string) => void
}) {
  const [px, py] = foco.split(' ').map(v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 50 })
  // Proporción real del archivo, ancho / alto. Nula hasta que carga la imagen.
  const [proporcion, setProporcion] = useState<number | null>(null)
  const arrastre = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  // Tamaño del recuadro respecto a la foto mostrada, y cuánto puede correrse.
  const apaisada = proporcion !== null && proporcion > MARCO
  const anchoMarco = proporcion === null ? 1 : apaisada ? MARCO / proporcion : 1
  const altoMarco = proporcion === null ? 1 : apaisada ? 1 : proporcion / MARCO
  const holguraX = 1 - anchoMarco
  const holguraY = 1 - altoMarco
  const recorte = (n: number) => Math.round(Math.min(100, Math.max(0, n)))
  /** Guarda la posición y la devuelve ya acotada a 0–100. */
  const fijar = (x: number, y: number): [number, number] => {
    const nueva: [number, number] = [recorte(x), recorte(y)]
    onChange(`${nueva[0]}% ${nueva[1]}%`)
    return nueva
  }

  /** Centra el recuadro donde se tocó, hasta donde lo dejan los bordes. */
  function centrarEn(e: React.PointerEvent<HTMLDivElement>): [number, number] {
    const r = e.currentTarget.getBoundingClientRect()
    const cx = (e.clientX - r.left) / r.width
    const cy = (e.clientY - r.top) / r.height
    return fijar(
      holguraX > 0 ? ((cx - anchoMarco / 2) / holguraX) * 100 : 50,
      holguraY > 0 ? ((cy - altoMarco / 2) / holguraY) * 100 : 50,
    )
  }

  function empezar(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    // Tocar fuera del recuadro lo trae ahí; tocar dentro solo lo agarra. El
    // arrastre sigue desde donde quedó, no desde la posición de antes del toque.
    const [x, y] = (e.target as HTMLElement).dataset.marco ? [px, py] : centrarEn(e)
    arrastre.current = { x: e.clientX, y: e.clientY, px: x, py: y }
  }

  function mover(e: React.PointerEvent<HTMLDivElement>) {
    const a = arrastre.current
    if (!a) return
    const r = e.currentTarget.getBoundingClientRect()
    // Lo que se arrastró, en fracción de la foto, pasado a % de la holgura.
    const dx = (e.clientX - a.x) / r.width
    const dy = (e.clientY - a.y) / r.height
    fijar(
      holguraX > 0 ? a.px + (dx / holguraX) * 100 : 50,
      holguraY > 0 ? a.py + (dy / holguraY) * 100 : 50,
    )
  }

  function soltar() {
    arrastre.current = null
  }

  // Con el teclado: flechas de 2 en 2, con Mayúsculas de 10 en 10.
  function teclas(e: React.KeyboardEvent<HTMLDivElement>) {
    const paso = e.shiftKey ? 10 : 2
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso],
    }
    if (!d[e.key]) return
    e.preventDefault()
    fijar(px + d[e.key][0], py + d[e.key][1])
  }

  const sinHolgura = proporcion !== null && holguraX <= 0.001 && holguraY <= 0.001

  return (
    <div style={{ minWidth: 0 }}>
      <div className="admin-field-label">
        Encuadre
        <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)' }}>
          {' · '}
          {sinHolgura
            ? 'La foto ya tiene la forma de la tarjeta: sale entera'
            : `Arrastra el recuadro ${apaisada ? 'de lado a lado' : 'hacia arriba o abajo'}; lo que queda dentro es lo que se ve`}
        </span>
      </div>
      <div
        className="encuadre"
        onPointerDown={empezar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onKeyDown={teclas}
        tabIndex={0}
        role="group"
        aria-label={`Encuadre de la foto, posición ${px}% ${py}%. Usa las flechas para mover el recuadro`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagen} alt="" draggable={false}
          onLoad={e => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget
            if (w && h) setProporcion(w / h)
          }}
        />
        {proporcion !== null && (
          <div
            className="encuadre-marco"
            data-marco="1"
            aria-hidden="true"
            style={{
              left: `${(px / 100) * holguraX * 100}%`,
              top: `${(py / 100) * holguraY * 100}%`,
              width: `${anchoMarco * 100}%`,
              height: `${altoMarco * 100}%`,
            }}
          />
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 12, color: 'var(--admin-text-muted)' }}>
        <span>Posición: {foco}</span>
        <button type="button" className="btn-ghost btn-sm" style={{ minHeight: 44 }} onClick={() => onChange('50% 50%')}>
          Centrar
        </button>
      </div>
    </div>
  )
}

/**
 * La tarjeta tal como va a salir en /aviturismo, con lo que hay escrito en el
 * formulario en este momento. Solo pinta el estado local: nada llega al
 * backend hasta que se pulsa Guardar.
 *
 * Usa el mismo marcado y las mismas clases que la página pública (las de
 * .avi-especie y .avi-pill en globals.css), así la vista previa no puede
 * desviarse de lo que se publica. Los textos de relleno van en gris para que
 * no se confundan con un nombre real.
 */
function VistaPrevia({ form }: { form: FormData }) {
  const relleno = (valor: string, texto: string) =>
    valor.trim() ? valor : <span style={{ opacity: 0.55 }}>{texto}</span>

  return (
    <aside className="ave-form-previa" aria-label="Vista previa">
      <div className="admin-field-label">Vista previa</div>

      {/* Con foto, residente o migratoria, va la tarjeta de la rejilla; una
          migratoria sin foto, la ficha de texto. Igual que en GaleriaAves. */}
      {form.tipo === 'residente' || form.imagen ? (
        <div className="avi-especie ave-form-tarjeta">
          <div className="avi-especie-foto">
            {form.imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: form.foco }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: '30%', fontSize: 12, color: 'var(--admin-text-muted)', textAlign: 'center',
              }}>
                Aquí va la foto
              </div>
            )}
          </div>
          <div className="avi-especie-nombres">
            <b className="avi-especie-cientifico"><i>{relleno(form.cientifico, 'Nombre científico')}</i></b>
            <span className="avi-especie-ingles">{relleno(form.ingles, 'English name')}</span>
            <span className="avi-especie-local">{relleno(form.local, 'Nombre local')}</span>
          </div>
        </div>
      ) : (
        <div className="avi-pill">
          <b><i>{relleno(form.cientifico, 'Nombre científico')}</i></b>
          <span className="avi-pill-ingles">{relleno(form.ingles, 'English name')}</span>
          <span className="avi-pill-local">{relleno(form.local, 'Nombre local')}</span>
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 8 }}>
        Así se verá en la página. Se publica al pulsar Guardar.
      </div>
    </aside>
  )
}

function FormRow({ label, ayuda, children }: {
  label: string
  ayuda?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="admin-field-label">
        {label}
        {ayuda && (
          <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)' }}> · {ayuda}</span>
        )}
      </div>
      {children}
    </div>
  )
}
