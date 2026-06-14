// Category entity API (FSD: entities/category).
import { dbSelect } from "~/shared/api/http";
import type { Lang } from "~/shared/config/site";

export interface Category {
  id: string;
  value: string;
  name: Record<Lang, string>;
}

/** All product categories (the catalog filter list). */
export async function getCategories(revalidate = 600): Promise<Category[]> {
  try {
    const { data } = await dbSelect<Category[]>("product_categories", {}, { revalidate });
    return (data || []).sort((a, b) => (a.name?.ru || "").localeCompare(b.name?.ru || "", "ru"));
  } catch {
    return [];
  }
}
