import { GraphQLError } from "graphql";
import type { GraphQLContext } from "./context";

/**
 * Standard GraphQL error codes
 * Following the GraphQL spec and common conventions
 */
export type GraphQLErrorCode =
  | "INTERNAL_SERVER_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "SERVICE_UNAVAILABLE"
  | "BAD_USER_INPUT";

/**
 * GraphQL error extensions
 * Additional metadata attached to errors
 */
export interface GraphQLErrorExtensions {
  code: GraphQLErrorCode;
  requestId?: string;
  path?: string[];
  timestamp?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Create a GraphQL error with standard extensions
 *
 * @param message - Error message
 * @param code - Error code
 * @param context - GraphQL context for request ID
 * @param details - Additional error details
 * @returns GraphQLError
 */
export function createGraphQLError(
  message: string,
  code: GraphQLErrorCode,
  context?: GraphQLContext,
  details?: Record<string, unknown>,
): GraphQLError {
  const extensions: Record<string, unknown> = {
    code,
    ...(context && {
      requestId: context.requestId,
      timestamp: context.requestTime.toISOString(),
    }),
    ...(details && { details }),
  };

  return new GraphQLError(message, { extensions });
}

/**
 * Format an error for the response
 * Removes sensitive information in production
 *
 * @param error - The original error
 * @param isDevelopment - Whether in development mode
 * @returns Formatted error
 */
export function formatError(
  error: Error & { extensions?: Record<string, unknown> },
  isDevelopment: boolean,
): Error & { extensions?: Record<string, unknown> } {
  // In production, hide internal details for server errors
  if (!isDevelopment) {
    const code = error.extensions?.code as GraphQLErrorCode | undefined;
    if (code === "INTERNAL_SERVER_ERROR") {
      const formatted = new Error("Internal server error");
      (
        formatted as Error & { extensions?: Record<string, unknown> }
      ).extensions = {
        code: "INTERNAL_SERVER_ERROR",
        requestId: error.extensions?.requestId,
      };
      return formatted as Error & { extensions?: Record<string, unknown> };
    }
  }

  return error;
}

/**
 * Map domain errors to GraphQL errors
 * Converts domain-specific errors to standard GraphQL error format
 *
 * @param error - Domain error
 * @param context - GraphQL context
 * @returns GraphQLError
 */
export function mapDomainErrorToGraphQL(
  error: { _tag: string; message?: string },
  context: GraphQLContext,
): GraphQLError {
  const codeMap: Record<string, GraphQLErrorCode> = {
    NotFoundError: "NOT_FOUND",
    ValidationError: "VALIDATION_ERROR",
    UnauthorizedError: "UNAUTHENTICATED",
    ForbiddenError: "FORBIDDEN",
    ConflictError: "CONFLICT",
    RateLimitError: "RATE_LIMITED",
    TimeoutError: "TIMEOUT",
  };

  const code = codeMap[error._tag] ?? "INTERNAL_SERVER_ERROR";

  return createGraphQLError(
    error.message ?? `Error: ${error._tag}`,
    code,
    context,
    { originalTag: error._tag },
  );
}

/**
 * Error codes for common scenarios
 */
export const ErrorCodes = {
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR" as const,
  BAD_REQUEST: "BAD_REQUEST" as const,
  UNAUTHENTICATED: "UNAUTHENTICATED" as const,
  FORBIDDEN: "FORBIDDEN" as const,
  NOT_FOUND: "NOT_FOUND" as const,
  CONFLICT: "CONFLICT" as const,
  VALIDATION_ERROR: "VALIDATION_ERROR" as const,
  RATE_LIMITED: "RATE_LIMITED" as const,
  TIMEOUT: "TIMEOUT" as const,
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE" as const,
  BAD_USER_INPUT: "BAD_USER_INPUT" as const,
};
