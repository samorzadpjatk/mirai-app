/**
 * UseCaseModule - Adapter Layer Use Case Registrations
 *
 * This module extends the use-cases package's UseCaseModule with additional
 * factory registrations for authentication and telemetry use cases.
 * It serves as the bridge between the port interfaces (defined in use-cases)
 * and their implementations.
 *
 * ## Auth Use Cases (3 use cases)
 *
 * | Token | Class | Dependencies | Purpose |
 * |-------|-------|--------------|---------|
 * | `authenticateUserUseCase` | AuthenticateUserUseCase | AuthPort | Token validation |
 * | `authorizeAdminUseCase` | AuthorizeAdminUseCase | AuthContext | Admin role check |
 * | `authorizeModeratorUseCase` | AuthorizeModeratorUseCase | AuthContext | Moderator role check |
 *
 * ## Port Registrations (with implementations)
 *
 * | Token | Interface | Implementation |
 * |-------|-----------|----------------|
 * | `authPort` | AuthPort | SupabaseAuthAdapter (default) or InMemoryAuthAdapter |
 * | `realtimePort` | RealtimePort | SupabaseRealtimeAdapter (default) or InMemoryRealtimeAdapter |
 * | `storagePort` | StoragePort | SupabaseStorageAdapter (default) or InMemoryStorageAdapter |
 * | `telemetryPort` | TelemetryPort | DrizzleTelemetryAdapter |
 *
 * ## Environment-Based Provider Switching
 *
 * This module supports environment-based provider selection, allowing you to
 * switch between production (Supabase) and test (InMemory) implementations
 * without code changes.
 *
 * ### Available Environment Variables
 *
 * | Variable | Values | Default | Description |
 * |----------|--------|---------|-------------|
 * | `AUTH_PROVIDER` | "supabase" \| "inmemory" | "supabase" | Authentication provider |
 * | `REALTIME_PROVIDER` | "supabase" \| "inmemory" | "supabase" | Real-time communication provider |
 * | `STORAGE_PROVIDER` | "supabase" \| "inmemory" | "supabase" | File storage provider |
 *
 * ### Usage Examples
 *
 * **Production (Supabase - default):**
 * ```bash
 * # No environment variables needed - uses Supabase by default
 * bun start
 * ```
 *
 * **Testing (InMemory):**
 * ```bash
 * # Use InMemory adapters for all ports
 * AUTH_PROVIDER=inmemory REALTIME_PROVIDER=inmemory STORAGE_PROVIDER=inmemory bun test
 * ```
 *
 * **Mixed Configuration:**
 * ```bash
 * # Use InMemory auth for testing auth flows without Supabase
 * # But keep Supabase for storage and realtime
 * AUTH_PROVIDER=inmemory bun test --filter=auth
 * ```
 *
 * ### When to Use Each Provider
 *
 * **Supabase Providers (Production):**
 * - Production deployments
 * - Integration tests with real Supabase
 * - E2E tests requiring real authentication
 * - Staging environments
 * - Any scenario requiring persistent data
 *
 * **InMemory Providers (Testing):**
 * - Unit tests (fast, isolated, no external dependencies)
 * - Development without Supabase credentials
 * - CI/CD pipelines (faster, no network calls)
 * - Testing error scenarios deterministically
 * - Parallel test execution (each test gets isolated adapter)
 *
 * ### Provider Selection Flow
 *
 * ```
 * Environment Variables
 *         │
 *         ▼
 * ┌───────────────────┐
 * │ AUTH_PROVIDER     │ ──► "supabase" ──► SupabaseAuthAdapter
 * │ (default:supabase)│ ──► "inmemory" ──► InMemoryAuthAdapter
 * └───────────────────┘
 *         │
 * ┌───────────────────┐
 * │ REALTIME_PROVIDER │ ──► "supabase" ──► SupabaseRealtimeAdapter
 * │ (default:supabase)│ ──► "inmemory" ──► InMemoryRealtimeAdapter
 * └───────────────────┘
 *         │
 * ┌───────────────────┐
 * │ STORAGE_PROVIDER  │ ──► "supabase" ──► SupabaseStorageAdapter
 * │ (default:supabase)│ ──► "inmemory" ──► InMemoryStorageAdapter
 * └───────────────────┘
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { UseCaseModule } from "@mirai-app/adapters/modules/UseCaseModule";
 *
 * // In AppModule imports:
 * const container = initializeContainer([
 *   RepositoryModule,
 *   BaseUseCaseModule,  // from @mirai-app/use-cases
 *   UseCaseModule,      // this module - adds auth/telemetry
 *   ControllerModule,
 * ]);
 * ```
 *
 * @module UseCaseModule
 */

