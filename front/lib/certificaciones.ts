export type Certificacion = {
  nombre: string
  entidad: string
  detalle: string
  /** Ruta del logo. Ausente cuando el aval se dibuja como símbolo (`forma: 'simbolo'`). */
  logo?: string
  /** Versión del logo para el fondo brown del footer; si falta se usa `logo`. */
  logoOscuro?: string
  /** Dato visible junto al sello, como el número de registro. */
  referencia?: string
  /**
   * 'sello-rectangular': marcas cuyo manual prohíbe recortarlas u obstruirlas
   * (zona de respeto); se muestran completas, sin el círculo.
   * 'simbolo': se dibuja en curva y toma el color del contexto, sin archivo.
   */
  forma?: 'circulo' | 'sello-rectangular' | 'simbolo'
}

/**
 * Tira de confianza: los cuatro avales viajan siempre juntos, en este orden y
 * con este texto, en la web y en el portafolio comercial (hoja 15 de
 * `portafolio/src/portafolio.html`). Si cambia uno, cambian los dos.
 *
 * Fuente única: alimenta la sección de la landing y la tira del footer.
 */
export const CERTIFICACIONES: Certificacion[] = [
  {
    nombre: 'Buenas Prácticas Agrícolas',
    entidad: 'ICA',
    detalle: 'Manejo responsable y trazable del cultivo de cacao.',
    logo: '/certificaciones/bpa.png',
  },
  {
    nombre: 'Calidad Turística Colombia',
    entidad: 'MinCIT · NTS-TS',
    detalle: 'Distintivo de buenas prácticas en servicio turístico.',
    logo: '/certificaciones/ctc.png',
    logoOscuro: '/certificaciones/ctc-claro.png',
    forma: 'sello-rectangular',
  },
  {
    nombre: 'Registro Nacional de Turismo',
    entidad: 'Vigente',
    detalle: 'Prestador de servicios turísticos formalmente inscrito.',
    logo: '/certificaciones/logo_rnt.png',
    referencia: 'No. 179868',
  },
  {
    // Frente a una agencia la clase 39 de Niza es su misma clase de servicio:
    // por eso el registro de marca va en la tira y no en la letra chica.
    nombre: 'Marca registrada',
    entidad: 'SIC · Clase 39 de Niza',
    detalle: 'Marca mixta registrada para servicios de organización de viajes.',
    forma: 'simbolo',
  },
]

/** Pie legal que acompaña a la tira. Mismo texto en la web y en el portafolio. */
export const TIRA_LEGAL =
  'RNT No. 179868 · Marca mixta registrada ante la SIC, clase 39 de Niza'
