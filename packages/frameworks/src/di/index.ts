/**
 * @mirai-app/frameworks/di - Dependency Injection Effect Layers
 *
 * This module provides Effect Layer compositions for dependency injection.
 * It binds Context.Tags from the use-cases layer to concrete implementations
 * from the adapters layer.
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────┐
 * │          Frameworks Layer (DI)          │
 * │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
 * │  │  App    │ │   Repo  │ │ Service │  │
 * │  │  Layer  │ │  Layer  │ │  Layer  │  │
 * │  └────┬────┘ └────┬────┘ └────┬────┘  │
 * │       └───────────┴───────────┘       │
 * │                   │                   │
 * │                   ▼                   │
 * │         ┌─────────────────┐           │
 * │         │   Layer.merge   │           │
 * │         └─────────────────┘           │
 * └─────────────────────────────────────────┘
 * ```
 *
 * ## Usage
 *
 * ### Complete App Layer
 * ```typescript
 * import { makeAppLayer } from "@mirai-app/frameworks/di";
 * import { Effect } from "effect";
 *
 * const appLayer = makeAppLayer({ db, supabase });
 *
 * const program = Effect.gen(function* () {
 *   const userRepo = yield* UserPortTag;
 *   return yield* userRepo.findById("123");
 * }).pipe(Effect.provide(appLayer));
 * ```
 *
 * ### Individual Repository Layer
 * ```typescript
 * import { makeUserRepositoryLayer } from "@mirai-app/frameworks/di";
 *
 * const userLayer = makeUserRepositoryLayer({ db });
 * ```
 *
 * ### Testing with Mock Layers
 * ```typescript
 * import { createTestLayer } from "@mirai-app/frameworks/di";
 *
 * const testLayer = createTestLayer({
 *   userPort: mockUserRepo,
 * });
 * ```
 */

// =============================================================================
// Layer Composition - Main App Layer
// =============================================================================

export {
  makeAppLayer,
  makeRepositoriesOnlyLayer,
  makeServicesOnlyLayer,
  type AppLayerConfig,
} from "./layer/app";

// =============================================================================
// Repository Layers - Individual Domain Layers
// =============================================================================

export {
  makeRepositoryLayer,
  makeUserRepositoryLayer,
  makeTripRepositoryLayer,
  makeGroupRepositoryLayer,
  makeChallengeRepositoryLayer,
  makeChallengeSubmissionRepositoryLayer,
  makeChallengeVoteRepositoryLayer,
  makeNotificationRepositoryLayer,
  makeLocationRepositoryLayer,
  makeActivityFeedRepositoryLayer,
  makeRewardRepositoryLayer,
  makeCoinTransactionRepositoryLayer,
  makeSponsorRepositoryLayer,
  makeTripSponsorRepositoryLayer,
  makeSubmissionReportRepositoryLayer,
  makeStorageRepositoryLayer,
  type RepositoryLayerConfig,
} from "./layer/repository";

// =============================================================================
// Service Layers - External Services (Supabase, etc.)
// =============================================================================

export {
  makeServiceLayer,
  makeAuthLayer,
  makeStorageLayer,
  makeRealtimeLayer,
  type ServiceLayerConfig,
} from "./layer/service";

// =============================================================================
// Service Context Tags - For direct service access
// =============================================================================

export {
  AuthPortTag,
  StoragePortTag,
  RealtimePortTag,
} from "@mirai-app/use-cases";

export type { IAuthPort, IStoragePort, IRealtimePort } from "@mirai-app/domain";

// =============================================================================
// Test Utilities - Mock layers and test helpers
// =============================================================================

export {
  createTestLayer,
  runWithTestLayer,
  mockLayerOf,
  createMockRepositoryLayer,
  type TestLayer,
  type TestLayerConfig,
} from "./layer/test";

// =============================================================================
// Infrastructure Layers - Database, Logger, etc.
// =============================================================================

export {
  makeDatabaseLayer,
  makeLoggerLayer,
  type DatabaseLayerConfig,
  type LoggerLayerConfig,
} from "./layer/infrastructure";
