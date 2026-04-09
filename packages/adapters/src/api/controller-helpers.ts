/**
 * tRPC Controller Auth Helpers
 *
 * Utilities for handling authentication and authorization in tRPC controllers.
 * These helpers extract tokens from HTTP headers and use use cases for auth.
 *
 * @module controller-helpers
 */

import { TRPCError } from "@trpc/server";
import { TokenExtractor } from "../utils/TokenExtractor";
import type { DIContext } from "./trpc";
import type {
  AuthenticateUserUseCase,
  AuthorizeAdminUseCase,
  AuthorizeModeratorUseCase,
} from "@mirai-app/use-cases";
import type { AuthContext } from "@mirai-app/domain";
import type { Result } from "@mirai-app/domain";

/**
 * Extract and validate authentication token from request headers
 *
 * @param headers - HTTP headers from tRPC context
 * @param di - Dependency injection context
 * @returns AuthContext if authentication succeeds
 * @throws TRPCError with UNAUTHORIZED code if authentication fails
 *
 * @example
 * ```typescript
 * const authContext = await requireAuth(ctx.headers, ctx.di);
 * // Now you can use authContext.userId, authContext.role, etc.
 * ```
 */
export async function requireAuth(
  headers: Headers,
  di: DIContext,
): Promise<AuthContext> {
  // Extract token from HTTP headers
  const authHeader =
    headers.get("authorization") ?? headers.get("Authorization");
  const token = TokenExtractor.extract(authHeader);

  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message:
        "Authentication required. Provide a Bearer token in the Authorization header.",
    });
  }

  // Authenticate via use case
  const authUseCase = di.resolve<AuthenticateUserUseCase>(
    "authenticateUserUseCase",
  );
  const authResult: Result<AuthContext, Error> = await authUseCase.execute({
    token,
  });

  if (authResult.kind === "err") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: authResult.error.message,
    });
  }

  return authResult.value;
}

/**
 * Require admin role for the current request
 *
 * @param headers - HTTP headers from tRPC context
 * @param di - Dependency injection context
 * @returns AuthContext if authentication and authorization succeed
 * @throws TRPCError with UNAUTHORIZED or FORBIDDEN code if checks fail
 *
 * @example
 * ```typescript
 * const authContext = await requireAdmin(ctx.headers, ctx.di);
 * // User is authenticated and has admin role
 * ```
 */
export async function requireAdmin(
  headers: Headers,
  di: DIContext,
): Promise<AuthContext> {
  const authContext = await requireAuth(headers, di);

  const authorizeUseCase = di.resolve<AuthorizeAdminUseCase>(
    "authorizeAdminUseCase",
  );
  const authzResult = authorizeUseCase.execute({
    authContext,
    resource: "admin resource",
    action: "access",
  });

  if (authzResult.kind === "err") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: authzResult.error.message,
    });
  }

  return authContext;
}

/**
 * Require moderator or admin role for the current request
 *
 * @param headers - HTTP headers from tRPC context
 * @param di - Dependency injection context
 * @returns AuthContext if authentication and authorization succeed
 * @throws TRPCError with UNAUTHORIZED or FORBIDDEN code if checks fail
 *
 * @example
 * ```typescript
 * const authContext = await requireModerator(ctx.headers, ctx.di);
 * // User is authenticated and has moderator or admin role
 * ```
 */
export async function requireModerator(
  headers: Headers,
  di: DIContext,
): Promise<AuthContext> {
  const authContext = await requireAuth(headers, di);

  const authorizeUseCase = di.resolve<AuthorizeModeratorUseCase>(
    "authorizeModeratorUseCase",
  );
  const authzResult = authorizeUseCase.execute({
    authContext,
    resource: "moderator resource",
    action: "access",
  });

  if (authzResult.kind === "err") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: authzResult.error.message,
    });
  }

  return authContext;
}

/**
 * Get user ID from auth context or null if not authenticated
 *
 * This is a softer version of requireAuth that returns null instead of throwing
 * for anonymous requests.
 *
 * @param headers - HTTP headers from tRPC context
 * @param di - Dependency injection context
 * @returns AuthContext if authenticated, null otherwise
 *
 * @example
 * ```typescript
 * const authContext = await getOptionalAuth(ctx.headers, ctx.di);
 * if (authContext) {
 *   // User is authenticated
 *   console.log(authContext.userId);
 * } else {
 *   // Anonymous request
 * }
 * ```
 */
export async function getOptionalAuth(
  headers: Headers,
  di: DIContext,
): Promise<AuthContext | null> {
  // Extract token from HTTP headers
  const authHeader =
    headers.get("authorization") ?? headers.get("Authorization");
  const token = TokenExtractor.extract(authHeader);

  if (!token) {
    return null;
  }

  try {
    // Authenticate via use case
    const authUseCase = di.resolve<AuthenticateUserUseCase>(
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
