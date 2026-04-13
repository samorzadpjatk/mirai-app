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
// Result Handling (Result<T,E> format)
// =============================================================================

/**
 * Options for result handling
 */
export interface HandleResultOptions<T, R = T> {
  /** Transform the success value before returning */
  transform?: (value: T) => R;
}

// =============================================================================
// Controller Result Handling ({ success, data, error } format)
// =============================================================================

/**
 * Controller result type - { success, data, error } format
 */
export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Handle a controller result and either return the data or throw GraphQL error
 *
 * Controllers return { success, data, error } format (not Result<T,E>).
 * This helper converts that to GraphQL errors on failure.
 *
 * @param result - The controller result to handle
 * @param options - Optional transformation function
 * @returns The data value or throws GraphQLError
 *
 * @example
 * ```typescript
 * const result = await controller.getById({ id: args.id });
 * return handleControllerResult(result);
 *
 * // With transformation
 * const dto = handleControllerResult(result, { transform: (user) => UserDTO.from(user) });
 * ```
 */
export function handleControllerResult<T, R = T>(
  result: ControllerResult<T>,
  options?: HandleResultOptions<T, R>,
): R {
  if (result.success === false) {
    throw mapErrorToGraphQL(new Error(result.error));
  }

  return options?.transform
    ? options.transform(result.data)
    : (result.data as unknown as R);
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
// Effect-based Error Handling
// =============================================================================

import { Effect, Either, Data } from "effect";

/**
 * GraphQL error for Effect-based workflows
 */
export class GraphQLErrorEffect extends Data.TaggedError("GraphQLErrorEffect")<{
  message: string;
  code: GraphQLErrorCode;
  originalError?: unknown;
}> {
  toGraphQLError(): GraphQLError {
    return new GraphQLError(this.message, {
      extensions: {
        code: this.code,
        originalError: this.originalError,
      },
    });
  }
}

/**
 * Handle a Result<T,E> and convert to Effect
 *
 * Takes a Result<T,E> and converts it to an Effect that either:
 * - Succeeds with the value T
 * - Fails with a GraphQLErrorEffect containing the error E
 *
 * @example
 * ```typescript
 * const result = someUseCase.execute(input);
 * const effect = handleResultEffect(result);
 * const value = yield* effect; // GraphQLErrorEffect on error
 * ```
 */
export function handleResultEffect<T, E>(
  result: Result<T, E>,
): Effect.Effect<T, GraphQLErrorEffect, never> {
  if (result.kind === "err") {
    const error = result.error;
    const graphqlError = mapErrorToGraphQL(error);
    const code =
      (graphqlError.extensions?.code as GraphQLErrorCode) ??
      "INTERNAL_SERVER_ERROR";
    return Effect.fail(
      new GraphQLErrorEffect({
        message: graphqlError.message,
        code,
        originalError: error,
      }),
    );
  }

  return Effect.succeed(result.value);
}

/**
 * Handle a Result<T,E> with async transformation (Effect version)
 *
 * @example
 * ```typescript
 * const result = someUseCase.execute(input);
 * const effect = handleResultEffectAsync(result, async (value) => {
 *   // async transformation
 *   return transformedValue;
 * });
 * ```
 */
export function handleResultEffectAsync<T, E, R>(
  result: Result<T, E>,
  transform: (value: T) => Promise<R>,
): Effect.Effect<R, GraphQLErrorEffect, never> {
  return Effect.gen(function* () {
    const value = yield* handleResultEffect(result);
    return yield* Effect.tryPromise(() => transform(value));
  });
}

/**
 * Convert an Either<Error, T> to an Effect with GraphQL error
 *
 * @example
 * ```typescript
 * const either = yield* someEffect.pipe(Effect.either);
 * const result = yield* eitherToGraphQLEffect(either);
 * ```
 */
export function eitherToGraphQLEffect<E, T>(
  either: Either.Either<E, T>,
): Effect.Effect<T, GraphQLErrorEffect, never> {
  if (either._tag === "Left") {
    const error = either.left;
    const graphqlError = mapErrorToGraphQL(error);
    const code =
      (graphqlError.extensions?.code as GraphQLErrorCode) ??
      "INTERNAL_SERVER_ERROR";
    return Effect.fail(
      new GraphQLErrorEffect({
        message: graphqlError.message,
        code,
        originalError: error,
      }),
    );
  }

  return Effect.succeed(either.right);
}

/**
 * Run an Effect and convert error to GraphQLError for resolvers
 *
 * This utility runs an Effect and either:
 * - Returns the success value
 * - Throws a GraphQLError on failure (for GraphQL resolver consumption)
 *
 * @example
 * ```typescript
 * const effect = Effect.gen(function* () {
 *   // ... effect logic
 *   return result;
 * });
 *
 * const value = await runEffectToGraphQL(effect);
 * ```
 */
export async function runEffectToGraphQL<T, E>(
  effect: Effect.Effect<T, E, never>,
): Promise<T> {
  const result = await Effect.runPromise(Effect.either(effect));

  if (result._tag === "Left") {
    throw mapErrorToGraphQL(result.left);
  }

  return result.right;
}

/**
 * Run an Effect with runtime and convert error to GraphQLError
 *
 * This is the primary utility for running Effects in GraphQL resolvers.
 * It uses the context's runtime and throws GraphQL errors on failure.
 *
 * @example
 * ```typescript
 * resolve: async (_root, args, ctx) => {
 *   const effect = Effect.gen(function* () {
 *     const auth = yield* requireAuthEffect(ctx);
 *     const controller = ctx.container.resolve("userController");
 *     return yield* Effect.tryPromise(() => controller.getById({ id: args.id }));
 *   });
 *   return runEffectWithGraphQL(ctx.runtime)(effect);
 * }
 * ```
 */
export function runEffectWithGraphQL<T, E>(
  runtime: Runtime.Runtime<never>,
): <A>(effect: Effect.Effect<A, E, never>) => Promise<A> {
  return async <A>(effect: Effect.Effect<A, E, never>): Promise<A> => {
    const runnable = Runtime.runPromise(runtime)(effect);
    const result = await runnable;

    // Handle Either results from the controller
    if (
      result &&
      typeof result === "object" &&
      "kind" in result &&
      (result.kind === "ok" || result.kind === "err")
    ) {
      const resultObj = result as unknown as {
        kind: string;
        value?: A;
        error?: unknown;
      };
      if (resultObj.kind === "err") {
        throw mapErrorToGraphQL(resultObj.error);
      }
      return resultObj.value as A;
    }

    return result as A;
  };
}

// =============================================================================
// Export
// =============================================================================

export { mapErrorToGraphQL };
