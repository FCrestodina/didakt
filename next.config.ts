import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  experimental: {
    turbo: {
      root: path.resolve(__dirname),
    },
  } as any,
  // Mundialito es un único index.html autocontenido: se sirve como estático
  // desde public/ y este rewrite le da la URL limpia del catálogo.
  async rewrites() {
    return [{ source: '/mundialito', destination: '/mundialito/index.html' }];
  },
};

export default nextConfig;
