import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, type Product } from "~/entities/product/api";
import { getCategories } from "~/entities/category/api";
import { getLang } from "~/shared/i18n/lang";
import { API_URL, SITE_URL, SITE_NAME, pick, type Lang } from "~/shared/config/site";
import { ProductGallery } from "~/features/product-gallery/product-gallery";
import { QuoteRequest } from "~/features/quote-request/quote-request";

const T = {
  home: { ru: "Главная", en: "Home", uz: "Bosh sahifa" },
  catalog: { ru: "Каталог", en: "Catalog", uz: "Katalog" },
  byRequest: { ru: "Цена по запросу", en: "Price on request", uz: "Narxi so‘rov bo‘yicha" },
  features: { ru: "Характеристики", en: "Features", uz: "Xususiyatlar" },
  description: { ru: "Описание", en: "Description", uz: "Tavsif" },
  country: { ru: "Страна", en: "Country", uz: "Mamlakat" },
  category: { ru: "Категория", en: "Category", uz: "Toifa" },
  back: { ru: "Назад в каталог", en: "Back to catalog", uz: "Katalogga qaytish" },
  whyUs: {
    ru: "Med Service Centre — 8 лет опыта, 300+ реализованных проектов: поставка, инсталляция, обучение и сервис медоборудования по Узбекистану.",
    en: "Med Service Centre — 8 years of experience, 300+ completed projects: supply, installation, training and service of medical equipment across Uzbekistan.",
    uz: "Med Service Centre — 8 yillik tajriba, 300+ loyiha: O‘zbekiston bo‘ylab tibbiy uskunalarni yetkazib berish, o‘rnatish, o‘qitish va servis.",
  },
} as const;

function img(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

function priceLabel(p: Product, lang: Lang): string | null {
  if (!p.price) return null;
  const num = Number(p.price);
  const value = Number.isFinite(num) ? num.toLocaleString("ru-RU") : p.price;
  return p.currency ? `${value} ${p.currency}` : value;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: `${T.catalog.ru} — ${SITE_NAME}` };
  }
  const name = pick(product.name, "ru");
  const desc = (pick(product.description, "ru") || `${name} — ${SITE_NAME}`).slice(0, 160);
  const canonical = `${SITE_URL}/catalog/${slug}`;
  const cover = img(product.images?.cover);

  return {
    title: `${name} — ${SITE_NAME}`,
    description: desc,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${name} — ${SITE_NAME}`,
      description: desc,
      url: canonical,
      siteName: SITE_NAME,
      ...(cover ? { images: [{ url: cover, alt: name }] } : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lang = (await getLang()) as Lang;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const categories = await getCategories();
  const catLabel = categories.find((c) => c.value === product.category);
  const categoryName = catLabel ? pick(catLabel.name, lang) : product.category;

  const name = pick(product.name, lang);
  const description = pick(product.description, lang);
  const features = product.features?.[lang] ?? product.features?.ru ?? [];
  const price = priceLabel(product, lang);
  const cover = img(product.images?.cover);

  const gallery = [
    product.images?.cover,
    ...(product.images?.gallery ?? []),
  ]
    .map(img)
    .filter((u): u is string => Boolean(u));

  // schema.org Product structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    ...(description ? { description: description.slice(0, 500) } : {}),
    ...(cover ? { image: cover } : {}),
    ...(categoryName ? { category: categoryName } : {}),
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(price && product.price
      ? {
          offers: {
            "@type": "Offer",
            price: String(Number(product.price) || product.price),
            priceCurrency: product.currency ?? "USD",
            availability: "https://schema.org/InStock",
            seller: { "@type": "Organization", name: SITE_NAME },
            url: `${SITE_URL}/catalog/${slug}`,
          },
        }
      : {}),
  };

  const chip =
    "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="transition hover:text-foreground">
          {T.home[lang]}
        </Link>
        <span aria-hidden>/</span>
        <Link href="/catalog" className="transition hover:text-foreground">
          {T.catalog[lang]}
        </Link>
        <span aria-hidden>/</span>
        <span className="line-clamp-1 font-medium text-foreground">{name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={gallery} alt={name} />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex flex-wrap gap-2">
            {categoryName && (
              <Link href={`/catalog?category=${encodeURIComponent(product.category)}`} className={`${chip} transition hover:border-primary hover:text-foreground`}>
                {categoryName}
              </Link>
            )}
            {product.country && <span className={chip}>🌍 {product.country}</span>}
          </div>

          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>

          <div className="mt-5 rounded-2xl border border-border bg-card p-5">
            <p className="text-2xl font-bold tracking-tight sm:text-3xl">{price ?? T.byRequest[lang]}</p>
            <div className="mt-4">
              <QuoteRequest lang={lang} productName={name} />
            </div>
          </div>

          {features.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold tracking-tight">{T.features[lang]}</h2>
              <ul className="mt-3 space-y-2.5">
                {features.map((feat, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span aria-hidden className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-xs text-primary">
                      ✓
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {description && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold tracking-tight">{T.description[lang]}</h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{description}</div>
            </section>
          )}

          <p className="mt-8 rounded-2xl border border-border bg-muted/40 p-5 text-sm leading-relaxed text-muted-foreground">
            {T.whyUs[lang]}
          </p>

          <div className="mt-8">
            <Link href="/catalog" className="text-sm font-medium text-primary transition hover:underline">
              ← {T.back[lang]}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
