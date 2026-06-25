import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getActiveProducts } from "~/entities/product/api";
import { getCategories } from "~/entities/category/api";
import { getManufacturers } from "~/entities/manufacturer/api";
import { SITE_URL, SITE_NAME } from "~/shared/config/site";
import { toUrlSlug } from "@/lib/slugify";
import { CatalogView } from "~/widgets/catalog/catalog-view";

const OG_IMAGE = "https://medsc.uz/images/og-image.png";

// Indexable manufacturer (brand) landing pages: prerendered + ISR.
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const manufacturers = await getManufacturers();
  return manufacturers
    .filter((m) => m.slug)
    .map((m) => ({ slug: toUrlSlug(m.slug) }));
}

async function findManufacturer(slug: string) {
  const manufacturers = await getManufacturers();
  return manufacturers.find((m) => toUrlSlug(m.slug) === slug) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = await findManufacturer(slug);
  if (!m) {
    return { title: "Производитель не найден | Med Service Centre", robots: { index: false, follow: true } };
  }
  const canonical = `${SITE_URL}/catalog/manufacturer/${encodeURIComponent(slug)}`;
  const title = `${m.name} — медицинское оборудование | ${SITE_NAME}`;
  const description = `${m.name}: продажа, аренда и сервис медицинского оборудования в Узбекистане от официального партнёра Med Service Centre. Поставка по Ташкенту и регионам.`;

  return {
    title,
    description,
    keywords: [
      m.name,
      `${m.name} Узбекистан`,
      `${m.name} Ташкент`,
      "медицинское оборудование",
      SITE_NAME,
    ].join(", "),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: SITE_NAME,
      locale: "ru_RU",
      images: [{ url: OG_IMAGE, width: 770, height: 820, alt: `${m.name} — ${SITE_NAME}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE] },
  };
}

export default async function ManufacturerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [manufacturer, products, categories, manufacturers] = await Promise.all([
    findManufacturer(slug),
    getActiveProducts(),
    getCategories(),
    getManufacturers(),
  ]);
  if (!manufacturer) notFound();

  const canonical = `${SITE_URL}/catalog/manufacturer/${encodeURIComponent(slug)}`;
  const byManufacturer = products.filter((p) => p.manufacturer_id === manufacturer.id);

  const pathOf = (p: (typeof products)[number]) => {
    const ms = toUrlSlug(manufacturer.slug);
    const ps = p.slug || p.id;
    return ms && ms !== "unknown" ? `/catalog/${ms}/${ps}` : `/catalog/${ps}`;
  };
  const abs = (cover?: string | null) =>
    cover ? (cover.startsWith("http") ? cover : `${SITE_URL}${cover}`) : undefined;

  const brandSchema = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: manufacturer.name,
    url: canonical,
  };
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${manufacturer.name} — медицинское оборудование`,
    description: `${manufacturer.name}: каталог медицинского оборудования с продажей, арендой и сервисом в Узбекистане от Med Service Centre.`,
    url: canonical,
    numberOfItems: byManufacturer.length,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    about: brandSchema,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Каталог", item: `${SITE_URL}/catalog` },
      { "@type": "ListItem", position: 3, name: manufacturer.name, item: canonical },
    ],
  };
  const itemListSchema = byManufacturer.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: byManufacturer.slice(0, 24).map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: p.name?.ru || p.name,
            url: `${SITE_URL}${pathOf(p)}`,
            image: abs(p.images?.cover),
            brand: { "@type": "Brand", name: manufacturer.name },
          },
        })),
      }
    : null;

  const schemas = [collectionSchema, breadcrumbSchema, ...(itemListSchema ? [itemListSchema] : [])];

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
          initialManufacturer={slug}
        />
      </Suspense>
    </>
  );
}
