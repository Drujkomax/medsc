// Server-side language resolution (FSD: shared/i18n). Trilingual SSR via a cookie.
import { cookies } from "next/headers";
import { DEFAULT_LANG, type Lang } from "~/shared/config/site";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get("lang")?.value;
  return v === "en" || v === "uz" || v === "ru" ? v : DEFAULT_LANG;
}

export const LANG_COOKIE = "lang";
