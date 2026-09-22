import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
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
  // viven aquí sino en Cloudinary (ver lib/imagenes.ts). Por eso `immutable`:
  // durante un año el navegador ni siquiera pregunta.
  //
  // **Para reemplazar una imagen, cambia el nombre del archivo.** Si subes otra
  // foto con el mismo nombre, quien ya la tenga en caché seguirá viendo la vieja
  // hasta que expire, y no hay forma de purgarla desde aquí.
  async headers() {
    return [
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
