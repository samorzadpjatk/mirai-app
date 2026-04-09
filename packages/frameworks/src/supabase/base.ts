import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClientOptions } from "./types";

export default function createBaseSupabaseClient(
  url: string,
  anonKey: string,
  options?: SupabaseClientOptions,
): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      ...options?.auth,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }) as SupabaseClient;
}
