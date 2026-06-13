import { Router, Request, Response } from "express";
import { EventEmitter } from "events";

// In-process change bus → SSE. Replaces Supabase Realtime for the 2 postgres_changes
// subscriptions (lead_activities, warehouse_activity_logs). Mutations through /db emit here.
export const bus = new EventEmitter();
bus.setMaxListeners(0);

export function emitChange(table: string, type: "INSERT" | "UPDATE" | "DELETE", record: unknown) {
  bus.emit("change", { table, type, record, schema: "public" });
}

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  (res as any).flushHeaders?.();
  res.write(": connected\n\n");

  const onChange = (payload: unknown) => res.write(`data: ${JSON.stringify(payload)}\n\n`);
  bus.on("change", onChange);

  const keepAlive = setInterval(() => res.write(": ka\n\n"), 25000);
  req.on("close", () => {
    clearInterval(keepAlive);
    bus.off("change", onChange);
  });
});

export default router;
