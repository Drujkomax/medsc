# Deploy — Med Service Centre (own stack, no Supabase / no Lovable)

Architecture after migration:

```
medsc.uz        →  Vercel        →  client/   (Next.js, public site + admin UI)
api.medsc.uz    →  Contabo       →  server/   (Express API + Postgres + file storage)
Telegram bot    →  (already deployed)  → repoints to api.medsc.uz via the Supabase-compat layer
```

The old Lovable/Vite/Supabase app is preserved on the **`old`** git branch.

Two artifacts are **gitignored** (contain PII / are large) and must be copied to the server out-of-band:
- `data-dump.sql` — full DB (schema + data + bcrypt password hashes), ~1 MB
- `server/_storage/` — uploaded files / photos (product images + visit photos), ~188 MB

---

## 1. Server → Contabo

```bash
# on your machine: copy repo + the two gitignored artifacts to the server
rsync -az --exclude node_modules --exclude .next ./ user@CONTABO_IP:/opt/msc/
rsync -az ./data-dump.sql              user@CONTABO_IP:/opt/msc/data-dump.sql
rsync -az ./server/_storage/           user@CONTABO_IP:/opt/msc/server/_storage/
```

On the server, create `/opt/msc/.env` (used by docker-compose.prod.yml):
```env
DB_PASSWORD=<pick a strong password>
JWT_SECRET=<reuse the SAME value as before so existing sessions/passwords keep working>
CLIENT_ORIGIN=https://medsc.uz
BOT_SERVICE_KEY=<shared secret for the bot — see step 3>
API_DOMAIN=api.medsc.uz
```
Point DNS `api.medsc.uz` → Contabo IP, then:
```bash
cd /opt/msc
docker compose -f docker-compose.prod.yml up -d --build
```
- Postgres loads `data-dump.sql` on first start (all data + passwords).
- Caddy gets an HTTPS cert for `api.medsc.uz` automatically.
- Verify: `curl https://api.medsc.uz/health` → `{"ok":true,...}`.

> Password preservation: existing employees keep their passwords (bcrypt hashes are in the dump). Reuse the previous `JWT_SECRET` so issued tokens stay valid.

---

## 2. Client → Vercel

In the Vercel project:
- **Root Directory:** `client`
- **Framework:** Next.js (auto)
- **Environment variable:** `NEXT_PUBLIC_API_URL = https://api.medsc.uz`
- Deploy, then add the domain **medsc.uz** in Vercel → Domains.

`client/next.config.ts` already proxies `/storage/*` to the API, and image URLs use `NEXT_PUBLIC_API_URL`, so photos load from the Contabo server. Make sure `CLIENT_ORIGIN` on the server matches the Vercel domain (CORS).

---

## 3. Telegram bot → repoint (no code change)

The bot (`msc-bot`) talks Supabase protocol; the server exposes a compatible layer
(`/rest/v1`, `/auth/v1`, `/storage/v1`). Change only the bot's env and restart it:
```env
SUPABASE_URL=https://api.medsc.uz
SUPABASE_SERVICE_ROLE_KEY=<BOT_SERVICE_KEY value from server .env>
SUPABASE_ANON_KEY=<same BOT_SERVICE_KEY value>
TELEGRAM_BOT_TOKEN=<unchanged>
```

---

## 4. Cutover (do in this order)

1. ✅ Server live (`/health` OK, data + photos present), client live on Vercel, bot repointed & working.
2. Move the domain **medsc.uz** from Lovable to Vercel (DNS / domain settings), unlink Lovable.
3. Only then **pause/stop Supabase**. (Everything is already copied; nothing left to lose.)
4. Rotate the old Supabase keys — the anon key lived in the old repo and the service_role key was shared once.

---

## Local development

```bash
docker compose up -d                 # local Postgres on :55432 (db `msc`)
psql -h localhost -p 55432 -U postgres -d msc < data-dump.sql   # load data once
cd server && npm i && npm run dev     # API on :6001
cd client && npm i && npm run dev     # UI on :6002
```
