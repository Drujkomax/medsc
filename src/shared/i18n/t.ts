// Pure, framework-agnostic translator that mirrors the subset of the i18next
// API the ported pages use: dot-path lookup, { returnObjects } and {{var}}
// interpolation. Works identically on the server and the client so a value
// resolved during SSR hydrates without mismatch.
export type TFn = (key: string, opts?: { returnObjects?: boolean; [k: string]: unknown }) => any;

export function createT(dict: unknown): TFn {
  return (key, opts) => {
    const val = key.split('.').reduce<any>((o, k) => (o == null ? o : o[k]), dict);
    if (val == null) return key;
    if (opts?.returnObjects) return val;
    if (typeof val === 'string' && opts) {
      return val.replace(/\{\{(\w+)\}\}/g, (_, v) => (opts[v] != null ? String(opts[v]) : ''));
    }
    return val;
  };
}
