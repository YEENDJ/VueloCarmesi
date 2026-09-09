import Link from 'next/link'
import { Binoculars } from 'lucide-react'

/**
 * Enlace de ida hacia /aviturismo.
 *
 * La página de aviturismo ya remata en la ficha de `avistamiento-de-aves`
 * («Reservar la experiencia»), pero el camino de vuelta no existía: quien
 * llegaba al listado o a la ficha no tenía forma de encontrar la lista de
 * especies, la ventana de migratorias ni el perfil del guía, que es justo lo
 * que resuelve la duda antes de reservar. Este aviso cierra ese circuito.
 *
 * Va en un solo componente y no repetido en cada página para que el texto y la
 * promesa del enlace sean los mismos en los dos sitios: si mañana cambia la
 * cifra de especies, se cambia acá.
 */

/**
 * Las experiencias que incluyen avistamiento. Son las únicas fichas donde el
 * aviso viene a cuento: en la de la mascarilla de cacao sería ruido.
 *
 * Se comparan por slug y no por el nombre porque el nombre lo edita el panel;
 * el slug es la URL y no cambia sin una redirección de por medio
 * (ver `lib/slugs-legados.ts`).
 */
export const SLUGS_CON_AVISTAMIENTO = ['avistamiento-de-aves', 'experiencia-aves-cacao']

export function tieneAvistamiento(slug: string) {
  return SLUGS_CON_AVISTAMIENTO.includes(slug)
}

export default function AvisoAviturismo({
  variante,
}: {
  /** Dónde se está pintando: sólo cambia el margen, no la caja. */
  variante: 'listado' | 'ficha'
}) {
  return (
    /* El marco existe porque los dos sitios lo colocan distinto: en el listado
       basta con separarlo de la rejilla, que ya vive dentro del margen lateral
       de la página; en la ficha las secciones son de ancho completo y el margen
       se lo tiene que poner el bloque. */
    <div className={`aviso-avi-marco aviso-avi-marco--${variante}`}>
      {/* La caja entera es el enlace, no un botón al final: en móvil da un área
          táctil de la fila completa en vez de una píldora de 44px, y el ancla
          que lee el buscador pasa a ser el título, que lleva la palabra. Por
          eso la llamada de la derecha es un <span> y no otro <a>: un enlace
          dentro de otro no es HTML válido. */}
      <Link href="/aviturismo" className="aviso-avi">
        <span className="aviso-avi-icono" aria-hidden="true">
          <Binoculars size={22} strokeWidth={1.85} color="var(--color-orange)" />
        </span>
        <span className="aviso-avi-texto">
          <span className="aviso-avi-titulo">Guía de aviturismo en la finca</span>
          <span className="aviso-avi-linea">
            180 especies registradas en un hotspot público de eBird, la ventana de migratorias
            —de octubre a abril— y quién guía la salida.
          </span>
        </span>
        <span className="aviso-avi-cta">Ver la guía</span>
      </Link>
    </div>
  )
}
