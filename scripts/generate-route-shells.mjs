import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const DIST_DIR = resolve("dist");
const TEMPLATE_PATH = resolve(DIST_DIR, "index.html");
const BASE_URL = "https://medsc.uz";

const ROUTE_SEO_START = "<!-- ROUTE_SEO_START -->";
const ROUTE_SEO_END = "<!-- ROUTE_SEO_END -->";

const pages = [
  {
    path: "/",
    title: "Med Service Centre — Медтехника для клиник Узбекистана",
    description:
      "Med Service Centre — поставщик медоборудования в Узбекистане: УЗИ, анализаторы ABL, электроскальпели BOWA, продажа, сервис и аренда для клиник.",
  },
  {
    path: "/catalog",
    title:
      "Каталог медицинского оборудования в Узбекистане | Med Service Centre",
    description:
      "Каталог Med Service Centre: УЗИ, лабораторные и хирургические системы. Продажа, аренда и сервис медицинского оборудования для клиник Узбекистана.",
  },
  {
    path: "/services",
    title: "Сервис медоборудования в Узбекистане | Med Service Centre",
    description:
      "Сервис медицинского оборудования: монтаж, пусконаладка, обучение персонала и техническое обслуживание по Узбекистану.",
  },
  {
    path: "/cases",
    title: "Кейсы внедрения медоборудования | Med Service Centre",
    description:
      "Практические кейсы Med Service Centre по внедрению и сервису медицинского оборудования в клиниках Узбекистана.",
  },
  {
    path: "/about",
    title: "О компании Med Service Centre",
    description:
      "Med Service Centre — эксперт по поставке, аренде и сервису медицинского оборудования для частных и государственных клиник Узбекистана.",
  },
  {
    path: "/contacts",
    title: "Контакты Med Service Centre",
    description:
      "Свяжитесь с Med Service Centre: консультация по подбору, поставке, аренде и сервису медицинского оборудования в Узбекистане.",
  },
];

const escapeAttribute = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const normalizePath = (path) => {
  if (!path || path === "/") return "/";
  const cleaned = `/${path.replace(/^\/+|\/+$/g, "")}`;
  return cleaned;
};

const buildCanonical = (path) => {
  const normalizedPath = normalizePath(path);
  return normalizedPath === "/" ? `${BASE_URL}/` : `${BASE_URL}${normalizedPath}`;
};

const buildLocalizedHref = (canonical, lang) => {
  const localized = new URL(canonical);
  if (lang === "ru") {
    localized.searchParams.delete("lang");
  } else {
    localized.searchParams.set("lang", lang);
  }
  localized.searchParams.sort();
  return localized.toString();
};

const buildRouteMetaBlock = (canonical) => {
  const xDefault = buildLocalizedHref(canonical, "ru");

  return [
    `    ${ROUTE_SEO_START}`,
    `    <link rel="canonical" href="${canonical}" />`,
    `    <link rel="alternate" href="${buildLocalizedHref(canonical, "ru")}" hreflang="ru" />`,
    `    <link rel="alternate" href="${buildLocalizedHref(canonical, "en")}" hreflang="en" />`,
    `    <link rel="alternate" href="${buildLocalizedHref(canonical, "uz")}" hreflang="uz" />`,
    `    <link rel="alternate" href="${xDefault}" hreflang="x-default" />`,
    `    <meta property="og:url" content="${canonical}" />`,
    `    ${ROUTE_SEO_END}`,
  ].join("\n");
};

const replaceOrInsert = (html, pattern, replacement) => {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }

  return html.replace("</head>", `${replacement}\n  </head>`);
};

const applySeoToHtml = (template, page) => {
  const canonical = buildCanonical(page.path);
  const escapedTitle = escapeAttribute(page.title);
  const escapedDescription = escapeAttribute(page.description);

  let html = template;

  html = replaceOrInsert(html, /<title>[\s\S]*?<\/title>/, `<title>${escapedTitle}</title>`);
  html = replaceOrInsert(
    html,
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="description" content="${escapedDescription}" />`,
  );
  html = replaceOrInsert(
    html,
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta property="og:title" content="${escapedTitle}" />`,
  );
  html = replaceOrInsert(
    html,
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta property="og:description" content="${escapedDescription}" />`,
  );
  html = replaceOrInsert(
    html,
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="twitter:title" content="${escapedTitle}" />`,
  );
  html = replaceOrInsert(
    html,
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="twitter:description" content="${escapedDescription}" />`,
  );

  const routeMetaBlockPattern = new RegExp(
    `\\s*${ROUTE_SEO_START}[\\s\\S]*?${ROUTE_SEO_END}`,
    "m",
  );
  const routeMetaBlock = buildRouteMetaBlock(canonical);
  html = replaceOrInsert(html, routeMetaBlockPattern, `\n${routeMetaBlock}`);

  return html;
};

const routePathToOutputFile = (path) => {
  if (path === "/") {
    return resolve(DIST_DIR, "index.html");
  }

  const normalized = normalizePath(path).slice(1);
  return resolve(DIST_DIR, normalized, "index.html");
};

const writeCompressedHtmlVariants = async (outputPath, html) => {
  const sourceBuffer = Buffer.from(html, "utf8");
  const gzBuffer = gzipSync(sourceBuffer, { level: 9 });
  const brBuffer = brotliCompressSync(sourceBuffer, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11,
    },
  });

  await writeFile(`${outputPath}.gz`, gzBuffer);
  await writeFile(`${outputPath}.br`, brBuffer);
};

const template = await readFile(TEMPLATE_PATH, "utf8");

for (const page of pages) {
  const renderedHtml = applySeoToHtml(template, page);
  const outputPath = routePathToOutputFile(page.path);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderedHtml, "utf8");
  await writeCompressedHtmlVariants(outputPath, renderedHtml);
}

console.log(
  `Generated SEO route shells: ${pages.map((page) => page.path).join(", ")}`,
);
