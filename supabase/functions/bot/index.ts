
import {
  Bot,
  Context,
  Keyboard,
  session,
  SessionFlavor,
  webhookCallback,
} from "npm:grammy@1.22.4";
import { supabaseClient } from "./supabaseClient.ts";

type Step = "awaiting_phone" | "awaiting_name" | "awaiting_position" | null;

interface LeadSession {
  step: Step;
  phone?: string;
  name?: string;
}

type LeadContext = Context & SessionFlavor<LeadSession>;

const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

if (!botToken) {
  console.error("TELEGRAM_BOT_TOKEN is not set in environment variables");
  throw new Error("TELEGRAM_BOT_TOKEN is not set");
}

const bot = new Bot<LeadContext>(botToken);

bot.use(
  session({
    initial: (): LeadSession => ({
      step: null,
    }),
  }),
);

bot.command("start", async (ctx) => {
  console.log("Handling /start for", ctx.from?.id);
  ctx.session.step = "awaiting_phone";
  ctx.session.phone = undefined;
  ctx.session.name = undefined;

  const keyboard = new Keyboard()
    .requestContact("Поделиться контактом")
    .oneTime()
    .resize();

  await ctx.reply("Пожалуйста, поделитесь своим номером телефона.", {
    reply_markup: keyboard,
  });
});

bot.on("message:contact", async (ctx) => {
  console.log("Received contact from", ctx.from?.id);
  if (ctx.session.step !== "awaiting_phone") {
    console.log("Contact received, but step was", ctx.session.step);
    return;
  }

  const phoneNumber = ctx.message.contact?.phone_number;
  if (!phoneNumber) {
    console.warn("Contact message without phone number from", ctx.from?.id);
    await ctx.reply("Не удалось получить номер телефона. Попробуйте ещё раз.");
    return;
  }

  ctx.session.phone = phoneNumber;
  ctx.session.step = "awaiting_name";

  await ctx.reply("Спасибо! Как вас зовут?", {
    reply_markup: {
      remove_keyboard: true,
    },
  });
});

bot.on("message:text", async (ctx) => {
  const { step } = ctx.session;
  const text = ctx.message.text.trim();
  console.log(`Received text for step ${step} from ${ctx.from?.id}: ${text}`);

  if (step === "awaiting_name") {
    if (!text) {
      await ctx.reply("Пожалуйста, укажите ваше имя.");
      return;
    }
    ctx.session.name = text;
    ctx.session.step = "awaiting_position";
    await ctx.reply("Спасибо! Какая у вас должность?");
    return;
  }

  if (step === "awaiting_position") {
    if (!text) {
      await ctx.reply("Пожалуйста, укажите вашу должность.");
      return;
    }

    const lead = {
      name: ctx.session.name!,
      phone: ctx.session.phone!,
      position: text,
      telegram_id: ctx.from?.id ?? null,
      created_at: new Date().toISOString(),
    };

    console.log("Saving lead", lead);

    try {
      const { error } = await supabaseClient.from("leads").insert(lead);
      if (error) {
        console.error("Failed to save lead", error);
        await ctx.reply(
          "Произошла ошибка при сохранении данных. Попробуйте позже.",
        );
        return;
      }

      await ctx.reply("Спасибо! Наш специалист свяжется с вами.");
      ctx.session.step = null;
      ctx.session.phone = undefined;
      ctx.session.name = undefined;
    } catch (error) {
      console.error("Unexpected error while saving lead", error);
      await ctx.reply(
        "Произошла ошибка при сохранении данных. Попробуйте позже.",
      );
    }
    return;
  }

  if (ctx.message.text === "/start") {
    return;
  }

  await ctx.reply(
    "Пожалуйста, нажмите /start и следуйте инструкциям для регистрации.",
  );
});

bot.catch((err) => {
  console.error("Bot encountered an error", err);
});

export default webhookCallback(bot, "std/http");
