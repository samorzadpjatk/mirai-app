/**
 * Supabase Infrastructure - Adapters Layer
 *
 * Re-exports Supabase client type definitions from the frameworks layer
 * to ensure type compatibility across packages.
 */

export type {
  SupabaseClient,
  SupabaseClientOptions,
  SupabaseSession,
  SupabaseUser,
  SupabaseAuth,
  SupabaseStorage,
  SupabaseStorageBucket,
  SupabaseRealtime,
  RealtimeChannel,
  RealtimeChannelState,
  RealtimePostgresChangesPayload,
  RealtimePostgresInsertPayload,
  RealtimeBroadcastPayload,
  StorageFileMetadata,
  StorageResponse,
  StorageErrorResponse,
  StorageAdapter,
  AuthStateChangeEvent,
  PostgrestFilterOperator,
  PostgrestQueryBuilder,
  PostgrestFilterBuilder,
  SupabaseDatabase,
} from "@mirai-app/frameworks/supabase";

export { REALTIME_CHANNEL_STATES } from "@mirai-app/frameworks/supabase";