import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";

// =============================================================================
// Use Case Imports
// =============================================================================

import {
  authenticateUserUseCase,
  type AuthenticateUserInput,
  type AuthenticateUserOutput,
  AuthorizeAdminUseCase,
  authorizeAdminUseCase,
  AuthorizeModeratorUseCase,
  authorizeModeratorUseCase,
  logTelemetryUseCase,
  TelemetryPortTag,
} from "@mirai-app/use-cases/interactors";
import { Effect } from "effect";

// =============================================================================
// Adapter Imports
// =============================================================================

import { SupabaseAuthAdapter } from "../gateways/auth/SupabaseAuthAdapter";
import { InMemoryAuthAdapter } from "../gateways/auth/InMemoryAuthAdapter";
import { SupabaseRealtimeAdapter } from "../gateways/realtime/SupabaseRealtimeAdapter";
import { InMemoryRealtimeAdapter } from "../gateways/realtime/InMemoryRealtimeAdapter";
import { SupabaseStorageAdapter } from "../gateways/storage/SupabaseStorageAdapter";
import { InMemoryStorageAdapter } from "../gateways/storage/InMemoryStorageAdapter";
import { DrizzleTelemetryAdapter } from "../gateways/drizzle/telemetry";
import { TokenExtractor } from "../utils/TokenExtractor";
import { EventEmitterPubSub } from "../services/EventEmitterPubSub";

// =============================================================================
// Type Imports
// =============================================================================

import type {
  AuthPort,
  RealtimePort,
  StoragePort,
  TelemetryPort,
  PubSubService,
} from "@mirai-app/use-cases";
import { AuthPortTag } from "@mirai-app/use-cases/ports/AuthPort";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";

// =============================================================================
// Provider Configuration Types
// =============================================================================

/**
 * Supported provider types
 */
export type ProviderType = "supabase" | "inmemory";

/**
 * Provider configuration from environment
 */
export interface ProviderConfig {
  /** Authentication provider: "supabase" or "inmemory" */
  authProvider: ProviderType;
  /** Real-time communication provider: "supabase" or "inmemory" */
  realtimeProvider: ProviderType;
  /** File storage provider: "supabase" or "inmemory" */
  storageProvider: ProviderType;
}

// =============================================================================
// Environment Variable Reading
// =============================================================================

/**
 * Read provider configuration from environment variables
 *
 * Validates environment variables and returns validated configuration.
 * Throws if invalid provider values are provided.
 *
 * @returns ProviderConfig with validated provider settings
 *
 * @example
 * ```typescript
 * const config = readProviderConfigFromEnv();
 * logger.debug("Provider config loaded", { authProvider: config.authProvider });
 * ```
 */
export function readProviderConfigFromEnv(): ProviderConfig {
  const authProvider = getProviderFromEnv("AUTH_PROVIDER", "supabase");
  const realtimeProvider = getProviderFromEnv("REALTIME_PROVIDER", "supabase");
  const storageProvider = getProviderFromEnv("STORAGE_PROVIDER", "supabase");

  return {
    authProvider,
    realtimeProvider,
    storageProvider,
  };
}

/**
 * Get provider value from environment variable with validation
 *
 * @param envVar - Environment variable name
 * @param defaultValue - Default provider if not set
 * @returns Validated provider type
 * @throws Error if invalid provider value
 */
