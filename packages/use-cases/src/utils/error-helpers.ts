/**
 * Utility functions for use case error handling
 */

/**
 * Wraps an error with operation context
 *
 * @example
 * try {
 *   await someOperation();
 * } catch (error) {
 *   return err(wrapError("perform operation", error));
 * }
 */
export function wrapError(operation: string, error: unknown): string {
  return `Failed to ${operation}: ${error instanceof Error ? error.message : String(error)}`;
}

/**
 * Common error messages for use cases
 */
export const CommonErrors = {
  NOT_FOUND: (entity: string) => `${entity} not found`,
  ALREADY_EXISTS: (entity: string) => `${entity} already exists`,
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  INVALID_INPUT: (field: string) => `Invalid ${field}`,
} as const;
