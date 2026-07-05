export type Certificacion = {
  nombre: string
  entidad: string
  detalle: string
  logo: string
  /** Versión del logo para el fondo brown del footer; si falta se usa `logo`. */
  logoOscuro?: string
  /**
   * 'sello-rectangular': marcas cuyo manual prohíbe recortarlas u obstruirlas
   * (zona de respeto); se muestran completas, sin el círculo.
   */
  forma?: 'circulo' | 'sello-rectangular'
}

// Fuente única: alimenta la sección de la landing y la tira del footer.
export const CERTIFICACIONES: Certificacion[] = [
  {
    nombre: 'Buenas Prácticas Agrícolas',
    entidad: 'ICA',
    detalle: 'Certificación BPA que avala el manejo responsable del cultivo de cacao.',
    logo: '/certificaciones/bpa.png',
  },
  {
    nombre: 'Calidad Turística Colombia',
    entidad: 'MinCIT',
    detalle: 'Distintivo de buenas prácticas del Programa Nacional de Calidad Turística.',
    logo: '/certificaciones/ctc.png',
    logoOscuro: '/certificaciones/ctc-claro.png',
    forma: 'sello-rectangular',
  }
]
