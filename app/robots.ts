import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://medsc.uz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Block admin/auth + faceted filter query URLs. The static /catalog serves
      // identical HTML for every ?category/?manufacturer/?search/?page combo, so
      // those are duplicate/faceted crawl traps. Dedicated /catalog/category/* and
      // /catalog/manufacturer/* pages are the indexable entry points instead.
      disallow: [
        "/admin",
        "/auth",
        "/*?search=",
        "/*?category=",
        "/*?manufacturer=",
        "/*?page=",
      ],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
