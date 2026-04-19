/**
 * Auth Layer Composition
 *
 * Composes the authentication and authorization gateways into Effect Layers.
 * Located in frameworks/di because this is DI wiring logic that binds
 * the adapter implementations to the use-cases layer Context.Tags.
 *
 * This module provides:
 * - makeAuthNLayer: Authentication using Better Auth (JWT validation, sign in/out)
 * - makeAuthZLayer: Authorization (Role-based permissions)
 * - makeAuthLayer: Convenience function merging both
 */

import { Layer } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { createBetterAuth } from "@mirai-app/frameworks/better-auth";
import { AuthNPortTag, AuthZPortTag } from "@mirai-app/use-cases";
import { BetterAuthGateway, UserDrizzleGateway } from "@mirai-app/adapters";

/**
 * Configuration for creating the AuthN Layer with Better Auth
 */
export interface AuthNLayerConfig {
  /** Drizzle database client for Better Auth */
  db: DrizzleDb;
  /** Better Auth secret key (falls back to BETTER_AUTH_SECRET env var) */
  betterAuthSecret?: string;
  /** Better Auth base URL (falls back to BETTER_AUTH_URL env var) */
  betterAuthUrl?: string;
}

/**
 * Configuration for creating the AuthZ Layer
 */
export interface AuthZLayerConfig {
  /** Drizzle database client for role and permission lookups */
  db: DrizzleDb;
}

/**
 * Configuration for creating the combined auth Layer
 */
export interface AuthLayerConfig {
  /** Drizzle database client for Better Auth and authorization */
  db: DrizzleDb;
  /** Better Auth secret key (falls back to BETTER_AUTH_SECRET env var) */
  betterAuthSecret?: string;
  /** Better Auth base URL (falls back to BETTER_AUTH_URL env var) */
  betterAuthUrl?: string;
}

/**
 * Creates the AuthN (Authentication) Layer using Better Auth.
 *
 * Provides AuthNPortTag for authentication operations:
 * - Session management (getSession, signIn, signOut)
 * - Token validation and refresh
 *
 * @example
 * ```typescript
 * const authNLayer = makeAuthNLayer({ db });
 *
 * const program = Effect.gen(function* () {
 *   const authN = yield* AuthNPortTag;
 *   return yield* authN.getSession();
 * }).pipe(Effect.provide(authNLayer));
 * ```
 */
export const makeAuthNLayer = (config: AuthNLayerConfig) => {
  const betterAuth = createBetterAuth(config.db, {
    secret: config.betterAuthSecret,
    baseUrl: config.betterAuthUrl,
  });
  const gateway = new BetterAuthGateway(betterAuth);
  return Layer.succeed(AuthNPortTag, gateway);
};

/**
 * Creates the AuthZ (Authorization) Layer.
 *
 * Provides AuthZPortTag for authorization operations:
 * - verifyAccess for resource-level permission checks
 * - checkRolePermission for role-based access control
 *
 * @example
 * ```typescript
 * const authZLayer = makeAuthZLayer({ db });
 *
 * const program = Effect.gen(function* () {
 *   const authZ = yield* AuthZPortTag;
 *   return yield* authZ.verifyAccess({
 *     token: "jwt-token",
 *     resourceType: "trip",
 *     resourceId: "trip-123",
 *     requiredPermission: "write"
 *   });
 * }).pipe(Effect.provide(authZLayer));
 * ```
 */
export const makeAuthZLayer = (config: AuthZLayerConfig) => {
  const gateway = new UserDrizzleGateway(config.db);
  return Layer.succeed(AuthZPortTag, gateway);
};

/**
 * Creates the combined Auth service Layer.
 *
 * Merges both AuthN and AuthZ layers into a single layer.
 *
 * @example
 * ```typescript
 * const authLayer = makeAuthLayer({ db });
 *
 * const program = Effect.gen(function* () {
 *   const authN = yield* AuthNPortTag;
 *   const authZ = yield* AuthZPortTag;
 *   // ... use both auth ports
 * }).pipe(Effect.provide(authLayer));
 * ```
 */
export const makeAuthLayer = (config: AuthLayerConfig) => {
  const authNLayer = makeAuthNLayer({
    db: config.db,
    betterAuthSecret: config.betterAuthSecret,
    betterAuthUrl: config.betterAuthUrl,
  });
  const authZLayer = makeAuthZLayer({ db: config.db });
  return Layer.mergeAll(authNLayer, authZLayer);
};
