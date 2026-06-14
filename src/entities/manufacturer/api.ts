// Manufacturer entity API (FSD: entities/manufacturer).
import { dbSelect } from "~/shared/api/http";

export interface Manufacturer {
  id: string;
  name: string;
  slug: string | null;
  country_code: string | null;
}

export async function getManufacturers(revalidate = 600): Promise<Manufacturer[]> {
  try {
    const { data } = await dbSelect<Manufacturer[]>("manufacturers", {}, { revalidate });
    return (data || []).sort((a, b) => (a.name || "").localeCompare(b.name || "", "ru"));
  } catch {
    return [];
  }
}
