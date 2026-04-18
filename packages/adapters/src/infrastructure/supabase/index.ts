/**
 * Supabase Infrastructure - Adapters Layer
 *
 * Provides Supabase client type definitions for the adapters layer.
 * Effect Context.Tags moved to use-cases layer for DI.
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
} from "./types";

export { REALTIME_CHANNEL_STATES } from "./types";
