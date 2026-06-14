import type { Metadata } from "next";
import Link from "next/link";
import { getActiveProducts } from "~/entities/product/api";
import { getCategories } from "~/entities/category/api";
import { getLang } from "~/shared/i18n/lang";
import { API_URL, SITE_URL, pick, type Lang } from "~/shared/config/site";

export const metadata: Metadata = {
  title: "Med Service Centre — медицинское оборудование в Узбекистане",
  description:
    "Поставка, сервис и аренда медицинского оборудования в Узбекистане: УЗИ, анализаторы, электрохирургия, лабораторные системы. Официальный партнёр клиник.",
  alternates: { canonical: SITE_URL },
};

const T = {
  heroTitle: {
    ru: "Медицинское оборудование, которое мы поставляем и обслуживаем",
    en: "Medical equipment we supply and service",
    uz: "Biz yetkazib beradigan va xizmat ko‘rsatadigan tibbiy uskunalar",
  },
  heroSub: {
    ru: "Продажа, инсталляция, обучение и сервис для клиник Узбекистана — от официального партнёра ведущих производителей.",
    en: "Sales, installation, training and service for clinics in Uzbekistan — from an official partner of leading manufacturers.",
    uz: "O‘zbekiston klinikalari uchun sotuv, o‘rnatish, o‘qitish va servis — yetakchi ishlab chiqaruvchilarning rasmiy hamkoridan.",
  },
  toCatalog: { ru: "Перейти в каталог", en: "Browse catalog", uz: "Katalogga o‘tish" },
  contact: { ru: "Связаться", en: "Contact us", uz: "Bog‘lanish" },
  categories: { ru: "Категории оборудования", en: "Equipment categories", uz: "Uskunalar toifalari" },
  featured: { ru: "Популярное оборудование", en: "Featured equipment", uz: "Mashhur uskunalar" },
  all: { ru: "Все товары", en: "All products", uz: "Barcha mahsulotlar" },
} as const;

function img(cover: string | null | undefined): string | null {
  if (!cover) return null;
  return cover.startsWith("http") ? cover : `${API_URL}${cover}`;
}

export default async function HomePage() {
  const lang = (await getLang()) as Lang;
  const [products, categories] = await Promise.all([getActiveProducts(), getCategories()]);
  const featured = products.slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {T.heroTitle[lang]}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{T.heroSub[lang]}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              {T.toCatalog[lang]} →
            </Link>
            <Link
              href="/contacts"
              className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              {T.contact[lang]}
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight">{T.categories[lang]}</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/catalog?category=${encodeURIComponent(c.value)}`}
                className="rounded-xl border border-border bg-card p-4 text-sm font-medium transition hover:border-primary hover:shadow-sm"
              >
                {pick(c.name, lang)}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">{T.featured[lang]}</h2>
            <Link href="/catalog" className="text-sm font-medium text-primary hover:underline">
              {T.all[lang]} →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => {
              const cover = img(p.images?.cover);
              return (
                <Link
                  key={p.id}
                  href={`/catalog/${p.slug ?? p.id}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-muted">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={pick(p.name, lang)}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-muted-foreground">—</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium">{pick(p.name, lang)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
