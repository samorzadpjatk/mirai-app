import { Context } from "effect";
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

// =============================================================================
// SupabaseClient Context.Tag for Effect DI
// =============================================================================

/**
 * Context.Tag for accessing the Supabase client directly.
 *
 * This tag provides direct access to the Supabase client for operations
 * that need the full Supabase API (e.g., admin operations like getUserById).
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const supabase = yield* SupabaseClientTag;
 *   const { data } = yield* Effect.tryPromise(() =>
 *     supabase.auth.admin.getUserById(userId)
 *   );
 *   return data;
 * }).pipe(Effect.provide(context.appLayer));
 * ```
 */
export const SupabaseClientTag = Context.Tag<SupabaseClient>("SupabaseClient");
