/**
 * Effect Execution Utilities
 *
 * Provides utilities for executing Effects at adapter layer boundaries.
 * Bridges the gap between Effect-based use cases and HTTP/GraphQL controllers.
 *
 * Key features:
 * - Effect.runPromise wrappers for controller execution
 * - Error mapping to HTTP status codes (preserves existing contracts)
 * - Error mapping to GraphQL error formats (preserves existing contracts)
 * - Integration with controller-helpers.ts for backward compatibility
 *
 * @module effect-executor
 */

import { Effect } from "effect";
import { GraphQLError } from "graphql";
import type {
  DomainError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  InvariantError,
  InvalidStateError,
  ResourceUnavailableError,
  QuotaExceededError,
  StateTransitionError,
} from "@mirai-app/domain";
import {
  ApiError,
  UnauthorizedError as HttpUnauthorizedError,
  ForbiddenError as HttpForbiddenError,
  NotFoundError as HttpNotFoundError,
  BadRequestError as HttpBadRequestError,
} from "../api/errors";

// =============================================================================
// Effect Execution Wrappers
// =============================================================================

/**
 * Run an Effect and return the success value, throwing appropriate
 * HTTP errors on failure.
 *
 * This is the primary execution helper for HTTP controllers.
 * It preserves existing HTTP status code contracts by mapping domain
 * errors to their corresponding HTTP status codes.
 *
 * @example
 * ```typescript
 * // In a controller
 * const user = await runEffect(
 *   useCase.execute({ id: userId })
 * );
 * return user;
 * ```
 */
export async function runEffect<T, E>(
  effect: Effect.Effect<T, E, never>,
): Promise<T> {
  const result = await Effect.runPromise(Effect.either(effect));

  if (result._tag === "Left") {
    throw mapDomainErrorToHttpError(result.left as DomainError);
  }

  return result.right;
}

/**
 * Run an Effect with a custom error handler.
 *
 * Allows controllers to provide custom error recovery logic while
 * still using the standard Effect execution pattern.
 *
 * @example
 * ```typescript
 * const user = await runEffectWithHandler(
 *   useCase.execute({ id: userId }),
 *   {
 *     onNotFound: () => null, // Return null instead of throwing
 *   }
 * );
 * ```
 */
export async function runEffectWithHandler<T, E, R = T>(
  effect: Effect.Effect<T, E, never>,
  handlers: {
    onValidationError?: (error: ValidationError) => R;
    onNotFound?: (error: NotFoundError) => R;
    onUnauthorized?: (error: UnauthorizedError) => R;
    onConflict?: (error: ConflictError) => R;
    onInvariant?: (error: InvariantError) => R;
    onInvalidState?: (error: InvalidStateError) => R;
    onResourceUnavailable?: (error: ResourceUnavailableError) => R;
    onQuotaExceeded?: (error: QuotaExceededError) => R;
    onStateTransition?: (error: StateTransitionError) => R;
    onDefault?: (error: DomainError) => R;
  },
): Promise<T | R> {
  const result = await Effect.runPromise(Effect.either(effect));

  if (result._tag === "Right") {
    return result.right;
  }

  const error = result.left as DomainError;
  const handler = getErrorHandler(error, handlers);

  if (handler) {
    return handler(error);
  }

  throw mapDomainErrorToHttpError(error);
}

/**
 * Get the appropriate handler for a domain error
 */
function getErrorHandler<E extends DomainError, R>(
  error: DomainError,
  handlers: {
    onValidationError?: (error: ValidationError) => R;
    onNotFound?: (error: NotFoundError) => R;
    onUnauthorized?: (error: UnauthorizedError) => R;
    onConflict?: (error: ConflictError) => R;
    onInvariant?: (error: InvariantError) => R;
    onInvalidState?: (error: InvalidStateError) => R;
    onResourceUnavailable?: (error: ResourceUnavailableError) => R;
    onQuotaExceeded?: (error: QuotaExceededError) => R;
    onStateTransition?: (error: StateTransitionError) => R;
    onDefault?: (error: DomainError) => R;
  },
): ((error: E) => R) | undefined {
  switch (error._tag) {
    case "ValidationError":
      return handlers.onValidationError as (error: E) => R;
    case "NotFoundError":
      return handlers.onNotFound as (error: E) => R;
    case "UnauthorizedError":
      return handlers.onUnauthorized as (error: E) => R;
    case "ConflictError":
      return handlers.onConflict as (error: E) => R;
    case "InvariantError":
      return handlers.onInvariant as (error: E) => R;
    case "InvalidStateError":
      return handlers.onInvalidState as (error: E) => R;
    case "ResourceUnavailableError":
      return handlers.onResourceUnavailable as (error: E) => R;
    case "QuotaExceededError":
      return handlers.onQuotaExceeded as (error: E) => R;
    case "StateTransitionError":
      return handlers.onStateTransition as (error: E) => R;
    default:
      return handlers.onDefault as (error: E) => R;
  }
}

