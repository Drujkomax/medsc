// Typed HTTP client for the Express API (FSD: shared/api).
// Works on the server (SSR data fetching) and client. Replaces the supabase shim
// for the rewritten FSD pages.
import { API_URL } from "~/shared/config/site";

const TOKEN_KEY = "msc_token";
const token = () => (typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);

type Opts = { auth?: boolean; revalidate?: number; cache?: RequestCache };

async function request<T>(path: string, init: RequestInit & Opts = {}): Promise<T> {
  const { auth, revalidate, cache, headers, ...rest } = init;
  const t = auth ? token() : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "content-type": "application/json",
      ...(t ? { authorization: `Bearer ${t}` } : {}),
      ...(headers as Record<string, string>),
    },
    ...(cache ? { cache } : revalidate != null ? { next: { revalidate } } : {}),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json())?.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

/** Generic select against the Express /db/:table compat endpoint. */
export function dbSelect<T = unknown>(
  table: string,
  body: { filters?: unknown[]; order?: { col: string; ascending?: boolean }; limitN?: number; single?: boolean } = {},
  opts: Opts = {},
): Promise<{ data: T; error: { message: string } | null }> {
  return request(`/db/${table}`, { method: "POST", body: JSON.stringify({ op: "select", ...body }), ...opts });
}

export function rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}, opts: Opts = {}): Promise<{ data: T; error: { message: string } | null }> {
  return request(`/rpc/${fn}`, { method: "POST", body: JSON.stringify(args), ...opts });
}

export const http = { request, dbSelect, rpc, TOKEN_KEY };
