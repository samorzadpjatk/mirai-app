/**
 * @mirai-app/frameworks/effect - Effect-based utilities and context patterns
 *
 * This module provides Effect Context patterns and utilities for the frameworks layer.
 * Contains AuthContext and other context types for dependency injection and workflow state.
 *
 * ## Usage
 *
 * ### AuthContext - Authentication state in Effect workflows
 * ```typescript
 * import { AuthContextTag, type AuthContext } from "@mirai-app/frameworks/effect";
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
 * import { AuthContextTag, type AuthContext } from "@mirai-app/frameworks/effect";
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

// =============================================================================
// AuthContext - Authentication context for Effect workflows
// =============================================================================

export {
  AuthContextTag,
  type AuthContext,
  type TripRole,
  type IAuthContext,
} from "./AuthContext";
