import { Router } from "express";
import express from "express";
import path from "path";
import { promises as fs } from "fs";

// File storage on local disk (replaces Supabase Storage buckets).
//   GET    /storage/<bucket>/<path>  → serve file (static)
//   POST   /storage/<bucket>/<path>  → upload raw file bytes (auth required)
//   DELETE /storage/<bucket>/<path>  → remove file (auth required)
const router = Router();
const STORAGE = path.resolve(process.env.STORAGE_DIR || "./_storage");

// Resolve <bucket>/<rest> to an absolute path inside STORAGE, blocking traversal.
function resolveSafe(bucket: string, rest: string): string | null {
  if (!/^[a-z0-9_-]+$/i.test(bucket)) return null;
  const full = path.resolve(STORAGE, bucket, rest);
  const base = path.resolve(STORAGE, bucket);
  if (full !== base && !full.startsWith(base + path.sep)) return null; // no ../ escape
  return full;
}

// Upload: the supabase-compat shim sends the File as the raw request body.
router.post(
  "/:bucket/*",
  express.raw({ type: () => true, limit: "30mb" }),
  async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "unauthenticated" });
    const rest = (req.params as any)[0] as string;
    const dest = resolveSafe(req.params.bucket, rest);
    if (!dest) return res.status(400).json({ error: "bad path" });
    try {
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, req.body as Buffer);
      res.json({ path: `${req.params.bucket}/${rest}`, key: rest });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.delete("/:bucket/*", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "unauthenticated" });
  const dest = resolveSafe(req.params.bucket, (req.params as any)[0] as string);
  if (!dest) return res.status(400).json({ error: "bad path" });
  try {
    await fs.unlink(dest).catch(() => {}); // missing file is fine
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Serve uploaded/migrated files.
router.use("/", express.static(STORAGE, { fallthrough: true, maxAge: "1h" }));

export default router;
