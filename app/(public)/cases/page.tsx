import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "~/shared/i18n/lang";
import { SITE_URL, type Lang } from "~/shared/config/site";

export const metadata: Metadata = {
  title: "Кейсы — Med Service Centre",
  description:
    "Реализованные проекты Med Service Centre: оснащение операционных, лабораторий и диагностических кабинетов в клиниках Узбекистана. 8 лет опыта, 300+ проектов — поставка, инсталляция, обучение и сервис УЗИ, анализаторов и электрохирургии.",
  alternates: { canonical: `${SITE_URL}/cases` },
};

const T = {
  badge: {
    ru: "Реализованные проекты",
    en: "Delivered projects",
    uz: "Amalga oshirilgan loyihalar",
  },
  heroTitle: {
    ru: "8 лет опыта и 300+ проектов оснащения клиник",
    en: "8 years of experience and 300+ clinic equipment projects",
    uz: "8 yillik tajriba va 300+ klinika jihozlash loyihasi",
  },
  heroSub: {
    ru: "От поставки одного УЗИ-аппарата до оснащения «под ключ» операционных блоков и клинических лабораторий — мы проектируем, инсталлируем, обучаем персонал и обслуживаем оборудование по всему Узбекистану.",
    en: "From supplying a single ultrasound unit to turnkey equipping of operating blocks and clinical laboratories — we design, install, train staff and service equipment across Uzbekistan.",
    uz: "Bitta UZI apparatini yetkazib berishdan tortib operatsiya bloklari va klinik laboratoriyalarni «kalit topshirish» asosida jihozlashgacha — biz butun O‘zbekiston bo‘ylab uskunalarni loyihalaymiz, o‘rnatamiz, xodimlarni o‘qitamiz va xizmat ko‘rsatamiz.",
  },
  toCatalog: { ru: "Смотреть каталог", en: "Browse catalog", uz: "Katalogni ko‘rish" },
  contact: { ru: "Обсудить проект", en: "Discuss a project", uz: "Loyihani muhokama qilish" },
  casesTitle: {
    ru: "Представительные кейсы",
    en: "Representative cases",
    uz: "Vakil loyihalar",
  },
  casesSub: {
    ru: "Типовые направления работ — каждый проект адаптируется под задачи и бюджет клиники.",
    en: "Typical lines of work — each project is tailored to the clinic’s needs and budget.",
    uz: "Ishning tipik yo‘nalishlari — har bir loyiha klinikaning ehtiyojlari va byudjetiga moslashtiriladi.",
  },
  ctaTitle: {
    ru: "Готовы оснастить вашу клинику?",
    en: "Ready to equip your clinic?",
    uz: "Klinikangizni jihozlashga tayyormisiz?",
  },
  ctaSub: {
    ru: "Расскажите о задаче — подберём оборудование, рассчитаем проект и возьмём сервис на себя.",
    en: "Tell us your task — we’ll select the equipment, plan the project and take care of service.",
    uz: "Vazifangizni ayting — uskunalarni tanlaymiz, loyihani hisoblaymiz va servisni o‘z zimmamizga olamiz.",
  },
} as const;

const STATS: { value: Record<Lang, string>; label: Record<Lang, string> }[] = [
  {
    value: { ru: "8 лет", en: "8 years", uz: "8 yil" },
    label: { ru: "на рынке Узбекистана", en: "on the Uzbekistan market", uz: "O‘zbekiston bozorida" },
  },
  {
    value: { ru: "300+", en: "300+", uz: "300+" },
    label: { ru: "реализованных проектов", en: "delivered projects", uz: "amalga oshirilgan loyiha" },
  },
  {
    value: { ru: "50+", en: "50+", uz: "50+" },
    label: { ru: "клиник-партнёров", en: "partner clinics", uz: "hamkor klinika" },
  },
  {
    value: { ru: "4", en: "4", uz: "4" },
    label: {
      ru: "поставка · монтаж · обучение · сервис",
      en: "supply · install · training · service",
      uz: "yetkazish · o‘rnatish · o‘qitish · servis",
    },
  },
];

type Case = {
  tag: Record<Lang, string>;
  title: Record<Lang, string>;
  desc: Record<Lang, string>;
  bullets: Record<Lang, string[]>;
};

