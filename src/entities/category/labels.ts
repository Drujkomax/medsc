// Shared product-category labels (FSD: entities/category).
// Single source of truth for category display names across catalog, product,
// home and the dedicated /catalog/category/[slug] landing pages.
import type { Lang } from "~/shared/config/site";

export const CATEGORY_LABELS: Record<string, Record<Lang, string>> = {
  diagnostic: { ru: "Диагностическое", en: "Diagnostic", uz: "Diagnostika" },
  surgical: { ru: "Хирургическое", en: "Surgical", uz: "Jarrohlik" },
  monitoring: { ru: "Мониторинг", en: "Monitoring", uz: "Monitoring" },
  laboratory: { ru: "Лабораторное", en: "Laboratory", uz: "Laboratoriya" },
  rehabilitation: { ru: "Реабилитационное", en: "Rehabilitation", uz: "Reabilitatsiya" },
  dental: { ru: "Стоматологическое", en: "Dental", uz: "Stomatologiya" },
  ophthalmology: { ru: "Офтальмологическое", en: "Ophthalmology", uz: "Oftalmologiya" },
  furniture: { ru: "Медицинская мебель", en: "Medical Furniture", uz: "Tibbiy mebel" },
};

/** Localized category label, falls back to the raw value. */
export function getCategoryLabel(value: string, lang: Lang): string {
  return CATEGORY_LABELS[value]?.[lang] || value;
}

/** SEO intro copy for a category landing page (RU is the indexable default). */
export function categoryIntro(value: string, lang: Lang): string {
  const label = getCategoryLabel(value, lang);
  const map: Record<Lang, string> = {
    ru: `${label} медицинское оборудование от Med Service Centre: продажа, аренда, поставка, монтаж и сервисное обслуживание для клиник по всему Узбекистану — Ташкент и регионы. Подбор решений под задачи и бюджет, гарантия и обучение персонала.`,
    en: `${label} medical equipment from Med Service Centre: sales, rental, supply, installation and service for clinics across Uzbekistan — Tashkent and the regions. Solutions tailored to your needs and budget, with warranty and staff training.`,
    uz: `${label} tibbiy uskunalari Med Service Centre'dan: butun Oʻzbekiston boʻylab — Toshkent va viloyatlardagi klinikalar uchun sotuv, ijara, yetkazib berish, oʻrnatish va servis. Vazifa va byudjetga mos yechimlar, kafolat va xodimlarni oʻqitish.`,
  };
  return map[lang];
}
