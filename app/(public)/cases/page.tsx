import type { Metadata } from "next";
import { getDict } from "~/shared/i18n/dict";
import { createT } from "~/shared/i18n/t";
import { SITE_URL } from "~/shared/config/site";
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
    openGraph: {
      title: t("pages.cases.seo.title"),
      description: t("pages.cases.seo.description"),
      url: canonical,
      type: "website",
    },
  };
}

export default function CasesPage() {
  return <CasesView />;
}
