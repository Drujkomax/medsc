// Shared site configuration (FSD: shared/config).
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001").replace(/\/+$/, "");

// Server-side data fetches use the API's internal Docker address when set
// (e.g. http://msc-api:6001) to skip the public hairpin (DNS → Caddy → back).
// Not NEXT_PUBLIC → undefined in the browser, so client code falls back to API_URL.
export const API_INTERNAL_URL = (process.env.API_INTERNAL_URL || API_URL).replace(/\/+$/, "");
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://medsc.uz").replace(/\/+$/, "");

export const SITE_NAME = "Med Service Centre";

// Resolve a stored image path to a direct, absolute API URL. Going straight to the
// backend (instead of the relative /storage rewrite that hops through Vercel) is
// faster and avoids intermittent proxy failures that showed images as broken.
export function imageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

// Tiny neutral blur shown by next/image while a remote photo loads (replaces the
// empty grey box). base64 of an 8×10 #eef0f3 rect SVG.
export const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjEwIj48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2VlZjBmMyIvPjwvc3ZnPg==";

export type Lang = "ru" | "en" | "uz";
export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "uz", label: "O‘zbekcha", flag: "🇺🇿" },
];
export const DEFAULT_LANG: Lang = "ru";

export const PUBLIC_NAV: { href: string; label: Record<Lang, string> }[] = [
  { href: "/", label: { ru: "Главная", en: "Home", uz: "Bosh sahifa" } },
  { href: "/catalog", label: { ru: "Каталог", en: "Catalog", uz: "Katalog" } },
  { href: "/services", label: { ru: "Услуги", en: "Services", uz: "Xizmatlar" } },
  { href: "/contacts", label: { ru: "Контакты", en: "Contacts", uz: "Kontaktlar" } },
];

/** Pick a localized value from a {ru,en,uz} json field (or a plain string). */
export function pick<T extends Partial<Record<Lang, string>>>(v: T | string | null | undefined, lang: Lang = DEFAULT_LANG): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v[lang] || v.ru || v.en || v.uz || "";
}
