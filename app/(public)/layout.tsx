import type { ReactNode } from "react";
import { DEFAULT_LANG } from "~/shared/config/site";
import { I18nProvider } from "~/shared/i18n/i18n-provider";
import { SiteHeader } from "~/widgets/site-header/site-header";
import { SiteFooter } from "~/widgets/site-footer/site-footer";

// Statically prerendered in the default language (no cookies() on the server →
// pages stay cacheable). <I18nProvider> applies the visitor's language on the client.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <I18nProvider lang={DEFAULT_LANG}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </I18nProvider>
  );
}
