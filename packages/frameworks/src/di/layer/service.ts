/**
 * Service Layer Composition - Supabase Services
 *
 * Composes Supabase service gateways into Effect Layers.
 * Located in frameworks/di because this is DI wiring logic that binds
 * adapter implementations to use-cases layer Context.Tags.
 */

import { Layer } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import {
  AuthPortTag,
  StoragePortTag,
  EventBusTag,
} from "@mirai-app/use-cases";
import {
  SupabaseAuthGateway,
  SupabaseStorageGateway,
  SupabaseRealtimeEventBusGateway,
} from "@mirai-app/adapters";

/**
 * Configuration for creating service Layers
 */
export interface ServiceLayerConfig {
  /** Supabase client for auth, storage, and realtime services */
  supabase: SupabaseClient;
}

/**
 * Creates the complete service Layer with all Supabase services.
 *
 * Provides:
 * - AuthPortTag - Authentication operations
 * - StoragePortTag - File storage operations
 * - EventBusTag - Event bus for notifications
 *
 * Note: NotificationServicePortTag is created separately in makeAppLayer
 * because it requires repository ports (NotificationPort, PushSubscriptionPort).
 *
 * @example
 * ```typescript
 * const serviceLayer = makeServiceLayer({ supabase });
 *
 * const program = Effect.gen(function* () {
 *   const auth = yield* AuthPortTag;
 *   return yield* auth.getSession();
 * }).pipe(Effect.provide(serviceLayer));
 * ```
 */
export const makeServiceLayer = (config: ServiceLayerConfig) => {
  const authLayer = Layer.succeed(
    AuthPortTag,
    new SupabaseAuthGateway(config.supabase),
  );
  const storageLayer = Layer.succeed(
    StoragePortTag,
    new SupabaseStorageGateway(config.supabase),
  );
  const eventBusLayer = Layer.succeed(
    EventBusTag,
    new SupabaseRealtimeEventBusGateway(config.supabase),
  );

  return Layer.mergeAll(
    authLayer,
    storageLayer,
    eventBusLayer,
  );
};

/**
 * Creates only the Storage service Layer.
 */
export const makeStorageLayer = (supabase: SupabaseClient) => {
  return Layer.succeed(StoragePortTag, new SupabaseStorageGateway(supabase));
};


