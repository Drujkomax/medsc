import type { NextConfig } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

const nextConfig: NextConfig = {
  // Self-host (Docker) build emits a standalone server (`node server.js`); the flag
  // is only set in the Dockerfile, so other builds are unaffected.
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  // The ported app is large and was strict-typed for Vite; don't block dev/build on it.
  typescript: { ignoreBuildErrors: true },
  // Tree-shake big barrel libraries so only the icons/helpers actually used land in
  // the shared first-load bundle.
  experimental: { optimizePackageImports: ["lucide-react", "date-fns", "recharts"] },
  // Allow next/image to optimize the stored product photos (≈500KB originals) into
  // small WebP thumbnails so the catalog isn't shipping full-size images as cards.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.medsc.uz" },
      { protocol: "https", hostname: "medsc.api.jaragency.uz" },
      { protocol: "https", hostname: "medsc.uz" },
    ],
  },
  // Serve stored media via the client origin → proxied to the backend (port-independent).
  async rewrites() {
    return [{ source: "/storage/:path*", destination: `${API}/storage/:path*` }];
  },
  // Preserve the legacy SPA routes after the [...slug] fallback is removed.
  async redirects() {
    return [
      { source: "/product/:id", destination: "/catalog/:id", permanent: true },
      { source: "/products/:id", destination: "/catalog/:id", permanent: true },
      { source: "/catalog/products/:slug", destination: "/catalog/:slug", permanent: true },
      { source: "/auth", destination: "/admin", permanent: false },
      { source: "/setup-director", destination: "/admin/director-registration", permanent: false },
      { source: "/director-registration", destination: "/admin/director-registration", permanent: false },
    ];
  },
};

export default nextConfig;
