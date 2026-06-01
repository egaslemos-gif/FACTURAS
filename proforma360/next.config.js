const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  webpack: (config) => {
    // For sql.js WASM support in Next.js (Webpack)
    config.resolve.fallback = { fs: false, path: false, crypto: false };
    return config;
  },
  turbopack: {}
};

module.exports = withPWA(nextConfig);
