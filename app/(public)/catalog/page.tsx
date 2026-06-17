import type { Metadata } from "next";
import { Suspense } from "react";
import { getActiveProducts } from "~/entities/product/api";
import { getCategories } from "~/entities/category/api";
import { getManufacturers } from "~/entities/manufacturer/api";
import { SITE_URL } from "~/shared/config/site";
import { toUrlSlug } from "@/lib/slugify";
import { CatalogView } from "~/widgets/catalog/catalog-view";

// Public catalog: prerendered + revalidated (ISR) so it is CDN/browser cacheable.
// Search, category/manufacturer filtering and pagination all run on the client
// (CatalogView reads the URL query via useSearchParams), so the page itself does
// NOT depend on searchParams and stays static. SEO copy is the default (Russian)
// catalog text — the language a crawler sees, applied client-side for visitors.
export const revalidate = 300;

const SEO_TITLE = "Каталог медицинского оборудования в Узбекистане";
const SEO_DESCRIPTION =
  "Продажа и аренда медицинского оборудования: УЗИ, анализаторы, хирургические системы. Поставка по Узбекистану и Ташкенту.";
const SEO_KEYWORDS = [
  "медицинское оборудование Узбекистан",
  "медицинское оборудование Ташкент",
  "купить медоборудование",
  "аренда медицинского оборудования",
  "medical equipment Uzbekistan",
  "buy medical equipment Tashkent",
  "Med Service Centre",
];
const CANONICAL = `${SITE_URL}/catalog`;

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  keywords: SEO_KEYWORDS.join(", "),
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    url: CANONICAL,
    type: "website",
  },
};

export default async function CatalogPage() {
  const [products, categories, manufacturers] = await Promise.all([
    getActiveProducts(),
    getCategories(),
    getManufacturers(),
  ]);

  // ItemList of the listed products (parity with the original second JSON-LD blob).
  const slugOf = (mid: string | null) => manufacturers.find((m) => m.id === mid)?.slug;
  const pathOf = (p: (typeof products)[number]) => {
    const ms = toUrlSlug(slugOf(p.manufacturer_id));
    const ps = p.slug || p.id;
    return ms && ms !== "unknown" ? `/catalog/${ms}/${ps}` : `/catalog/${ps}`;
  };

  const catalogSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: SEO_TITLE,
    description: SEO_DESCRIPTION,
    url: CANONICAL,
    isPartOf: {
      "@type": "WebSite",
      name: "Med Service Centre",
      url: SITE_URL,
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Каталог", item: CANONICAL },
    ],
  };
  const itemListSchema = products.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: products.slice(0, 24).map((p, i) => {
          const cover = p.images?.cover || "";
          return {
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "WebPage",
              name: p.name.ru,
              url: `${SITE_URL}${pathOf(p)}`,
              image: cover
                ? cover.startsWith("http")
                  ? cover
                  : `${SITE_URL}${cover}`
                : undefined,
            },
          };
        }),
      }
    : null;
  const schemas = [
    catalogSchema,
    breadcrumbSchema,
    ...(itemListSchema ? [itemListSchema] : []),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <Suspense fallback={null}>
        <CatalogView
          products={products}
          categories={categories}
          manufacturers={manufacturers}
        />
      </Suspense>
    </>
  );
}
