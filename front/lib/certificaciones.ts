export type Certificacion = {
  /** Clave dentro de `avales`: nombre, entidad, detalle y referencia. */
  clave: string
  /** Ruta del logo. Ausente cuando el aval se dibuja como símbolo (`forma: 'simbolo'`). */
  logo?: string
  /** Versión del logo para el fondo brown del footer; si falta se usa `logo`. */
  logoOscuro?: string
  /** true si el catálogo trae `referencia` para este aval (el nº de registro). */
  conReferencia?: boolean
  /**
   * 'sello-rectangular': marcas cuyo manual prohíbe recortarlas u obstruirlas
   * (zona de respeto); se muestran completas, sin el círculo.
   * 'simbolo': se dibuja en curva y toma el color del contexto, sin archivo.
   */
  forma?: 'circulo' | 'sello-rectangular' | 'simbolo'
  /**
   * La política del sitio que respalda este aval, si alguna lo hace.
   *
   * Solo el CTC la tiene: las NTS-TS exigen que el prestador certificado
   * publique su política de sostenibilidad, así que el sello y el documento son
   * dos mitades de lo mismo. Exhibir el sello sin dejar llegar al documento es
   * justo lo que revisa una auditoría de renovación.
   *
   * Se pinta en la sección de la landing, no en la tira del footer: allí los
   * cuatro sellos van como recurso fijo de marca sobre el brown, sin texto ni
   * enlaces.
   */
  politica?: '/politicas/sostenibilidad'
}

/**
 * Tira de confianza: los cuatro avales viajan siempre juntos, en este orden y
 * con este texto, en la web y en el portafolio comercial (hoja 15 de
 * `portafolio/src/portafolio.html`). Si cambia uno, cambian los dos.
 *
 * Fuente única: alimenta la sección de la landing y la tira del footer.
 */
export const CERTIFICACIONES: Certificacion[] = [
  { clave: 'bpa', logo: '/certificaciones/bpa.png' },
  {
    clave: 'ctc',
    logo: '/certificaciones/ctc.png',
    logoOscuro: '/certificaciones/ctc-claro.png',
    forma: 'sello-rectangular',
    politica: '/politicas/sostenibilidad',
  },
  { clave: 'rnt', logo: '/certificaciones/logo_rnt.png', conReferencia: true },
  {
    // Frente a una agencia la clase 39 de Niza es su misma clase de servicio:
    // por eso el registro de marca va en la tira y no en la letra chica.
    clave: 'marca',
    forma: 'simbolo',
  },
]

