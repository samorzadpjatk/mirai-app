import { createSupabaseClient } from "./client";
export type {
  SupabaseClientOptions,
  SupabaseClient,
  SupabaseSession,
  SupabaseUser,
  RealtimePostgresChangesPayload,
  RealtimeChannel,
  RealtimePostgresInsertPayload,
} from "./types";

export { REALTIME_CHANNEL_STATES } from "./types";

export { createSupabaseClient };
