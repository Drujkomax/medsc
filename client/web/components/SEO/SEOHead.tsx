import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

type SupportedLang = "ru" | "en" | "uz";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noindex?: boolean;
  nofollow?: boolean;
  structuredData?: object | object[];
}

const BASE_URL = "https://medsc.uz";
const LOCALE_BY_LANG: Record<SupportedLang, string> = {
  ru: "ru_RU",
  en: "en_US",
  uz: "uz_UZ",
};
const TRACKING_QUERY_PARAMS = new Set([
  "gclid",
  "fbclid",
  "yclid",
  "msclkid",
  "_openstat",
  "ref",
  "source",
]);

const resolveAbsoluteUrl = (value: string, baseUrl: string) => {
  try {
    return new URL(value, baseUrl);
  } catch {
    return new URL(baseUrl);
  }
};

const normalizeCanonicalUrl = (value: string, baseUrl: string) => {
  const url = resolveAbsoluteUrl(value, baseUrl);

  url.hash = "";
  url.pathname = url.pathname.replace(/\/{2,}/g, "/");
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  for (const key of [...url.searchParams.keys()]) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.startsWith("utm_") || TRACKING_QUERY_PARAMS.has(lowerKey)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();

  const search = url.searchParams.toString();
  return `${url.origin}${url.pathname}${search ? `?${search}` : ""}`;
};

const SEOHead = ({
  title = "Med Service Centre - Медицинское оборудование в Узбекистане",
  description = "Med Service Centre — поставщик медтехники в Узбекистане: УЗИ, анализаторы ABL800 Flex, системы BOWA ARC 400, продажа, сервис и аренда клиникам страны.",
  keywords = "медицинское оборудование Узбекистан, УЗИ аппарат Ташкент, лабораторное оборудование аренда, ABL800 Flex, хирургическое оборудование BOWA ARC 400, медицинская техника клиники Узбекистан",
  image = "/lovable-uploads/ea1f50a2-d3d1-418f-b6ce-f6e08a722162.png",
  url,
  type = "website",
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  twitterTitle,
  twitterDescription,
  twitterImage,
  noindex = false,
  nofollow = false,
  structuredData,
}: SEOHeadProps) => {
  const location = useLocation();

  // Canonical uses route URL by default and is normalized to prevent duplicates.
  const currentPath = `${location.pathname}${location.search}`;
  const currentUrl = url || `${BASE_URL}${currentPath}`;
  const canonicalUrl = normalizeCanonicalUrl(canonical || currentUrl, BASE_URL);
  const canonicalUrlObject = new URL(canonicalUrl);
  const fullImageUrl = resolveAbsoluteUrl(image, BASE_URL).toString();

  const langParam = canonicalUrlObject.searchParams.get("lang");
  const activeLang: SupportedLang =
    langParam === "en" || langParam === "uz" ? langParam : "ru";
  const activeLocale = LOCALE_BY_LANG[activeLang];
  const alternateLocales = (Object.entries(LOCALE_BY_LANG) as Array<
    [SupportedLang, string]
  >)
    .filter(([lang]) => lang !== activeLang)
    .map(([, locale]) => locale);

  // Resolve OG and Twitter values
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;
  const resolvedOgImage = ogImage || fullImageUrl;
  const resolvedOgUrl = ogUrl || canonicalUrl;
  const resolvedTwitterTitle = twitterTitle || resolvedOgTitle;
  const resolvedTwitterDescription =
    twitterDescription || resolvedOgDescription;
  const resolvedTwitterImage = twitterImage || resolvedOgImage;

  const robotsDirectives = [noindex ? "noindex" : "index"];
  robotsDirectives.push(nofollow ? "nofollow" : "follow");
  if (!noindex) {
    robotsDirectives.push(
      "max-snippet:-1",
      "max-image-preview:large",
      "max-video-preview:-1",
    );
  }
  const robotsValue = robotsDirectives.join(", ");

  const buildLocalizedHref = (lang: "ru" | "uz" | "en") => {
    const localized = new URL(canonicalUrlObject.toString());
    if (lang === "ru") {
      localized.searchParams.delete("lang");
    } else {
      localized.searchParams.set("lang", lang);
    }
    localized.searchParams.sort();
    return localized.toString();
  };

  const searchParamsWithoutLang = new URLSearchParams(canonicalUrlObject.search);
  searchParamsWithoutLang.delete("lang");
  searchParamsWithoutLang.sort();
  const searchWithoutLang = searchParamsWithoutLang.toString();
  const xDefaultUrl = `${canonicalUrlObject.origin}${canonicalUrlObject.pathname}${searchWithoutLang ? `?${searchWithoutLang}` : ""}`;

  return (
    <Helmet>
      <html lang={activeLang} />

      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Med Service Centre" />
      <meta name="robots" content={robotsValue} />
      <meta name="googlebot" content={robotsValue} />

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Alternate Languages */}
      <link rel="alternate" hrefLang="ru" href={buildLocalizedHref("ru")} />
      <link rel="alternate" hrefLang="en" href={buildLocalizedHref("en")} />
      <link rel="alternate" hrefLang="uz" href={buildLocalizedHref("uz")} />
      <link rel="alternate" hrefLang="x-default" href={xDefaultUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={resolvedOgUrl} />
      <meta property="og:image" content={resolvedOgImage} />
      <meta property="og:image:alt" content={resolvedOgTitle} />
      <meta property="og:site_name" content="Med Service Centre" />
      <meta property="og:locale" content={activeLocale} />
      {alternateLocales.map((locale) => (
        <meta key={locale} property="og:locale:alternate" content={locale} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTwitterTitle} />
      <meta name="twitter:description" content={resolvedTwitterDescription} />
      <meta name="twitter:image" content={resolvedTwitterImage} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData) ? structuredData : [structuredData],
          )}
        </script>
      )}

      {/* Organization Schema (Default) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Med Service Centre",
          description: description,
          url: BASE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${BASE_URL}/lovable-uploads/ea1f50a2-d3d1-418f-b6ce-f6e08a722162.png`,
          },
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            areaServed: "UZ",
            availableLanguage: ["ru", "en", "uz"],
          },
          address: {
            "@type": "PostalAddress",
            addressCountry: "UZ",
            addressRegion: "Tashkent",
          },
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
