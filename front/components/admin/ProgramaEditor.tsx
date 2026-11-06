'use client'
import { useRef } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { MAX_TITULO, type PasoPrograma } from '@/lib/programa'

/** Un paso mientras se edita: los detalles van como texto, una línea por detalle. */
export interface PasoEditor {
  id: number
  titulo: string
  detalles: string
  conNumero: boolean
}

export function aPasoEditor(paso: PasoPrograma, id: number): PasoEditor {
  return {
    id,
    titulo: paso.titulo,
    detalles: paso.detalles.join('\n'),
    conNumero: paso.numero !== null,
  }
}

/**
 * Pasa los pasos del editor al formato que se guarda. El que quedó totalmente en
 * blanco se descarta: es el que se agregó y no se usó, no un paso incompleto.
 */
export function dePasosEditor(pasos: PasoEditor[]): PasoPrograma[] {
  return pasos
    .map(p => ({
      numero: p.conNumero ? 0 : null,
      titulo: p.titulo.trim(),
      detalles: p.detalles.split('\n').map(d => d.trim()).filter(Boolean),
    }))
    .filter(p => p.titulo || p.detalles.length > 0)
}

interface Props {
  pasos: PasoEditor[]
  onChange: (pasos: PasoEditor[]) => void
}

/**
 * Editor del programa paso a paso. Quien administra llena título y detalles, y
 * el formato que lee la ficha lo arma `componerRelato`: nadie tiene que acordarse
 * de guiones ni de líneas en blanco, que era donde se rompía.
 *
 * Los detalles son un textarea con una línea por detalle, y no una lista con
 * botón «Agregar» como en «Incluye»: un programa suele llegar ya escrito en otro
 * documento, y así se pega de una vez.
 */
export default function ProgramaEditor({ pasos, onChange }: Props) {
  // Identificador estable para React: reordenar por índice mezclaría el foco y
  // el texto de los campos. Parte por encima de los que ya trae la ficha.
  const siguienteId = useRef(pasos.length)

  const cambiar = (id: number, cambio: Partial<PasoEditor>) =>
    onChange(pasos.map(p => (p.id === id ? { ...p, ...cambio } : p)))

  const mover = (indice: number, salto: 1 | -1) => {
    const copia = [...pasos]
    const [paso] = copia.splice(indice, 1)
    copia.splice(indice + salto, 0, paso)
    onChange(copia)
  }

  const agregar = () =>
    onChange([...pasos, { id: siguienteId.current++, titulo: '', detalles: '', conNumero: true }])

  return (
    <div className="programa-editor">
      {pasos.length > 0 && (
        <ol className="programa-editor-lista">
          {pasos.map((paso, i) => {
            const numero = pasos.slice(0, i + 1).filter(p => p.conNumero).length
            const nombre = paso.titulo.trim() || `paso ${i + 1}`
            return (
              <li key={paso.id} className="programa-editor-paso">
                <div className="programa-editor-cabecera">
                  <span className="programa-editor-num" aria-hidden="true">
                    {paso.conNumero ? numero : '•'}
                  </span>
                  <input
                    className="admin-input programa-editor-titulo"
                    value={paso.titulo}
                    maxLength={MAX_TITULO}
                    onChange={e => cambiar(paso.id, { titulo: e.target.value })}
                    placeholder="Título del paso. Ej: Recorrido por el cultivo"
                    aria-label={`Título del paso ${i + 1}`}
                    // Enter aquí enviaría el formulario entero a medio llenar.
                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                  />
                </div>

                <textarea
                  className="admin-input"
                  // Crece con los detalles, para que no queden cortados al abrir.
                  rows={Math.max(3, paso.detalles.split('\n').length + 1)}
                  style={{ resize: 'vertical' }}
                  value={paso.detalles}
                  onChange={e => cambiar(paso.id, { detalles: e.target.value })}
                  placeholder={'Un detalle por línea. Ej:\nCaminata guiada por el cultivo\nIdentificación de flores y mazorcas'}
                  aria-label={`Detalles del paso ${i + 1}, uno por línea`}
                />

                <div className="programa-editor-acciones">
                  <label className="programa-editor-check">
                    <input
                      type="checkbox"
                      checked={!paso.conNumero}
                      onChange={e => cambiar(paso.id, { conNumero: !e.target.checked })}
                    />
                    Sin número, como un cierre
                  </label>
                  <div className="programa-editor-botones">
                    <button
                      type="button" className="programa-editor-boton"
                      disabled={i === 0} onClick={() => mover(i, -1)}
                      aria-label={`Subir ${nombre}`}
                    >
                      <ArrowUp size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button" className="programa-editor-boton"
                      disabled={i === pasos.length - 1} onClick={() => mover(i, 1)}
                      aria-label={`Bajar ${nombre}`}
                    >
                      <ArrowDown size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button" className="programa-editor-boton programa-editor-boton--quitar"
                      onClick={() => onChange(pasos.filter(p => p.id !== paso.id))}
                      aria-label={`Quitar ${nombre}`}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <button
        type="button" className="btn-secondary btn-sm programa-editor-agregar"
        onClick={agregar}
      >
        <Plus size={16} aria-hidden="true" />
        Agregar paso
      </button>
    </div>
  )
}
