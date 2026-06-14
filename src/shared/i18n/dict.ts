import "server-only";
import ru from "@/i18n/locales/ru.json";
import en from "@/i18n/locales/en.json";
import uz from "@/i18n/locales/uz.json";
import { getLang } from "./lang";
import type { Lang } from "~/shared/config/site";

// Server-side translation dictionary. Reuses the SAME locale JSON the original
// SPA shipped, so ported pages render the exact original copy. Read once in the
// layout and handed to the client <I18nProvider>.
const DICTS: Record<Lang, unknown> = { ru, en, uz };

export type Dict = typeof ru;

export async function getDict(): Promise<{ lang: Lang; dict: Dict }> {
  const lang = (await getLang()) as Lang;
  return { lang, dict: (DICTS[lang] ?? ru) as Dict };
}
