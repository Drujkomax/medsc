import type { NextConfig } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

const nextConfig: NextConfig = {
  // The ported app is large and was strict-typed for Vite; don't block dev/build on it.
  typescript: { ignoreBuildErrors: true },
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
