import { createSupabaseClient } from "@mirai-app/supabase";
import { env } from "./env";

export const supabase = createSupabaseClient(
  env.supabaseUrl as string,
  env.serviceRoleKey as string,
  undefined,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
