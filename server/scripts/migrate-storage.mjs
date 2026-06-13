// Download Supabase Storage files that the DB references (storage_files) but that
// aren't on local disk yet — e.g. the private `visits` photos and `clinic-documents`.
// Public `product-images` were already migrated; this fills in the rest. Idempotent:
// skips files already present, so it's safe to re-run.
//
// Usage (run from test-msc/server):
//   SUPABASE_URL=https://<project>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
//   node scripts/migrate-storage.mjs            # all missing
//   node scripts/migrate-storage.mjs visits clinic-documents   # only these buckets
//
// The service_role key is read from your env and used only to GET the objects;
// it is never written anywhere.

import "dotenv/config";
import { promises as fs } from "fs";
import path from "path";
import pg from "pg";

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "";
const STORAGE = path.resolve(process.env.STORAGE_DIR || "./_storage");
const onlyBuckets = process.argv.slice(2); // optional bucket filter

if (!SUPABASE_URL || !KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const encodePath = (p) => p.split("/").map(encodeURIComponent).join("/");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const { rows } = await pool.query(
  `select bucket_id, name from storage_files
   ${onlyBuckets.length ? "where bucket_id = any($1)" : ""}
   order by bucket_id, name`,
  onlyBuckets.length ? [onlyBuckets] : []
);
console.log(`storage_files referenced: ${rows.length}${onlyBuckets.length ? " (buckets: " + onlyBuckets.join(",") + ")" : ""}`);

let have = 0, fetched = 0, failed = 0;
for (const { bucket_id, name } of rows) {
  const dest = path.join(STORAGE, bucket_id, name);
  try { await fs.access(dest); have++; continue; } catch {}
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket_id}/${encodePath(name)}`;
    const res = await fetch(url, { headers: { apikey: KEY, authorization: `Bearer ${KEY}` } });
    if (!res.ok) { failed++; console.warn(`  ✗ ${bucket_id}/${name} → HTTP ${res.status}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, buf);
    fetched++;
    if (fetched % 25 === 0) console.log(`  …${fetched} downloaded`);
  } catch (e) {
    failed++; console.warn(`  ✗ ${bucket_id}/${name} → ${e.message}`);
  }
}

console.log(`\nDone. already on disk: ${have}, downloaded: ${fetched}, failed: ${failed}`);
await pool.end();