const CASES: Case[] = [
  {
    tag: { ru: "Операционный блок", en: "Operating block", uz: "Operatsiya bloki" },
    title: {
      ru: "Оснащение операционной «под ключ»",
      en: "Turnkey operating room setup",
      uz: "Operatsiya xonasini «kalit topshirish» asosida jihozlash",
    },
    desc: {
      ru: "Комплексное оснащение операционного блока многопрофильной клиники: электрохирургические аппараты, операционные светильники и столы, аспираторы и расходные материалы.",
      en: "Complete equipping of a multi-specialty clinic’s operating block: electrosurgical units, surgical lights and tables, suction systems and consumables.",
      uz: "Ko‘p tarmoqli klinikaning operatsiya blokini to‘liq jihozlash: elektroxirurgik apparatlar, operatsiya chiroqlari va stollari, aspiratorlar va sarf materiallar.",
    },
    bullets: {
      ru: ["Электрохирургия", "Операционные системы", "Пусконаладка"],
      en: ["Electrosurgery", "OR systems", "Commissioning"],
      uz: ["Elektroxirurgiya", "Operatsiya tizimlari", "Ishga tushirish"],
    },
  },
  {
    tag: { ru: "Лаборатория", en: "Laboratory", uz: "Laboratoriya" },
    title: {
      ru: "Клинико-диагностическая лаборатория",
      en: "Clinical diagnostic laboratory",
      uz: "Klinik-diagnostika laboratoriyasi",
    },
    desc: {
      ru: "Поставка и интеграция биохимических и гематологических анализаторов, организация рабочих потоков и обучение лаборантов работе на новых системах.",
      en: "Supply and integration of biochemistry and hematology analyzers, workflow setup and training of lab technicians on the new systems.",
      uz: "Biokimyoviy va gematologik analizatorlarni yetkazib berish va integratsiya qilish, ish jarayonlarini tashkil etish va laborantlarni o‘qitish.",
    },
    bullets: {
      ru: ["Анализаторы", "Интеграция", "Обучение персонала"],
      en: ["Analyzers", "Integration", "Staff training"],
      uz: ["Analizatorlar", "Integratsiya", "Xodimlarni o‘qitish"],
    },
  },
  {
    tag: { ru: "Диагностика", en: "Diagnostics", uz: "Diagnostika" },
    title: {
      ru: "Кабинет УЗИ-диагностики",
      en: "Ultrasound diagnostics room",
      uz: "UZI-diagnostika xonasi",
    },
    desc: {
      ru: "Установка УЗИ-сканеров экспертного класса с набором датчиков под профиль клиники, калибровка и обучение врачей работе с системой и протоколами.",
      en: "Installation of expert-class ultrasound scanners with a probe set matched to the clinic’s profile, calibration and physician training on the system and protocols.",
      uz: "Klinika profiliga mos datchiklar to‘plami bilan ekspert darajadagi UZI skanerlarini o‘rnatish, kalibrlash va shifokorlarni o‘qitish.",
    },
    bullets: {
      ru: ["УЗИ-сканеры", "Набор датчиков", "Калибровка"],
      en: ["Ultrasound scanners", "Probe set", "Calibration"],
      uz: ["UZI skanerlar", "Datchiklar to‘plami", "Kalibrlash"],
    },
  },
  {
    tag: { ru: "Стерилизация", en: "Sterilization", uz: "Sterilizatsiya" },
    title: {
      ru: "Центральное стерилизационное отделение",
      en: "Central sterilization department",
      uz: "Markaziy sterilizatsiya bo‘limi",
    },
    desc: {
      ru: "Организация ЦСО: паровые стерилизаторы, моюще-дезинфицирующие машины и упаковочное оборудование с выстраиванием «грязной» и «чистой» зон.",
      en: "Setting up a CSSD: steam sterilizers, washer-disinfectors and packaging equipment with proper dirty/clean zone separation.",
      uz: "Markaziy sterilizatsiya bo‘limini tashkil etish: bug‘li sterilizatorlar, yuvib-dezinfeksiyalovchi mashinalar va qadoqlash uskunalari.",
    },
    bullets: {
      ru: ["Стерилизаторы", "Зонирование", "Валидация"],
      en: ["Sterilizers", "Zoning", "Validation"],
      uz: ["Sterilizatorlar", "Zonalash", "Validatsiya"],
    },
  },
  {
    tag: { ru: "Реанимация", en: "Intensive care", uz: "Reanimatsiya" },
    title: {
      ru: "Палата интенсивной терапии",
      en: "Intensive care unit",
      uz: "Intensiv terapiya palatasi",
    },
    desc: {
      ru: "Оснащение реанимационных коек: аппараты ИВЛ, прикроватные мониторы пациента, инфузионные системы и централизованная подача газов.",
      en: "Equipping ICU beds: ventilators, bedside patient monitors, infusion systems and centralized medical gas supply.",
      uz: "Reanimatsiya koykalarini jihozlash: sun’iy nafas apparatlari, palata monitorlari, infuzion tizimlar va markazlashgan gaz ta’minoti.",
    },
    bullets: {
      ru: ["Мониторы пациента", "ИВЛ", "Инфузия"],
      en: ["Patient monitors", "Ventilation", "Infusion"],
      uz: ["Palata monitorlari", "IVL", "Infuziya"],
    },
  },
  {
    tag: { ru: "Сервис · Аренда", en: "Service · Rental", uz: "Servis · Ijara" },
    title: {
      ru: "Сервисное сопровождение и аренда",
      en: "Service support and equipment rental",
      uz: "Servis qo‘llab-quvvatlash va ijara",
    },
    desc: {
      ru: "Долгосрочное сервисное обслуживание парка оборудования и предоставление аппаратов в аренду на период пиковой нагрузки или ремонта собственной техники.",
      en: "Long-term service of the equipment fleet and rental of devices for periods of peak load or repair of the clinic’s own units.",
      uz: "Uskunalar parkiga uzoq muddatli servis xizmati va yuqori yuklama yoki ta’mirlash davrida apparatlarni ijaraga berish.",
    },
    bullets: {
      ru: ["Профилактика", "Ремонт", "Аренда"],
      en: ["Maintenance", "Repair", "Rental"],
      uz: ["Profilaktika", "Ta’mirlash", "Ijara"],
    },
  },
];

export default async function CasesPage() {
  const lang = (await getLang()) as Lang;

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {T.badge[lang]}
          </span>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
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

          {/* Stats row */}
          <dl className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <dt className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">{s.value[lang]}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{s.label[lang]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Cases grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{T.casesTitle[lang]}</h2>
          <p className="mt-2 text-muted-foreground">{T.casesSub[lang]}</p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CASES.map((c, i) => (
            <article
              key={i}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-md"
            >
              <span className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {c.tag[lang]}
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{c.title[lang]}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{c.desc[lang]}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {c.bullets[lang].map((b, j) => (
                  <li
                    key={j}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12">
            <h2 className="max-w-2xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              {T.ctaTitle[lang]}
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{T.ctaSub[lang]}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/contacts"
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                {T.contact[lang]} →
              </Link>
              <Link
                href="/catalog"
                className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted"
              >
                {T.toCatalog[lang]}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
