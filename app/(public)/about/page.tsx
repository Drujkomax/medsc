import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "~/shared/i18n/lang";
import { SITE_URL, type Lang } from "~/shared/config/site";

export const metadata: Metadata = {
  title: "О компании — Med Service Centre",
  description:
    "Med Service Centre — интегратор медицинского оборудования и сервис-услуг в Узбекистане. 8 лет опыта, 300+ проектов, официальный партнёр ведущих производителей: поставка, инсталляция, обучение, сервис и аренда.",
  alternates: { canonical: `${SITE_URL}/about` },
};

const T = {
  eyebrow: {
    ru: "О компании",
    en: "About us",
    uz: "Kompaniya haqida",
  },
  heroTitle: {
    ru: "Интегратор медицинского оборудования в Узбекистане",
    en: "Medical-equipment integrator in Uzbekistan",
    uz: "O‘zbekistonda tibbiy uskunalar integratori",
  },
  heroSub: {
    ru: "Med Service Centre объединяет поставку оборудования, инженерный сервис и обучение персонала в единый процесс — от первого расчёта до запуска в эксплуатацию и поддержки. Мы официальный партнёр ведущих мировых производителей и работаем с клиниками по всему Узбекистану.",
    en: "Med Service Centre brings equipment supply, engineering service and staff training into a single process — from the first quote to commissioning and ongoing support. We are an official partner of leading global manufacturers, working with clinics across Uzbekistan.",
    uz: "Med Service Centre uskunalar yetkazib berish, muhandislik xizmati va xodimlarni o‘qitishni yagona jarayonga birlashtiradi — birinchi hisob-kitobdan ishga tushirish va qo‘llab-quvvatlashgacha. Biz yetakchi jahon ishlab chiqaruvchilarining rasmiy hamkorimiz va O‘zbekiston bo‘ylab klinikalar bilan ishlaymiz.",
  },
  toCatalog: { ru: "Каталог оборудования", en: "Equipment catalog", uz: "Uskunalar katalogi" },
  contact: { ru: "Связаться с нами", en: "Get in touch", uz: "Biz bilan bog‘lanish" },

  doTitle: {
    ru: "Что мы делаем",
    en: "What we do",
    uz: "Biz nima qilamiz",
  },
  doSub: {
    ru: "Полный цикл работы с медицинским оборудованием — под одной крышей.",
    en: "The full lifecycle of medical equipment — under one roof.",
    uz: "Tibbiy uskunalar bilan to‘liq ish sikli — bir tom ostida.",
  },

  valuesTitle: {
    ru: "Почему выбирают нас",
    en: "Why clinics choose us",
    uz: "Nega bizni tanlashadi",
  },

  statsTitle: {
    ru: "Цифры, которые говорят за нас",
    en: "Numbers that speak for us",
    uz: "Biz haqimizda gapiruvchi raqamlar",
  },

  ctaTitle: {
    ru: "Обсудим ваш проект?",
    en: "Let’s discuss your project",
    uz: "Loyihangizni muhokama qilamizmi?",
  },
  ctaSub: {
    ru: "Расскажите о задаче — подберём оборудование, рассчитаем поставку и сервис.",
    en: "Tell us about your task — we’ll select the equipment and plan supply and service.",
    uz: "Vazifangizni aytib bering — uskunani tanlaymiz, yetkazib berish va servisni hisoblaymiz.",
  },
} as const;

type TriText = { ru: string; en: string; uz: string };

const SERVICES: { icon: string; title: TriText; desc: TriText }[] = [
  {
    icon: "📦",
    title: { ru: "Поставка", en: "Supply", uz: "Yetkazib berish" },
    desc: {
      ru: "УЗИ, анализаторы, электрохирургия и лабораторные системы от официальных производителей.",
      en: "Ultrasound, analyzers, electrosurgery and laboratory systems from official manufacturers.",
      uz: "UZI, analizatorlar, elektroxirurgiya va laboratoriya tizimlari rasmiy ishlab chiqaruvchilardan.",
    },
  },
  {
    icon: "🛠️",
    title: { ru: "Инсталляция", en: "Installation", uz: "O‘rnatish" },
    desc: {
      ru: "Доставка, монтаж и ввод в эксплуатацию инженерами на площадке клиники.",
      en: "Delivery, mounting and commissioning by engineers on the clinic site.",
      uz: "Yetkazib berish, montaj va ishga tushirish klinika joyida muhandislar tomonidan.",
    },
  },
  {
    icon: "🎓",
    title: { ru: "Обучение", en: "Training", uz: "O‘qitish" },
    desc: {
      ru: "Подготовка врачей и инженеров клиники к самостоятельной работе с оборудованием.",
      en: "Training clinic doctors and engineers to operate the equipment independently.",
      uz: "Klinika shifokorlari va muhandislarini uskuna bilan mustaqil ishlashga tayyorlash.",
    },
  },
  {
    icon: "⚙️",
    title: { ru: "Сервис", en: "Service", uz: "Servis" },
    desc: {
      ru: "Плановое обслуживание, ремонт и поставка расходников с гарантией качества.",
      en: "Scheduled maintenance, repair and consumables supply with a quality guarantee.",
      uz: "Rejali xizmat, ta’mirlash va sarflanadigan materiallar yetkazib berish sifat kafolati bilan.",
    },
  },
  {
    icon: "📅",
    title: { ru: "Аренда", en: "Rental", uz: "Ijara" },
    desc: {
      ru: "Аренда медоборудования для проектов и временных задач без крупных инвестиций.",
      en: "Renting medical equipment for projects and temporary needs without large investment.",
      uz: "Loyihalar va vaqtinchalik vazifalar uchun katta investitsiyasiz tibbiy uskuna ijarasi.",
    },
  },
];

