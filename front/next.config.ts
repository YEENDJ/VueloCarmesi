import type { NextConfig } from "next";

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

export default nextConfig;
