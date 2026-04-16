/**
 * Service Layer - Effect Layer bindings for Infrastructure Services
 *
 * This module creates Effect Layers that bind infrastructure service implementations
 * to their respective Context.Tags from the use-cases layer.
 */

import { Layer } from "effect";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SupabaseAuthAdapter,
  SupabaseStorageAdapter,
  SupabaseRealtimeAdapter,
  EventEmitterPubSub,
} from "@mirai-app/adapters";
import {
  AuthPortTag,
  StoragePortTag,
  RealtimePortTag,
  PubSubServiceTag,
} from "@mirai-app/use-cases";

// Re-export Tags for convenience
export { AuthPortTag, StoragePortTag, RealtimePortTag, PubSubServiceTag };

/**
 * Configuration for service layer
 */
export interface ServiceLayerConfig {
  /** Supabase client for auth, storage, and realtime services */
  supabase: SupabaseClient;
}

/**
 * Creates a Layer that provides the AuthPort implementation
 *
 * Uses SupabaseAuthAdapter for authentication operations.
 */
export const makeAuthLayer = (config: ServiceLayerConfig) =>
  Layer.succeed(AuthPortTag, new SupabaseAuthAdapter(config.supabase));

/**
 * Creates a Layer that provides the StoragePort implementation
 *
 * Uses SupabaseStorageAdapter for file storage operations.
 */
export const makeStorageLayer = (config: ServiceLayerConfig) =>
  Layer.succeed(StoragePortTag, new SupabaseStorageAdapter(config.supabase));

/**
 * Creates a Layer that provides the RealtimePort implementation
 *
 * Uses SupabaseRealtimeAdapter for real-time subscriptions.
 */
export const makeRealtimeLayer = (config: ServiceLayerConfig) =>
  Layer.succeed(RealtimePortTag, new SupabaseRealtimeAdapter(config.supabase));

/**
 * Creates a Layer that provides the PubSubService implementation
 *
 * Uses EventEmitterPubSub for in-process pub/sub (GraphQL subscriptions).
 */
export const makePubSubLayer = () =>
  Layer.succeed(PubSubServiceTag, new EventEmitterPubSub());

/**
 * Creates a combined Layer with all service implementations
 *
 * This merges all individual service layers into a single Layer
 * that can be provided to Effects requiring any infrastructure service.
 */
export const makeServiceLayer = (config: ServiceLayerConfig) => {
  const authLayer = makeAuthLayer(config);
  const storageLayer = makeStorageLayer(config);
  const realtimeLayer = makeRealtimeLayer(config);
  const pubSubLayer = makePubSubLayer();

  return authLayer.pipe(
    Layer.merge(storageLayer),
    Layer.merge(realtimeLayer),
    Layer.merge(pubSubLayer),
  );
};
