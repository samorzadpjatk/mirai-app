/**
 * Frameworks Layer Exports
 *
 * Barrel export for all Effect Layer compositions.
 * Provides unified dependency injection for repositories and services.
 *
 * ## Usage
 *
 * ### Complete App Layer (Recommended)
 * ```typescript
 * import { makeAppLayer, AppLayerConfig } from "@mirai-app/frameworks/layers";
 *
 * const config: AppLayerConfig = { supabase, db };
 * const appLayer = makeAppLayer(config);
 * ```
 *
 * ### Individual Layers (Selective Composition)
 * ```typescript
 * import {
 *   makeRepositoryLayer,
 *   makeServiceLayer,
 *   makeUserDomainLayer,
 * } from "@mirai-app/frameworks/layers";
 *
 * // Use only repositories
 * const repoLayer = makeRepositoryLayer(db);
 *
 * // Use only services
 * const serviceLayer = makeServiceLayer({ supabase, db });
 *
 * // Use domain-specific layer
 * const userLayer = makeUserDomainLayer(db);
 * ```
 *
 * @module layers
 */

// =============================================================================
// App Layer (Unified Composition)
// =============================================================================

export {
  makeAppLayer,
  makeRepositoriesOnlyLayer,
  makeServicesOnlyLayer,
  type AppLayerConfig,
} from "./AppLayer";

// =============================================================================
// Repository Layer (Domain Repositories)
// =============================================================================

export {
  makeRepositoryLayer,
  makeUserDomainLayer,
  makeTripRewardDomainLayer,
  makeChallengeDomainLayer,
  makeNotificationDomainLayer,
  makeContentDomainLayer,
  makeReportingDomainLayer,
  type DrizzleDb,
} from "./RepositoryLayer";

// =============================================================================
// Service Layer (External Services)
// =============================================================================

export {
  makeServiceLayer,
  makeSupabaseServicesLayer,
  makeTelemetryServiceLayer,
  makePubSubServiceLayer,
  makeAuthLayer,
  makeRealtimeLayer,
  makeStorageLayer,
  type ServiceLayerConfig,
  type SupabaseClient,
} from "./ServiceLayer";
