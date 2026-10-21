'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type Tipo = 'exito' | 'error'
/** Un botón en el aviso, como «Deshacer». Al pulsarlo, el aviso se cierra. */
export interface AccionAviso { etiqueta: string; alPulsar: () => void }
interface Aviso { id: number; tipo: Tipo; texto: string; accion?: AccionAviso }

/**
 * Cuánto se queda cada aviso. El error se lee con más calma: casi siempre hay
 * que hacer algo después (recargar, revisar el pedido).
 */
const DURACION: Record<Tipo, number> = { exito: 4000, error: 7000 }
/** Con un botón se queda más: hay que leerlo y decidir si pulsarlo. */
const DURACION_CON_ACCION = 8000

const AvisosContext = createContext<(tipo: Tipo, texto: string, accion?: AccionAviso) => void>(() => {})

/** `avisar('exito', 'Pedido VC-AB12C3: ahora Enviado')`. Se oculta solo. */
export const useAvisar = () => useContext(AvisosContext)

/**
 * Avisos del panel, abajo a la derecha (abajo y a lo ancho en el celular).
 * Uno nuevo no tapa al anterior: se apilan y cada uno se va a su tiempo.
 */
export function AvisosProvider({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const siguiente = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const quitar = useCallback((id: number) => {
    setAvisos(prev => prev.filter(a => a.id !== id))
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
  }, [])

  const avisar = useCallback((tipo: Tipo, texto: string, accion?: AccionAviso) => {
    const id = ++siguiente.current
    setAvisos(prev => [...prev, { id, tipo, texto, accion }])
    timers.current.set(id, setTimeout(() => quitar(id), accion ? DURACION_CON_ACCION : DURACION[tipo]))
  }, [quitar])

  useEffect(() => {
    const pendientes = timers.current
    return () => pendientes.forEach(clearTimeout)
  }, [])

  return (
    <AvisosContext.Provider value={avisar}>
      {children}
      {/* Siempre montada: un lector de pantalla solo anuncia lo que entra a una región que ya existía. */}
      <div className="admin-avisos" role="status" aria-live="polite">
        {avisos.map(a => (
          <div key={a.id} className={`admin-aviso admin-aviso--${a.tipo}`}>
            <span aria-hidden="true">{a.tipo === 'exito' ? '✓' : '!'}</span>
            <span className="admin-aviso-texto">{a.texto}</span>
            {a.accion && (
              <button
                type="button"
                className="admin-aviso-accion"
                onClick={() => { quitar(a.id); a.accion!.alPulsar() }}
              >
                {a.accion.etiqueta}
              </button>
            )}
            <button type="button" className="admin-aviso-cerrar" onClick={() => quitar(a.id)} aria-label="Cerrar aviso">×</button>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  )
}

/** Indicador de carga para dentro de un botón: «⟳ Aplicando…». */
export function Cargando({ texto }: { texto: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span className="admin-spinner" aria-hidden="true" />
      {texto}
    </span>
  )
}
