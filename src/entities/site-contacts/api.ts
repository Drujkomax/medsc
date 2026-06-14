// Site contacts entity API (FSD: entities/site-contacts).
// Reads an optional `site_contacts` row; falls back to static company facts.
import { dbSelect } from "~/shared/api/http";

export interface SiteContacts {
  id?: string;
  email: string | null;
  telegram: string | null; // handle, e.g. "@medservice_centre"
  telegram_url: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
}

export const FALLBACK_CONTACTS: SiteContacts = {
  email: "info@medsc.uz",
  telegram: "@medservice_centre",
  telegram_url: "https://t.me/medservice_centre",
  phone: null,
  country: "Узбекистан",
  city: "Ташкент",
  address: null,
};

/** Fetch the single site_contacts row, merged over static fallbacks. */
export async function getSiteContacts(revalidate = 600): Promise<SiteContacts> {
  try {
    const { data } = await dbSelect<Partial<SiteContacts> | null>(
      "site_contacts",
      { single: true },
      { revalidate },
    );
    if (!data) return FALLBACK_CONTACTS;
    return {
      ...FALLBACK_CONTACTS,
      ...Object.fromEntries(Object.entries(data).filter(([, v]) => v != null && v !== "")),
    } as SiteContacts;
  } catch {
    return FALLBACK_CONTACTS;
  }
}
