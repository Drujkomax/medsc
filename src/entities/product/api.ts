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

/** All active, non-archived products (public catalog). Cached for SSR/ISR. */
export async function getActiveProducts(revalidate = 300): Promise<Product[]> {
  try {
    const { data } = await rpc<Product[]>("get_public_products", {}, { revalidate });
    return data || [];
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
    return data ?? null;
  } catch {
    return null;
  }
}
