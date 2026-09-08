import type { NextConfig } from "next";
import path from "path";

// Las tres imágenes que renderiza la app (tapa del curso, bloque de imagen en
// el editor y en la preview) usan `<img>` crudo, no `next/image`. Con
// `images.remotePatterns` en `'**'`, el optimizador quedaba habilitado para
// cualquier host HTTPS sin que ningún código lo usara: `/_next/image?url=...`
// era un proxy de imágenes abierto — verificado sirviendo un PNG de un dominio
// externo. Sin `remotePatterns`, el optimizador rechaza todo host remoto.
// Si algún día se usa `next/image` con imágenes de afuera, agregar acá SOLO los
// hosts concretos.

const cabecerasDeSeguridad = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Robot mensajero usa el micrófono y la Billetera usa la cámara: se permiten
  // en el propio origen y se bloquean para cualquier iframe de terceros.
  // Un `camera=()` a secas rompería el escaneo de QR.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
];

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      root: path.resolve(__dirname),
    },
  } as any,
  // Mundialito es un único index.html autocontenido: se sirve como estático
  // desde public/ y este rewrite le da la URL limpia del catálogo.
  async rewrites() {
    return [{ source: "/mundialito", destination: "/mundialito/index.html" }];
  },
  async headers() {
    return [{ source: "/:path*", headers: cabecerasDeSeguridad }];
  },
};

export default nextConfig;
