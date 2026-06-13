# Med Service Centre — client (Next.js)

Public site + admin UI. Deploys to **Vercel**.

- Set Vercel **Root Directory** to this repo root (the Next app).
- Env: `NEXT_PUBLIC_API_URL=https://medsc.api.jaragency.uz`, `NEXT_PUBLIC_SITE_URL=https://medsc.uz`.

The API server is deployed separately on Contabo (`/opt/msc-api`, domain `medsc.api.jaragency.uz`).
The previous Lovable/Vite/Supabase app is on the **`old`** branch.

## Dev
```bash
npm i
npm run dev      # http://localhost:6002  (expects the API on :6001)
```
