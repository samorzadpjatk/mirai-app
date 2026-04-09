import { TRPCError } from "@trpc/server";
import {
  mapErrorToCode,
  type ControllerResult,
  type ErrorCode,
} from "../controller-helpers";

/**
 * Handles controller results and converts to TRPC errors
 *
 * @example
 * const result = await controller.someMethod(input);
 * return handleResult(result);
 */
export function handleResult<T>(result: ControllerResult<T>): T {
  if (!result.success) {
    throw new TRPCError({
      code: mapErrorToCode(result.error),
      message: result.error,
    });
  }
  return result.data;
}

export { mapErrorToCode, type ControllerResult, type ErrorCode };