const VALUES: { title: TriText; desc: TriText }[] = [
  {
    title: { ru: "Только официальные поставки", en: "Official supply only", uz: "Faqat rasmiy yetkazib berish" },
    desc: {
      ru: "Прямые контракты с производителями — оригинальное оборудование, гарантия и доступ к расходникам.",
      en: "Direct contracts with manufacturers — genuine equipment, warranty and consumables access.",
      uz: "Ishlab chiqaruvchilar bilan to‘g‘ridan-to‘g‘ri shartnomalar — original uskuna, kafolat va sarflanadigan materiallar.",
    },
  },
  {
    title: { ru: "Инженеры, а не только продавцы", en: "Engineers, not just sellers", uz: "Faqat sotuvchi emas, muhandislar" },
    desc: {
      ru: "Своя сервисная команда: монтаж, калибровка, ремонт и техническая поддержка после продажи.",
      en: "Our own service team: installation, calibration, repair and post-sale technical support.",
      uz: "O‘z servis jamoamiz: montaj, kalibrlash, ta’mirlash va sotuvdan keyingi texnik qo‘llab-quvvatlash.",
    },
  },
  {
    title: { ru: "Ответственность за результат", en: "Accountable for the result", uz: "Natija uchun mas’uliyat" },
    desc: {
      ru: "Доводим проект до работающего оборудования и обученного персонала, а не до накладной.",
      en: "We deliver working equipment and trained staff — not just an invoice.",
      uz: "Loyihani ishlaydigan uskuna va o‘qitilgan xodimga yetkazamiz, nakladnoyga emas.",
    },
  },
  {
    title: { ru: "Опыт по всему Узбекистану", en: "Experience across Uzbekistan", uz: "O‘zbekiston bo‘ylab tajriba" },
    desc: {
      ru: "8 лет работы и 300+ реализованных проектов в государственных и частных клиниках.",
      en: "8 years of work and 300+ completed projects in public and private clinics.",
      uz: "8 yillik ish va davlat hamda xususiy klinikalarda 300+ amalga oshirilgan loyiha.",
    },
  },
];

const STATS: { value: string; label: TriText }[] = [
  { value: "8", label: { ru: "лет опыта", en: "years of experience", uz: "yillik tajriba" } },
  { value: "300+", label: { ru: "реализованных проектов", en: "completed projects", uz: "amalga oshirilgan loyiha" } },
  { value: "5", label: { ru: "направлений услуг", en: "service directions", uz: "xizmat yo‘nalishi" } },
  { value: "100%", label: { ru: "официальные поставки", en: "official supply", uz: "rasmiy yetkazib berish" } },
];

export default async function AboutPage() {
  const lang = (await getLang()) as Lang;

  return (
    <>
      {/* Hero / intro */}
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {T.eyebrow[lang]}
          </span>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {T.heroTitle[lang]}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{T.heroSub[lang]}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              {T.toCatalog[lang]} →
            </Link>
            <Link
              href="/contacts"
              className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              {T.contact[lang]}
            </Link>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{T.doTitle[lang]}</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">{T.doSub[lang]}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.title.ru}
              className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-2xl transition group-hover:bg-primary/10">
                <span aria-hidden>{s.icon}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title[lang]}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc[lang]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values / advantages */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{T.valuesTitle[lang]}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <div key={v.title.ru} className="flex gap-4 rounded-2xl border border-border bg-card p-6">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{v.title[lang]}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{v.desc[lang]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="sr-only">{T.statsTitle[lang]}</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label.ru}
              className="rounded-2xl border border-border bg-card p-8 text-center transition hover:border-primary hover:shadow-sm"
            >
              <div className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">{s.value}</div>
              <div className="mt-2 text-sm font-medium text-muted-foreground">{s.label[lang]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-primary px-6 py-12 text-primary-foreground sm:px-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{T.ctaTitle[lang]}</h2>
              <p className="mt-2 text-primary-foreground/80">{T.ctaSub[lang]}</p>
            </div>
            <Link
              href="/contacts"
              className="shrink-0 rounded-xl bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary shadow-sm transition hover:opacity-90"
            >
              {T.contact[lang]} →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
