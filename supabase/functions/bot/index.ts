console.log("🔧 bot function booted");

import {
  Bot,
  Context,
  Keyboard,
  session,
  SessionFlavor,
  webhookCallback,
} from "https://deno.land/x/grammy@v1.19.1/mod.ts";

import { getSupabaseClient } from "./supabaseClient.ts";

const botToken = Deno.env.get("BOT_TOKEN");

if (!botToken) {
  console.error("Missing BOT_TOKEN environment variable");
  throw new Error("BOT_TOKEN is required");
}

interface LeadSession {
  step: "idle" | "waiting_phone" | "waiting_name" | "waiting_position";
  phone?: string;
  name?: string;
}

const initialSession = (): LeadSession => ({
  step: "idle",
});

type LeadContext = Context & SessionFlavor<LeadSession>;

const bot = new Bot<LeadContext>(botToken);

bot.api.setMyCommands([
  { command: "start", description: "Начать сбор контакта" },
]);

bot.use(session({ initial: initialSession }));

bot.catch((err) => {
  console.error("Bot error", err);
});

function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+998") && digits.length === 13) {
    return digits;
  }
  if (digits.startsWith("998") && digits.length === 12) {
    return `+${digits}`;
  }
  return null;
}

bot.command("start", async (ctx) => {
  ctx.session.step = "waiting_phone";
  ctx.session.phone = undefined;
  ctx.session.name = undefined;

  const keyboard = new Keyboard()
    .requestContact("📱 Отправить номер")
    .resized();

  await ctx.reply(
    "Пожалуйста, отправьте ваш номер телефона в формате +998XXXXXXXXX или поделитесь контактом.",
    { reply_markup: keyboard },
  );
});

bot.on("message", async (ctx) => {
  const { step } = ctx.session;

  if (step === "waiting_phone") {
    const fromContact = ctx.message?.contact?.phone_number ?? "";
    const fromText = ctx.message?.text?.trim() ?? "";
    const normalized = normalizePhone(fromContact || fromText);

    if (!normalized) {
      await ctx.reply(
        "❗️ Пожалуйста, отправьте номер телефона в формате +998XXXXXXXXX.",
      );
      return;
    }

    ctx.session.phone = normalized;
    ctx.session.step = "waiting_name";

    await ctx.reply("Как вас зовут?", {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  if (step === "waiting_name") {
    const name = ctx.message?.text?.trim();
    if (!name) {
      await ctx.reply("❗️ Пожалуйста, отправьте ваше имя текстом.");
      return;
    }

    ctx.session.name = name;
    ctx.session.step = "waiting_position";

    await ctx.reply("Какая у вас должность?");
    return;
  }

  if (step === "waiting_position") {
    const position = ctx.message?.text?.trim();
    if (!position) {
      await ctx.reply("❗️ Пожалуйста, отправьте вашу должность текстом.");
      return;
    }

    const supabase = getSupabaseClient();
    const telegramId = ctx.from?.id?.toString();

    try {
      const { error } = await supabase.from("leads").insert({
        name: ctx.session.name,
        phone: ctx.session.phone,
        position,
        telegram_id: telegramId,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Failed to insert lead", error);
        await ctx.reply(
          "⚠️ Произошла ошибка при сохранении данных. Попробуйте позже.",
        );
        ctx.session = initialSession();
        return;
      }

      await ctx.reply("✅ Спасибо! Наш специалист свяжется с вами.");
      console.log("Lead saved", {
        telegramId,
        phone: ctx.session.phone,
        name: ctx.session.name,
        position,
      });
    } catch (insertError) {
      console.error("Unexpected error while saving lead", insertError);
      await ctx.reply(
        "⚠️ Произошла непредвиденная ошибка. Попробуйте позже.",
      );
    } finally {
      ctx.session = initialSession();
    }
    return;
  }
});

const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req) => {
  await handleUpdate(req);
  return new Response("ok", { status: 200 });
});
