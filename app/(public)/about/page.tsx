import type { Metadata } from "next";
import { getDict } from "~/shared/i18n/dict";
import { SITE_URL, type Lang } from "~/shared/config/site";
import { AboutView } from "~/widgets/about/about-view";

const baseUrl = SITE_URL;
const canonicalUrl = `${baseUrl}/about`;

// SEO source strings copied verbatim from the original About page's <SEOHead>.
const SEO: Record<Lang, { title: string; description: string; keywords: string }> = {
  ru: {
    title: "О компании Med Service Centre",
    description:
      "Med Service Centre — поставщик медицинского оборудования в Узбекистане. Поставка, аренда, сервис, обучение персонала и подбор техники для клиник.",
    keywords:
      "о компании Med Service Centre, медицинское оборудование Узбекистан, поставка медтехники Ташкент, аренда медоборудования, сервис медтехники",
  },
  en: {
    title: "About Med Service Centre",
    description:
      "Med Service Centre supplies medical equipment in Uzbekistan. Sales, rental, service, staff training, and procurement support for clinics.",
    keywords:
      "Med Service Centre, medical equipment Uzbekistan, supply in Tashkent, rental, service and training",
  },
  uz: {
    title: "Med Service Centre haqida",
    description:
      "Med Service Centre — O'zbekistonda tibbiy uskunalar yetkazib beruvchi. Sotuv, ijara, servis va xodimlarni o'qitish.",
    keywords:
      "Med Service Centre, tibbiy uskunalar O'zbekiston, Toshkent yetkazib berish, ijara, servis",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getDict();
  const seo = SEO[lang] || SEO.ru;
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: canonicalUrl },
  };
}

export default async function AboutPage() {
  const { lang } = await getDict();
  const seo = SEO[lang] || SEO.ru;

  // Structured data preserved 1:1 from the original About page's <SEOHead>.
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: seo.title,
    description: seo.description,
    url: canonicalUrl,
    inLanguage: lang,
    about: {
      "@type": "Organization",
      name: "Med Service Centre",
      url: baseUrl,
      areaServed: "UZ",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: lang === "ru" ? "Главная" : lang === "en" ? "Home" : "Bosh sahifa",
        item: `${baseUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: seo.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([aboutSchema, breadcrumbSchema]) }}
      />
      <AboutView />
    </>
  );
}
