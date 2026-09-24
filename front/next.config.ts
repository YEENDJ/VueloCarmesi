import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Cabeceras de seguridad para todas las rutas. Vercel solo ponía HSTS.
 *
 * La CSP es la parte que no rompe nada: prohíbe que otro sitio meta estas
 * páginas en un iframe (clickjacking sobre el panel), que un `<base>` inyectado
 * cambie a dónde apuntan los enlaces relativos, los plugins, y que un
 * formulario mande a otro dominio. No limita `script-src`: Next mete scripts en
 * línea en cada página, y cerrarlo exige nonces, que obligan a renderizar todo
 * en cada petición y apagan la caché estática. Si algún día se hace, es aquí.
 */
const CABECERAS_SEGURIDAD = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  // El gemelo viejo de frame-ancestors, para navegadores que no leen la CSP.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  // Anunciar «X-Powered-By: Next.js» solo le ahorra trabajo a quien busca qué
  // versión atacar.
  poweredByHeader: false,

  // El portafolio comercial es un único HTML estático en public/portafolio: 21 hojas
  // A4 horizontales con las fuentes y las imágenes incrustadas. Al no pedir ningún
  // asset relativo, el rewrite es seguro y deja la URL corta para compartirlo.
  // Se genera con portafolio/generar-pdf.py — no editar el HTML de salida.
  async rewrites() {
    return [
      { source: '/portafolio', destination: '/portafolio/index.html' },
    ];
  },

  // Lo que hay en public/ lo sirve Next con `max-age=0, must-revalidate`, así que
  // cada foto del sitio se revalida en cada carga: un 304 por imagen y por visita,
  // aunque el archivo no haya cambiado desde que se subió al repositorio.
  //
  // Estas rutas no llevan hash en el nombre, pero tampoco cambian solas: las fotos
  // y los sellos entran por commit, y las que edita el negocio desde el panel no
  // viven aquí sino en Cloudinary. Por eso `immutable`:
  // durante un año el navegador ni siquiera pregunta.
  //
  // **Para reemplazar una imagen, cambia el nombre del archivo.** Si subes otra
  // foto con el mismo nombre, quien ya la tenga en caché seguirá viendo la vieja
  // hasta que expire, y no hay forma de purgarla desde aquí.
  async headers() {
    return [
      { source: '/:path*', headers: CABECERAS_SEGURIDAD },
      {
        source: '/:carpeta(images|certificaciones|fonts)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

// El plugin necesita saber dónde está la config de mensajes: este proyecto no
// usa src/, así que la ruta por defecto (./i18n/request.ts) no la encontraría.
const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

export default withNextIntl(nextConfig);
