// Service entity API (FSD: entities/service).
import { dbSelect } from "~/shared/api/http";
import type { Lang } from "~/shared/config/site";

export interface Service {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: string | null;
  icon_url?: string | null;
}

/** All company services (public services page). Cached for SSR/ISR. */
export async function getServices(revalidate = 600): Promise<Service[]> {
  try {
    const { data } = await dbSelect<Service[]>("services", {}, { revalidate });
    return data || [];
  } catch {
    return [];
  }
}
