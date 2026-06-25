import type { Metadata } from "next";
import { getDict } from "~/shared/i18n/dict";
import { SITE_URL } from "~/shared/config/site";
import { getSiteContacts } from "~/entities/site-contacts/api";
import { socialMeta } from "~/shared/config/seo";
import { ContactsView } from "~/widgets/contacts/contacts-view";

const baseUrl = SITE_URL;
const canonicalUrl = `${baseUrl}/contacts`;

// SEO source strings copied verbatim from the original Contacts page's <SEOHead>.
const SEO = {
  title: "Контакты Med Service Centre — Ташкент, Узбекистан",
  description:
    "Контакты Med Service Centre™: офис в Ташкенте, телефон, e-mail, карта и онлайн-форма для закупки и аренды медтехники, сервисных заявок и консультаций.",
  keywords:
    "контакты Med Service Centre, медицинское оборудование Ташкент, телефон медтехника, e-mail медоборудование, карта офиса Ташкент, онлайн форма заявки",
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO.title,
    description: SEO.description,
    keywords: SEO.keywords,
    alternates: { canonical: canonicalUrl },
    ...socialMeta({ title: SEO.title, description: SEO.description, url: canonicalUrl }),
  };
}

const addressTranslations = {
  ru: "Узбекистан, Ташкент, ул. Асака, 32",
  en: "Uzbekistan, Tashkent, Asaka St., 32",
  uz: "O'zbekiston, Toshkent, Asaka ko'chasi, 32",
} as const;

// Localized title/subtitle used for the ContactPage schema (copied 1:1 from the original).
const content = {
  ru: { title: "Контакты", subtitle: "Свяжитесь с нами любым удобным способом" },
  en: { title: "Contacts", subtitle: "Contact us in any convenient way" },
  uz: { title: "Aloqa", subtitle: "Biz bilan qulay usulda bog'laning" },
} as const;

export default async function ContactsPage() {
  const { lang } = await getDict();

  let siteContacts: any = null;
  try {
    siteContacts = await getSiteContacts();
  } catch {
    siteContacts = null;
  }

  // Mirror the original contactData defaults so the structured data is identical.
  const contactData = {
    phone: siteContacts?.phone || "",
    email: siteContacts?.email || "info@medsc.uz",
    address: siteContacts?.address || "",
    telegram: siteContacts?.telegram || "@medservice_centre",
    whatsapp: siteContacts?.whatsapp || "+998 90 944 34 82",
    facebook: siteContacts?.facebook || "https://www.facebook.com/profile.php?id=61576982724139",
    instagram: siteContacts?.instagram || "https://www.instagram.com/medservicecentreuz/",
    youtube: siteContacts?.youtube || "https://www.youtube.com/@MedService_centre/shorts",
  };

  const currentContent = content[lang] || content.ru;

  const phoneValue = contactData.phone.replace(/[^\d+]/g, "");
  const whatsappValue = contactData.whatsapp.replace(/[^\d]/g, "");
  const telegramUrl = contactData.telegram.startsWith("http")
    ? contactData.telegram
    : `https://t.me/${contactData.telegram.replace("@", "")}`;
  const addressValue = contactData.address || addressTranslations[lang];

  // Structured data preserved 1:1 from the original Contacts page's <SEOHead>.
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: currentContent.title,
    description: currentContent.subtitle,
    url: canonicalUrl,
    inLanguage: lang,
    mainEntity: {
      "@type": ["Organization", "MedicalBusiness"],
      name: "Med Service Centre",
      url: baseUrl,
      email: contactData.email,
      telephone: phoneValue || contactData.phone,
      priceRange: "$$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: addressValue,
        addressLocality: "Tashkent",
        addressCountry: "UZ",
      },
      geo: { "@type": "GeoCoordinates", latitude: 41.311081, longitude: 69.279737 },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "09:00",
          closes: "18:00",
        },
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: phoneValue || contactData.phone,
          contactType: "sales",
          areaServed: "UZ",
          availableLanguage: ["ru", "en", "uz"],
        },
      ],
      sameAs: [
        contactData.facebook,
        contactData.instagram,
        contactData.youtube,
        telegramUrl,
        whatsappValue ? `https://wa.me/${whatsappValue}` : "",
      ].filter(Boolean),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: `${baseUrl}/` },
      { "@type": "ListItem", position: 2, name: SEO.title, item: canonicalUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([contactSchema, breadcrumbSchema]) }}
      />
      <ContactsView siteContacts={siteContacts} />
    </>
  );
}
