import "../src/index.css";
import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";
import { SITE_URL, SITE_NAME } from "~/shared/config/site";

// Display serif for headlines (Latin + Cyrillic), self-hosted via next/font.
const display = Source_Serif_4({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const OG_IMAGE = "/images/og-image.png";
const LOGO = "/images/logo-icon.png";

const DESCRIPTION =
  "Med Service Centre — поставка, сервис и аренда медицинского оборудования в Узбекистане: УЗИ, анализаторы, лабораторные системы. 8 лет опыта, 300+ проектов.";

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
    url: SITE_URL,
    title: "Med Service Centre — медицинское оборудование в Узбекистане",
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 770, height: 820, alt: SITE_NAME }],
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
  "@type": ["Organization", "MedicalBusiness"],
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  legalName: "Med Service Centre",
  url: SITE_URL,
  logo: `${SITE_URL}${LOGO}`,
  image: `${SITE_URL}${OG_IMAGE}`,
  description: DESCRIPTION,
  email: "info@medsc.uz",
  telephone: "+998909443482",
  foundingDate: "2016",
  priceRange: "$$$",
  areaServed: { "@type": "Country", name: "Uzbekistan" },
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Асака, 32",
    addressLocality: "Ташкент",
    addressRegion: "Tashkent",
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
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: "info@medsc.uz",
    telephone: "+998909443482",
    areaServed: "UZ",
    availableLanguage: ["ru", "uz", "en"],
  },
  sameAs: [
    "https://t.me/medservice_centre",
    "https://www.facebook.com/profile.php?id=61576982724139",
    "https://www.instagram.com/medservicecentreuz/",
    "https://www.youtube.com/@MedService_centre/shorts",
  ],
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
    <html lang="ru" className={display.variable}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        {children}
      </body>
    </html>
  );
}
