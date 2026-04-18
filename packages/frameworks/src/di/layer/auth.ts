/**
 * Auth Layer Composition
 *
 * Composes the authentication and authorization gateways into Effect Layers.
 * Located in frameworks/di because this is DI wiring logic that binds
 * the adapter implementations to the use-cases layer Context.Tags.
 *
 * This module provides:
 * - makeAuthNLayer: Authentication (JWT validation, sign in/out)
 * - makeAuthZLayer: Authorization (Role-based permissions)
 * - makeAuthLayer: Convenience function merging both (backward compatibility)
 */

import { Layer } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { AuthNPortTag, AuthZPortTag } from "@mirai-app/use-cases";
import { SupabaseAuthGateway, UserDrizzleGateway } from "@mirai-app/adapters";

/**
 * Configuration for creating the AuthN Layer
 */
export interface AuthNLayerConfig {
  /** Supabase client for authentication operations */
  supabase: SupabaseClient;
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
 * @deprecated Use separate AuthNLayerConfig and AuthZLayerConfig for better separation
 */
export interface AuthLayerConfig {
  /** Supabase client for authentication operations */
  supabase: SupabaseClient;
  /** Drizzle database client for authorization operations */
  db: DrizzleDb;
}

/**
 * Creates the AuthN (Authentication) Layer.
 *
 * Provides AuthNPortTag for authentication operations:
 * - Session management (getSession, signIn, signOut)
 * - Token validation and refresh
 *
 * @example
 * ```typescript
 * const authNLayer = makeAuthNLayer({ supabase });
 *
 * const program = Effect.gen(function* () {
 *   const authN = yield* AuthNPortTag;
 *   return yield* authN.getSession();
 * }).pipe(Effect.provide(authNLayer));
 * ```
 */
export const makeAuthNLayer = (config: AuthNLayerConfig) => {
  const gateway = new SupabaseAuthGateway(config.supabase);
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
 * Creates the combined Auth service Layer (backward compatibility).
 *
 * Merges both AuthN and AuthZ layers into a single layer.
 * For new code, prefer using makeAuthNLayer and makeAuthZLayer separately
 * for better separation of concerns.
 *
 * @example
 * ```typescript
 * const authLayer = makeAuthLayer({ supabase, db });
 *
 * const program = Effect.gen(function* () {
 *   const authN = yield* AuthNPortTag;
 *   const authZ = yield* AuthZPortTag;
 *   // ... use both auth ports
 * }).pipe(Effect.provide(authLayer));
 * ```
 */
export const makeAuthLayer = (config: AuthLayerConfig) => {
  const authNLayer = makeAuthNLayer({ supabase: config.supabase });
  const authZLayer = makeAuthZLayer({ db: config.db });
  return Layer.mergeAll(authNLayer, authZLayer);
};
