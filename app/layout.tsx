import "../src/index.css";
import type { Metadata, Viewport } from "next";
import { SITE_URL, SITE_NAME } from "~/shared/config/site";

const OG_IMAGE = "/lovable-uploads/ea1f50a2-d3d1-418f-b6ce-f6e08a722162.png";
const LOGO = "/lovable-uploads/acdce942-978c-4243-9068-38f2c5bb0284.png";

const DESCRIPTION =
  "Med Service Centre — поставка, сервис и аренда медицинского оборудования в Узбекистане: УЗИ, анализаторы, электрохирургия, лабораторные системы. 8 лет опыта, 300+ проектов оснащения клиник.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Med Service Centre — медицинское оборудование в Узбекистане",
    template: "%s | Med Service Centre",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  keywords: [
    "медицинское оборудование Узбекистан",
    "медицинское оборудование Ташкент",
    "купить медоборудование",
    "аренда медицинского оборудования",
    "УЗИ аппарат",
    "лабораторное оборудование",
    "электрохирургия",
    "medical equipment Uzbekistan",
    "Med Service Centre",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ru_RU",
    alternateLocale: ["en_US", "uz_UZ"],
    url: SITE_URL,
    title: "Med Service Centre — медицинское оборудование в Узбекистане",
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Med Service Centre — медицинское оборудование в Узбекистане",
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  icons: { icon: LOGO, shortcut: LOGO, apple: LOGO },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: true, email: true, address: true },
};

export const viewport: Viewport = {
  themeColor: "#0C1139",
  width: "device-width",
  initialScale: 1,
};

// Global Organization / medical-equipment business — brand + local SEO signal.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  legalName: "Med Service Centre",
  url: SITE_URL,
  logo: `${SITE_URL}${LOGO}`,
  image: `${SITE_URL}${OG_IMAGE}`,
  description: DESCRIPTION,
  email: "info@medsc.uz",
  foundingDate: "2016",
  areaServed: { "@type": "Country", name: "Uzbekistan" },
  address: {
    "@type": "PostalAddress",
    addressCountry: "UZ",
    addressLocality: "Ташкент",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: "info@medsc.uz",
    areaServed: "UZ",
    availableLanguage: ["ru", "uz", "en"],
  },
  sameAs: ["https://t.me/medservice_centre"],
  knowsAbout: [
    "Медицинское оборудование",
    "УЗИ-аппараты",
    "Лабораторное оборудование",
    "Электрохирургия",
    "Сервис медтехники",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Static default language; the client <I18nProvider> updates <html lang> after
  // hydration based on the `lang` cookie. Not reading cookies() here is what keeps
  // every page statically prerenderable / CDN-cacheable.
  return (
    <html lang="ru">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        {children}
      </body>
    </html>
  );
}
