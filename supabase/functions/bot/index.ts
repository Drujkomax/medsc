import { Bot, Context, Keyboard, session, SessionFlavor, webhookCallback } from "npm:grammy@1";

import { supabase } from "./supabaseClient.ts";

console.log("🔧 bot function booted");

const botToken = Deno.env.get("BOT_TOKEN");

if (!botToken) {
  throw new Error("BOT_TOKEN is not set");
}

type Step = "idle" | "awaiting_phone" | "awaiting_name" | "awaiting_position";

type LeadDetails = {
  phone?: string;
  name?: string;
  position?: string;
};

type LeadSession = {
  step: Step;
  lead: LeadDetails;
};

type BotContext = Context & SessionFlavor<LeadSession>;

const initialSession = (): LeadSession => ({
  step: "idle",
  lead: {},
});

const bot = new Bot<BotContext>(botToken);

bot.use(session({ initial: initialSession }));

bot.use(async (ctx, next) => {
  const from = ctx.from?.id ?? "unknown";
  console.log(`⬇️ Update from ${from}: ${ctx.updateType}`);
  await next();
});

const phoneKeyboard = new Keyboard()
  .requestContact("📞 Поделиться телефоном")
  .oneTime()
  .resize();

bot.command("start", async (ctx) => {
  const fromId = ctx.from?.id;
  console.log(`▶️ /start from ${fromId ?? "unknown"}`);
  ctx.session.step = "awaiting_phone";
  ctx.session.lead = {};

  await ctx.reply(
    "Пожалуйста, поделитесь своим номером телефона в формате +998XXXXXXXXX.",
    {
      reply_markup: phoneKeyboard,
    },
  );
});

bot.on("message", async (ctx) => {
  const { step } = ctx.session;
  const fromId = ctx.from?.id ?? "unknown";

  if (step === "awaiting_phone") {
    const contact = ctx.message?.contact;
    const text = ctx.message?.text?.trim();

    let rawPhone: string | undefined;

    if (contact && contact.user_id === ctx.from?.id) {
      rawPhone = contact.phone_number;
      console.log(`📞 Contact received from ${fromId}: ${rawPhone}`);
    } else if (text) {
      rawPhone = text;
      console.log(`💬 Phone text received from ${fromId}: ${rawPhone}`);
    }

    if (!rawPhone) {
      await ctx.reply("Пожалуйста, отправьте номер телефона или используйте кнопку ниже.", {
        reply_markup: phoneKeyboard,
      });
      return;
    }

    const sanitized = normalizePhone(rawPhone);

    if (!sanitized) {
      await ctx.reply("Неверный формат. Введите номер в формате +998XXXXXXXXX.", {
        reply_markup: phoneKeyboard,
      });
      return;
    }

    console.log(`✅ Phone accepted for ${fromId}: ${sanitized}`);

    ctx.session.lead.phone = sanitized;
    ctx.session.step = "awaiting_name";

    await ctx.reply("Спасибо! Теперь укажите, пожалуйста, ваше имя.", {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  if (step === "awaiting_name") {
    const name = ctx.message?.text?.trim();

    if (!name) {
      await ctx.reply("Пожалуйста, отправьте имя текстом.");
      return;
    }

    ctx.session.lead.name = name;
    ctx.session.step = "awaiting_position";

    console.log(`📝 Name received from ${fromId}: ${name}`);

    await ctx.reply("Отлично! Теперь напишите вашу должность.");
    return;
  }

  if (step === "awaiting_position") {
    const position = ctx.message?.text?.trim();

    if (!position) {
      await ctx.reply("Пожалуйста, отправьте должность текстом.");
      return;
    }

    ctx.session.lead.position = position;

    console.log(`🏢 Position received from ${fromId}: ${position}`);

    await persistLead(ctx);
    return;
  }

  if (ctx.message?.text === "/start") {
    return;
  }

  if (step === "idle") {
    await ctx.reply("Отправьте команду /start, чтобы оставить заявку.");
  }
});

bot.catch((err) => {
  console.error("❗ Ошибка в обработчике бота", err.error);
});

async function persistLead(ctx: BotContext) {
  const fromId = ctx.from?.id ?? null;
  const { lead } = ctx.session;

  if (!lead.phone || !lead.name || !lead.position) {
    console.error(`⚠️ Недостаточно данных для сохранения: ${JSON.stringify(lead)}`);
    await ctx.reply("Не удалось сохранить данные. Попробуйте снова командой /start.");
    ctx.session = initialSession();
    return;
  }

  console.log(`💾 Сохранение лида от ${fromId ?? "unknown"}`);

  const { error } = await supabase.from("leads").insert({
    name: lead.name,
    phone: lead.phone,
    position: lead.position,
    telegram_id: fromId ? String(fromId) : null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("❌ Ошибка Supabase при сохранении лида", error);
    await ctx.reply("Произошла ошибка при сохранении. Попробуйте позже.");
    ctx.session = initialSession();
    return;
  }

  console.log(`✅ Лид успешно сохранён для ${fromId ?? "unknown"}`);

  await ctx.reply("✅ Спасибо! Наш специалист свяжется с вами.");

  ctx.session = initialSession();
}

function normalizePhone(value: string): string | null {
  const digits = value.replace(/[^0-9+]/g, "");
  let normalized = digits;

  if (normalized.startsWith("998") && !normalized.startsWith("+")) {
    normalized = `+${normalized}`;
  }

  if (!normalized.startsWith("+")) {
    normalized = `+${normalized.replace(/^\++/, "")}`;
  }

  if (!/^\+998\d{9}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    console.log(`ℹ️ Получен ${req.method} запрос`);
    return new Response("ok", { status: 200 });
  }

  try {
    await handleUpdate(req);
  } catch (error) {
    console.error("❌ Ошибка при обработке обновления", error);
    return new Response("error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
