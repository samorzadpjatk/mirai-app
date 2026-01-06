import { REALTIME_CHANNEL_STATES } from "@supabase/supabase-js";

export type {
  Session as SupabaseSession,
  SupabaseClient,
  User as SupabaseUser,
  RealtimePostgresChangesPayload,
  RealtimeChannel,
} from "@supabase/supabase-js";

export { REALTIME_CHANNEL_STATES };

export interface SupabaseClientOptions {
  auth?: {
    storage?: StorageAdapter;
    autoRefreshToken?: boolean;
    persistSession?: boolean;
    detectSessionInUrl?: boolean;
  };
}

export interface StorageAdapter {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
}