// =============================================================================
// HTTP Error Mapping
// =============================================================================

/**
 * Maps domain errors to HTTP status codes.
 *
 * Preserves existing HTTP status code contracts from the current implementation.
 *
 * | Error Type           | HTTP Status | Description                    |
 * | -------------------- | ----------- | ------------------------------ |
 * | ValidationError      | 400         | Bad Request - validation failed  |
 * | NotFoundError          | 404         | Resource not found               |
 * | UnauthorizedError      | 401         | Authentication required          |
 * | ConflictError          | 409         | Resource conflict                |
 * | InvariantError         | 400         | Business invariant violated      |
 * | InvalidStateError      | 400         | Invalid entity state             |
 * | ResourceUnavailableError | 503       | Service unavailable              |
 * | QuotaExceededError     | 429         | Too many requests/rate limited   |
 * | StateTransitionError   | 400         | Invalid state transition         |
 * | Default                | 500         | Internal server error            |
 *
 * @example
 * ```typescript
 * const statusCode = mapErrorToHttpStatus(error); // 400, 404, 401, etc.
 * ```
 */
export function mapErrorToHttpStatus(error: DomainError): number {
  switch (error._tag) {
    case "ValidationError":
      return 400;
    case "NotFoundError":
      return 404;
    case "UnauthorizedError":
      return 401;
    case "ConflictError":
      return 409;
    case "InvariantError":
    case "InvalidStateError":
    case "StateTransitionError":
      return 400;
    case "ResourceUnavailableError":
      return 503;
    case "QuotaExceededError":
      return 429;
    default:
      return 500;
  }
}

/**
 * Maps domain errors to HTTP ApiError instances.
 *
 * This creates the actual error objects that controllers should throw,
 * preserving the existing error class hierarchy (UnauthorizedError, etc.)
 *
 * @example
 * ```typescript
 * throw mapDomainErrorToHttpError(error);
 * ```
 */
export function mapDomainErrorToHttpError(error: DomainError): ApiError {
  const message = error.message;

  switch (error._tag) {
    case "ValidationError":
    case "InvariantError":
    case "InvalidStateError":
    case "StateTransitionError":
      return new HttpBadRequestError(message);

    case "NotFoundError":
      return new HttpNotFoundError(message);

    case "UnauthorizedError":
      return new HttpUnauthorizedError(message);

    case "ConflictError":
      // Conflict maps to BadRequest for HTTP (no 409 error class in api/errors.ts)
      return new HttpBadRequestError(message);

    case "ResourceUnavailableError":
      // Service unavailable - map to generic bad request or use 500
      return new HttpBadRequestError(message);

    case "QuotaExceededError":
      // Rate limited - map to forbidden or bad request
      return new HttpForbiddenError(message);

    default:
      return new HttpBadRequestError(message);
  }
}

// =============================================================================
// GraphQL Error Mapping
// =============================================================================

/**
 * GraphQL error codes matching common HTTP status semantics.
 *
 * These codes are used in GraphQL error extensions and map to the
 * standard GraphQL error code specification.
 */
export type GraphQLErrorCode =
  | "UNAUTHENTICATED" // 401 - Authentication required
  | "FORBIDDEN" // 403 - Insufficient permissions
  | "NOT_FOUND" // 404 - Resource not found
  | "BAD_USER_INPUT" // 400 - Validation error
  | "INTERNAL_SERVER_ERROR" // 500 - Server error
  | "CONFLICT"; // 409 - Resource conflict

/**
 * Maps a domain error to a GraphQL error code.
 *
 * Preserves existing GraphQL error code contracts.
 */
