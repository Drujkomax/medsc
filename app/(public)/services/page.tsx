import type { Metadata } from "next";
import Link from "next/link";
import { getServices, type Service } from "~/entities/service/api";
import { getLang } from "~/shared/i18n/lang";
import { API_URL, SITE_URL, pick, type Lang } from "~/shared/config/site";

export const metadata: Metadata = {
  title: "Услуги — Med Service Centre",
  description:
    "Полный цикл услуг для медицинских учреждений Узбекистана: поставка, инсталляция и настройка оборудования, обучение персонала, техническое обслуживание, аренда и гарантийная поддержка.",
  alternates: { canonical: `${SITE_URL}/services` },
};

const T = {
  heroEyebrow: { ru: "Что мы делаем", en: "What we do", uz: "Biz nima qilamiz" },
  heroTitle: {
    ru: "Услуги полного цикла для медицинского оборудования",
    en: "Full-cycle services for medical equipment",
    uz: "Tibbiy uskunalar uchun to‘liq tsikldagi xizmatlar",
  },
  heroSub: {
    ru: "От поставки и инсталляции до обучения, сервиса и аренды — Med Service Centre сопровождает клиники Узбекистана на каждом этапе работы с оборудованием.",
    en: "From supply and installation to training, service and rental — Med Service Centre supports clinics in Uzbekistan at every stage of equipment lifecycle.",
    uz: "Yetkazib berish va o‘rnatishdan tortib o‘qitish, servis va ijaragacha — Med Service Centre O‘zbekiston klinikalarini uskuna bilan ishlashning har bir bosqichida qo‘llab-quvvatlaydi.",
  },
  toContacts: { ru: "Обсудить проект", en: "Discuss a project", uz: "Loyihani muhokama qilish" },
  toCatalog: { ru: "Смотреть каталог", en: "View catalog", uz: "Katalogni ko‘rish" },
  sectionTitle: { ru: "Наши услуги", en: "Our services", uz: "Bizning xizmatlar" },
  ctaTitle: {
    ru: "Нужна консультация по оборудованию или сервису?",
    en: "Need advice on equipment or service?",
    uz: "Uskuna yoki servis bo‘yicha maslahat kerakmi?",
  },
  ctaSub: {
    ru: "8 лет опыта и более 300 реализованных проектов. Расскажите о задаче — подберём решение под ваш бюджет.",
    en: "8 years of experience and 300+ completed projects. Tell us your goal — we’ll tailor a solution to your budget.",
    uz: "8 yillik tajriba va 300+ amalga oshirilgan loyiha. Vazifangiz haqida ayting — byudjetingizga mos yechim tanlaymiz.",
  },
  ctaBtn: { ru: "Связаться с нами", en: "Get in touch", uz: "Biz bilan bog‘lanish" },
} as const;

type Static = {
  key: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
};

