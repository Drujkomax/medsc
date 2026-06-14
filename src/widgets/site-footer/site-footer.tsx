// Public site footer (FSD: widgets/site-footer). Server component.
import Link from "next/link";
import { PUBLIC_NAV, SITE_NAME, type Lang } from "~/shared/config/site";

const T = {
  tagline: {
    ru: "Поставка, сервис и аренда медицинского оборудования в Узбекистане.",
    en: "Supply, service and rental of medical equipment in Uzbekistan.",
    uz: "O‘zbekistonda tibbiy uskunalarni yetkazib berish, servis va ijara.",
  },
  nav: { ru: "Навигация", en: "Navigation", uz: "Navigatsiya" },
  contacts: { ru: "Контакты", en: "Contacts", uz: "Kontaktlar" },
  rights: { ru: "Все права защищены", en: "All rights reserved", uz: "Barcha huquqlar himoyalangan" },
} as const;

export function SiteFooter({ lang }: { lang: Lang }) {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">MSC</span>
            {SITE_NAME}
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{T.tagline[lang]}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{T.nav[lang]}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {PUBLIC_NAV.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="hover:text-primary">{i.label[lang]}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{T.contacts[lang]}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="mailto:info@medsc.uz" className="hover:text-primary">info@medsc.uz</a></li>
            <li><a href="https://t.me/medservice_centre" className="hover:text-primary">@medservice_centre</a></li>
            <li>Узбекистан, Ташкент</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {SITE_NAME}. {T.rights[lang]}.
      </div>
    </footer>
  );
}
