import type { Metadata } from "next";
import Link from "next/link";
import { getActiveProducts } from "~/entities/product/api";
import { getCategories } from "~/entities/category/api";
import { getLang } from "~/shared/i18n/lang";
import { SITE_URL, pick, type Lang } from "~/shared/config/site";
import { ProductCard } from "~/widgets/product-card/product-card";
import { CatalogSearch } from "~/features/catalog-filter/catalog-search";

const PER_PAGE = 20;

export const metadata: Metadata = {
  title: "Каталог медоборудования — Med Service Centre",
  description:
    "Каталог медицинского оборудования: УЗИ, анализаторы, электрохирургия, лабораторные системы. Продажа и сервис по Узбекистану.",
  alternates: { canonical: `${SITE_URL}/catalog` },
};

const T = {
  title: { ru: "Каталог оборудования", en: "Equipment catalog", uz: "Uskunalar katalogi" },
  all: { ru: "Все", en: "All", uz: "Hammasi" },
  search: { ru: "Поиск по названию…", en: "Search by name…", uz: "Nomi bo‘yicha qidirish…" },
  found: { ru: "Найдено", en: "Found", uz: "Topildi" },
  none: { ru: "Ничего не найдено", en: "Nothing found", uz: "Hech narsa topilmadi" },
} as const;

type SP = { category?: string; q?: string; page?: string };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const lang = (await getLang()) as Lang;
  const [products, categories] = await Promise.all([getActiveProducts(), getCategories()]);

  const cat = sp.category || "all";
  const q = (sp.q || "").trim().toLowerCase();
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const catName: Record<string, string> = Object.fromEntries(categories.map((c) => [c.value, pick(c.name, lang)]));

  const filtered = products.filter((p) => {
    if (cat !== "all" && p.category !== cat) return false;
    if (q && !pick(p.name, lang).toLowerCase().includes(q) && !pick(p.name, "ru").toLowerCase().includes(q)) return false;
    return true;
  });
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const href = (over: Partial<SP>) => {
    const m = { category: cat === "all" ? "" : cat, q: sp.q || "", page: "", ...over };
    const u = new URLSearchParams();
    if (m.category) u.set("category", m.category);
    if (m.q) u.set("q", m.q);
    if (m.page && m.page !== "1") u.set("page", m.page);
    const s = u.toString();
    return `/catalog${s ? `?${s}` : ""}`;
  };

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{T.title[lang]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {T.found[lang]}: {total}
          </p>
        </div>
        <div className="w-full sm:w-80">
          <CatalogSearch placeholder={T.search[lang]} />
        </div>
      </header>

      {/* All categories visible */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={href({ category: "", page: "1" })} className={chip(cat === "all")}>
          {T.all[lang]}
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={href({ category: c.value, page: "1" })} className={chip(cat === c.value)}>
            {pick(c.name, lang)}
          </Link>
        ))}
      </div>

      {slice.length === 0 ? (
        <p className="py-24 text-center text-lg text-muted-foreground">{T.none[lang]}</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {slice.map((p) => (
            <ProductCard key={p.id} product={p} lang={lang} categoryLabel={catName[p.category]} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-10 flex flex-wrap justify-center gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href({ page: String(n) })}
              className={`min-w-9 rounded-lg border px-3 py-2 text-center text-sm ${
                n === cur ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"
              }`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
