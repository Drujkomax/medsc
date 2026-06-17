import type { Metadata } from "next";
import { getActiveProducts } from "~/entities/product/api";
import { getCategories } from "~/entities/category/api";
import { getManufacturers } from "~/entities/manufacturer/api";
import { getDict } from "~/shared/i18n/dict";
import { createT } from "~/shared/i18n/t";
import { SITE_URL } from "~/shared/config/site";
import { HomeView } from "~/widgets/home/home-view";

const OG_IMAGE = "https://medsc.uz/lovable-uploads/ea1f50a2-d3d1-418f-b6ce-f6e08a722162.png";

// Prerender + revalidate (ISR) so the page is CDN/browser cacheable instead of
// fully re-rendered per request.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDict();
  const t = createT(dict);
  return {
    title: t("home.seo.title"),
    description: t("home.seo.description"),
    keywords: t("home.seo.keywords"),
    alternates: { canonical: `${SITE_URL}/` },
    openGraph: {
      title: t("home.seo.ogTitle"),
      description: t("home.seo.ogDescription"),
      url: `${SITE_URL}/`,
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: t("home.seo.twitterTitle"),
      description: t("home.seo.twitterDescription"),
      images: [OG_IMAGE],
    },
  };
}

export default async function HomePage() {
  const [products, categories, manufacturers] = await Promise.all([
    getActiveProducts(),
    getCategories(),
    getManufacturers(),
  ]);

  // Faithful to the original Home: WebSite + ItemList structured data + FAQPage.
  const { lang, dict } = await getDict();
  const t = createT(dict);
  const faqItems = (t("home.faq.items", { returnObjects: true }) as Array<{ question: string; answer: string }>) || [];
  const featured = products.slice(0, 3);
  const slugOf = (mid: string | null) => manufacturers.find((m) => m.id === mid)?.slug || "";
  const pathOf = (p: (typeof products)[number]) => {
    const ms = slugOf(p.manufacturer_id);
    const ps = p.slug || p.id;
    return ms ? `/catalog/${ms}/${ps}` : `/catalog/${ps}`;
  };
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Med Service Centre",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/catalog?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    ...(featured.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: featured.map((p, i) => {
              const cover = p.images?.cover || "";
              return {
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "WebPage",
                  name: p.name[lang],
                  url: `${SITE_URL}${pathOf(p)}`,
                  image: cover ? (cover.startsWith("http") ? cover : `${SITE_URL}${cover}`) : undefined,
                },
              };
            }),
          },
        ]
      : []),
    ...(Array.isArray(faqItems) && faqItems.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          },
        ]
      : []),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {/* Pass only the 3 featured products the view renders — not the full catalog —
          so the RSC flight payload stays tiny instead of serializing every product. */}
      <HomeView products={featured} categories={categories} manufacturers={manufacturers} />
    </>
  );
}
