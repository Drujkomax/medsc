import type { Metadata } from "next";
import ClientApp from "./client-app";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://medsc.uz";
const DEFAULT_TITLE = "Med Service Centre — Медтехника для клиник Узбекистана";
const DEFAULT_DESC =
  "Med Service Centre — поставщик медоборудования в Узбекистане: УЗИ, анализаторы, электроскальпели, продажа, сервис и аренда для клиник.";

const pick = (v: any): string => (v && (v.ru || v.en || v.uz)) || (typeof v === "string" ? v : "");

async function fetchProductBySlug(slug: string) {
  try {
    const r = await fetch(`${API}/db/products`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "select", filters: [{ col: "slug", op: "eq", val: slug }], single: true }),
      next: { revalidate: 600 },
    });
    const j = await r.json();
    return j?.data || null;
  } catch {
    return null;
  }
}

// Server-rendered <head> per URL (crawlers + social previews), while the body stays the SPA.
export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const { slug = [] } = await params;
  const path = "/" + slug.join("/");
  const canonical = SITE + (path === "/" ? "" : path);

  // never index the admin / auth area
  if (slug[0] === "admin" || slug[0] === "auth") {
    return { title: DEFAULT_TITLE, robots: { index: false, follow: false } };
  }

  // product detail — /catalog/products/<slug>
  if (slug[0] === "catalog" && slug[1] === "products" && slug[2]) {
    const p = await fetchProductBySlug(slug[2]);
    if (p) {
      const title = `${pick(p.name)} — Med Service Centre`;
      const description = (pick(p.description) || DEFAULT_DESC).slice(0, 200);
      const cover = p.images?.cover as string | undefined;
      const image = cover ? (cover.startsWith("http") ? cover : `${API}${cover}`) : undefined;
      return {
        title,
        description,
        alternates: { canonical },
        openGraph: { title, description, url: canonical, type: "website", images: image ? [image] : undefined },
        twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
      };
    }
  }

  const MAP: Record<string, { t: string; d: string }> = {
    "/catalog": {
      t: "Каталог медоборудования — Med Service Centre",
      d: "Каталог медицинского оборудования: УЗИ, анализаторы, электрохирургия и др. Продажа и сервис по Узбекистану.",
    },
    "/services": {
      t: "Услуги — Med Service Centre",
      d: "Поставка, инсталляция, обучение и техническое обслуживание медоборудования для клиник Узбекистана.",
    },
    "/cases": { t: "Кейсы — Med Service Centre", d: "Реализованные проекты оснащения клиник медицинским оборудованием." },
    "/about": {
      t: "О компании — Med Service Centre",
      d: "Med Service Centre — интегратор медицинского оборудования и сервис-услуг в Узбекистане.",
    },
    "/contacts": {
      t: "Контакты — Med Service Centre",
      d: "Свяжитесь с Med Service Centre: продажа и сервис медоборудования в Ташкенте.",
    },
  };
  const m = MAP[path];
  const title = m?.t || DEFAULT_TITLE;
  const description = m?.d || DEFAULT_DESC;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

export default function CatchAll() {
  return <ClientApp />;
}
