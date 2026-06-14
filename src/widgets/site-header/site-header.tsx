"use client";
// Public site header (FSD: widgets/site-header).
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LANGS, PUBLIC_NAV, SITE_NAME, type Lang } from "~/shared/config/site";

export function SiteHeader({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const setLang = (code: Lang) => {
    document.cookie = `lang=${code}; path=/; max-age=31536000`;
    router.refresh();
  };
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">MSC</span>
          <span className="hidden sm:inline">{SITE_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active(item.href) ? "text-primary" : "text-foreground/70 hover:text-primary"
              }`}
            >
              {item.label[lang]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                aria-label={l.label}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  l.code === current.code ? "bg-primary/10 text-primary" : "text-foreground/60 hover:text-primary"
                }`}
              >
                {l.code.toUpperCase()}
              </button>
            ))}
          </div>
          <Link
            href="/admin"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            {lang === "ru" ? "Кабинет" : lang === "uz" ? "Kabinet" : "Admin"}
          </Link>
          <button className="md:hidden rounded-md p-2 hover:bg-muted" onClick={() => setOpen((v) => !v)} aria-label="menu">
            <span className="block h-0.5 w-5 bg-foreground" />
            <span className="mt-1 block h-0.5 w-5 bg-foreground" />
            <span className="mt-1 block h-0.5 w-5 bg-foreground" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border px-4 py-3 md:hidden">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                active(item.href) ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              {item.label[lang]}
            </Link>
          ))}
          <div className="mt-2 flex gap-1 px-3">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)} className="rounded px-2 py-1 text-xs hover:bg-muted">
                {l.code.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
