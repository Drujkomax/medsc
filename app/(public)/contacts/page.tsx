import type { Metadata } from "next";
import { getLang } from "~/shared/i18n/lang";
import { SITE_URL, SITE_NAME, type Lang } from "~/shared/config/site";
import { getSiteContacts } from "~/entities/site-contacts/api";
import { ContactForm } from "~/features/contact-form/contact-form";

export const metadata: Metadata = {
  title: "Контакты — Med Service Centre",
  description:
    "Свяжитесь с Med Service Centre: email info@medsc.uz, Telegram @medservice_centre, Ташкент, Узбекистан. Поставка, сервис и аренда медицинского оборудования.",
  alternates: { canonical: `${SITE_URL}/contacts` },
};

const T = {
  title: { ru: "Контакты", en: "Contacts", uz: "Kontaktlar" },
  intro: {
    ru: "Подберём оборудование под вашу клинику, ответим по срокам поставки, инсталляции, обучению и сервису.",
    en: "We'll help you choose equipment for your clinic and answer questions on supply, installation, training and service.",
    uz: "Klinikangiz uchun uskuna tanlashda yordam beramiz, yetkazib berish, o‘rnatish, o‘qitish va servis bo‘yicha javob beramiz.",
  },
  reach: { ru: "Как с нами связаться", en: "How to reach us", uz: "Biz bilan bog‘lanish" },
  email: { ru: "Email", en: "Email", uz: "Email" },
  telegram: { ru: "Telegram", en: "Telegram", uz: "Telegram" },
  phone: { ru: "Телефон", en: "Phone", uz: "Telefon" },
  location: { ru: "Адрес", en: "Location", uz: "Manzil" },
  formTitle: { ru: "Оставьте заявку", en: "Send a request", uz: "So‘rov qoldiring" },
  formSub: {
    ru: "Заполните форму — менеджер свяжется с вами в рабочее время.",
    en: "Fill in the form — a manager will contact you during business hours.",
    uz: "Formani to‘ldiring — menejer ish vaqtida siz bilan bog‘lanadi.",
  },
  about: {
    ru: "Med Service Centre — 8 лет опыта и 300+ реализованных проектов: УЗИ, анализаторы, электрохирургия и лабораторные системы для клиник Узбекистана.",
    en: "Med Service Centre — 8 years of experience and 300+ delivered projects: ultrasound, analyzers, electrosurgery and lab systems for clinics in Uzbekistan.",
    uz: "Med Service Centre — 8 yillik tajriba va 300+ amalga oshirilgan loyiha: UZI, analizatorlar, elektroxirurgiya va laboratoriya tizimlari.",
  },
} as const;

export default async function ContactsPage() {
  const lang = (await getLang()) as Lang;
  const c = await getSiteContacts();

  const location = [c.city, c.country].filter(Boolean).join(", ");
  const tgUrl = c.telegram_url || (c.telegram ? `https://t.me/${c.telegram.replace(/^@/, "")}` : null);

  const items: { key: string; label: string; value: string; href?: string }[] = [];
  if (c.email) items.push({ key: "email", label: T.email[lang], value: c.email, href: `mailto:${c.email}` });
  if (c.telegram) items.push({ key: "tg", label: T.telegram[lang], value: c.telegram, href: tgUrl ?? undefined });
  if (c.phone) items.push({ key: "phone", label: T.phone[lang], value: c.phone, href: `tel:${c.phone.replace(/\s+/g, "")}` });
  if (location) items.push({ key: "loc", label: T.location[lang], value: location });

  const icon: Record<string, string> = { email: "✉", tg: "✈", phone: "☎", loc: "📍" };

  return (
    <>
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{T.title[lang]}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{T.intro[lang]}</p>
        </div>
      </section>

      {/* Body: info + form */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: contact info */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{T.reach[lang]}</h2>

            <ul className="mt-6 space-y-3">
              {items.map((it) => {
                const inner = (
                  <span className="flex items-center gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-lg text-primary">
                      {icon[it.key]}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {it.label}
                      </span>
                      <span className="block truncate text-base font-semibold">{it.value}</span>
                    </span>
                  </span>
                );
                return (
                  <li key={it.key}>
                    {it.href ? (
                      <a
                        href={it.href}
                        target={it.href.startsWith("http") ? "_blank" : undefined}
                        rel={it.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-sm"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="rounded-2xl border border-border bg-card p-4">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-6">
              <p className="text-sm font-semibold">{SITE_NAME}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{T.about[lang]}</p>
            </div>
          </div>

          {/* Right: form */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{T.formTitle[lang]}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{T.formSub[lang]}</p>
            <div className="mt-6">
              <ContactForm lang={lang} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