// Curated fallback used when the services table is empty / unreachable.
const FALLBACK: Static[] = [
  {
    key: "supply",
    title: { ru: "Поставка оборудования", en: "Equipment supply", uz: "Uskuna yetkazib berish" },
    description: {
      ru: "Подбор и поставка медоборудования от ведущих производителей: УЗИ, анализаторы, электрохирургия, лабораторные системы.",
      en: "Sourcing and delivery of medical equipment from leading manufacturers: ultrasound, analyzers, electrosurgery, lab systems.",
      uz: "Yetakchi ishlab chiqaruvchilardan tibbiy uskunalarni tanlash va yetkazib berish: UZI, analizatorlar, elektroxirurgiya, laboratoriya tizimlari.",
    },
  },
  {
    key: "install",
    title: { ru: "Инсталляция и настройка", en: "Installation & setup", uz: "O‘rnatish va sozlash" },
    description: {
      ru: "Профессиональный монтаж, ввод в эксплуатацию и калибровка оборудования силами сертифицированных инженеров.",
      en: "Professional installation, commissioning and calibration of equipment by certified engineers.",
      uz: "Sertifikatlangan muhandislar tomonidan uskunani professional o‘rnatish, ishga tushirish va kalibrlash.",
    },
  },
  {
    key: "training",
    title: { ru: "Обучение персонала", en: "Staff training", uz: "Xodimlarni o‘qitish" },
    description: {
      ru: "Практические тренинги для медицинского и технического персонала по работе с поставленным оборудованием.",
      en: "Hands-on training for medical and technical staff on operating the supplied equipment.",
      uz: "Yetkazib berilgan uskunada ishlash bo‘yicha tibbiy va texnik xodimlar uchun amaliy treninglar.",
    },
  },
  {
    key: "maintenance",
    title: { ru: "Техническое обслуживание", en: "Technical maintenance", uz: "Texnik xizmat ko‘rsatish" },
    description: {
      ru: "Плановое и срочное сервисное обслуживание, диагностика и ремонт с поставкой оригинальных запчастей.",
      en: "Scheduled and on-demand servicing, diagnostics and repair with genuine spare parts supply.",
      uz: "Rejali va shoshilinch servis, diagnostika va ta’mirlash, original ehtiyot qismlar bilan ta’minlash.",
    },
  },
  {
    key: "rental",
    title: { ru: "Аренда оборудования", en: "Equipment rental", uz: "Uskuna ijarasi" },
    description: {
      ru: "Гибкая аренда медицинского оборудования под краткосрочные и долгосрочные задачи клиники.",
      en: "Flexible rental of medical equipment for short-term and long-term clinic needs.",
      uz: "Klinikaning qisqa va uzoq muddatli vazifalari uchun tibbiy uskunalarni moslashuvchan ijaraga berish.",
    },
  },
  {
    key: "warranty",
    title: { ru: "Гарантийная поддержка", en: "Warranty support", uz: "Kafolat qo‘llab-quvvatlash" },
    description: {
      ru: "Полное гарантийное и постгарантийное сопровождение с быстрым реагированием на обращения.",
      en: "Full warranty and post-warranty support with a fast response to requests.",
      uz: "So‘rovlarga tez javob beradigan to‘liq kafolat va kafolatdan keyingi qo‘llab-quvvatlash.",
    },
  },
];

function icon(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

// Minimal inline glyph as a default visual when a service has no icon_url.
function ServiceGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M12 3v18M3 12h18" />
      <rect x="4" y="4" width="16" height="16" rx="4" />
    </svg>
  );
}

export default async function ServicesPage() {
  const lang = (await getLang()) as Lang;
  const services = await getServices();

  const items: { id: string; title: string; description: string; iconUrl: string | null }[] =
    services.length > 0
      ? services.map((s: Service) => ({
          id: s.id,
          title: pick(s.title, lang),
          description: pick(s.description, lang),
          iconUrl: icon(s.icon_url),
        }))
      : FALLBACK.map((s) => ({
          id: s.key,
          title: pick(s.title, lang),
          description: pick(s.description, lang),
          iconUrl: null,
        }));

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="inline-block rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {T.heroEyebrow[lang]}
          </span>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {T.heroTitle[lang]}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{T.heroSub[lang]}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contacts"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              {T.toContacts[lang]} →
            </Link>
            <Link
              href="/catalog"
              className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              {T.toCatalog[lang]}
            </Link>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{T.sectionTitle[lang]}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <article
              key={s.id}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                {s.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.iconUrl}
                    alt={s.title}
                    loading="lazy"
                    decoding="async"
                    className="h-6 w-6 object-contain"
                  />
                ) : (
                  <ServiceGlyph />
                )}
              </div>
              <h3 className="mt-5 text-lg font-semibold leading-snug">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-primary px-6 py-12 text-primary-foreground sm:px-12 sm:py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{T.ctaTitle[lang]}</h2>
            <p className="mt-3 text-base text-primary-foreground/90">{T.ctaSub[lang]}</p>
            <div className="mt-7">
              <Link
                href="/contacts"
                className="inline-flex rounded-xl bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary shadow-sm transition hover:opacity-90"
              >
                {T.ctaBtn[lang]} →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
