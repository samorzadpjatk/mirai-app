/**
 * Cursor encoding/decoding utilities for cursor-based pagination
 *
 * Uses base64url encoding (URL-safe base64 without padding) to encode
 * cursor data as opaque strings for GraphQL Relay pagination.
 */

/**
 * Data structure stored in cursor
 * Contains entity id and createdAt timestamp (ISO 8601)
 * Extensible with additional fields via index signature
 */
export interface CursorData {
  id: string;
  createdAt: string;
  [key: string]: unknown;
}

/**
 * Encodes cursor data to base64url string
 *
 * @param data - Cursor data containing id, createdAt, and optional fields
 * @returns Base64url encoded cursor string
 *
 * @example
 * const cursor = encodeCursor({ id: "abc123", createdAt: "2024-01-15T10:00:00Z" });
 * // Returns: "eyJpZCI6ImFiYzEyMyIsImNyZWF0ZWRBdCI6IjIwMjQtMDEtMTVUMTA6MDA6MDBaIn0"
 */
export function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

/**
 * Decodes cursor string to cursor data
 *
 * Returns null for invalid cursors instead of throwing errors.
 * This ensures graceful handling of malformed or corrupted cursors.
 *
 * @param cursor - Base64url encoded cursor string
 * @returns CursorData object or null if cursor is invalid
 *
 * @example
 * const data = decodeCursor("eyJpZCI6ImFiYzEyMyIsImNyZWF0ZWRBdCI6...");
 * if (data) {
 *   console.log(data.id, data.createdAt);
 * }
 */
export function decodeCursor(cursor: string): CursorData | null {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf-8");
    const data = JSON.parse(json) as unknown;

    // Validate that data has required id field
    if (
      typeof data !== "object" ||
      data === null ||
      typeof (data as Record<string, unknown>).id !== "string"
    ) {
      return null;
    }

    return data as CursorData;
  } catch {
    return null;
  }
}
