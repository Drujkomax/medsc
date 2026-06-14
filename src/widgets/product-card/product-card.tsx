// Reusable product card (FSD: widgets/product-card). Server-renderable.
import Link from "next/link";
import type { Product } from "~/entities/product/api";
import { API_URL, pick, type Lang } from "~/shared/config/site";

function cover(p: Product): string | null {
  const c = p.images?.cover;
  if (!c) return null;
  return c.startsWith("http") ? c : `${API_URL}${c}`;
}

export function ProductCard({ product, lang, categoryLabel }: { product: Product; lang: Lang; categoryLabel?: string }) {
  const src = cover(product);
  return (
    <Link
      href={`/catalog/${product.slug ?? product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={pick(product.name, lang)}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-3xl text-muted-foreground">⚕</div>
        )}
        {categoryLabel && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur">
            {categoryLabel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{pick(product.name, lang)}</h3>
        <span className="mt-auto pt-3 text-sm font-medium text-primary opacity-0 transition group-hover:opacity-100">
          {lang === "ru" ? "Подробнее →" : lang === "uz" ? "Batafsil →" : "Details →"}
        </span>
      </div>
    </Link>
  );
}
