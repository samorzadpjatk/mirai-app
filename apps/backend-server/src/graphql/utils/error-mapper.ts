/**
 * GraphQL Error Mapper
 *
 * Maps domain errors and use case errors to GraphQL errors.
 * Provides utilities for handling Result<T,E> types and converting
 * them to proper GraphQL error responses.
 *
 * @module error-mapper
 */

import { GraphQLError } from "graphql";
import type { Result } from "@mirai-app/domain";
import {
  isUseCaseError,
  type UseCaseError,
  getUseCaseErrorMessage,
  getUseCaseErrorCode,
} from "@mirai-app/use-cases";

// =============================================================================
// Error Codes
// =============================================================================

/**
 * GraphQL error codes matching common HTTP status semantics
 */
export type GraphQLErrorCode =
  | "UNAUTHENTICATED" // 401 - Authentication required
  | "FORBIDDEN" // 403 - Insufficient permissions
  | "NOT_FOUND" // 404 - Resource not found
  | "BAD_USER_INPUT" // 400 - Validation error
  | "INTERNAL_SERVER_ERROR" // 500 - Server error
  | "CONFLICT"; // 409 - Resource conflict

// =============================================================================
// Error Mapping Functions
// =============================================================================

/**
 * Map use case error code to GraphQL error code
 */
function mapUseCaseCodeToGraphQLCode(code: string): GraphQLErrorCode {
  switch (code) {
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "UNAUTHORIZED":
      return "UNAUTHENTICATED";
    case "CONFLICT":
      return "CONFLICT";
    case "VALIDATION_FAILED":
    case "INVALID_CREDENTIALS":
      return "BAD_USER_INPUT";
    case "REPOSITORY_ERROR":
    case "INSUFFICIENT_COINS":
    case "CHALLENGE_CLOSED":
    case "REWARD_OUT_OF_STOCK":
    case "OPERATION_NOT_ALLOWED":
    case "VOTING_ERROR":
    case "SUBMISSION_ERROR":
    case "USER_ALREADY_EXISTS":
      return "INTERNAL_SERVER_ERROR";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

/**
 * Map a domain error to a GraphQLError
 */
function mapErrorToGraphQL(error: unknown): GraphQLError {
  // Handle UseCaseError
  if (isUseCaseError(error)) {
    const useCaseError = error as UseCaseError;
    const code = mapUseCaseCodeToGraphQLCode(getUseCaseErrorCode(useCaseError));
    const message = getUseCaseErrorMessage(useCaseError);

    return new GraphQLError(message, {
      extensions: {
        code,
        originalCode: useCaseError.code,
        tag: useCaseError._tag,
      },
    });
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for common error patterns
    if (message.includes("not found")) {
      return new GraphQLError(error.message, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    if (
      message.includes("unauthorized") ||
      message.includes("unauthenticated")
    ) {
      return new GraphQLError(error.message, {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    if (message.includes("forbidden") || message.includes("permission")) {
      return new GraphQLError(error.message, {
        extensions: { code: "FORBIDDEN" },
      });
    }

    if (message.includes("validation") || message.includes("invalid")) {
      return new GraphQLError(error.message, {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    // Default to internal server error
    return new GraphQLError("Internal server error", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        originalMessage: error.message,
      },
    });
  }

  // Handle unknown errors
  return new GraphQLError("Internal server error", {
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });
}

// =============================================================================
// Result Handling
// =============================================================================

/**
 * Options for result handling
 */
export interface HandleResultOptions<T, R = T> {
  /** Transform the success value before returning */
  transform?: (value: T) => R;
}

/**
 * Handle a Result<T,E> and either return the value or throw GraphQL error
 *
 * @param result - The Result<T,E> to handle
 * @param options - Optional transformation function
 * @returns The success value or throws GraphQLError
 *
 * @example
 * ```typescript
 * const result = await useCase.execute(input);
 * return handleResult(result);
 *
 * // With transformation
 * const dto = handleResult(result, { transform: (user) => UserDTO.fromDomain(user) });
 * ```
 */
export function handleResult<T, E, R = T>(
  result: Result<T, E>,
  options?: HandleResultOptions<T, R>,
): R {
  if (result.kind === "err") {
    throw mapErrorToGraphQL(result.error);
  }

  return options?.transform
    ? options.transform(result.value)
    : (result.value as unknown as R);
}

/**
 * Handle a Result<T,E> with async transformation
 */
export async function handleResultAsync<T, E, R = T>(
  result: Result<T, E>,
  transform?: (value: T) => Promise<R>,
): Promise<R> {
  if (result.kind === "err") {
    throw mapErrorToGraphQL(result.error);
  }

  return transform
    ? await transform(result.value)
    : (result.value as unknown as R);
}

// =============================================================================
// Auth Error Helpers
// =============================================================================

/**
 * Throw an unauthenticated error
 */
export function throwUnauthenticated(message?: string): never {
  throw new GraphQLError(message ?? "Authentication required", {
    extensions: { code: "UNAUTHENTICATED" },
  });
}

/**
 * Throw a forbidden error
 */
export function throwForbidden(message?: string): never {
  throw new GraphQLError(message ?? "Insufficient permissions", {
    extensions: { code: "FORBIDDEN" },
  });
}

/**
 * Throw a not found error
 */
export function throwNotFound(resource?: string): never {
  throw new GraphQLError(
    resource ? `${resource} not found` : "Resource not found",
    {
      extensions: { code: "NOT_FOUND" },
    },
  );
}

/**
 * Throw a bad input error
 */
export function throwBadInput(message: string): never {
  throw new GraphQLError(message, {
    extensions: { code: "BAD_USER_INPUT" },
  });
}

// =============================================================================
// Error Assertions
// =============================================================================

/**
 * Assert that a value is not null/undefined, throw NOT_FOUND if it is
 */
export function assertFound<T>(
  value: T | null | undefined,
  resource?: string,
): T {
  if (value === null || value === undefined) {
    throwNotFound(resource);
  }
  return value;
}

/**
 * Assert that a condition is true, throw FORBIDDEN if false
 */
export function assertAuthorized(
  condition: boolean,
  message?: string,
): asserts condition {
  if (!condition) {
    throwForbidden(message);
  }
}

/**
 * Assert that a condition is true, throw BAD_USER_INPUT if false
 */
export function assertValid(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throwBadInput(message);
  }
}

// =============================================================================
// Export
// =============================================================================

export { mapErrorToGraphQL };
