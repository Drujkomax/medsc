import SEOHead from "@/components/SEO/SEOHead";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
const Cases = () => {
  const { t } = useTranslation();
  const baseUrl = "https://medsc.uz";
  const canonicalUrl = `${baseUrl}/cases`;

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("pages.cases.seo.title"),
    description: t("pages.cases.seo.description"),
    url: canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Med Service Centre",
      url: baseUrl,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("common.home", "Главная"),
        item: `${baseUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("pages.cases.title"),
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <SEOHead
        title={t("pages.cases.seo.title")}
        description={t("pages.cases.seo.description")}
        keywords={t("pages.cases.seo.keywords")}
        type="website"
        canonical={canonicalUrl}
        structuredData={[pageSchema, breadcrumbSchema]}
      />
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-4">{t("pages.cases.title")}</h1>
        <p className="text-lg text-muted-foreground mb-8">{t("pages.cases.description")}</p>
        <Link
          to="/catalog"
          className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-msc-accent text-white font-semibold hover:bg-msc-accent/90 transition-colors"
        >
          {t("pages.cases.cta")}
        </Link>
        <div className="mt-10 max-w-3xl mx-auto text-left bg-card/60 border border-primary/10 rounded-xl p-6">
          <h2 className="text-2xl font-heading font-semibold mb-3">
            {t("pages.cases.moreTitle", "Как мы решаем задачи клиник")}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t(
              "pages.cases.moreText",
              "Показываем примеры внедрения: подбор оборудования, логистика, монтаж и обучение персонала. Это помогает оценить сроки, бюджет и ожидаемый эффект.",
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/services"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors"
            >
              {t("pages.cases.moreServices", "Посмотреть услуги")}
            </Link>
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("pages.cases.moreCatalog", "Перейти в каталог")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cases;
