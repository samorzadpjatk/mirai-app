/**
 * Result Type - Re-export from utils
 *
 * This file re-exports the Result type and utilities from utils/result
 * for backward compatibility with code importing from types/Result.
 *
 * @module types/Result
 */

export {
  type Result,
  ok,
  err,
  isSuccess,
  isError,
  map,
  mapError,
  flatten,
  flatMap,
  getOrElse,
  unwrap,
} from "../utils/result";

// Additional aliases for backward compatibility
export { isSuccess as isOk, isError as isErr } from "../utils/result";