function getProviderFromEnv(
  envVar: string,
  defaultValue: ProviderType,
): ProviderType {
  const value = process.env[envVar];

  if (!value) {
    return defaultValue;
  }

  const normalized = value.toLowerCase().trim();

  if (normalized !== "supabase" && normalized !== "inmemory") {
    throw new Error(
      `Invalid ${envVar} value: "${value}". ` +
        `Must be "supabase" or "inmemory".`,
    );
  }

  return normalized as ProviderType;
}

// =============================================================================
// Injection Tokens
// =============================================================================

/**
 * Use case injection tokens for auth and telemetry
 */
export const AUTH_USE_CASE_TOKENS = {
  AuthenticateUserUseCase: "authenticateUserUseCase",
  AuthorizeAdminUseCase: "authorizeAdminUseCase",
  AuthorizeModeratorUseCase: "authorizeModeratorUseCase",
  LogTelemetryUseCase: "logTelemetryUseCase",
} as const;

/**
 * Port injection tokens for cross-cutting concerns
 */
export const PORT_TOKENS = {
  AuthPort: "authPort",
  RealtimePort: "realtimePort",
  StoragePort: "storagePort",
  TelemetryPort: "telemetryPort",
  PubSubService: "pubSubService",
} as const;

/**
 * Utility token for token extraction
 */
export const UTILITY_TOKENS = {
  TokenExtractor: "tokenExtractor",
} as const;

/**
 * Type for auth use case token keys
 */
export type AuthUseCaseToken =
  (typeof AUTH_USE_CASE_TOKENS)[keyof typeof AUTH_USE_CASE_TOKENS];

/**
 * Type for port token keys
 */
export type PortToken = (typeof PORT_TOKENS)[keyof typeof PORT_TOKENS];

// =============================================================================
// Factory Functions
// =============================================================================

type Cradle = Record<string, unknown>;

/**
 * Create AuthPort instance based on environment configuration
 *
 * Factory function that selects between Supabase and InMemory implementations
 * based on the AUTH_PROVIDER environment variable.
 *
 * @param cradle - DI container cradle with dependencies
 * @returns AuthPort implementation instance
 */
function createAuthPort(cradle: Cradle): AuthPort {
  const config = readProviderConfigFromEnv();

  switch (config.authProvider) {
    case "inmemory":
      return new InMemoryAuthAdapter();
    case "supabase":
    default:
      return new SupabaseAuthAdapter(cradle.supabase as SupabaseClient);
  }
}

/**
 * Create RealtimePort instance based on environment configuration
 *
 * Factory function that selects between Supabase and InMemory implementations
 * based on the REALTIME_PROVIDER environment variable.
 *
 * @param cradle - DI container cradle with dependencies
 * @returns RealtimePort implementation instance
 */
function createRealtimePort(cradle: Cradle): RealtimePort {
  const config = readProviderConfigFromEnv();

  switch (config.realtimeProvider) {
    case "inmemory":
      return new InMemoryRealtimeAdapter();
    case "supabase":
    default:
      return new SupabaseRealtimeAdapter(cradle.supabase as SupabaseClient);
  }
}

/**
 * Create StoragePort instance based on environment configuration
 *
 * Factory function that selects between Supabase and InMemory implementations
 * based on the STORAGE_PROVIDER environment variable.
 *
 * @param cradle - DI container cradle with dependencies
 * @returns StoragePort implementation instance
 */
function createStoragePort(cradle: Cradle): StoragePort {
  const config = readProviderConfigFromEnv();

  switch (config.storageProvider) {
    case "inmemory":
      return new InMemoryStorageAdapter();
    case "supabase":
    default:
      return new SupabaseStorageAdapter(cradle.supabase as SupabaseClient);
  }
}

/**
 * Create DrizzleTelemetryAdapter instance
 */
function createDrizzleTelemetryAdapter(cradle: Cradle): TelemetryPort {
  return new DrizzleTelemetryAdapter(cradle.db as DrizzleDb);
}

