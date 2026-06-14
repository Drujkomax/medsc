"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createT, type TFn } from "./t";
import type { Lang } from "~/shared/config/site";

// Provides a t() over the server-resolved dictionary so ported client views can
// keep calling t('home.hero.headline') exactly as the original i18next code did,
// with no SSR/hydration language mismatch (lang comes from the server cookie).
const Ctx = createContext<{ t: TFn; lang: Lang } | null>(null);

export function I18nProvider({ lang, dict, children }: { lang: Lang; dict: unknown; children: ReactNode }) {
  const value = useMemo(() => ({ t: createT(dict), lang }), [dict, lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): TFn {
  const c = useContext(Ctx);
  if (!c) throw new Error("useT must be used within <I18nProvider>");
  return c.t;
}

export function useLang(): Lang {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLang must be used within <I18nProvider>");
  return c.lang;
}
