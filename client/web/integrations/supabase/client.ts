// Supabase-compatible shim → our own Express backend (NO Supabase).
// Lets the entire ported frontend keep its supabase.from()/.rpc()/.auth/.storage calls
// unchanged while talking to test-msc/server.
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TOKEN_KEY = "msc_token";

const tok = () => (typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);

async function post(path: string, body: unknown) {
  const t = tok();
  const res = await fetch(API + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(t ? { authorization: `Bearer ${t}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  return res.json();
}
async function get(path: string) {
  const t = tok();
  const res = await fetch(API + path, { headers: t ? { authorization: `Bearer ${t}` } : {} });
  return { ok: res.ok, body: await res.json() };
}

type Filter = { col: string; op: string; val: unknown };

class Query<T = any> {
  private _filters: Filter[] = [];
  private _order?: { col: string; ascending: boolean };
  private _limit?: number;
  private _range?: { from: number; to: number };
  private _single = false;
  private _op: "select" | "insert" | "update" | "delete" = "select";
  private _values: unknown;
  constructor(private table: string) {}

  select(_cols?: string, _opts?: unknown) { return this; }
  insert(values: unknown) { this._op = "insert"; this._values = values; return this; }
  upsert(values: unknown) { this._op = "insert"; this._values = values; return this; }
  update(values: unknown) { this._op = "update"; this._values = values; return this; }
  delete() { this._op = "delete"; return this; }

  eq(c: string, v: unknown) { this._filters.push({ col: c, op: "eq", val: v }); return this; }
  neq(c: string, v: unknown) { this._filters.push({ col: c, op: "neq", val: v }); return this; }
  gt(c: string, v: unknown) { this._filters.push({ col: c, op: "gt", val: v }); return this; }
  gte(c: string, v: unknown) { this._filters.push({ col: c, op: "gte", val: v }); return this; }
  lt(c: string, v: unknown) { this._filters.push({ col: c, op: "lt", val: v }); return this; }
  lte(c: string, v: unknown) { this._filters.push({ col: c, op: "lte", val: v }); return this; }
  like(c: string, v: unknown) { this._filters.push({ col: c, op: "like", val: v }); return this; }
  ilike(c: string, v: unknown) { this._filters.push({ col: c, op: "ilike", val: v }); return this; }
  in(c: string, v: unknown[]) { this._filters.push({ col: c, op: "in", val: v }); return this; }
  is(c: string, v: unknown) { this._filters.push({ col: c, op: "is", val: v }); return this; }
  contains(c: string, v: unknown) { this._filters.push({ col: c, op: "eq", val: v }); return this; }
  not(c: string, op: string, v: unknown) { this._filters.push({ col: c, op: "not_" + op, val: v }); return this; }
  or(str: string) {
    const conditions = String(str)
      .split(",")
      .map((part) => {
        const [col, op, ...rest] = part.split(".");
        let val: unknown = rest.join(".");
        if (val === "true") val = true;
        else if (val === "false") val = false;
        else if (val === "null") val = null;
        return { col, op, val };
      });
    this._filters.push({ col: "__or__", op: "or", conditions } as any);
    return this;
  }
  order(c: string, opts?: { ascending?: boolean }) {
    this._order = { col: c, ascending: opts?.ascending !== false };
    return this;
  }
  limit(n: number) { this._limit = n; return this; }
  range(from: number, to: number) { this._range = { from, to }; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._single = true; return this; }

  private exec() {
    return post(`/db/${this.table}`, {
      op: this._op,
      filters: this._filters,
      order: this._order,
      limitN: this._limit,
      range: this._range,
      values: this._values,
      single: this._single,
    });
  }
  then<R1 = any, R2 = never>(
    onfulfilled?: ((v: { data: T; error: any }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null
  ) {
    return this.exec().then(onfulfilled as any, onrejected as any);
  }
}

// ── auth ─────────────────────────────────────────────────────────────────────
type Listener = (event: string, session: any) => void;
const listeners: Listener[] = [];
const emit = (event: string, session: any) => listeners.forEach((l) => l(event, session));

const auth = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const r = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (!r.ok) return { data: { user: null, session: null }, error: { message: d.error || "auth error" } };
    localStorage.setItem(TOKEN_KEY, d.token);
    const session = { access_token: d.token, user: d.user };
    emit("SIGNED_IN", session);
    return { data: { user: d.user, session }, error: null };
  },
  async signUp({ email, password, options }: any) {
    const r = await fetch(API + "/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, full_name: options?.data?.full_name }),
    });
    const d = await r.json();
    if (!r.ok) return { data: { user: null, session: null }, error: { message: d.error } };
    localStorage.setItem(TOKEN_KEY, d.token);
    return { data: { user: d.user, session: { access_token: d.token, user: d.user } }, error: null };
  },
  async signOut() {
    localStorage.removeItem(TOKEN_KEY);
    emit("SIGNED_OUT", null);
    return { error: null };
  },
  async getSession() {
    const t = tok();
    if (!t) return { data: { session: null }, error: null };
    const { ok, body } = await get("/auth/me");
    return { data: { session: ok && body.user ? { access_token: t, user: body.user } : null }, error: null };
  },
  async getUser() {
    const t = tok();
    if (!t) return { data: { user: null }, error: null };
    const { ok, body } = await get("/auth/me");
    return { data: { user: ok ? body.user : null }, error: ok ? null : { message: body.error } };
  },
  onAuthStateChange(cb: Listener) {
    listeners.push(cb);
    (async () => {
      const t = tok();
      if (t) {
        const { ok, body } = await get("/auth/me");
        cb("INITIAL_SESSION", ok && body.user ? { access_token: t, user: body.user } : null);
      } else cb("INITIAL_SESSION", null);
    })();
    return { data: { subscription: { unsubscribe() { const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1); } } } };
  },
  admin: {
    async listUsers() { return { data: { users: [] }, error: null }; },
  },
};

// ── storage ──────────────────────────────────────────────────────────────────
const storage = {
  from(bucket: string) {
    return {
      getPublicUrl(path: string) { return { data: { publicUrl: `${API}/storage/${bucket}/${path}` } }; },
      async createSignedUrl(path: string) { return { data: { signedUrl: `${API}/storage/${bucket}/${path}` }, error: null }; },
      async upload(path: string, file: Blob | File, _opts?: unknown) {
        const t = tok();
        const res = await fetch(`${API}/storage/${bucket}/${path}`, {
          method: "POST",
          headers: {
            ...(t ? { authorization: `Bearer ${t}` } : {}),
            "content-type": (file as File)?.type || "application/octet-stream",
          },
          body: file,
        });
        if (!res.ok) {
          let msg = "upload failed";
          try { msg = (await res.json()).error || msg; } catch {}
          return { data: null, error: { message: msg } };
        }
        return { data: { path, fullPath: `${bucket}/${path}` }, error: null };
      },
      async remove(paths: string[]) {
        const t = tok();
        await Promise.all(
          (paths || []).map((p) =>
            fetch(`${API}/storage/${bucket}/${p}`, {
              method: "DELETE",
              headers: t ? { authorization: `Bearer ${t}` } : {},
            }).catch(() => {})
          )
        );
        return { data: null, error: null };
      },
    };
  },
};

// ── realtime (SSE → our /realtime; reproduces postgres_changes subscriptions) ──
function channel(_name: string) {
  const subs: { config: any; cb: (p: any) => void }[] = [];
  let es: EventSource | null = null;
  const ch: any = {
    on(_type: string, config: any, cb: (p: any) => void) {
      subs.push({ config, cb });
      return ch;
    },
    subscribe(cb?: (status: string) => void) {
      if (typeof EventSource !== "undefined") {
        es = new EventSource(`${API}/realtime`);
        es.onmessage = (e: MessageEvent) => {
          let p: any;
          try { p = JSON.parse(e.data); } catch { return; }
          for (const s of subs) {
            const c = s.config || {};
            if (c.table && c.table !== p.table) continue;
            if (c.event && c.event !== "*" && c.event !== p.type) continue;
            if (c.filter) {
              const m = /^(\w+)=eq\.(.+)$/.exec(c.filter);
              if (m && p.record && String(p.record[m[1]]) !== m[2]) continue;
            }
            try { s.cb({ eventType: p.type, new: p.record, old: p.record, schema: "public", table: p.table }); } catch {}
          }
        };
      }
      cb?.("SUBSCRIBED");
      return ch;
    },
    unsubscribe() { es?.close(); es = null; return Promise.resolve("ok"); },
  };
  return ch;
}

export const supabase: any = {
  from: (table: string) => new Query(table),
  rpc: (fn: string, args?: unknown) => post(`/rpc/${fn}`, args),
  auth,
  storage,
  channel,
  removeChannel: (ch: any) => { try { ch?.unsubscribe?.(); } catch {} },
};
