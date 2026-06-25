import type { Metadata } from "next";
import { getDict } from "~/shared/i18n/dict";
import { createT } from "~/shared/i18n/t";
import { SITE_URL } from "~/shared/config/site";
import { socialMeta } from "~/shared/config/seo";
import { CasesView } from "~/widgets/cases/cases-view";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDict();
  const t = createT(dict);
  const canonical = `${SITE_URL}/cases`;

  return {
    title: t("pages.cases.seo.title"),
    description: t("pages.cases.seo.description"),
    keywords: t("pages.cases.seo.keywords"),
    alternates: { canonical },
    ...socialMeta({
      title: t("pages.cases.seo.title"),
      description: t("pages.cases.seo.description"),
      url: canonical,
    }),
  };
}

export default function CasesPage() {
  const canonical = `${SITE_URL}/cases`;
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Кейсы и проекты — Med Service Centre",
    description:
      "Проекты Med Service Centre по поставке, монтажу и сервису медицинского оборудования для клиник Узбекистана.",
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "Med Service Centre", url: SITE_URL },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Кейсы", item: canonical },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([collectionSchema, breadcrumbSchema]) }}
      />
      <CasesView />
    </>
  );
}
