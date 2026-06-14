"use client";

import Link from "next/link";
import { useT } from "~/shared/i18n/i18n-provider";

export function CasesView() {
  const t = useT();
  // The original used i18next's string-fallback form `t(key, fallback)`. The
  // ported createT() has no fallback arg, so mirror it: use the translation when
  // the key resolves, otherwise the same literal default the original passed.
  const tf = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-4">{t("pages.cases.title")}</h1>
        <p className="text-lg text-muted-foreground mb-8">{t("pages.cases.description")}</p>
        <Link
          href="/catalog"
          className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-msc-accent text-white font-semibold hover:bg-msc-accent/90 transition-colors"
        >
          {t("pages.cases.cta")}
        </Link>
        <div className="mt-10 max-w-3xl mx-auto text-left bg-card/60 border border-primary/10 rounded-xl p-6">
          <h2 className="text-2xl font-heading font-semibold mb-3">
            {tf("pages.cases.moreTitle", "Как мы решаем задачи клиник")}
          </h2>
          <p className="text-muted-foreground mb-4">
            {tf(
              "pages.cases.moreText",
              "Показываем примеры внедрения: подбор оборудования, логистика, монтаж и обучение персонала. Это помогает оценить сроки, бюджет и ожидаемый эффект.",
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/services"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary/10 transition-colors"
            >
              {tf("pages.cases.moreServices", "Посмотреть услуги")}
            </Link>
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {tf("pages.cases.moreCatalog", "Перейти в каталог")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
