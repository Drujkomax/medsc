// Server-side language resolution (FSD: shared/i18n).
// Public pages are statically prerendered in the default language so they can be
// CDN/ISR-cached; the visitor's language is applied on the client by <I18nProvider>
// (it reads the `lang` cookie after hydration). Reading cookies() here would opt
// every page into dynamic, per-request rendering (cache-control: no-store), so we
// intentionally resolve to the default language on the server.
import { DEFAULT_LANG, type Lang } from "~/shared/config/site";

export async function getLang(): Promise<Lang> {
  return DEFAULT_LANG;
}

export const LANG_COOKIE = "lang";
