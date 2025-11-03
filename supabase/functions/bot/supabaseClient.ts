import { createClient } from "jsr:@supabase/supabase-js@2";

type SupabaseClient = ReturnType<typeof createClient>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is not set in environment variables");
}

if (!SERVICE_ROLE_KEY) {
  throw new Error("SERVICE_ROLE_KEY is not set in environment variables");
}

export const supabaseClient: SupabaseClient = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "msc-heal-hub-bot/1.0.0",
      },
    },
  },
);
