/**
 * ServiceLayer - Effect Layer composition for all external service bindings
 *
 * This module provides factory functions that create Effect Layers binding
 * service Context.Tags to their adapter implementations (Supabase, etc.).
 *
 * Pattern follows CLAUDE.md §10.4 Layer composition guidelines:
 * - Layer.succeed for direct bindings (no async required)
 * - Layer.mergeAll for composition
 * - Grouped by service type for readability
 *
 * Services covered:
 * - Auth (SupabaseAuthAdapter)
 * - Realtime (SupabaseRealtimeAdapter)
 * - Storage (SupabaseStorageAdapter)
 * - Telemetry (DrizzleTelemetryAdapter)
 * - PubSub (EventEmitterPubSub)
 *
 * @module layers/ServiceLayer
 */

import { Layer } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";

// =============================================================================
// Service Tags (Ports)
// =============================================================================

import {
  AuthPortTag,
  RealtimePortTag,
  StoragePortTag,
  TelemetryPortTag,
  PubSubServiceTag,
} from "@mirai-app/use-cases";

// =============================================================================
// Service Implementations (Adapters)
// =============================================================================

// Supabase-based services
import { SupabaseAuthAdapter } from "@mirai-app/adapters/gateways/auth";
import { SupabaseRealtimeAdapter } from "@mirai-app/adapters/gateways/realtime";
import { SupabaseStorageAdapter } from "@mirai-app/adapters/gateways/storage";

// Database-based services
import { DrizzleTelemetryAdapter } from "@mirai-app/adapters/gateways/drizzle/telemetry";

// In-memory/event-based services
import { EventEmitterPubSub } from "@mirai-app/adapters/services";

// =============================================================================
// Service-Grouped Factory Functions
// =============================================================================

/**
 * Supabase service adapters
 * - AuthPortTag (authentication via Supabase Auth)
 * - RealtimePortTag (WebSocket via Supabase Realtime)
 * - StoragePortTag (file storage via Supabase Storage)
 *
 * All three services share the same SupabaseClient dependency.
 */
export const makeSupabaseServicesLayer = (supabase: SupabaseClient) =>
  Layer.mergeAll(
    Layer.succeed(AuthPortTag, new SupabaseAuthAdapter(supabase)),
    Layer.succeed(RealtimePortTag, new SupabaseRealtimeAdapter(supabase)),
    Layer.succeed(StoragePortTag, new SupabaseStorageAdapter(supabase)),
  );

/**
 * Telemetry service adapter
 * - TelemetryPortTag (logging via Drizzle ORM)
 *
 * Persists telemetry events to the database using UserAgent table.
 */
export const makeTelemetryServiceLayer = (db: DrizzleDb) =>
  Layer.succeed(TelemetryPortTag, new DrizzleTelemetryAdapter(db));

/**
 * Pub/Sub service adapter
 * - PubSubServiceTag (in-memory pub/sub via EventEmitter)
 *
 * No external dependencies - creates its own EventEmitter instance.
 * Used for GraphQL subscriptions and in-process messaging.
 */
export const makePubSubServiceLayer = () =>
  Layer.succeed(PubSubServiceTag, new EventEmitterPubSub());

// =============================================================================
// Full Service Layer
// =============================================================================

/**
 * Configuration options for creating the ServiceLayer
 */
export interface ServiceLayerConfig {
  /** Supabase client for auth, realtime, and storage services */
  supabase: SupabaseClient;
  /** Drizzle database client for telemetry service */
  db: DrizzleDb;
}

/**
 * Creates a complete Layer with all service bindings.
 *
 * This is the primary factory for external service dependency injection.
 * All 5 service Context.Tags are bound to their adapter implementations.
 *
 * @example
 * ```typescript
 * import { makeServiceLayer } from "@mirai-app/frameworks/layers/ServiceLayer";
 * import { createSupabaseClient } from "@mirai-app/frameworks/supabase";
 * import { createDrizzleClient } from "@mirai-app/frameworks/drizzle";
 *
 * const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
 * const db = createDrizzleClient(databaseUrl);
 * const serviceLayer = makeServiceLayer({ supabase, db });
 *
 * // Use in Effect program
 * const program = Effect.gen(function* () {
 *   const auth = yield* AuthPortTag;
 *   const storage = yield* StoragePortTag;
 *   // Use services...
 * }).pipe(Effect.provide(serviceLayer));
 * ```
 *
 * @param config - Service layer configuration with Supabase and Drizzle clients
 * @returns Layer containing all service bindings
 */
export const makeServiceLayer = (config: ServiceLayerConfig) =>
  Layer.mergeAll(
    makeSupabaseServicesLayer(config.supabase),
    makeTelemetryServiceLayer(config.db),
    makePubSubServiceLayer(),
  );

// =============================================================================
// Individual Service Factories (for selective composition)
// =============================================================================

/**
 * Create only the Auth service layer
 *
 * @param supabase - Supabase client
 * @returns Layer with AuthPortTag binding
 */
export const makeAuthLayer = (supabase: SupabaseClient) =>
  Layer.succeed(AuthPortTag, new SupabaseAuthAdapter(supabase));

/**
 * Create only the Realtime service layer
 *
 * @param supabase - Supabase client
 * @returns Layer with RealtimePortTag binding
 */
export const makeRealtimeLayer = (supabase: SupabaseClient) =>
  Layer.succeed(RealtimePortTag, new SupabaseRealtimeAdapter(supabase));

/**
 * Create only the Storage service layer
 *
 * @param supabase - Supabase client
 * @returns Layer with StoragePortTag binding
 */
export const makeStorageLayer = (supabase: SupabaseClient) =>
  Layer.succeed(StoragePortTag, new SupabaseStorageAdapter(supabase));

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { DrizzleDb, SupabaseClient };
export type { ServiceLayerConfig };
