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
}

const SEOHead = ({ 
  title = "Med Service Centre - Медицинское оборудование в Узбекистане",
  description = "Med Service Centre — поставщик медтехники в Узбекистане: УЗИ, анализаторы ABL800 Flex, системы BOWA ARC 400, продажа, сервис и аренда клиникам страны.",
  keywords = "медицинское оборудование Узбекистан, УЗИ аппарат Ташкент, лабораторное оборудование аренда, ABL800 Flex, хирургическое оборудование BOWA ARC 400, медицинская техника клиники Узбекистан",
  image = "/lovable-uploads/ea1f50a2-d3d1-418f-b6ce-f6e08a722162.png",
  url,
  type = "website",
  canonical
}: SEOHeadProps) => {
  const location = useLocation();
  const currentUrl = url || `${window.location.origin}${location.pathname}`;
  const canonicalUrl = canonical || currentUrl;

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
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:site_name', 'Med Service Centre', true);

    // Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

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

  }, [title, description, keywords, image, currentUrl, canonicalUrl, type]);

  return null;
};

export default SEOHead;