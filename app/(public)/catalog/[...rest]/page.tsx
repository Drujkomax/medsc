import type { Metadata } from "next";
import { getProductBySlug, getActiveProducts } from "~/entities/product/api";
import { getManufacturers } from "~/entities/manufacturer/api";
import { getLang } from "~/shared/i18n/lang";
import { SITE_URL, SITE_NAME, type Lang } from "~/shared/config/site";
import { ProductDetailView } from "~/widgets/product-detail/product-detail-view";

const FALLBACK_IMAGE =
  "https://medsc.uz/lovable-uploads/ea1f50a2-d3d1-418f-b6ce-f6e08a722162.png";

const getCategoryLabel = (category: string, language: Lang) => {
  const categoryLabels = {
    diagnostic: { ru: "Диагностическое", en: "Diagnostic", uz: "Diagnostika" },
    surgical: { ru: "Хирургическое", en: "Surgical", uz: "Jarrohlik" },
    monitoring: { ru: "Мониторинг", en: "Monitoring", uz: "Monitoring" },
    laboratory: { ru: "Лабораторное", en: "Laboratory", uz: "Laboratoriya" },
    rehabilitation: {
      ru: "Реабилитационное",
      en: "Rehabilitation",
      uz: "Reabilitatsiya",
    },
    dental: { ru: "Стоматологическое", en: "Dental", uz: "Stomatologiya" },
    ophthalmology: {
      ru: "Офтальмологическое",
      en: "Ophthalmology",
      uz: "Oftalmologiya",
    },
    furniture: {
      ru: "Медицинская мебель",
      en: "Medical Furniture",
      uz: "Tibbiy mebel",
    },
  };
  return (
    categoryLabels[category as keyof typeof categoryLabels]?.[language] ||
    category
  );
};

function localized(
  field: unknown,
  language: Lang,
  fallback = "",
): string {
  if (typeof field === "object" && field !== null) {
    const obj = field as Record<string, string>;
    return obj[language] || obj.ru || obj.en || fallback;
  }
  return field ? String(field) : fallback;
}

function ogImage(cover: string | null | undefined): string {
  if (!cover) return FALLBACK_IMAGE;
  return cover.startsWith("http") ? cover : `https://medsc.uz${cover}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rest: string[] }>;
}): Promise<Metadata> {
  const { rest } = await params;
  const slug = rest[rest.length - 1];
  const product = await getProductBySlug(slug);
  const lang = (await getLang()) as Lang;

  if (!product) {
    return {
      title: "Товар не найден - Med Service Centre",
      description:
        "Карточка медицинского оборудования не найдена. Вернитесь в каталог Med Service Centre, чтобы подобрать подходящее решение и сервис аренды для клиники.",
      keywords:
        "товар не найден, каталог медоборудования, Med Service Centre, выбор оборудования",
      robots: { index: false, follow: false },
    };
  }

  const productName = localized(
    product.name,
    lang,
    "Медицинское оборудование",
  );
  const manufacturers = await getManufacturers();
  const manufacturer = manufacturers.find(
    (m) => m.id === product.manufacturer_id,
  );
  const manufacturerName = localized(manufacturer?.name, lang);
  const categoryLabel = getCategoryLabel(product.category, lang);

  const rawDescription = `${productName} — ${categoryLabel} оборудование Med Service Centre для клиник Узбекистана с поддержкой сервиса, аренды и поставки от официального партнёра.`;
  const metaDescription =
    rawDescription.length > 150
      ? `${rawDescription.slice(0, 149)}…`
      : rawDescription;

  const metaKeywords = [
    productName,
    manufacturerName,
    categoryLabel,
    `купить ${productName}`,
    "медицинское оборудование Ташкент",
    "медицинское оборудование Узбекистан",
    "Med Service Centre",
    "аренда медоборудования",
  ]
    .filter(Boolean)
    .join(", ");

  const canonicalUrl = `${SITE_URL}/catalog/${encodeURIComponent(
    product.slug || product.id,
  )}`;
  const image = ogImage(product.images?.cover);

  return {
    title: `${productName} — купить в Узбекистане | Med Service Centre`,
    description: metaDescription,
    keywords: metaKeywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${productName} — медицинское оборудование`,
      description: `${productName}. Официальная поставка, сервис и аренда медицинского оборудования в Узбекистане от Med Service Centre.`,
      url: canonicalUrl,
      images: [{ url: image }],
    },
    twitter: {
      title: productName,
      description: `${productName} — ${categoryLabel} оборудование. Купить или арендовать в Med Service Centre.`,
      images: [image],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ rest: string[] }>;
}) {
  const { rest } = await params;
  const slug = rest[rest.length - 1];
  const product = await getProductBySlug(slug);

  if (!product) {
    const { notFound } = await import("next/navigation");
    return notFound();
  }

  const lang = (await getLang()) as Lang;
  const [manufacturers, allProducts] = await Promise.all([
    getManufacturers(),
    getActiveProducts(),
  ]);

  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // ── Structured data: Product (+ offers when priced) and BreadcrumbList ──
  const productName = localized(product.name, lang, "Медицинское оборудование");
  const description = localized(product.description, lang, productName);
  const manufacturer = manufacturers.find((m) => m.id === product.manufacturer_id);
  const brandName = localized(manufacturer?.name, lang) || SITE_NAME;
  const canonicalUrl = `${SITE_URL}/catalog/${encodeURIComponent(product.slug || product.id)}`;
  const images = [product.images?.cover, ...(product.images?.gallery || [])]
    .filter(Boolean)
    .map((c) => ogImage(c));
  const priceNum = product.price ? Number(String(product.price).replace(/[^\d.]/g, "")) : NaN;

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description,
    image: images.length ? images : [FALLBACK_IMAGE],
    sku: product.id,
    category: getCategoryLabel(product.category, lang),
    brand: { "@type": "Brand", name: brandName },
    url: canonicalUrl,
    ...(Number.isFinite(priceNum) && priceNum > 0
      ? {
          offers: {
            "@type": "Offer",
            price: priceNum,
            priceCurrency: product.currency || "USD",
            availability: "https://schema.org/InStock",
            url: canonicalUrl,
            seller: { "@type": "Organization", name: SITE_NAME },
          },
        }
      : {
          offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            url: canonicalUrl,
            seller: { "@type": "Organization", name: SITE_NAME },
          },
        }),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Каталог", item: `${SITE_URL}/catalog` },
      { "@type": "ListItem", position: 3, name: productName, item: canonicalUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productSchema, breadcrumbSchema]) }}
      />
      <ProductDetailView product={product} manufacturers={manufacturers} related={related} />
    </>
  );
}
