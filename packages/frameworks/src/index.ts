/**
 * @mirai-app/frameworks - Frameworks Layer Exports
 *
 * This package contains framework-specific configuration.
 * It is the outermost layer and can depend on all inner layers.
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────┐
 * │          Frameworks Layer               │
 * │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
 * │  │Drizzle  │ │ Effect │ │ Supabase│  │
 * │  │ Client  │ │ Layers  │ │ Client  │  │
 * │  └─────────┘ └─────────┘ └─────────┘  │
 * └─────────────────────────────────────────┘
 *              │
 *              ▼
 * ┌─────────────────────────────────────────┐
 * │          Adapters Layer                 │
 * │    (Controllers, Gateways, Mappers)     │
 * └─────────────────────────────────────────┘
 * ```
 *
 * ## Usage
 *
 * ### Drizzle ORM Client
 * ```typescript
 * import { createDrizzleClient } from "@mirai-app/frameworks/drizzle/client";
 *
 * const db = createDrizzleClient(process.env.DATABASE_URL);
 * ```
 *
 * ### Supabase Client
 * ```typescript
 * import { createSupabaseClient } from "@mirai-app/frameworks/supabase/client";
 *
 * const supabase = createSupabaseClient(
 *   process.env.SUPABASE_URL,
 *   process.env.SUPABASE_ANON_KEY
 * );
 * ```
 */

// =============================================================================
// Phase 1: Drizzle ORM Configuration (Prisma Replacement)
// =============================================================================

export { createDrizzleClient, type DrizzleDb } from "./drizzle/client";

export * from "./drizzle/schema";

// =============================================================================
// Supabase Configuration
// =============================================================================

export { createSupabaseClient } from "./supabase/client";
export { SupabaseClientTag } from "./supabase/index";
export type {
  SupabaseClientOptions,
  SupabaseClient,
  SupabaseSession,
  SupabaseUser,
  RealtimePostgresChangesPayload,
  RealtimeChannel,
  RealtimePostgresInsertPayload,
  StorageAdapter,
} from "./supabase/types";
export { REALTIME_CHANNEL_STATES } from "./supabase/types";

// =============================================================================
// Effect Layer Compositions (DI Factories)
// =============================================================================

/**
 * Effect Layer compositions for dependency injection.
 *
 * These provide unified factories for binding Context.Tags to implementations.
 *
 * ### Complete App Layer (Recommended)
 * ```typescript
 * import { makeAppLayer, type AppLayerConfig } from "@mirai-app/frameworks";
 * import { UserGatewayTag } from "@mirai-app/use-cases/ports/user/gateway";
 *
 * const appLayer = makeAppLayer({ supabase, db });
 *
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserGatewayTag;
 *   // ... use repos and services
 * }).pipe(Effect.provide(appLayer));
 * ```
 *
 * ### Individual Layers (Selective Composition)
 * ```typescript
 * import { makeRepositoryLayer, makeServiceLayer } from "@mirai-app/frameworks";
 * import { Layer } from "effect";
 *
 * const repoLayer = makeRepositoryLayer({ db });
 * const serviceLayer = makeServiceLayer({ supabase });
 * const combined = repoLayer.pipe(Layer.merge(serviceLayer));
 * ```
 */
export {
  // App Layer (unified)
  makeAppLayer,
  makeRepositoriesOnlyLayer,
  makeServicesOnlyLayer,
  type AppLayerConfig,
  // Repository Layer
  makeRepositoryLayer,
  makeUserRepositoryLayer,
  makeTripRepositoryLayer,
  makeGroupRepositoryLayer,
  makeChallengeRepositoryLayer,
  makeChallengeSubmissionRepositoryLayer,
  makeChallengeVoteRepositoryLayer,
  makeNotificationRepositoryLayer,
  makeNotificationDeliveryRepositoryLayer,
  makeNotificationScheduleRepositoryLayer,
  makeLocationRepositoryLayer,
  makeActivityFeedRepositoryLayer,
  makeRewardRepositoryLayer,
  makeCoinTransactionRepositoryLayer,
  makeSponsorRepositoryLayer,
  makeSubmissionReportRepositoryLayer,
  type RepositoryLayerConfig,
  // Service Layer
  makeServiceLayer,
  makeAuthLayer,
  makeStorageLayer,
  makeRealtimeLayer,
  makePubSubLayer,
  AuthPortTag,
  StoragePortTag,
  RealtimePortTag,
  PubSubServiceTag,
  type ServiceLayerConfig,
} from "./di";

// =============================================================================
// Test Utilities (Effect Layer-based)
// =============================================================================

/**
 * Test utilities for Effect-based dependency injection.
 *
 * ### Creating Test Layers
 * ```typescript
 * import { createTestLayer, runWithTestLayer } from "@mirai-app/frameworks";
 * import { Effect } from "effect";
 * import { UserGatewayTag } from "@mirai-app/use-cases/ports/user/gateway";
 *
 * const testLayer = createTestLayer();
 *
 * const result = await runWithTestLayer(
 *   testLayer,
 *   Effect.gen(function* () {
 *     const repo = yield* UserGatewayTag;
 *     return yield* repo.findById("123");
 *   })
 * );
 * ```
 *
 * ### Mock Individual Services
 * ```typescript
 * import { mockLayerOf } from "@mirai-app/frameworks";
 * import { UserGatewayTag } from "@mirai-app/use-cases/ports/user/gateway";
 * import { Effect, Layer } from "effect";
 *
 * const mockUserRepo = mockLayerOf(
 *   UserGatewayTag,
 *   {
 *     findById: () => Effect.succeed(null),
 *     save: (user) => Effect.succeed(user),
 *   }
 * );
 * ```
 */
export {
  // Test Layer Creation
  createTestLayer,
  // Test Execution
  runWithTestLayer,
  // Mock Helpers
  mockLayerOf,
  // Types
  type TestLayer,
  type TestLayerConfig,
} from "./di/layer/test";

// =============================================================================
// Re-export Inner Layers (for convenience)
// =============================================================================

// NOTE: Re-exports from @mirai-app/domain, @mirai-app/use-cases, and @mirai-app/adapters
// are available via their respective packages. Import directly:
//
// ```typescript
// import { User, Challenge } from "@mirai-app/domain";
// import { CreateUserUseCase } from "@mirai-app/use-cases";
// import { UserController } from "@mirai-app/adapters";
// ```
