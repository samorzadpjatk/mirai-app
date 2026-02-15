import { createSupabaseClient } from "@integral-2025-app/supabase";
import { env } from "./env";

export const supabase = createSupabaseClient(
  env.supabaseUrl,
  env.serviceRoleKey,
  undefined,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
