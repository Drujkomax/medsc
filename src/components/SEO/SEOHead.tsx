import { useEffect } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
}

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
  twitterImage
}: SEOHeadProps) => {
  const location = useLocation();
  const currentUrl = url || `${window.location.origin}${location.pathname}${location.search}`;
  const canonicalUrl = canonical || currentUrl;
  const resolvedOgTitle = ogTitle || title;
  const resolvedOgDescription = ogDescription || description;
  const resolvedOgImage = ogImage || image;
  const resolvedOgUrl = ogUrl || canonicalUrl;
  const resolvedTwitterTitle = twitterTitle || resolvedOgTitle;
  const resolvedTwitterDescription = twitterDescription || resolvedOgDescription;
  const resolvedTwitterImage = twitterImage || resolvedOgImage;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Standard meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', 'Med Service Centre');

    // Open Graph tags
    updateMetaTag('og:title', resolvedOgTitle, true);
    updateMetaTag('og:description', resolvedOgDescription, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', resolvedOgUrl, true);
    updateMetaTag('og:image', resolvedOgImage, true);
    updateMetaTag('og:site_name', 'Med Service Centre', true);

    // Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', resolvedTwitterTitle);
    updateMetaTag('twitter:description', resolvedTwitterDescription);
    updateMetaTag('twitter:image', resolvedTwitterImage);

    // Link tags (canonical + alternates)
    const upsertLinkTag = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]`;
      let link = document.querySelector(selector) as HTMLLinkElement;

      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (hreflang) {
          link.hreflang = hreflang;
        }
        document.head.appendChild(link);
      }

      link.href = href;
    };

    const currentUrlObject = new URL(currentUrl);
    const buildLocalizedHref = (lang: 'ru' | 'uz') => {
      const localized = new URL(currentUrlObject.toString());
      if (lang === 'ru') {
        localized.searchParams.delete('lang');
      } else {
        localized.searchParams.set('lang', lang);
      }
      return localized.toString();
    };

    const searchParamsWithoutLang = new URLSearchParams(currentUrlObject.search);
    searchParamsWithoutLang.delete('lang');
    const searchWithoutLang = searchParamsWithoutLang.toString();
    const basePathWithSearch = `${currentUrlObject.origin}${currentUrlObject.pathname}${searchWithoutLang ? `?${searchWithoutLang}` : ''}`;

    upsertLinkTag('canonical', canonicalUrl);
    upsertLinkTag('alternate', buildLocalizedHref('ru'), 'ru');
    upsertLinkTag('alternate', buildLocalizedHref('uz'), 'uz');
    upsertLinkTag('alternate', basePathWithSearch, 'x-default');

    // JSON-LD structured data for organization
    const updateStructuredData = () => {
      const existingScript = document.querySelector('#structured-data');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Med Service Centre",
        "description": description,
        "url": currentUrl,
        "logo": {
          "@type": "ImageObject",
          "url": "/lovable-uploads/ea1f50a2-d3d1-418f-b6ce-f6e08a722162.png"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "sales",
          "areaServed": "UZ",
          "availableLanguage": ["ru", "en", "uz"]
        },
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "UZ",
          "addressRegion": "Tashkent"
        },
        "sameAs": [
          currentUrl
        ]
      });
      document.head.appendChild(script);
    };

    updateStructuredData();

  }, [
    title,
    description,
    keywords,
    image,
    currentUrl,
    canonicalUrl,
    type,
    resolvedOgTitle,
    resolvedOgDescription,
    resolvedOgImage,
    resolvedOgUrl,
    resolvedTwitterTitle,
    resolvedTwitterDescription,
    resolvedTwitterImage
  ]);

  return null;
};

export default SEOHead;
