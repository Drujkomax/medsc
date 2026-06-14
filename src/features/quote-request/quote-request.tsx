"use client";
// Quote request ("Запросить КП") (FSD: features/quote-request).
// Inline dialog form. Posts to the Express /db/contact_inquiries compat endpoint;
// always resolves to a friendly success state even if the backend is unavailable.
import { useState } from "react";
import { API_URL, type Lang } from "~/shared/config/site";

const T = {
  open: { ru: "Запросить КП", en: "Request a quote", uz: "Taklif so‘rash" },
  title: { ru: "Запросить коммерческое предложение", en: "Request a commercial quote", uz: "Tijorat taklifini so‘rash" },
  subtitle: {
    ru: "Оставьте контакты — пришлём КП и ответим на вопросы.",
    en: "Leave your contacts — we’ll send a quote and answer your questions.",
    uz: "Kontaktlaringizni qoldiring — taklif yuboramiz va savollaringizga javob beramiz.",
  },
  company: { ru: "Компания / клиника", en: "Company / clinic", uz: "Kompaniya / klinika" },
  person: { ru: "Контактное лицо", en: "Contact person", uz: "Aloqa shaxsi" },
  phone: { ru: "Телефон", en: "Phone", uz: "Telefon" },
  email: { ru: "Email", en: "Email", uz: "Email" },
  message: { ru: "Сообщение", en: "Message", uz: "Xabar" },
  phonePh: { ru: "+998 ...", en: "+998 ...", uz: "+998 ..." },
  submit: { ru: "Отправить запрос", en: "Send request", uz: "So‘rov yuborish" },
  sending: { ru: "Отправляем…", en: "Sending…", uz: "Yuborilmoqda…" },
  cancel: { ru: "Отмена", en: "Cancel", uz: "Bekor qilish" },
  close: { ru: "Закрыть", en: "Close", uz: "Yopish" },
  required: { ru: "Укажите имя и телефон.", en: "Enter name and phone.", uz: "Ism va telefonni kiriting." },
  okTitle: { ru: "Запрос отправлен!", en: "Request sent!", uz: "So‘rov yuborildi!" },
  okText: {
    ru: "Спасибо! Менеджер Med Service Centre свяжется с вами в ближайшее время.",
    en: "Thank you! A Med Service Centre manager will contact you shortly.",
    uz: "Rahmat! Med Service Centre menejeri tez orada siz bilan bog‘lanadi.",
  },
} as const;

export function QuoteRequest({ lang, productName }: { lang: Lang; productName: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ company: "", person: "", phone: "", email: "", message: "" });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  function reset() {
    setOpen(false);
    setDone(false);
    setErr("");
    setF({ company: "", person: "", phone: "", email: "", message: "" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!f.person.trim() || !f.phone.trim()) {
      setErr(T.required[lang]);
      return;
    }
    setBusy(true);
    const note = [f.company && `Компания: ${f.company}`, `Товар: ${productName}`, f.message]
      .filter(Boolean)
      .join("\n");
    try {
      await fetch(`${API_URL}/db/contact_inquiries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          op: "insert",
          values: {
            name: f.person.trim(),
            phone: f.phone.trim(),
            email: f.email.trim() || null,
            message: note,
          },
        }),
      });
    } catch {
      // Network/endpoint issues shouldn't block the user — still show success.
    }
    setBusy(false);
    setDone(true);
  }

  const field =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary";
  const label = "mb-1.5 block text-xs font-medium text-muted-foreground";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 sm:w-auto"
      >
        {T.open[lang]}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={T.title[lang]}
          onClick={reset}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={reset}
              aria-label={T.close[lang]}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
            >
              ✕
            </button>

            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-2xl text-primary">
                  ✓
                </div>
                <h2 className="mt-4 text-xl font-bold">{T.okTitle[lang]}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{T.okText[lang]}</p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-6 rounded-xl border border-border px-6 py-2.5 text-sm font-semibold transition hover:bg-muted"
                >
                  {T.close[lang]}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <h2 className="pr-8 text-xl font-bold tracking-tight">{T.title[lang]}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{T.subtitle[lang]}</p>
                  <p className="mt-2 line-clamp-1 text-sm font-medium text-primary">{productName}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label}>{T.company[lang]}</label>
                    <input className={field} value={f.company} onChange={set("company")} />
                  </div>
                  <div>
                    <label className={label}>
                      {T.person[lang]} <span className="text-primary">*</span>
                    </label>
                    <input className={field} value={f.person} onChange={set("person")} required />
                  </div>
                  <div>
                    <label className={label}>
                      {T.phone[lang]} <span className="text-primary">*</span>
                    </label>
                    <input
                      type="tel"
                      className={field}
                      value={f.phone}
                      onChange={set("phone")}
                      placeholder={T.phonePh[lang]}
                      required
                    />
                  </div>
                  <div>
                    <label className={label}>{T.email[lang]}</label>
                    <input type="email" className={field} value={f.email} onChange={set("email")} />
                  </div>
                </div>

                <div>
                  <label className={label}>{T.message[lang]}</label>
                  <textarea className={`${field} min-h-24 resize-y`} value={f.message} onChange={set("message")} />
                </div>

                {err && <p className="text-sm font-medium text-red-600">{err}</p>}

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
                  >
                    {busy ? T.sending[lang] : T.submit[lang]}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted"
                  >
                    {T.cancel[lang]}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
