/**
 * AppLayer - Unified Effect Layer composition for the entire application
 *
 * This module provides the top-level factory function that merges:
 * - RepositoryLayer (19 repository bindings to Drizzle implementations)
 * - ServiceLayer (5 service bindings to external adapters)
 *
 * This is Step 3 of the DI refactoring:
 * 1. ✓ RepositoryLayer (17 repos)
 * 2. ✓ ServiceLayer (5 services)
 * 3. → AppLayer (merges both) ← YOU ARE HERE
 * 4. Container integration (Phase 4.3)
 * 5. Controller migration
 * 6. Cleanup
 * 7. Verification
 *
 * Pattern follows CLAUDE.md §10.4 Layer composition guidelines:
 * - Layer.succeed for direct bindings
 * - Layer.mergeAll for composition
 * - Single unified factory for easy use in controllers
 *
 * @module layers/AppLayer
 */

import { Layer } from "effect";

// =============================================================================
// Layer Imports
// =============================================================================

import { makeRepositoryLayer, type DrizzleDb } from "./RepositoryLayer";
import { makeServiceLayer, type ServiceLayerConfig } from "./ServiceLayer";
import { AllUseCasesLayer } from "@mirai-app/use-cases";

// =============================================================================
// Configuration Interface
// =============================================================================

/**
 * Configuration options for creating the complete AppLayer
 *
 * Combines both RepositoryLayer and ServiceLayer requirements:
 * - Drizzle database client (for repositories and telemetry)
 * - Supabase client (for auth, realtime, storage services)
 */
export interface AppLayerConfig {
  /** Supabase client for auth, realtime, storage, and other Supabase services */
  supabase: ServiceLayerConfig["supabase"];
  /** Drizzle database client for repositories and telemetry */
  db: DrizzleDb;
}

// =============================================================================
// Unified App Layer Factory
// =============================================================================

/**
 * Creates a complete Layer with all repository, service, and use case bindings.
 *
 * This is the PRIMARY factory for dependency injection in the application.
 * It merges:
 * - 19 repository Context.Tags → Drizzle implementations
 * - 5 service Context.Tags → adapter implementations
 * - 8 use case Context.Tags → use case implementations
 *
 * Total: 32 Context.Tag bindings in a single Layer.
 *
 * @example
 * ```typescript
 * // In controller or request handler
 * import { makeAppLayer, AppLayerConfig } from "@mirai-app/frameworks/layers";
 * import { createDrizzleClient } from "@mirai-app/frameworks/drizzle/client";
 * import { createSupabaseClient } from "@mirai-app/frameworks/supabase/client";
 *
 * const config: AppLayerConfig = {
 *   supabase: createSupabaseClient(supabaseUrl, supabaseKey),
 *   db: createDrizzleClient(databaseUrl),
 * };
 *
 * const appLayer = makeAppLayer(config);
 *
 * // Use in Effect program
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserRepositoryTag;
 *   const auth = yield* AuthPortTag;
 *   const getUser = yield* GetUserUseCaseTag;
 *
 *   const user = yield* userRepo.findById("123");
 *   // ... use services and use cases
 *   return user;
 * }).pipe(Effect.provide(appLayer));
 * ```
 *
 * @example
 * ```typescript
 * // In tests - use with mock layers
 * import { Layer } from "effect";
 *
 * const testLayer = makeAppLayer(config).pipe(
 *   Layer.merge(mockRepositoryLayer),  // Override repos
 *   Layer.merge(mockServiceLayer)     // Override services
 * );
 * ```
 *
 * @param config - App layer configuration with Supabase and Drizzle clients
 * @returns Layer containing all 32 (19 repos + 5 services + 8 use cases) bindings
 */
export const makeAppLayer = (config: AppLayerConfig) =>
  Layer.mergeAll(
    makeRepositoryLayer(config.db),
    makeServiceLayer(config),
    AllUseCasesLayer,
  );

// =============================================================================
// Convenience Exports
// =============================================================================

/**
 * Creates only the repository layer (for selective composition)
 *
 * @param db - Drizzle database client
 * @returns Layer containing all repository bindings
 */
export const makeRepositoriesOnlyLayer = (db: DrizzleDb) =>
  makeRepositoryLayer(db);

/**
 * Creates only the service layer (for selective composition)
 *
 * @param config - Service layer configuration
 * @returns Layer containing all service bindings
 */
export const makeServicesOnlyLayer = (config: ServiceLayerConfig) =>
  makeServiceLayer(config);

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type {
  DrizzleDb,
  ServiceLayerConfig,
  SupabaseClient,
} from "./ServiceLayer";

// AppLayerConfig is already exported at line 45 (interface definition)

// Re-export individual layer factories for advanced composition
export {
  // Repository domain layers
  makeUserDomainLayer,
  makeTripRewardDomainLayer,
  makeChallengeDomainLayer,
  makeNotificationDomainLayer,
  makeContentDomainLayer,
  makeReportingDomainLayer,
} from "./RepositoryLayer";

export {
  // Service layers
  makeSupabaseServicesLayer,
  makeTelemetryServiceLayer,
  makePubSubServiceLayer,
  makeAuthLayer,
  makeRealtimeLayer,
  makeStorageLayer,
  makeSupabaseClientLayer,
} from "./ServiceLayer";
