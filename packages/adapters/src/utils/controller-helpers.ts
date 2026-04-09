import type { Result } from "@mirai-app/domain";

/**
 * Error code types for controller responses
 */
export type ErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "INTERNAL_SERVER_ERROR";

/**
 * Maps error messages to appropriate error codes
 */
export function mapErrorToCode(error: string): ErrorCode {
  const lowerError = error.toLowerCase();
  if (lowerError.includes("not found")) return "NOT_FOUND";
  if (
    lowerError.includes("forbidden") ||
    lowerError.includes("not a participant")
  )
    return "FORBIDDEN";
  if (lowerError.includes("unauthorized")) return "UNAUTHORIZED";
  if (lowerError.includes("internal") || lowerError.includes("failed to"))
    return "INTERNAL_SERVER_ERROR";
  return "BAD_REQUEST";
}

/**
 * Handles controller results and converts to TRPC errors
 *
 * @example
 * const result = await controller.someMethod(input);
 * return handleResult(result);
 */
export function handleResult<T>(
  result: { success: true; data: T } | { success: false; error: string },
): T {
  if (!result.success) {
    throw new TRPCError({
      code: mapErrorToCode(result.error),
      message: result.error,
    });
  }
  return result.data;
}

/**
 * Type for controller result pattern
 */
export type ControllerResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Converts a domain Result to a controller result
 *
 * @example
 * const result = await useCase.execute(input);
 * return toControllerResult(result, (value) => transform(value));
 */
export function toControllerResult<T, E, R = T>(
  result: Result<T, E>,
  transform?: (value: T) => R,
): ControllerResult<R> {
  if (result.kind === "err") {
    return { success: false, error: String(result.error) };
  }
  return {
    success: true,
    data: transform ? transform(result.value) : (result.value as unknown as R),
  };
}

/**
 * Creates a controller result directly from data or error
 */
export function createControllerResult<T>(
  data: T | null,
  error?: string,
): ControllerResult<T> {
  if (error || data === null) {
    return { success: false, error: error ?? "Unknown error" };
  }
  return { success: true, data };
}
