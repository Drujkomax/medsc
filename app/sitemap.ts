import type { MetadataRoute } from "next";
import { getCategories } from "~/entities/category/api";
import { getManufacturers } from "~/entities/manufacturer/api";
import { toUrlSlug } from "@/lib/slugify";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://medsc.uz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages: no lastModified (build-time now() lies about content freshness).
  const statics: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/catalog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/services`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/cases`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/contacts`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/privacy-policy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let categoryPages: MetadataRoute.Sitemap = [];
  let manufacturerPages: MetadataRoute.Sitemap = [];
  let products: MetadataRoute.Sitemap = [];

  try {
    const [categories, manufacturers] = await Promise.all([
      getCategories(),
      getManufacturers(),
    ]);
    const slugById = new Map(manufacturers.map((m) => [m.id, toUrlSlug(m.slug)]));

    categoryPages = categories.map((c) => ({
      url: `${SITE}/catalog/category/${encodeURIComponent(c.value)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    manufacturerPages = manufacturers
      .filter((m) => m.slug)
      .map((m) => ({
        url: `${SITE}/catalog/manufacturer/${toUrlSlug(m.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));

    // Products: URLs match the canonical (manufacturer-prefixed when available).
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
      .map((p: any) => {
        const ms = slugById.get(p.manufacturer_id) || "";
        const path =
          ms && ms !== "unknown"
            ? `/catalog/${ms}/${p.slug}`
            : `/catalog/${p.slug}`;
        return {
          url: `${SITE}${path}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        };
      });
  } catch {
    // API unreachable at build → ship the static sitemap only
  }

  return [...statics, ...categoryPages, ...manufacturerPages, ...products];
}