/**
 * Create AuthenticateUserUseCase function wrapper
 *
 * Returns a function that executes the authenticateUserUseCase Effect
 * with the authPort from the container provided via Effect.provideService.
 */
function createAuthenticateUserUseCase(
  cradle: Cradle,
): (input: AuthenticateUserInput) => Promise<AuthenticateUserOutput> {
  const authPort = cradle.authPort as AuthPort;
  return async (input: AuthenticateUserInput) => {
    const effect = authenticateUserUseCase(input);
    const runnable = effect.pipe(Effect.provideService(AuthPortTag, authPort));
    return await Effect.runPromise(runnable);
  };
}

/**
 * Create AuthorizeAdminUseCase instance
 * Uses singleton pattern - no dependencies
 */
const authorizeAdminUseCaseSingleton = new AuthorizeAdminUseCase();

function createAuthorizeAdminUseCase(): AuthorizeAdminUseCase {
  return authorizeAdminUseCaseSingleton;
}

/**
 * Create AuthorizeModeratorUseCase instance
 * Uses singleton pattern - no dependencies
 */
const authorizeModeratorUseCaseSingleton = new AuthorizeModeratorUseCase();

function createAuthorizeModeratorUseCase(): AuthorizeModeratorUseCase {
  return authorizeModeratorUseCaseSingleton;
}

/**
 * Create PubSubService instance (EventEmitterPubSub)
 *
 * Uses singleton pattern since EventEmitterPubSub maintains internal state
 * (EventEmitter instance and subscription tracking).
 */
const pubSubServiceSingleton = new EventEmitterPubSub();

function createPubSubService(): PubSubService {
  return pubSubServiceSingleton;
}

// =============================================================================
// Module Dependencies Type
// =============================================================================

export interface UseCaseModuleDeps {
  /** Authentication port - dynamically selected based on AUTH_PROVIDER */
  [PORT_TOKENS.AuthPort]: AuthPort;

  /** Real-time port - dynamically selected based on REALTIME_PROVIDER */
  [PORT_TOKENS.RealtimePort]: RealtimePort;

  /** Storage port - dynamically selected based on STORAGE_PROVIDER */
  [PORT_TOKENS.StoragePort]: StoragePort;

  /** Telemetry port - Prisma implementation */
  [PORT_TOKENS.TelemetryPort]: TelemetryPort;

  /** PubSub service - EventEmitterPubSub singleton */
  [PORT_TOKENS.PubSubService]: PubSubService;

  /** Token extraction utility */
  [UTILITY_TOKENS.TokenExtractor]: typeof TokenExtractor;

  /** Authenticate user use case - function-based Effect */
  [AUTH_USE_CASE_TOKENS.AuthenticateUserUseCase]: (
    input: AuthenticateUserInput,
  ) => Promise<AuthenticateUserOutput>;

  /** Authorize admin use case */
  [AUTH_USE_CASE_TOKENS.AuthorizeAdminUseCase]: AuthorizeAdminUseCase;

  /** Authorize moderator use case */
  [AUTH_USE_CASE_TOKENS.AuthorizeModeratorUseCase]: AuthorizeModeratorUseCase;

  /** Log telemetry use case */
  [AUTH_USE_CASE_TOKENS.LogTelemetryUseCase]: typeof logTelemetryUseCase;
}

// =============================================================================
// Module Definition Type
// =============================================================================

export interface UseCaseModuleDef {
  name: "UseCaseModule";
  providers: Record<string, any>;
  exports: string[];
}

// =============================================================================
// Module Creation
// =============================================================================

