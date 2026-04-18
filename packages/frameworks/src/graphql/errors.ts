import { builder } from "./builder.js";
import type { GraphQLContext } from "./context.js";

/**
 * Base error interface
 */
export interface GraphQLError {
  message: string;
  code: string;
  extensions?: Record<string, unknown>;
}

/**
 * Map domain/use-case errors to GraphQL errors
 */
export function mapErrorToGraphQL(error: unknown): GraphQLError {
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes("UNAUTHENTICATED")) {
      return {
        message: error.message.replace("UNAUTHENTICATED: ", ""),
        code: "UNAUTHENTICATED",
      };
    }
    if (error.message.includes("FORBIDDEN")) {
      return {
        message: error.message.replace("FORBIDDEN: ", ""),
        code: "FORBIDDEN",
      };
    }
    if (error.message.includes("NOT_FOUND")) {
      return {
        message: error.message.replace("NOT_FOUND: ", ""),
        code: "NOT_FOUND",
      };
    }
    if (error.message.includes("BAD_REQUEST")) {
      return {
        message: error.message.replace("BAD_REQUEST: ", ""),
        code: "BAD_USER_INPUT",
      };
    }
    if (error.message.includes("CONFLICT")) {
      return {
        message: error.message.replace("CONFLICT: ", ""),
        code: "CONFLICT",
      };
    }
  }

  // Default internal error
  return {
    message: error instanceof Error ? error.message : "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  };
}

/**
 * Error extensions type
 */
export interface ErrorExtensions {
  code: string;
  [key: string]: unknown;
}

/**
 * Create GraphQL error with extensions
 */
export function createGraphQLError(
  message: string,
  code: string,
  extensions?: Record<string, unknown>,
): Error {
  const error = new Error(message);
  (error as Error & { extensions: ErrorExtensions }).extensions = {
    code,
    ...extensions,
  };
  return error;
}

/**
 * Not found error helper
 */
export function notFoundError(resource: string, id?: string): Error {
  return createGraphQLError(
    `${resource} not found${id ? `: ${id}` : ""}`,
    "NOT_FOUND",
    { resource, id },
  );
}

/**
 * Bad request error helper
 */
export function badRequestError(message: string): Error {
  return createGraphQLError(message, "BAD_USER_INPUT");
}

/**
 * Forbidden error helper
 */
export function forbiddenError(message = "Access denied"): Error {
  return createGraphQLError(message, "FORBIDDEN");
}

/**
 * Unauthorized error helper
 */
export function unauthorizedError(message = "Authentication required"): Error {
  return createGraphQLError(message, "UNAUTHENTICATED");
}

/**
 * Conflict error helper
 */
export function conflictError(message: string): Error {
  return createGraphQLError(message, "CONFLICT");
}

// =============================================================================
// Error Result Types
// =============================================================================

/**
 * Error result type for mutations that can fail
 */
export const ErrorResult = builder.objectType("ErrorResult", {
  description: "Error result from a mutation",
  fields: (t) => ({
    message: t.exposeString("message"),
    code: t.exposeString("code"),
  }),
});



/**
 * Mutation result union helper
 */
export interface MutationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Standard mutation response type
 */
export interface MutationResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}
