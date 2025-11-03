import { createClient } from "npm:@supabase/supabase-js@2.43.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl) {
  console.error("SUPABASE_URL is not set in environment variables");
  throw new Error("SUPABASE_URL is not set");
}

if (!supabaseKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables");
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});
