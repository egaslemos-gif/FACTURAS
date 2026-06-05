const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: false, // Controlado manualmente pelo versionGuard e UpdateBanner
  publicExcludes: ['!**/*.wasm'], // Manter WASM do sql.js
  cleanupOutdatedCaches: true, // Forçar limpeza de caches antigos para evitar storage eviction
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 ano
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
        },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
        },
      },
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'apis',
        networkTimeoutSeconds: 5, // Falha rapidamente se a rede estiver morta/degradada
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 dia
        },
      },
    },
    {
      // App Shell / Dashboard - StaleWhileRevalidate for instant Cold Boot offline.
      // This guarantees the shell loads immediately from cache, and updates in the background.
      urlPattern: /^https?:\/\/[^/]+\/dashboard.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'dashboard-pages',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias para garantir sobrevivência
        },
        matchOptions: {
          ignoreSearch: true,
        },
      },
    },
    {
      urlPattern: /.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'others',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 1 dia
        },
      },
    },
  ],
  // Mantemos o fallback document para cenários de Cold Boot onde a cache da página falha.
  // Isto impede que o Android mostre o ecrã nativo genérico "You're offline".
  fallbacks: {
    document: '/offline.html',
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