export function mapErrorToGraphQLCode(error: DomainError): GraphQLErrorCode {
  switch (error._tag) {
    case "ValidationError":
      return "BAD_USER_INPUT";
    case "NotFoundError":
      return "NOT_FOUND";
    case "UnauthorizedError":
      return "UNAUTHENTICATED";
    case "ConflictError":
      return "CONFLICT";
    case "InvariantError":
    case "InvalidStateError":
    case "StateTransitionError":
      return "BAD_USER_INPUT";
    case "ResourceUnavailableError":
    case "QuotaExceededError":
      return "INTERNAL_SERVER_ERROR";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

/**
 * Maps domain errors to GraphQLError instances.
 *
 * Preserves existing GraphQL error format contracts, including:
 * - Error message from domain error
 * - Error code in extensions.code
 * - Original error tag in extensions.tag
 * - Additional context in extensions
 *
 * @example
 * ```typescript
 * throw mapErrorToGraphQL(error);
 * ```
 */
export function mapErrorToGraphQL(error: DomainError): GraphQLError {
  const code = mapErrorToGraphQLCode(error);
  const message = error.message;

  // Build extensions based on error type
  const extensions: Record<string, unknown> = {
    code,
    tag: error._tag,
  };

  // Add type-specific context
  switch (error._tag) {
    case "ValidationError":
      if ("field" in error && error.field) {
        extensions.field = error.field;
      }
      break;
    case "NotFoundError":
      if ("entityType" in error) {
        extensions.entityType = error.entityType;
      }
      if ("id" in error) {
        extensions.id = error.id;
      }
      break;
    case "ConflictError":
      if ("field" in error && error.field) {
        extensions.field = error.field;
      }
      break;
    case "InvalidStateError":
      if ("currentState" in error) {
        extensions.currentState = error.currentState;
      }
      if ("requiredState" in error) {
        extensions.requiredState = error.requiredState;
      }
      break;
    case "QuotaExceededError":
      if ("quota" in error) {
        extensions.quota = error.quota;
      }
      if ("current" in error) {
        extensions.current = error.current;
      }
      if ("maximum" in error) {
        extensions.maximum = error.maximum;
      }
      break;
  }

  return new GraphQLError(message, {
    extensions,
  });
}

/**
 * Run an Effect and return the success value, throwing GraphQLError on failure.
 *
 * This is the primary execution helper for GraphQL resolvers.
 *
 * @example
 * ```typescript
 * // In a GraphQL resolver
 * const user = await runEffectGraphQL(
 *   useCase.execute({ id: userId })
 * );
 * return user;
 * ```
 */
export async function runEffectGraphQL<T, E>(
  effect: Effect.Effect<T, E, never>,
): Promise<T> {
  const result = await Effect.runPromise(Effect.either(effect));

  if (result._tag === "Left") {
    throw mapErrorToGraphQL(result.left as DomainError);
  }

  return result.right;
}

/**
 * Run an Effect with custom GraphQL error handlers.
 *
 * Allows resolvers to provide custom error recovery logic.
 */
export async function runEffectGraphQLWithHandler<T, E, R = T>(
  effect: Effect.Effect<T, E, never>,
  handlers: {
    onValidationError?: (error: ValidationError) => R;
    onNotFound?: (error: NotFoundError) => R;
    onUnauthorized?: (error: UnauthorizedError) => R;
    onConflict?: (error: ConflictError) => R;
    onInvariant?: (error: InvariantError) => R;
    onInvalidState?: (error: InvalidStateError) => R;
    onResourceUnavailable?: (error: ResourceUnavailableError) => R;
    onQuotaExceeded?: (error: QuotaExceededError) => R;
    onStateTransition?: (error: StateTransitionError) => R;
    onDefault?: (error: DomainError) => R;
  },
): Promise<T | R> {
  const result = await Effect.runPromise(Effect.either(effect));

  if (result._tag === "Right") {
    return result.right;
  }

  const error = result.left as DomainError;
  const handler = getErrorHandler(error, handlers);

  if (handler) {
    return handler(error);
  }

  throw mapErrorToGraphQL(error);
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if an error is a DomainError.
 */
export function isDomainError(error: unknown): error is DomainError {
  return (
    error instanceof Error &&
    "_tag" in error &&
    typeof (error as { _tag: unknown })._tag === "string"
  );
}

/**
 * Get the error tag from an unknown error.
 * Returns undefined if not a domain error.
 */
export function getErrorTag(error: unknown): string | undefined {
  if (isDomainError(error)) {
    return error._tag;
  }
  return undefined;
}
