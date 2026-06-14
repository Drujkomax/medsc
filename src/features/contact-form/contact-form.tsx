"use client";

// Contact inquiry form (FSD: features/contact-form).
// Posts to the Express /db/:table compat endpoint as an insert.
import { useState } from "react";
import { API_URL, type Lang } from "~/shared/config/site";

type Status = "idle" | "loading" | "success" | "error";

const T = {
  name: { ru: "Имя", en: "Name", uz: "Ism" },
  phone: { ru: "Телефон", en: "Phone", uz: "Telefon" },
  email: { ru: "Email", en: "Email", uz: "Email" },
  message: { ru: "Сообщение", en: "Message", uz: "Xabar" },
  namePh: { ru: "Ваше имя", en: "Your name", uz: "Ismingiz" },
  phonePh: { ru: "+998 ...", en: "+998 ...", uz: "+998 ..." },
  emailPh: { ru: "you@example.com", en: "you@example.com", uz: "you@example.com" },
  messagePh: {
    ru: "Расскажите, какое оборудование вас интересует…",
    en: "Tell us which equipment you're interested in…",
    uz: "Qaysi uskuna sizni qiziqtirayotganini yozing…",
  },
  submit: { ru: "Отправить заявку", en: "Send request", uz: "Yuborish" },
  sending: { ru: "Отправляем…", en: "Sending…", uz: "Yuborilmoqda…" },
  ok: {
    ru: "Спасибо! Мы свяжемся с вами в ближайшее время.",
    en: "Thank you! We'll get back to you shortly.",
    uz: "Rahmat! Tez orada siz bilan bog‘lanamiz.",
  },
  fail: {
    ru: "Не удалось отправить. Попробуйте ещё раз или напишите нам напрямую.",
    en: "Failed to send. Please try again or contact us directly.",
    uz: "Yuborib bo‘lmadi. Qayta urinib ko‘ring yoki to‘g‘ridan-to‘g‘ri yozing.",
  },
} as const;

export function ContactForm({ lang }: { lang: Lang }) {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const values = {
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      message: String(fd.get("message") || "").trim(),
    };
    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/db/contact_inquiries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "insert", values }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-2xl text-primary">
          ✓
        </div>
        <p className="mt-4 text-base font-medium">{T.ok[lang]}</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
        >
          {lang === "ru" ? "Отправить ещё" : lang === "uz" ? "Yana yuborish" : "Send another"}
        </button>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelCls = "mb-1.5 block text-sm font-medium";

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={labelCls}>
            {T.name[lang]}
          </label>
          <input id="cf-name" name="name" type="text" required autoComplete="name" placeholder={T.namePh[lang]} className={field} />
        </div>
        <div>
          <label htmlFor="cf-phone" className={labelCls}>
            {T.phone[lang]}
          </label>
          <input id="cf-phone" name="phone" type="tel" autoComplete="tel" placeholder={T.phonePh[lang]} className={field} />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="cf-email" className={labelCls}>
          {T.email[lang]}
        </label>
        <input id="cf-email" name="email" type="email" autoComplete="email" placeholder={T.emailPh[lang]} className={field} />
      </div>

      <div className="mt-4">
        <label htmlFor="cf-message" className={labelCls}>
          {T.message[lang]}
        </label>
        <textarea id="cf-message" name="message" rows={5} required placeholder={T.messagePh[lang]} className={`${field} resize-y`} />
      </div>

      {status === "error" && (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {T.fail[lang]}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-6 w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? T.sending[lang] : T.submit[lang]}
      </button>
    </form>
  );
}
