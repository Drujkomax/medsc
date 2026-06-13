import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db";
import { authenticate } from "./middleware";
import authRouter from "./auth";
import productsRouter from "./modules/products";
import leadsRouter from "./modules/leads";
import { clients, deals, tasks, categories, site } from "./modules/crm";
import dataRouter from "./modules/data";
import rpcRouter from "./modules/rpc";
import storageRouter from "./modules/storage";
import realtimeRouter from "./realtime";
import supabaseCompatRouter from "./modules/supabase_compat";

const app = express();
app.use(
  cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",") : true, credentials: true })
);
app.use(express.json({ limit: "5mb" }));
app.use(authenticate); // sets req.user (with roles) when a token is present

// Supabase-compatible surface for the already-deployed msc-bot (supabase-py).
// Mounted FIRST so /rest/v1, /auth/v1, /storage/v1 aren't swallowed by the routers below.
app.use(supabaseCompatRouter);

app.get("/health", async (_req, res, next) => {
  try {
    const { rows } = await pool.query("select count(*)::int as tables from pg_tables where schemaname='public'");
    res.json({ ok: true, db: "msc (clean, no RLS)", tables: rows[0].tables });
  } catch (e) {
    next(e);
  }
});

app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/leads", leadsRouter);
app.use("/clients", clients);
app.use("/deals", deals);
app.use("/tasks", tasks);
app.use("/categories", categories);
app.use("/site", site);
// supabase-compat surface for the ported frontend (still our code / clean DB)
app.use("/db", dataRouter);
app.use("/rpc", rpcRouter);
app.use("/storage", storageRouter);
app.use("/realtime", realtimeRouter);

// central error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err?.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err?.message ?? "internal error", code: err?.code, detail: err?.detail });
});

const PORT = parseInt(process.env.PORT || "4000", 10);
app.listen(PORT, () => console.log(`✅ clean backend on :${PORT} (one Express app, code-based authz, no Supabase)`));
