/**
 * UseCaseModule - Adapter Layer Use Case Registrations
 *
 * This module extends the use-cases package's UseCaseModule with additional
 * factory registrations for authentication and telemetry use cases.
 * It serves as the bridge between the port interfaces (defined in use-cases)
 * and their implementations.
 *
 * ## Auth & Telemetry Use Cases (4 use cases)
 *
 * | Token | Class | Dependencies | Purpose |
 * |-------|-------|--------------|---------|
 * | `authenticateUserUseCase` | AuthenticateUserUseCase | AuthPort | Token validation |
 * | `authorizeAdminUseCase` | AuthorizeAdminUseCase | AuthContext | Admin role check |
 * | `authorizeModeratorUseCase` | AuthorizeModeratorUseCase | AuthContext | Moderator role check |
 * | `logTelemetryUseCase` | LogTelemetryUseCase | TelemetryPort | Telemetry logging |
 *
 * ## Port Registrations (with implementations)
 *
 * | Token | Interface | Implementation |
 * |-------|-----------|----------------|
 * | `authPort` | AuthPort | SupabaseAuthAdapter |
 * | `telemetryPort` | TelemetryPort | PrismaTelemetryAdapter |
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
  AuthenticateUserUseCase,
  AuthorizeAdminUseCase,
  AuthorizeModeratorUseCase,
  LogTelemetryUseCase,
} from "@mirai-app/use-cases/interactors";

// =============================================================================
// Adapter Imports
// =============================================================================

import { SupabaseAuthAdapter } from "../gateways/SupabaseAuthAdapter";
import { PrismaTelemetryAdapter } from "../gateways/PrismaTelemetryAdapter";
import { TokenExtractor } from "../utils/TokenExtractor";

// =============================================================================
// Type Imports
// =============================================================================

import type { AuthPort, TelemetryPort } from "@mirai-app/use-cases";
import type { PrismaClient } from "@mirai-app/frameworks/prisma";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";

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
  TelemetryPort: "telemetryPort",
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
 * Create SupabaseAuthAdapter instance
 */
function createSupabaseAuthAdapter(cradle: Cradle): AuthPort {
  return new SupabaseAuthAdapter(
    cradle.supabase as SupabaseClient,
    cradle.prisma as PrismaClient,
  );
}

/**
 * Create PrismaTelemetryAdapter instance
 */
function createPrismaTelemetryAdapter(cradle: Cradle): TelemetryPort {
  return new PrismaTelemetryAdapter(cradle.prisma as PrismaClient);
}

/**
 * Create AuthenticateUserUseCase instance
 */
function createAuthenticateUserUseCase(
  cradle: Cradle,
): AuthenticateUserUseCase {
  return new AuthenticateUserUseCase(cradle.authPort as AuthPort);
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
 * Create LogTelemetryUseCase instance
 */
function createLogTelemetryUseCase(cradle: Cradle): LogTelemetryUseCase {
  return new LogTelemetryUseCase(cradle.telemetryPort as TelemetryPort);
}

// =============================================================================
// Module Dependencies Type
// =============================================================================

export interface UseCaseModuleDeps {
  /** Authentication port - Supabase implementation */
  [PORT_TOKENS.AuthPort]: AuthPort;

  /** Telemetry port - Prisma implementation */
  [PORT_TOKENS.TelemetryPort]: TelemetryPort;

  /** Token extraction utility */
  [UTILITY_TOKENS.TokenExtractor]: typeof TokenExtractor;

  /** Authenticate user use case */
  [AUTH_USE_CASE_TOKENS.AuthenticateUserUseCase]: AuthenticateUserUseCase;

  /** Authorize admin use case */
  [AUTH_USE_CASE_TOKENS.AuthorizeAdminUseCase]: AuthorizeAdminUseCase;

  /** Authorize moderator use case */
  [AUTH_USE_CASE_TOKENS.AuthorizeModeratorUseCase]: AuthorizeModeratorUseCase;

  /** Log telemetry use case */
  [AUTH_USE_CASE_TOKENS.LogTelemetryUseCase]: LogTelemetryUseCase;
}

// =============================================================================
// Module Definition Type
// =============================================================================

export interface UseCaseModuleDef {
  name: "UseCaseModule";
  providers: Record<string, object | string | boolean | number>;
  exports: string[];
}

// =============================================================================
// Module Creation
// =============================================================================

/**
 * UseCaseModule - Static module for auth and telemetry use cases
 *
 * This module provides:
 * 1. Port implementations (SupabaseAuthAdapter, PrismaTelemetryAdapter)
 * 2. Factory registrations for auth/telemetry use cases
 * 3. TokenExtractor utility for HTTP header parsing
 *
 * ## Lifetime Strategy
 *
 * | Provider | Lifetime | Rationale |
 * |----------|----------|-----------|
 * | authPort | SCOPED | Request-scoped auth with Supabase client |
 * | telemetryPort | SCOPED | Request-scoped Prisma client |
 * | tokenExtractor | SINGLETON | Stateless utility |
 * | authenticateUserUseCase | SCOPED | Uses request-scoped port |
 * | authorizeAdminUseCase | SINGLETON | Pure logic, no dependencies |
 * | authorizeModeratorUseCase | SINGLETON | Pure logic, no dependencies |
 * | logTelemetryUseCase | SCOPED | Uses request-scoped port |
 *
 * ## DI Graph
 *
 * ```
 * AppModule
 * ├── UseCaseModule (this module)
 * │   ├── authPort ← SupabaseAuthAdapter
 * │   ├── telemetryPort ← PrismaTelemetryAdapter
 * │   ├── tokenExtractor (utility)
 * │   ├── authenticateUserUseCase (depends on authPort)
 * │   ├── authorizeAdminUseCase (no deps)
 * │   ├── authorizeModeratorUseCase (no deps)
 * │   └── logTelemetryUseCase (depends on telemetryPort)
 * ```
 */
export const UseCaseModule: StaticModule<UseCaseModuleDef> =
  createStaticModule<UseCaseModuleDef>({
    name: "UseCaseModule",

    providers: {
      // =================================================================
      // Port Implementations
      // =================================================================

      /**
       * AuthPort - Supabase implementation
       * SCOPED lifetime for request-scoped Supabase client
       */
      [PORT_TOKENS.AuthPort]: {
        factory: createSupabaseAuthAdapter,
        lifetime: Lifetime.SCOPED,
      },

      /**
       * TelemetryPort - Prisma implementation
       * SCOPED lifetime for request-scoped Prisma client
       */
      [PORT_TOKENS.TelemetryPort]: {
        factory: createPrismaTelemetryAdapter,
        lifetime: Lifetime.SCOPED,
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
       * SCOPED lifetime because it depends on request-scoped telemetryPort.
       */
      [AUTH_USE_CASE_TOKENS.LogTelemetryUseCase]: {
        factory: createLogTelemetryUseCase,
        lifetime: Lifetime.SCOPED,
      },
    },

    exports: [
      // Ports
      PORT_TOKENS.AuthPort,
      PORT_TOKENS.TelemetryPort,

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
