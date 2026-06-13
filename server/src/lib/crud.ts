import { q } from "../db";

const isIdent = (s: string) => /^[a-z_][a-z0-9_]*$/.test(s);

/** Insert a row. Column names are identifier-checked; table is fixed by the caller. */
export async function insertInto(
  table: string,
  body: Record<string, unknown>,
  forced: Record<string, unknown> = {}
) {
  const data = { ...body, ...forced };
  const keys = Object.keys(data).filter(isIdent);
  if (!keys.length) throw Object.assign(new Error("empty body"), { status: 400 });
  const cols = keys.map((k) => `"${k}"`).join(", ");
  const ph = keys.map((_, i) => `$${i + 1}`).join(", ");
  const { rows } = await q(`insert into ${table} (${cols}) values (${ph}) returning *`, keys.map((k) => data[k]));
  return rows[0];
}

export async function updateById(table: string, id: string, body: Record<string, unknown>) {
  const keys = Object.keys(body).filter(isIdent);
  if (!keys.length) throw Object.assign(new Error("empty body"), { status: 400 });
  const set = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
  const vals = keys.map((k) => body[k]);
  vals.push(id);
  const { rows } = await q(`update ${table} set ${set} where id = $${vals.length} returning *`, vals);
  return rows[0] ?? null;
}

export async function deleteById(table: string, id: string) {
  const { rows } = await q(`delete from ${table} where id = $1 returning id`, [id]);
  return rows[0] ?? null;
}
