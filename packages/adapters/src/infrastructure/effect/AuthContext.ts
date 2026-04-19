/**
 * @mirai-app/adapters/infrastructure/effect - Effect-based utilities and context patterns
 *
 * This module provides Effect Context patterns and utilities for the adapters layer.
 * Contains AuthContext and other context types for dependency injection and workflow state.
 *
 * ## Usage
 *
 * ### AuthContext - Authentication state in Effect workflows
 * ```typescript
 * import { AuthContextTag, type AuthContext } from "../infrastructure/effect";
 * import { Effect } from "effect";
 *
 * const program = Effect.gen(function* () {
 *   const authCtx = yield* AuthContextTag;
 *
 *   if (!authCtx.isAuthenticated) {
 *     return yield* Effect.fail(new UnauthorizedError({}));
 *   }
 *
 *   // Access user info
 *   console.log(authCtx.userId, authCtx.role);
 *
 *   // Check trip-specific role
 *   const tripRole = authCtx.tripRoles[tripId];
 *   return tripRole === "LEADER";
 * });
 * ```
 *
 * ### Providing AuthContext in tests
 * ```typescript
 * import { Layer, Effect } from "effect";
 * import { AuthContextTag, type AuthContext } from "../infrastructure/effect";
 *
 * const mockAuthContext: AuthContext = {
 *   userId: "user-123",
 *   role: "USER",
 *   tripRoles: { "trip-456": "LEADER" },
 *   isAuthenticated: true,
 *   accessToken: "jwt-token"
 * };
 *
 * const authLayer = Layer.succeed(AuthContextTag, mockAuthContext);
 *
 * const result = await Effect.runPromise(
 *   program.pipe(Effect.provide(authLayer))
 * );
 * ```
 */

import { Context } from "effect";
import type { Role } from "@mirai-app/domain";

/**
 * TripRole - Role of a user within a specific trip
 *
 * Used in tripRoles map to track user's permissions per trip
 */
export type TripRole = "MEMBER" | "LEADER";

/**
 * AuthContext - Authentication context for Effect workflows
 *
 * Carries authentication state and user information through Effect workflows.
 * Access via `yield* AuthContextTag` in Effect.gen blocks.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const authCtx = yield* AuthContextTag;
 *
 *   if (!authCtx.isAuthenticated) {
 *     return yield* Effect.fail(new UnauthorizedError({}));
 *   }
 *
 *   // Check trip-specific role
 *   const tripRole = authCtx.tripRoles[tripId];
 *   if (tripRole !== "LEADER") {
 *     return yield* Effect.fail(new PermissionDeniedError({}));
 *   }
 *
 *   return yield* performProtectedOperation(authCtx.userId);
 * });
 * ```
 */
export interface AuthContext {
  /**
   * User ID of the authenticated user
   * Empty string when not authenticated
   */
  readonly userId: string;

  /**
   * Global role of the user (USER, ADMIN, MODERATOR, SERVICE)
   */
  readonly role: Role;

  /**
   * Map of tripId to user's role within that trip
   * Used for trip-scoped authorization decisions
   */
  readonly tripRoles: Record<string, TripRole>;

  /**
   * Whether the user is currently authenticated
   */
  readonly isAuthenticated: boolean;

  /**
   * Access token for operations that need it (optional)
   * e.g., for external API calls requiring JWT
   */
  readonly accessToken?: string;
}

/**
 * AuthContextTag - Effect Context.Tag for AuthContext
 *
 * Use this tag to access authentication context in Effect workflows:
 *   const authCtx = yield* AuthContextTag;
 *
 * The AuthContext provides:
 * - userId: Current user identifier
 * - role: Global user role
 * - tripRoles: Trip-specific role mappings
 * - isAuthenticated: Authentication status
 * - accessToken: Optional JWT for external service calls
 */
export class AuthContextTag extends Context.Tag("AuthContext")<
  AuthContextTag,
  AuthContext
>() {}

/**
 * Helper type for extracting AuthContext from Effect workflows
 */
export type { AuthContext as IAuthContext };