/**
 * UseCaseModule - Static module for auth, realtime, storage, and telemetry
 *
 * This module provides:
 * 1. Port implementations with environment-based provider selection
 *    - AuthPort: SupabaseAuthAdapter or InMemoryAuthAdapter
 *    - RealtimePort: SupabaseRealtimeAdapter or InMemoryRealtimeAdapter
 *    - StoragePort: SupabaseStorageAdapter or InMemoryStorageAdapter
 *    - TelemetryPort: DrizzleTelemetryAdapter
 * 2. Factory registrations for auth/telemetry use cases
 * 3. TokenExtractor utility for HTTP header parsing
 *
 * ## Environment-Based Provider Selection
 *
 * The module reads environment variables to determine which adapter
 * implementations to use:
 *
 * | Variable | Default | Options |
 * |----------|---------|---------|
 * | AUTH_PROVIDER | supabase | supabase, inmemory |
 * | REALTIME_PROVIDER | supabase | supabase, inmemory |
 * | STORAGE_PROVIDER | supabase | supabase, inmemory |
 *
 * ## Lifetime Strategy
 *
 * | Provider | Lifetime | Rationale |
 * |----------|----------|-----------|
 * | authPort | SCOPED | Request-scoped based on provider |
 * | realtimePort | SCOPED | Request-scoped based on provider |
 * | storagePort | SCOPED | Request-scoped based on provider |
 * | telemetryPort | SCOPED | Request-scoped Drizzle client |
 * | tokenExtractor | SINGLETON | Stateless utility |
 * | authenticateUserUseCase | SCOPED | Uses request-scoped authPort |
 * | authorizeAdminUseCase | SINGLETON | Pure logic, no dependencies |
 * | authorizeModeratorUseCase | SINGLETON | Pure logic, no dependencies |
 * | logTelemetryUseCase | SCOPED | Uses request-scoped telemetryPort |
 *
 * ## DI Graph
 *
 * ```
 * AppModule
 * ├── UseCaseModule (this module)
 * │   ├── authPort ← [SupabaseAuthAdapter | InMemoryAuthAdapter]
 * │   ├── realtimePort ← [SupabaseRealtimeAdapter | InMemoryRealtimeAdapter]
 * │   ├── storagePort ← [SupabaseStorageAdapter | InMemoryStorageAdapter]
 * │   ├── telemetryPort ← DrizzleTelemetryAdapter
 * │   ├── tokenExtractor (utility)
 * │   ├── authenticateUserUseCase (depends on authPort)
 * │   ├── authorizeAdminUseCase (no deps)
 * │   ├── authorizeModeratorUseCase (no deps)
 * │   └── logTelemetryUseCase (depends on telemetryPort)
 * ```
 *
 * ## Provider Selection at Runtime
 *
 * ```
 * process.env.AUTH_PROVIDER
 *         │
 *         ├── "supabase" ──► new SupabaseAuthAdapter(supabaseClient)
 *         └── "inmemory" ──► new InMemoryAuthAdapter()
 *
 * process.env.REALTIME_PROVIDER
 *         │
 *         ├── "supabase" ──► new SupabaseRealtimeAdapter(supabaseClient)
 *         └── "inmemory" ──► new InMemoryRealtimeAdapter()
 *
 * process.env.STORAGE_PROVIDER
 *         │
 *         ├── "supabase" ──► new SupabaseStorageAdapter(supabaseClient)
 *         └── "inmemory" ──► new InMemoryStorageAdapter()
 * ```
 */
