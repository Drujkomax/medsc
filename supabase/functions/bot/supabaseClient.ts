import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

let cachedClient: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl) {
    console.error("Missing SUPABASE_URL environment variable");
    throw new Error("SUPABASE_URL is required");
  }

  if (!serviceRoleKey) {
    console.error("Missing SERVICE_ROLE_KEY environment variable");
    throw new Error("SERVICE_ROLE_KEY is required");
  }

  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log("✅ Supabase client initialized");

  return cachedClient;
}
