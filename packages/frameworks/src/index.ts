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
 * │  │GraphQL  │ │ Drizzle │ │ Supabase│  │
 * │  │ Config  │ │ Client  │ │ Client  │  │
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
 * ### GraphQL Server Configuration
 * ```typescript
 * import { builder, schema } from "@mirai-app/frameworks/graphql";
 *
 * export const Query = builder.queryType({
 *   fields: (t) => ({
 *     users: t.field({
 *       type: [User],
 *       resolve: () => db.query.users.findMany(),
 *     }),
 *   }),
 * });
 * ```
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
// Phase 3: GraphQL API Configuration
// =============================================================================

export { builder, schemaBuilder, type GraphQLContext } from "./graphql/builder";

export {
  schema,
  type Schema,
  generateSDL,
  writeSDLToFile,
} from "./graphql/schema";

export { createHonoApp, startHonoServer } from "./graphql/server";

// =============================================================================
// Supabase Configuration
// =============================================================================

export { createSupabaseClient } from "./supabase/client";
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
 * import { makeAppLayer, AppLayerConfig } from "@mirai-app/frameworks";
 *
 * const appLayer = makeAppLayer({ supabase, db });
 *
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserRepositoryTag;
 *   const auth = yield* AuthPortTag;
 *   // ... use repos and services
 * }).pipe(Effect.provide(appLayer));
 * ```
 *
 * ### Individual Layers (Selective Composition)
 * ```typescript
 * import { makeRepositoryLayer, makeServiceLayer } from "@mirai-app/frameworks";
 *
 * const repoLayer = makeRepositoryLayer(db);
 * const serviceLayer = makeServiceLayer({ supabase, db });
 * const combined = Layer.merge(repoLayer, serviceLayer);
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
  makeUserDomainLayer,
  makeTripRewardDomainLayer,
  makeChallengeDomainLayer,
  makeNotificationDomainLayer,
  makeContentDomainLayer,
  makeReportingDomainLayer,
  // Service Layer
  makeServiceLayer,
  makeSupabaseServicesLayer,
  makeTelemetryServiceLayer,
  makePubSubServiceLayer,
  makeAuthLayer,
  makeRealtimeLayer,
  makeStorageLayer,
  type ServiceLayerConfig,
  type SupabaseClient,
  type DrizzleDb,
} from "./layers";

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
 * import { UserRepositoryTag } from "@mirai-app/use-cases";
 *
 * const testLayer = createTestLayer();
 *
 * const result = await runWithTestLayer(testLayer,
 *   Effect.gen(function* () {
 *     const repo = yield* UserRepositoryTag;
 *     return yield* repo.findById("123");
 *   })
 * );
 * ```
 *
 * ### Individual Service Layers
 * ```typescript
 * import { createAuthTestLayer, createUserRepositoryTestLayer } from "@mirai-app/frameworks";
 * import { Layer } from "effect";
 *
 * const authLayer = createAuthTestLayer();
 * const userLayer = createUserRepositoryTestLayer();
 * const combined = Layer.merge(authLayer, userLayer);
 * ```
 */
export {
  // Test Layer Creation
  createTestLayer,
  createMinimalTestLayer,
  createAuthTestLayer,
  createRealtimeTestLayer,
  createStorageTestLayer,
  createUserRepositoryTestLayer,
  // Test Execution
  runWithTestLayer,
  // Types
  type TestLayer,
  type TestLayerConfig,
  // Backward Compatibility (deprecated)
  createTestContainer,
  createConfiguredTestContainer,
  createTestContainerFromModule,
  createMockPortFactory,
  createMockFn,
  type MockFn,
  PORT_TOKENS,
  getInMemoryAuthAdapter,
  getInMemoryRealtimeAdapter,
  getInMemoryStorageAdapter,
  clearInMemoryAdapters,
} from "./di/test-layer";

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
