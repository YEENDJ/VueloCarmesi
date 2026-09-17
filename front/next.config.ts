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
};

// El plugin necesita saber dónde está la config de mensajes: este proyecto no
// usa src/, así que la ruta por defecto (./i18n/request.ts) no la encontraría.
const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

export default withNextIntl(nextConfig);
