import { createSupabaseClient } from "@mirai-app/frameworks/supabase";
import { env } from "./env";

/**
 * Lazy-initialized Supabase client
 * Only creates the client when first accessed
 */
let _supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseClient(): ReturnType<typeof createSupabaseClient> {
  if (!_supabaseClient) {
    _supabaseClient = createSupabaseClient(
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
  }
  return _supabaseClient;
}

/**
 * @deprecated Use getSupabaseClient() for lazy initialization
 * This export is kept for backward compatibility but should not be used in new code
 */
export const supabase = new Proxy(
  {} as ReturnType<typeof createSupabaseClient>,
  {
    get(_target, prop) {
      const client = getSupabaseClient();
      return client[prop as keyof typeof client];
    },
  },
);
