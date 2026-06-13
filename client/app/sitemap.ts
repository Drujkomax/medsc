import type { MetadataRoute } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://medsc.uz";

const STATIC_PATHS = ["", "/catalog", "/services", "/cases", "/about", "/contacts", "/privacy-policy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const statics: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: SITE + p,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  let products: MetadataRoute.Sitemap = [];
  try {
    const r = await fetch(`${API}/db/products`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        op: "select",
        filters: [
          { col: "status", op: "eq", val: "active" },
          { col: "archived", op: "eq", val: false },
        ],
      }),
      next: { revalidate: 3600 },
    });
    const j = await r.json();
    products = (j?.data || [])
      .filter((p: any) => p?.slug)
      .map((p: any) => ({
        url: `${SITE}/catalog/products/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch {
    // API unreachable at build → ship the static sitemap only
  }

  return [...statics, ...products];
}
