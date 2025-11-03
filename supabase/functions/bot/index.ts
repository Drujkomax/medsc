console.log("🔧 bot function booted");

import {
  Bot,
  Context,
  Keyboard,
  session,
  SessionFlavor,
  webhookCallback,
} from "https://deno.land/x/grammy@1.24.1/mod.ts";

import { supabaseClient } from "./supabaseClient.ts";

type LeadSession = {
  step: "idle" | "awaiting_phone" | "awaiting_name" | "awaiting_position";
  phone?: string;
  name?: string;
};

type LeadContext = Context & SessionFlavor<LeadSession>;
type LeadSessionData = LeadSession;

const initialSession = (): LeadSessionData => ({
  step: "idle",
});

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set in environment variables");
}

const bot = new Bot<LeadContext>(BOT_TOKEN);

bot.use(async (ctx, next) => {
  console.log("📩 Incoming update", JSON.stringify(ctx.update));
  await next();
});

bot.use(session({ initial: initialSession }));

bot.catch((err) => {
  console.error("❌ Bot error", err.error);
});

const phoneKeyboard = new Keyboard()
  .requestContact("📱 Отправить номер телефона")
  .resized()
  .oneTime();

bot.command("start", async (ctx) => {
  ctx.session = initialSession();
  ctx.session.step = "awaiting_phone";

  await ctx.reply(
    "Здравствуйте! Пожалуйста, поделитесь вашим номером телефона в формате +998.",
    {
      reply_markup: phoneKeyboard,
    },
  );
});

bot.on("message:contact", async (ctx) => {
  if (ctx.session.step !== "awaiting_phone") {
    await ctx.reply("Пожалуйста, введите команду /start, чтобы начать заново.");
    return;
  }

  const contact = ctx.message.contact;
  let phoneNumber = contact.phone_number.trim();

  if (!phoneNumber.startsWith("+")) {
    phoneNumber = `+${phoneNumber}`;
  }

  if (!/^\+998\d{9}$/.test(phoneNumber)) {
    await ctx.reply(
      "Похоже, номер в неверном формате. Укажите номер в формате +998XXXXXXXXX.",
      {
        reply_markup: phoneKeyboard,
      },
    );
    return;
  }

  ctx.session.phone = phoneNumber;
  ctx.session.step = "awaiting_name";

  await ctx.reply("Спасибо! Теперь напишите, пожалуйста, ваше имя.");
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();

  switch (ctx.session.step) {
    case "awaiting_phone": {
      let phoneNumber = text;
      if (!phoneNumber.startsWith("+")) {
        phoneNumber = `+${phoneNumber}`;
      }

      if (!/^\+998\d{9}$/.test(phoneNumber)) {
        await ctx.reply(
          "Пожалуйста, отправьте номер телефона в формате +998XXXXXXXXX или воспользуйтесь кнопкой ниже.",
          {
            reply_markup: phoneKeyboard,
          },
        );
        return;
      }

      ctx.session.phone = phoneNumber;
      ctx.session.step = "awaiting_name";
      await ctx.reply("Спасибо! Теперь напишите, пожалуйста, ваше имя.");
      return;
    }
    case "awaiting_name": {
      if (text.length < 2) {
        await ctx.reply("Имя должно содержать хотя бы 2 символа. Попробуйте ещё раз.");
        return;
      }

      ctx.session.name = text;
      ctx.session.step = "awaiting_position";
      await ctx.reply("Укажите, пожалуйста, вашу должность.");
      return;
    }
    case "awaiting_position": {
      const position = text;
      const telegramId = ctx.from?.id;
      const name = ctx.session.name;
      const phone = ctx.session.phone;

      if (!telegramId || !name || !phone) {
        console.error("Недостаточно данных для сохранения лида", {
          telegramId,
          name,
          phone,
        });
        await ctx.reply(
          "Произошла ошибка при сохранении данных. Пожалуйста, введите /start и попробуйте снова.",
        );
        ctx.session = initialSession();
        return;
      }

      console.log("💾 Сохраняем лида", { telegramId, name, phone, position });

      const { error } = await supabaseClient.from("leads").insert({
        name,
        phone,
        position,
        telegram_id: telegramId,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Ошибка Supabase при сохранении лида", error);
        await ctx.reply(
          "Не удалось сохранить данные. Попробуйте, пожалуйста, позже или начните заново с /start.",
        );
        ctx.session = initialSession();
        return;
      }

      console.log("✅ Лид успешно сохранён", { telegramId });
      await ctx.reply("✅ Спасибо! Наш специалист свяжется с вами.");
      ctx.session = initialSession();
      return;
    }
    default: {
      await ctx.reply(
        "Чтобы начать, отправьте команду /start и следуйте инструкциям.",
      );
    }
  }
});

bot.on("message", async (ctx) => {
  if (ctx.session.step === "idle") {
    await ctx.reply("Чтобы начать, отправьте команду /start.");
  }
});

const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    console.warn("Получен запрос с неподдерживаемым методом", req.method);
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    return await handleUpdate(req);
  } catch (error) {
    console.error("Ошибка при обработке вебхука", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
