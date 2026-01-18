import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClientOptions } from "./types";

export default function createBaseSupabaseClient(
  url: string,
  anonKey: string,
  options?: SupabaseClientOptions,
): SupabaseClient {
  console.log(`[Supabase] Creating client with URL: ${url}`);

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
