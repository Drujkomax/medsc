"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import ru from "@/i18n/locales/ru.json";
import { createT, type TFn } from "./t";
import { DEFAULT_LANG, type Lang } from "~/shared/config/site";

// Public pages are prerendered (static/ISR) in the default language so they can be
// CDN/browser cached. The visitor's language is applied HERE on the client: after
// hydration we read the `lang` cookie and, for a non-default language, lazily load
// its dictionary and swap. This keeps SSR static (no cookies() on the server, which
// would force per-request dynamic rendering) while preserving the trilingual UX.
// The default (ru) dict ships in the initial bundle; en/uz are code-split.
const DICT_LOADERS: Record<Lang, () => Promise<unknown>> = {
  ru: async () => ru,
  en: () => import("@/i18n/locales/en.json").then((m) => m.default),
  uz: () => import("@/i18n/locales/uz.json").then((m) => m.default),
};

function readLangCookie(): Lang | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)lang=(ru|en|uz)\b/);
  return (m?.[1] as Lang) || null;
}

type I18nCtx = { t: TFn; lang: Lang; setLang: (l: Lang) => void };
const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({
  lang: initialLang = DEFAULT_LANG,
  children,
}: {
  lang?: Lang;
  /** Kept for backward-compat; the dict is now resolved on the client. */
  dict?: unknown;
  children: ReactNode;
}) {
  // The initial render MUST match the server (always DEFAULT_LANG) to avoid a
  // hydration mismatch; the cookie-driven swap happens in the effect below.
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [dict, setDict] = useState<unknown>(ru);

  const setLang = useCallback((next: Lang) => {
    document.cookie = `lang=${next};path=/;max-age=31536000;samesite=lax`;
    DICT_LOADERS[next]().then((d) => {
      setDict(d);
      setLangState(next);
      if (typeof document !== "undefined") document.documentElement.lang = next;
    });
  }, []);

  useEffect(() => {
    const cookieLang = readLangCookie();
    if (cookieLang && cookieLang !== lang) setLang(cookieLang);
    // run once on mount; setLang/lang intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<I18nCtx>(
    () => ({ t: createT(dict), lang, setLang }),
    [dict, lang, setLang],
  );
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

export function useSetLang(): (l: Lang) => void {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSetLang must be used within <I18nProvider>");
  return c.setLang;
}
