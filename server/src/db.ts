import { Pool } from "pg";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Plain query — no role switching, no JWT GUC. A normal app talking to a normal DB. */
export function q<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
) {
  return pool.query<T>(text, params as never[]);
}
