import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // MilesWeb runs the app with Node.js ("Setup Node.js App"): a self-contained server.js build.
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Partner applications may carry up to 3 documents of 10 MB each, capped at 20 MB in total.
      bodySizeLimit: "21mb",
    },
  },
  async redirects() {
    // The EMS page lives at the address from the owner's content brief; keep the older short links working.
    return [
      { source: "/ems", destination: "/vercenji-ems-wellness-training-suit", permanent: true },
      { source: "/ems/:path*", destination: "/vercenji-ems-wellness-training-suit", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
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
