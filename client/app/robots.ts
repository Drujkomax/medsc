import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://medsc.uz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/auth"] },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
