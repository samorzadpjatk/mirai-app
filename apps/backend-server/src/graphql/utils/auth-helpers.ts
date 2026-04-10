/**
 * GraphQL Auth Helpers
 *
 * Utilities for handling authentication and authorization in GraphQL resolvers.
 * These helpers extract tokens from HTTP headers and use use cases for auth.
 *
 * @module auth-helpers
 */

// Context type derived from PothosTypes
import type { PothosTypes } from "../builder";
type Context = PothosTypes["Context"];
import type { AuthContext } from "@mirai-app/domain";
import type { Result } from "@mirai-app/domain";
import type {
  AuthenticateUserUseCase,
  AuthorizeAdminUseCase,
  AuthorizeModeratorUseCase,
} from "@mirai-app/use-cases";
import { TokenExtractor } from "@mirai-app/adapters";
import { throwUnauthenticated, throwForbidden } from "./error-mapper";

// =============================================================================
// Auth Context Extraction
// =============================================================================

/**
 * Extract and validate authentication token from request headers
 *
 * @param context - GraphQL context with container and request
 * @returns AuthContext if authentication succeeds
 * @throws GraphQLError with UNAUTHENTICATED code if authentication fails
 *
 * @example
 * ```typescript
 * const authContext = await requireAuth(context);
 * // Now you can use authContext.userId, authContext.role, etc.
 * ```
 */
export async function requireAuth(context: Context): Promise<AuthContext> {
  // Extract token from HTTP headers
  const headers = context.request.headers;
  const authHeader =
    headers.get("authorization") ?? headers.get("Authorization");
  const token = TokenExtractor.extract(authHeader);

  if (!token) {
    throwUnauthenticated(
      "Authentication required. Provide a Bearer token in the Authorization header.",
    );
  }

  // Authenticate via use case
  const authUseCase = context.container.resolve<AuthenticateUserUseCase>(
    "authenticateUserUseCase",
  );
  const authResult: Result<AuthContext, Error> = await authUseCase.execute({
    token,
  });

  if (authResult.kind === "err") {
    throwUnauthenticated(authResult.error.message);
  }

  return authResult.value;
}

/**
 * Require admin role for the current request
 *
 * @param context - GraphQL context with container and request
 * @returns AuthContext if authentication and authorization succeed
 * @throws GraphQLError with UNAUTHENTICATED or FORBIDDEN code if checks fail
 *
 * @example
 * ```typescript
 * const authContext = await requireAdmin(context);
 * // User is authenticated and has admin role
 * ```
 */
export async function requireAdmin(context: Context): Promise<AuthContext> {
  const authContext = await requireAuth(context);

  const authorizeUseCase = context.container.resolve<AuthorizeAdminUseCase>(
    "authorizeAdminUseCase",
  );
  const authzResult = authorizeUseCase.execute({
    authContext,
    resource: "admin resource",
    action: "access",
  });

  if (authzResult.kind === "err") {
    throwForbidden(authzResult.error.message);
  }

  return authContext;
}

/**
 * Require moderator or admin role for the current request
 *
 * @param context - GraphQL context with container and request
 * @returns AuthContext if authentication and authorization succeed
 * @throws GraphQLError with UNAUTHENTICATED or FORBIDDEN code if checks fail
 *
 * @example
 * ```typescript
 * const authContext = await requireModerator(context);
 * // User is authenticated and has moderator or admin role
 * ```
 */
export async function requireModerator(context: Context): Promise<AuthContext> {
  const authContext = await requireAuth(context);

  const authorizeUseCase = context.container.resolve<AuthorizeModeratorUseCase>(
    "authorizeModeratorUseCase",
  );
  const authzResult = authorizeUseCase.execute({
    authContext,
    resource: "moderator resource",
    action: "access",
  });

  if (authzResult.kind === "err") {
    throwForbidden(authzResult.error.message);
  }

  return authContext;
}

/**
 * Get user ID from auth context or null if not authenticated
 *
 * This is a softer version of requireAuth that returns null instead of throwing
 * for anonymous requests.
 *
 * @param context - GraphQL context with container and request
 * @returns AuthContext if authenticated, null otherwise
 *
 * @example
 * ```typescript
 * const authContext = await getOptionalAuth(context);
 * if (authContext) {
 *   // User is authenticated
 *   console.log(authContext.userId);
 * } else {
 *   // Anonymous request
 * }
 * ```
 */
export async function getOptionalAuth(
  context: Context,
): Promise<AuthContext | null> {
  // Extract token from HTTP headers
  const headers = context.request.headers;
  const authHeader =
    headers.get("authorization") ?? headers.get("Authorization");
  const token = TokenExtractor.extract(authHeader);

  if (!token) {
    return null;
  }

  try {
    // Authenticate via use case
    const authUseCase = context.container.resolve<AuthenticateUserUseCase>(
      "authenticateUserUseCase",
    );
    const authResult = await authUseCase.execute({ token });

    if (authResult.kind === "err") {
      return null;
    }

    return authResult.value;
  } catch {
    return null;
  }
}

/**
 * Check if the current user is authenticated (returns boolean)
 *
 * @param context - GraphQL context with container and request
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(context: Context): Promise<boolean> {
  const authContext = await getOptionalAuth(context);
  return authContext !== null;
}

/**
 * Get the current user's ID, or throw if not authenticated
 *
 * @param context - GraphQL context with container and request
 * @returns The user ID string
 * @throws GraphQLError with UNAUTHENTICATED if not authenticated
 */
export async function getCurrentUserId(context: Context): Promise<string> {
  const authContext = await requireAuth(context);
  return authContext.userId as string;
}
