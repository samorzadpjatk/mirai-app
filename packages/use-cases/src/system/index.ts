/**
 * System module exports for Use Cases layer
 *
 * Centralized exports for shared system utilities and types
 * used across all domain use cases.
 */

// =============================================================================
// Cursor Utilities
// =============================================================================
export { encodeCursor, decodeCursor, type CursorData } from "./utils/cursor";

// =============================================================================
// Pagination Types
// =============================================================================
export {
  type CursorPaginationOptions,
  type CursorPaginatedResult,
} from "./ports/pagination";
