import { createSupabaseClient } from "./client";
export type {
  SupabaseClientOptions,
  SupabaseClient,
  SupabaseSession,
  SupabaseUser,
  RealtimePostgresChangesPayload,
  RealtimeChannel,
} from "./types";

export { createSupabaseClient };
