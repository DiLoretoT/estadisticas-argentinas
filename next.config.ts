import type { NextConfig } from "next";

/**
 * Content Security Policy.
 *
 * - `style-src 'unsafe-inline'` es necesario porque Framer Motion inyecta
 *   estilos inline. Nonces no funcionan con SSG/ISR — habría que pasar todo a
 *   dynamic rendering.
 * - `connect-src` permite Vercel Analytics + Vercel Insights + jsdelivr.
 * - `img-src https:` para flags de monedas LATAM y branding via CDN.
 */
const CSP = [
  "default-src 'self'",
  // static.cloudflareinsights.com = beacon de Cloudflare Web Analytics
  // (inyectado automáticamente por CF cuando el proxy está activo).
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://cdn.jsdelivr.net https://raw.githubusercontent.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://cloudflareinsights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      // Security headers en TODAS las rutas
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
      // Cache + CORS abierto para la API pública
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/argentina",
        destination: "/",
        permanent: true,
      },
      {
        source: "/argentina/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
