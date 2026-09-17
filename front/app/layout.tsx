import './globals.css'

/**
 * Layout raíz sin <html>: lo montan sus hijos.
 *
 * El sitio tiene dos ramas con necesidades distintas. El público vive bajo
 * [locale] y necesita que `lang` cambie con el idioma; el panel es siempre
 * español y no tiene segmento de idioma. Como no puede haber dos <html>
 * anidados, esta raíz solo deja pasar y cada rama abre el suyo.
 *
 * El import de globals.css se queda aquí a propósito: así lo heredan las dos
 * ramas y no hay que acordarse de repetirlo en cada una.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
