/**
 * GraphQL Auth Helpers
 *
 * Utilities for handling authentication and authorization in GraphQL resolvers.
 * Provides both traditional async functions and Effect-based versions for
 * seamless integration with the Effect framework.
 *
 * ## Usage
 *
 * ### Traditional Async (backward compatible)
 * ```typescript
 * const authContext = await requireAuth(context);
 * ```
 *
 * ### Effect-based (recommended for new code)
 * ```typescript
 * const authEffect = requireAuthEffect(context);
 * const authContext = yield* authEffect;
 * ```
 *
 * @module auth-helpers
 */

// Context type derived from PothosTypes
import type { PothosTypes } from "../builder";
import type { GraphQLContext } from "../context";
type Context = PothosTypes["Context"];
import type { AuthContext as DomainAuthContext } from "@mirai-app/domain";
import { TokenExtractor } from "@mirai-app/adapters";
import {
  throwUnauthenticated,
  throwForbidden,
  mapErrorToGraphQL,
  type GraphQLErrorCode,
} from "./error-mapper";
import { Effect, Data } from "effect";
import { GraphQLError } from "graphql";

// =============================================================================
// Error Types for Effect
// =============================================================================

/**
 * Authentication error for Effect-based workflows
 */
export class AuthError extends Data.TaggedError("AuthError")<{
  message: string;
  code: GraphQLErrorCode;
}> {}

/**
 * Authorization error for Effect-based workflows
 */
export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  message: string;
  code: GraphQLErrorCode;
}> {}

// =============================================================================
// Traditional Async Helpers (Backward Compatible)
// =============================================================================

export async function requireAuth(
  context: Context,
): Promise<DomainAuthContext> {
  const headers = context.request.headers;
  const authHeader =
    headers.get("authorization") ?? headers.get("Authorization");
  const token = TokenExtractor.extract(authHeader);

  if (!token) {
    throwUnauthenticated(
      "Authentication required. Provide a Bearer token in the Authorization header.",
    );
  }

  const authPort =
    context.container.resolve<
      import("@mirai-app/use-cases/ports/AuthPort").AuthPort
    >("authPort");

  // Use Effect to validate token
  const effect = authPort.validateToken(token);
  const result = await import("effect").then(({ Effect }) =>
    Effect.runPromise(Effect.either(effect)),
  );

  if (result._tag === "Left") {
    throwUnauthenticated(result.left.message);
  }

  return result.right;
}

/**
 * Require admin role for the current request
 */
export async function requireAdmin(
  context: Context,
): Promise<DomainAuthContext> {
  const authContext = await requireAuth(context);

  if (authContext.role !== "ADMIN") {
    throwForbidden("Admin access required");
  }

  return authContext;
}

/**
 * Require moderator or admin role for the current request
 */
export async function requireModerator(
  context: Context,
): Promise<DomainAuthContext> {
  const authContext = await requireAuth(context);

  if (authContext.role !== "ADMIN" && authContext.role !== "MODERATOR") {
    throwForbidden("Moderator access required");
  }

  return authContext;
}

/**
 * Get user ID from auth context or null if not authenticated
 */
export async function getOptionalAuth(
  context: Context,
): Promise<DomainAuthContext | null> {
  const headers = context.request.headers;
  const authHeader =
    headers.get("authorization") ?? headers.get("Authorization");
  const token = TokenExtractor.extract(authHeader);

  if (!token) {
    return null;
  }

  try {
    const authPort =
      context.container.resolve<
        (
          token: string,
        ) => Promise<
          | { kind: "ok"; value: DomainAuthContext }
          | { kind: "err"; error: Error }
        >
      >("authPort");
    const result = await authPort(token);
    if (result.kind === "err") {
      return null;
    }
    return result.value;
  } catch {
    return null;
  }
}

/**
 * Check if the current user is authenticated (returns boolean)
 */
export async function isAuthenticated(context: Context): Promise<boolean> {
  const authContext = await getOptionalAuth(context);
  return authContext !== null;
}

/**
 * Get the current user's ID, or throw if not authenticated
 */
export async function getCurrentUserId(context: Context): Promise<string> {
  const authContext = await requireAuth(context);
  return authContext.userId as string;
}

// =============================================================================
// Effect-based Helpers (Recommended for New Code)
// =============================================================================

/**
 * Require authentication for the current request (Effect version)
 *
 * Returns an Effect that resolves to AuthContext or fails with AuthError.
 * Use this in Effect.gen workflows for composable authentication.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const authContext = yield* requireAuthEffect(graphqlContext);
 *   // ... use authContext
 * });
 * ```
 */
