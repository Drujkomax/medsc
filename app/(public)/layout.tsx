import type { ReactNode } from "react";
import { getLang } from "~/shared/i18n/lang";
import { SiteHeader } from "~/widgets/site-header/site-header";
import { SiteFooter } from "~/widgets/site-footer/site-footer";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader lang={lang} />
      <main className="flex-1">{children}</main>
      <SiteFooter lang={lang} />
    </div>
  );
}
