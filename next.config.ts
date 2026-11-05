import type { NextConfig } from "next";

/**
 * Dos modos de compilación:
 *  - Normal (npm run dev / build / start): aplicación completa con rutas /api/ai/*.
 *  - Estático (npm run build:pages): exportación para GitHub Pages. No hay servidor,
 *    por lo que las rutas API se excluyen y la IA aparece como "no disponible".
 *
 * Variables (solo modo estático):
 *   NEXT_PUBLIC_STATIC_EXPORT=true
 *   NEXT_PUBLIC_BASE_PATH=/nombre-del-repositorio
 */
const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(isStatic
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
        basePath,
        assetPrefix: basePath || undefined,
      }
    : {}),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
