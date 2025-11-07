import { createClient } from '@supabase/supabase-js'
import { env } from "~/env";

const createSupabaseClient = () => createClient(env.SUPABASE_PROJECT_URL, env.SUPABASE_PROJECT_KEY)

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createSupabaseClient> | undefined;
};

export const supabase = globalForSupabase.supabase ?? createSupabaseClient();

if (env.NODE_ENV !== "production") globalForSupabase.supabase = supabase;