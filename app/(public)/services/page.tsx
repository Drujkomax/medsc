import type { Metadata } from "next";
import { getDict } from "~/shared/i18n/dict";
import { SITE_URL, type Lang } from "~/shared/config/site";
import { socialMeta } from "~/shared/config/seo";
import { ServicesView } from "~/widgets/services/services-view";

const baseUrl = SITE_URL;
const canonicalUrl = `${baseUrl}/services`;

// SEO source strings copied verbatim from the original Services page's <SEOHead>.
const SEO: Record<Lang, { title: string; description: string; keywords: string }> = {
  ru: {
    title: "Сервис, монтаж и аренда медоборудования — Med Service Centre",
    description:
      "Монтаж и пуско-наладка, обучение персонала, сервис 24/7 и аренда медоборудования для клиник. Выезд по Ташкенту и регионам Узбекистана.",
    keywords:
      "сервис медицинского оборудования Ташкент, монтаж медоборудования Узбекистан, пуско-наладка медтехники, обучение медперсонала, ремонт медоборудования 24/7, аренда медицинского оборудования Ташкент, сервисный центр медтехники",
  },
  en: {
    title:
      "Medical Equipment Installation, 24/7 Service, and Rental — Tashkent, Uzbekistan",
    description:
      "Installation and commissioning, staff training, 24/7 maintenance, and medical equipment rental for clinics and labs. Coverage in Tashkent and across Uzbekistan with contracts and documentation.",
    keywords:
      "medical equipment service Tashkent, installation Uzbekistan, commissioning, staff training, 24/7 maintenance, medical equipment rental",
  },
  uz: {
    title:
      "Tibbiy uskunalarni o‘rnatish, 24/7 servis va ijara — Toshkent, O‘zbekiston",
    description:
      "O‘rnatish va ishga tushirish, xodimlarni o‘qitish, 24/7 servis va tibbiy uskunalar ijarasi. Toshkent va O‘zbekiston bo‘ylab, shartnoma va hujjatlar bilan.",
    keywords:
      "tibbiy uskunalar servisi Toshkent, o‘rnatish O‘zbekiston, ishga tushirish, xodimlarni o‘qitish, 24/7 servis, tibbiy uskunalar ijarasi",
  },
};

// Service titles/descriptions/types used for the ItemList schema, mirrored 1:1
// from the original Services page content (per language).
const SERVICES: Record<
  Lang,
  { id: string; title: string; description: string; schemaType: string }[]
> = {
  ru: [
    {
      id: "installation",
      title: "Монтаж, пуско-наладка и ввод в эксплуатацию медоборудования",
      description:
        "Профессиональный монтаж и запуск медицинского оборудования для клиник и лабораторий в Ташкенте и по Узбекистану",
      schemaType: "Medical equipment installation and commissioning",
    },
    {
      id: "training",
      title: "Обучение медперсонала работе с оборудованием",
      description:
        "Обучение врачей и медперсонала: теория, практика, безопасность и протокол обучения",
      schemaType: "Medical equipment training",
    },
    {
      id: "service-24-7",
      title: "Сервисное обслуживание и ремонт медоборудования 24/7",
      description:
        "Диагностика, выезд инженера и ремонт медицинского оборудования 24/7 для клиник и лабораторий",
      schemaType: "Medical equipment maintenance and repair",
    },
    {
      id: "rent",
      title: "Аренда медицинского оборудования",
      description:
        "Аренда медоборудования для клиник и проектов: гибкие сроки, обслуживание включено",
      schemaType: "Medical equipment rental",
    },
  ],
  en: [
    {
      id: "installation",
      title: "Medical equipment installation and commissioning",
      description:
        "Professional installation and launch for clinics and labs in Tashkent and across Uzbekistan",
      schemaType: "Medical equipment installation and commissioning",
    },
    {
      id: "training",
      title: "Medical staff training for equipment",
      description:
        "Training for doctors and staff: theory, practice, safety, training protocol",
      schemaType: "Medical equipment training",
    },
    {
      id: "service-24-7",
      title: "24/7 medical equipment service and repair",
      description:
        "Diagnostics, engineer dispatch, and 24/7 repair for clinics and labs",
      schemaType: "Medical equipment maintenance and repair",
    },
    {
      id: "rent",
      title: "Medical equipment rental",
      description:
        "Rental for clinics and projects with flexible terms and service included",
      schemaType: "Medical equipment rental",
    },
  ],
  uz: [
    {
      id: "installation",
      title: "Tibbiy uskunalarni o‘rnatish va ishga tushirish",
      description:
        "Toshkent va O‘zbekiston bo‘ylab klinikalar uchun professional o‘rnatish va ishga tushirish",
      schemaType: "Medical equipment installation and commissioning",
    },
    {
      id: "training",
      title: "Tibbiy xodimlarni uskunada ishlashga o‘qitish",
      description:
        "Nazariya va amaliyot, xavfsizlik va o‘qitish protokoli bilan trening",
      schemaType: "Medical equipment training",
    },
    {
      id: "service-24-7",
      title: "Tibbiy uskunalar uchun 24/7 texnik xizmat",
      description:
        "Diagnostika, muhandis chiqishi va 24/7 servis klinikalar uchun",
      schemaType: "Medical equipment maintenance and repair",
    },
    {
      id: "rent",
      title: "Tibbiy uskunalarni ijaraga berish",
      description:
        "Klinikalar va loyihalar uchun moslashuvchan ijara, servis kiritilgan",
      schemaType: "Medical equipment rental",
    },
  ],
};

const AREA_SERVED = ["Tashkent", "Uzbekistan"];

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getDict();
  const seo = SEO[lang] || SEO.ru;
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: canonicalUrl },
    ...socialMeta({ title: seo.title, description: seo.description, url: canonicalUrl }),
  };
}

export default async function ServicesPage() {
  const { lang } = await getDict();
  const seo = SEO[lang] || SEO.ru;
  const services = SERVICES[lang] || SERVICES.ru;

  // Structured data preserved 1:1 from the original Services page's <SEOHead>.
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seo.title,
    description: seo.description,
    url: canonicalUrl,
    inLanguage: lang,
  };

  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: service.title,
        description: service.description,
        serviceType: service.schemaType,
        url: `${canonicalUrl}#${service.id}`,
        provider: {
          "@type": "Organization",
          name: "Med Service Centre",
          url: baseUrl,
        },
        areaServed: AREA_SERVED,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: baseUrl },
      { "@type": "ListItem", position: 2, name: seo.title, item: canonicalUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([pageSchema, servicesSchema, breadcrumbSchema]) }}
      />
      <ServicesView />
    </>
  );
}
