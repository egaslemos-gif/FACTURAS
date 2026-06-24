const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: false, // Controlado manualmente pelo versionGuard e UpdateBanner
  publicExcludes: ['!**/*.wasm'], // Manter WASM do sql.js
  cleanupOutdatedCaches: true, // Forçar limpeza de caches antigos para evitar storage eviction
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  extendDefaultRuntimeCaching: true,
  runtimeCaching: [
    {
      urlPattern: /\/api\/auth\/.*$/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'auth-network-only',
      }
    },
    {
      urlPattern: /\/api\/sync\/.*$/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'sync-queue',
        backgroundSync: {
          name: 'proforma360-sync-queue',
          options: {
            maxRetentionTime: 24 * 60 // 24 hours
          }
        }
      }
    },
    {
      // Fallback para rotas dinâmicas
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      }
    }
  ],
  // Mantemos o fallback document para cenários de Cold Boot onde a cache da página falha.
  // Isto impede que o Android mostre o ecrã nativo genérico "You're offline".
  fallbacks: {
    document: '/offline-shell.html',
  },
});

const buildVersion = `build_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: buildVersion,
  },
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  webpack: (config) => {
    // Para sql.js WASM support no Next.js (Webpack)
    config.resolve.fallback = { fs: false, path: false, crypto: false };
    return config;
  },
  turbopack: {}
};

module.exports = withPWA(nextConfig);
