// Product entity API (FSD: entities/product).
import { dbSelect, rpc } from "~/shared/api/http";
import type { Lang } from "~/shared/config/site";

export interface Product {
  id: string;
  slug: string | null;
  name: Record<Lang, string>;
  description: Record<Lang, string>;
  category: string;
  country: string | null;
  price: string | null;
  currency: "USD" | "EUR" | "UZS" | null;
  images: { cover: string | null; gallery: string[] } | null;
  features: Record<Lang, string[]> | null;
  status: string;
  manufacturer_id: string | null;
  views_count?: number;
  created_at: string;
}

// Sensitive/internal columns the backend's SELECT * returns but the public site
// never renders. Stripping them server-side keeps business metrics out of the
// public HTML/flight payload (and trims its size). Safe: none are used by any
// public component.
const ADMIN_ONLY_COLS = [
  "competitor_price",
  "revenue_attributed",
  "conversion_rate",
  "performance_score",
  "price_history",
  "created_by",
  "updated_by",
];

function stripAdminFields<T extends Record<string, unknown>>(p: T): T {
  const out: Record<string, unknown> = { ...p };
  for (const k of ADMIN_ONLY_COLS) delete out[k];
  return out as T;
}

/** All active, non-archived products (public catalog). Cached for SSR/ISR. */
export async function getActiveProducts(revalidate = 300): Promise<Product[]> {
  try {
    const { data } = await rpc<Product[]>("get_public_products", {}, { revalidate });
    return (data || []).map((p) => stripAdminFields(p as Record<string, unknown>)) as Product[];
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug: string, revalidate = 300): Promise<Product | null> {
  try {
    const { data } = await dbSelect<Product | null>(
      "products",
      { filters: [{ col: "slug", op: "eq", val: slug }], single: true },
      { revalidate },
    );
    return data ? (stripAdminFields(data as Record<string, unknown>) as Product) : null;
  } catch {
    return null;
  }
}