export const UseCaseModule: StaticModule<UseCaseModuleDef> =
  createStaticModule<UseCaseModuleDef>({
    name: "UseCaseModule",

    providers: {
      // =================================================================
      // Port Implementations with Environment-Based Selection
      // =================================================================

      /**
       * AuthPort - Dynamic implementation based on AUTH_PROVIDER env var
       * SCOPED lifetime for request-scoped behavior
       *
       * Environment: AUTH_PROVIDER=(supabase|inmemory), default: supabase
       */
      [PORT_TOKENS.AuthPort]: {
        factory: createAuthPort,
        lifetime: Lifetime.SCOPED,
      },

      /**
       * RealtimePort - Dynamic implementation based on REALTIME_PROVIDER env var
       * SCOPED lifetime for request-scoped behavior
       *
       * Environment: REALTIME_PROVIDER=(supabase|inmemory), default: supabase
       */
      [PORT_TOKENS.RealtimePort]: {
        factory: createRealtimePort,
        lifetime: Lifetime.SCOPED,
      },

      /**
       * StoragePort - Dynamic implementation based on STORAGE_PROVIDER env var
       * SCOPED lifetime for request-scoped behavior
       *
       * Environment: STORAGE_PROVIDER=(supabase|inmemory), default: supabase
       */
      [PORT_TOKENS.StoragePort]: {
        factory: createStoragePort,
        lifetime: Lifetime.SCOPED,
      },

      /**
       * TelemetryPort - Drizzle implementation
       * SCOPED lifetime for request-scoped Drizzle client
       */
      [PORT_TOKENS.TelemetryPort]: {
        factory: createDrizzleTelemetryAdapter,
        lifetime: Lifetime.SCOPED,
      },

      /**
       * PubSubService - EventEmitterPubSub singleton
       * SINGLETON lifetime because it maintains internal EventEmitter state
       */
      [PORT_TOKENS.PubSubService]: {
        factory: createPubSubService,
        lifetime: Lifetime.SINGLETON,
      },

      // =================================================================
      // Utility Registrations
      // =================================================================

      /**
       * TokenExtractor - Stateless utility for Bearer token extraction
       * SINGLETON lifetime because it's a pure function with no state.
       */
      [UTILITY_TOKENS.TokenExtractor]: {
        factory: () => TokenExtractor,
        lifetime: Lifetime.SINGLETON,
      },

      // =================================================================
      // Auth/Telemetry Use Case Registrations
      // =================================================================

      /**
       * AuthenticateUserUseCase - Validates tokens and returns AuthContext
       * SCOPED lifetime because it depends on request-scoped authPort.
       */
      [AUTH_USE_CASE_TOKENS.AuthenticateUserUseCase]: {
        factory: createAuthenticateUserUseCase,
        lifetime: Lifetime.SCOPED,
      },

      /**
       * AuthorizeAdminUseCase - Checks admin role authorization
       * SINGLETON lifetime because it has no dependencies and pure logic.
       */
      [AUTH_USE_CASE_TOKENS.AuthorizeAdminUseCase]: {
        factory: createAuthorizeAdminUseCase,
        lifetime: Lifetime.SINGLETON,
      },

      /**
       * AuthorizeModeratorUseCase - Checks moderator role authorization
       * SINGLETON lifetime because it has no dependencies and pure logic.
       */
      [AUTH_USE_CASE_TOKENS.AuthorizeModeratorUseCase]: {
        factory: createAuthorizeModeratorUseCase,
        lifetime: Lifetime.SINGLETON,
      },

      /**
       * LogTelemetryUseCase - Logs telemetry events
       * SINGLETON lifetime because it's a pure function.
       */
      [AUTH_USE_CASE_TOKENS.LogTelemetryUseCase]: {
        factory: () => logTelemetryUseCase,
        lifetime: Lifetime.SINGLETON,
      },
    },

    exports: [
      // Ports
      PORT_TOKENS.AuthPort,
      PORT_TOKENS.RealtimePort,
      PORT_TOKENS.StoragePort,
      PORT_TOKENS.TelemetryPort,
      PORT_TOKENS.PubSubService,

      // Utilities
      UTILITY_TOKENS.TokenExtractor,

      // Use cases
      AUTH_USE_CASE_TOKENS.AuthenticateUserUseCase,
      AUTH_USE_CASE_TOKENS.AuthorizeAdminUseCase,
      AUTH_USE_CASE_TOKENS.AuthorizeModeratorUseCase,
      AUTH_USE_CASE_TOKENS.LogTelemetryUseCase,
    ],
  });

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { TokenExtractor };

// Export adapter classes for direct use if needed
export { InMemoryAuthAdapter } from "../gateways/auth/InMemoryAuthAdapter";
export { InMemoryRealtimeAdapter } from "../gateways/realtime/InMemoryRealtimeAdapter";
export { InMemoryStorageAdapter } from "../gateways/storage/InMemoryStorageAdapter";