export function requireAuthEffect(
  context: GraphQLContext,
): Effect.Effect<DomainAuthContext, AuthError, never> {
  return Effect.gen(function* () {
    const headers = context.request.headers;
    const authHeader =
      headers.get("authorization") ?? headers.get("Authorization");
    const token = TokenExtractor.extract(authHeader);

    if (!token) {
      return yield* Effect.fail(
        new AuthError({
          message:
            "Authentication required. Provide a Bearer token in the Authorization header.",
          code: "UNAUTHENTICATED",
        }),
      );
    }

    const authPort =
      context.container.resolve<
        (
          token: string,
        ) => Promise<
          | { kind: "ok"; value: DomainAuthContext }
          | { kind: "err"; error: Error }
        >
      >("authPort");

    const result = yield* Effect.tryPromise(() => authPort(token));

    if (result.kind === "err") {
      return yield* Effect.fail(
        new AuthError({
          message: result.error.message,
          code: "UNAUTHENTICATED",
        }),
      );
    }

    return result.value;
  });
}

/**
 * Require admin role for the current request (Effect version)
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const authContext = yield* requireAdminEffect(graphqlContext);
 *   // ... use admin context
 * });
 * ```
 */
export function requireAdminEffect(
  context: GraphQLContext,
): Effect.Effect<DomainAuthContext, AuthError | ForbiddenError, never> {
  return Effect.gen(function* () {
    const authContext = yield* requireAuthEffect(context);

    if (authContext.role !== "ADMIN" && authContext.role !== "SERVICE") {
      return yield* Effect.fail(
        new ForbiddenError({
          message: "Admin access required",
          code: "FORBIDDEN",
        }),
      );
    }

    return authContext;
  });
}

/**
 * Require moderator or admin role for the current request (Effect version)
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const authContext = yield* requireModeratorEffect(graphqlContext);
 *   // ... use moderator context
 * });
 * ```
 */
export function requireModeratorEffect(
  context: GraphQLContext,
): Effect.Effect<DomainAuthContext, AuthError | ForbiddenError, never> {
  return Effect.gen(function* () {
    const authContext = yield* requireAuthEffect(context);

    if (
      authContext.role !== "ADMIN" &&
      authContext.role !== "MODERATOR" &&
      authContext.role !== "SERVICE"
    ) {
      return yield* Effect.fail(
        new ForbiddenError({
          message: "Moderator access required",
          code: "FORBIDDEN",
        }),
      );
    }

    return authContext;
  });
}

/**
 * Get optional auth context without requiring it (Effect version)
 *
 * Returns an Effect that resolves to AuthContext or null.
 * Never fails - returns null for unauthenticated requests.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const maybeAuth = yield* getOptionalAuthEffect(graphqlContext);
 *   if (maybeAuth) {
 *     // User is authenticated
 *   }
 * });
 * ```
 */
export function getOptionalAuthEffect(
  context: GraphQLContext,
): Effect.Effect<DomainAuthContext | null, never, never> {
  return Effect.gen(function* () {
    const headers = context.request.headers;
    const authHeader =
      headers.get("authorization") ?? headers.get("Authorization");
    const token = TokenExtractor.extract(authHeader);

    if (!token) {
      return null;
    }

    const authPort =
      context.container.resolve<
        (
          token: string,
        ) => Promise<
          | { kind: "ok"; value: DomainAuthContext }
          | { kind: "err"; error: Error }
        >
      >("authPort");

    const result = yield* Effect.tryPromise(() => authPort(token)).pipe(
      Effect.either,
    );

    if (result._tag === "Left") {
      return null;
    }

    if (result.right.kind === "err") {
      return null;
    }

    return result.right.value;
  });
}

/**
 * Check if the current user is authenticated (Effect version)
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const isAuth = yield* isAuthenticatedEffect(graphqlContext);
 *   // ... use boolean result
 * });
 * ```
 */
export function isAuthenticatedEffect(
  context: GraphQLContext,
): Effect.Effect<boolean, never, never> {
  return Effect.gen(function* () {
    const authContext = yield* getOptionalAuthEffect(context);
    return authContext !== null;
  });
}

/**
 * Get the current user's ID, or fail if not authenticated (Effect version)
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const userId = yield* getCurrentUserIdEffect(graphqlContext);
 *   // ... use userId
 * });
 * ```
 */
export function getCurrentUserIdEffect(
  context: GraphQLContext,
): Effect.Effect<string, AuthError, never> {
  return Effect.gen(function* () {
    const authContext = yield* requireAuthEffect(context);
    return authContext.userId as string;
  });
}

// =============================================================================
// Effect-to-GraphQL Error Conversion
// =============================================================================

/**
 * Convert Effect error to GraphQL error
 *
 * Helper function to map Effect errors to GraphQL errors for resolver responses.
 *
 * @example
 * ```typescript
 * const result = await Effect.runPromise(
 *   Effect.either(program)
 * );
 *
 * if (result._tag === "Left") {
 *   throw mapEffectErrorToGraphQL(result.left);
 * }
 * ```
 */
export function mapEffectErrorToGraphQL(error: unknown): GraphQLError {
  if (error instanceof AuthError) {
    return new GraphQLError(error.message, {
      extensions: { code: error.code },
    });
  }

  if (error instanceof ForbiddenError) {
    return new GraphQLError(error.message, {
      extensions: { code: error.code },
    });
  }

  // Fall back to generic error mapper
  return mapErrorToGraphQL(error);
}
