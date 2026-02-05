import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// Lightweight .env loader to make the script work without extra deps.
const loadDotEnv = async () => {
  try {
    const envPath = resolve(".env");
    const raw = await readFile(envPath, "utf8");
    raw.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) return;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    });
  } catch {
    // It's fine if .env is missing in CI; env vars can come from the shell.
  }
};

await loadDotEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const siteUrl = process.env.SITE_URL || "https://medsc.uz";

const cyrillicMap = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

const transliterateCyrillic = (value) =>
  value
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      return lower in cyrillicMap ? cyrillicMap[lower] : char;
    })
    .join("");

const toAsciiSlug = (value) => {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  if (/^[a-z0-9-]+$/.test(normalized)) return normalized;
  return transliterateCyrillic(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing env: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) are required.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const isoDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const normalizeUrl = (path) => {
  if (!path.startsWith("/")) return `${siteUrl}/${path}`;
  return `${siteUrl}${path}`;
};

const staticUrls = [
  { loc: normalizeUrl("/"), changefreq: "weekly", priority: "1.0", lastmod: isoDate() },
  { loc: normalizeUrl("/catalog"), changefreq: "weekly", priority: "0.8", lastmod: isoDate() },
  { loc: normalizeUrl("/services"), changefreq: "monthly", priority: "0.7", lastmod: isoDate() },
  { loc: normalizeUrl("/cases"), changefreq: "monthly", priority: "0.6", lastmod: isoDate() },
  { loc: normalizeUrl("/about"), changefreq: "monthly", priority: "0.6", lastmod: isoDate() },
  { loc: normalizeUrl("/contacts"), changefreq: "monthly", priority: "0.6", lastmod: isoDate() },
];

// SEO-optimized categories (must match catalogSeo.ts)
const seoCategories = [
  "diagnostic",
  "laboratory", 
  "surgical",
  "dental",
  "rehabilitation",
  "monitoring",
  "sterilization",
  "furniture",
  "consumables",
];

// Fetch categories from DB for updated_at timestamps
const { data: dbCategories, error: categoriesError } = await supabase
  .from("product_categories")
  .select("value, updated_at");

if (categoriesError) {
  console.error("Failed to load categories:", categoriesError.message);
  process.exit(1);
}

// Create a map of category values to their updated_at
const categoryTimestamps = new Map(
  (dbCategories || []).map((cat) => [cat.value, cat.updated_at])
);

// Generate URLs for all SEO categories
const categoryUrls = seoCategories.map((category) => ({
  loc: normalizeUrl(`/catalog?category=${category}`),
  lastmod: isoDate(categoryTimestamps.get(category)),
  changefreq: "weekly",
  priority: "0.8",
}));

const { data: manufacturers, error: manufacturersError } = await supabase
  .from("manufacturers")
  .select("id, slug");

if (manufacturersError) {
  console.error("Failed to load manufacturers:", manufacturersError.message);
  process.exit(1);
}

const manufacturerSlugMap = new Map(
  (manufacturers || [])
    .filter((manufacturer) => manufacturer.slug)
    .map((manufacturer) => [manufacturer.id, toAsciiSlug(manufacturer.slug)]),
);

const { data: products, error: productsError } = await supabase
  .from("products")
  .select("id, slug, updated_at, status, archived, manufacturer_id")
  .eq("status", "active")
  .or("archived.eq.false,archived.is.null");

if (productsError) {
  console.error("Failed to load products:", productsError.message);
  process.exit(1);
}

const productUrls = (products || []).map((product) => {
  const productSlug = product.slug || product.id;
  const manufacturerSlug = manufacturerSlugMap.get(product.manufacturer_id);
  const path = manufacturerSlug
    ? `/catalog/${manufacturerSlug}/${productSlug}`
    : `/catalog/${productSlug}`;
  return {
    loc: normalizeUrl(path),
    lastmod: isoDate(product.updated_at),
    changefreq: "weekly",
    priority: "0.7",
  };
});

const urlEntries = [...staticUrls, ...categoryUrls, ...productUrls]
  .map((entry) => {
    const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : "";
    return [
      "  <url>",
      `    <loc>${entry.loc}</loc>`,
      lastmod ? `    ${lastmod}` : "",
      entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : "",
      entry.priority ? `    <priority>${entry.priority}</priority>` : "",
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n");
  })
  .join("\n");

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  urlEntries,
  "</urlset>",
  "",
].join("\n");

const outputPath = resolve("public/sitemap.xml");
await writeFile(outputPath, xml, "utf8");

console.log(
  `Sitemap updated: ${outputPath} (${staticUrls.length} static, ${categoryUrls.length} categories, ${productUrls.length} products)`,
);
