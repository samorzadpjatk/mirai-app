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
// Auth Layer - Authentication (AuthN) and Authorization (AuthZ) Layers
// =============================================================================

export {
  makeAuthLayer,
  makeAuthNLayer,
  makeAuthZLayer,
  type AuthLayerConfig,
  type AuthNLayerConfig,
  type AuthZLayerConfig,
} from "./layer/auth";

// =============================================================================
// Service Context Tags - For direct service access
// =============================================================================

export {
  AuthPortTag,
  AuthNPortTag,
  AuthZPortTag,
  StoragePortTag,
  EventBusTag,
} from "@mirai-app/use-cases";

export type { IAuthPort, IAuthNPort, IAuthZPort, IStoragePort } from "@mirai-app/domain";

// =============================================================================
// Test Utilities - Mock layers and test helpers
// =============================================================================

export {
  createTestLayer,
  runWithTestLayer,
  mockLayerOf,
  createMockRepositoryLayer,
  // Legacy auth mock helpers (backward compatibility)
  createAlwaysAllowMockAuth,
  createAlwaysDenyMockAuth,
  createConditionalMockAuth,
  createMockAuthLayer,
  createMockAuthPort,
  MockUnauthorizedError,
  MockPermissionDeniedError,
  MockSessionExpiredError,
  // AuthN mock helpers
  createAlwaysAllowMockAuthN,
  createAlwaysDenyMockAuthN,
  createMockAuthNLayer,
  // AuthZ mock helpers
  createAlwaysAllowMockAuthZ,
  createAlwaysDenyMockAuthZ,
  createConditionalMockAuthZ,
  createMockAuthZLayer,
  type ConditionalMockAuthConfig,
  type ConditionalMockAuthZConfig,
  type TestLayer,
  type TestLayerConfig,
} from "./layer/test";

// =============================================================================
// Infrastructure Layers - Database, etc.
// =============================================================================

export {
  makeDatabaseLayer,
  type DatabaseLayerConfig,
} from "./layer/infrastructure";
