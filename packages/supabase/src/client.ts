import createBaseSupabaseClient from "./base";
import type { StorageAdapter } from "./types";

export const createSupabaseClient = (
  supabaseUrl: string,
  supabaseKey: string,
  storage: StorageAdapter,
) =>
  createBaseSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
