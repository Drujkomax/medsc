import type { Metadata } from "next";
import { Suspense } from "react";
import { getActiveProducts } from "~/entities/product/api";
import { getCategories } from "~/entities/category/api";
import { getManufacturers } from "~/entities/manufacturer/api";
import { getDict } from "~/shared/i18n/dict";
import { SITE_URL, type Lang } from "~/shared/config/site";
import { toUrlSlug } from "@/lib/slugify";
import { CatalogView } from "~/widgets/catalog/catalog-view";

type SP = { search?: string; category?: string; manufacturer?: string };

// Fallback categories for display (mirrors the original Catalog component).
const fallbackCategories = {
  all: {
    ru: "Все категории",
    en: "All categories",
    uz: "Barcha kategoriyalar",
  },
};

const getCategoryTag = (
  category: string,
  language: Lang,
  allCategories: Record<string, { ru: string; en: string; uz: string }>,
) => allCategories[category]?.[language] || category;

/** Resolves the SAME SEO strings the original page passed to <SEOHead>. */
async function resolveCatalog(sp: SP) {
  const { lang } = await getDict();
  const language = lang;
  const [products, categories, manufacturers] = await Promise.all([
    getActiveProducts(),
    getCategories(),
    getManufacturers(),
  ]);

  const selectedCategory = sp.category || "all";
  const selectedManufacturer = sp.manufacturer || "all";
  const searchTerm = sp.search || "";

  const allCategories = {
    ...fallbackCategories,
    ...categories.reduce(
      (acc, cat) => {
        acc[cat.value] = cat.name;
        return acc;
      },
      {} as Record<string, { ru: string; en: string; uz: string }>,
    ),
  };

  const selectedManufacturerEntity =
    selectedManufacturer === "all"
      ? null
      : manufacturers.find(
          (manufacturer) =>
            toUrlSlug(manufacturer.slug) === toUrlSlug(selectedManufacturer),
        ) || null;

  const categoryName = getCategoryTag(selectedCategory, language, allCategories);

  const manufacturerName = (() => {
    if (!selectedManufacturerEntity?.name) return "";
    const name = selectedManufacturerEntity.name;
    if (typeof name === "object") {
      const objName = name as Record<string, string>;
      return objName[language] || objName.ru || objName.en || "";
    }
    return String(name);
  })();

  const catalogTitleByLanguage = {
    ru: "Каталог медицинского оборудования в Узбекистане",
    en: "Medical Equipment Catalog in Uzbekistan",
    uz: "O‘zbekistonda tibbiy uskunalar katalogi",
  }[language];

  const locationByLanguage = {
    ru: "в Узбекистане и Ташкенте",
    en: "in Uzbekistan and Tashkent",
    uz: "O‘zbekistonda va Toshkentda",
  }[language];

  const seoTitle = (() => {
    if (selectedCategory !== "all" && manufacturerName) {
      return language === "ru"
        ? `${categoryName} ${manufacturerName} — купить в Узбекистане`
        : language === "en"
          ? `${categoryName} ${manufacturerName} — buy in Uzbekistan`
          : `${categoryName} ${manufacturerName} — O‘zbekistonda sotib olish`;
    }
    if (selectedCategory !== "all") {
      return language === "ru"
        ? `${categoryName} — купить в Узбекистане`
        : language === "en"
          ? `${categoryName} — buy in Uzbekistan`
          : `${categoryName} — O‘zbekistonda sotib olish`;
    }
    if (manufacturerName) {
      return language === "ru"
        ? `${manufacturerName} — купить медоборудование в Узбекистане`
        : language === "en"
          ? `${manufacturerName} — buy medical equipment in Uzbekistan`
          : `${manufacturerName} — O‘zbekistonda tibbiy uskunalarni sotib olish`;
    }
    return catalogTitleByLanguage;
  })();

  const seoDescription = (() => {
    if (selectedCategory !== "all" && manufacturerName) {
      return language === "ru"
        ? `${categoryName} ${manufacturerName} — продажа, сервис и аренда медицинского оборудования ${locationByLanguage}.`
        : language === "en"
          ? `${categoryName} ${manufacturerName} — sales, service, and rental of medical equipment ${locationByLanguage}.`
          : `${categoryName} ${manufacturerName} — tibbiy uskunalarni sotish, servis va ijara ${locationByLanguage}.`;
    }
    if (selectedCategory !== "all") {
      return language === "ru"
        ? `${categoryName}. Продажа, сервис и аренда медицинского оборудования ${locationByLanguage}.`
        : language === "en"
          ? `${categoryName}. Medical equipment sales, service, and rental ${locationByLanguage}.`
          : `${categoryName}. Tibbiy uskunalarni sotish, servis va ijara ${locationByLanguage}.`;
    }
    if (manufacturerName) {
      return language === "ru"
        ? `${manufacturerName} — медицинское оборудование: продажа, аренда и сервис ${locationByLanguage}.`
        : language === "en"
          ? `${manufacturerName} — medical equipment: sales, rental, and service ${locationByLanguage}.`
          : `${manufacturerName} — tibbiy uskunalar: sotuv, ijara va servis ${locationByLanguage}.`;
    }
    return {
      ru: "Продажа и аренда медицинского оборудования: УЗИ, анализаторы, хирургические системы. Поставка по Узбекистану и Ташкенту.",
      en: "Medical equipment sales and rental in Uzbekistan and Tashkent.",
      uz: "O‘zbekistonda va Toshkentda tibbiy uskunalarni sotish va ijaraga berish.",
    }[language];
  })();

  const seoKeywords = [
    "медицинское оборудование Узбекистан",
    "медицинское оборудование Ташкент",
    "купить медоборудование",
    "аренда медицинского оборудования",
    "medical equipment Uzbekistan",
    "buy medical equipment Tashkent",
    "Med Service Centre",
    ...(selectedCategory !== "all"
      ? [
          `${categoryName} оборудование`,
          `купить ${categoryName.toLowerCase()}`,
          `купить ${categoryName.toLowerCase()} в Ташкенте`,
        ]
      : []),
    ...(manufacturerName
      ? [
          `${manufacturerName} оборудование`,
          `купить мед оборудование ${manufacturerName}`,
          `купить медицинские аппараты ${manufacturerName}`,
          `купить мед оборудование ${manufacturerName} в Ташкенте`,
          `купить мед оборудование ${manufacturerName} в Узбекистане`,
        ]
      : []),
  ];

  const queryParams = new URLSearchParams();
  const normalizedCategoryValue =
    selectedCategory !== "all"
      ? Object.keys(allCategories).find(
          (key) => key.toLowerCase() === selectedCategory.toLowerCase(),
        ) || selectedCategory
      : null;
  const normalizedManufacturerSlug = selectedManufacturerEntity
    ? toUrlSlug(selectedManufacturerEntity.slug)
    : null;
  if (normalizedCategoryValue) {
    queryParams.set("category", normalizedCategoryValue);
  }
  if (normalizedManufacturerSlug) {
    queryParams.set("manufacturer", normalizedManufacturerSlug);
  }
  const canonicalUrl = `https://medsc.uz/catalog${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  return {
    language,
    products,
    categories,
    manufacturers,
    seoTitle,
    seoDescription,
    seoKeywords,
    canonicalUrl,
    searchTerm,
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const { seoTitle, seoDescription, seoKeywords, canonicalUrl, searchTerm } =
    await resolveCatalog(sp);

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords.join(", "),
    alternates: { canonical: canonicalUrl },
    robots: searchTerm ? { index: false, follow: true } : undefined,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const {
    products,
    categories,
    manufacturers,
    seoTitle,
    seoDescription,
    canonicalUrl,
  } = await resolveCatalog(sp);

  // Structured data для каталога (mirrors the original <SEOHead> CollectionPage).
  const catalogSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seoTitle,
    description: seoDescription,
    url: canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Med Service Centre",
      url: "https://medsc.uz",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }}
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
