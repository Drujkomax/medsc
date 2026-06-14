import type { ReactNode } from "react";
import { getDict } from "~/shared/i18n/dict";
import { I18nProvider } from "~/shared/i18n/i18n-provider";
import { SiteHeader } from "~/widgets/site-header/site-header";
import { SiteFooter } from "~/widgets/site-footer/site-footer";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const { lang, dict } = await getDict();
  return (
    <I18nProvider lang={lang} dict={dict}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </I18nProvider>
  );
}
