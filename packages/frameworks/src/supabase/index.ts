/**
 * Supabase Framework Package
 *
 * Provides Supabase client integration for the Frameworks layer.
 * Includes Effect Context.Tag for dependency injection support.
 *
 * @example
 * ```typescript
 * import { SupabaseClientTag, createSupabaseClient } from "@mirai-app/frameworks/supabase";
 * import { Effect } from "effect";
 *
 * const supabase = createSupabaseClient(url, key);
 *
 * const program = Effect.gen(function* () {
 *   const client = yield* SupabaseClientTag;
 *   // Use client...
 * }).pipe(Effect.provide(Layer.succeed(SupabaseClientTag, supabase)));
 * ```
 */

import { Context, Layer } from "effect";
import type { RealSupabaseClient } from "./types";

// =============================================================================
// Effect Context Tag for DI
// =============================================================================

/**
 * Effect Context.Tag for SupabaseClient
 *
 * Use this to access the Supabase client within Effect programs.
 * The tag is typically provided by the service layer in DI.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const supabase = yield* SupabaseClientTag;
 *   const { data } = yield* Effect.tryPromise(() =>
 *     supabase.auth.getSession()
 *   );
 * });
 * ```
 */
export class SupabaseClientTag extends Context.Tag("SupabaseClient")<
  SupabaseClientTag,
  RealSupabaseClient
>() {}

// =============================================================================
// Layer Creation Helpers
// =============================================================================

/**
 * Creates a Layer that provides the SupabaseClientTag
 *
 * @param client - SupabaseClient instance
 * @returns Layer providing SupabaseClientTag
 *
 * @example
 * ```typescript
 * const supabase = createSupabaseClient(url, key);
 * const supabaseLayer = makeSupabaseLayer(supabase);
 *
 * const program = Effect.gen(function* () {
 *   const client = yield* SupabaseClientTag;
 *   // Use client...
 * }).pipe(Effect.provide(supabaseLayer));
 * ```
 */
export const makeSupabaseLayer = (client: RealSupabaseClient) => {
  return Layer.succeed(SupabaseClientTag, client);
};

// =============================================================================
// Exports
// =============================================================================

export type {
  SupabaseClient,
  RealSupabaseClient,
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

export {
  createSupabaseClient,
  createServiceClient,
  createClientWithAuth,
} from "./client";
