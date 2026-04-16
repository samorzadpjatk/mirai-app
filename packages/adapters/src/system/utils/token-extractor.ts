/**
 * TokenExtractor extracts Bearer tokens from HTTP request headers
 *
 * This utility operates on raw HTTP headers, NOT on framework-specific context.
 * It is framework-agnostic and can be used with any transport layer.
 *
 * @module TokenExtractor
 */

/**
 * TokenExtractor class for extracting Bearer tokens from HTTP Authorization headers
 *
 * This is a pure utility class with no state - all methods are static.
 * It provides framework-agnostic token extraction that works with any
 * HTTP-based transport layer (GraphQL).
 */
export class TokenExtractor {
  /**
   * Extract Bearer token from Authorization header
   *
   * @param authHeader - The Authorization header value (e.g., "Bearer token123")
   * @returns The extracted token or null if not found/invalid
   *
   * @example
   * ```typescript
   * const token = TokenExtractor.extract("Bearer eyJhbG...");
   * // Returns: "eyJhbG..."
   *
   * const invalid = TokenExtractor.extract("Basic dXNlcj...");
   * // Returns: null (wrong scheme)
   *
   * const empty = TokenExtractor.extract(null);
   * // Returns: null
   * ```
   */
  static extract(authHeader: string | undefined | null): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.trim().split(" ");

    if (parts.length !== 2) {
      return null;
    }

    const [scheme, token] = parts;

    if (!scheme || scheme.toLowerCase() !== "bearer") {
      return null;
    }

    if (!token || token.length === 0) {
      return null;
    }

    return token;
  }

  /**
   * Extract token from headers object
   *
   * @param headers - Object containing Authorization header
   * @returns The extracted token or null
   *
   * @example
   * ```typescript
   * const token = TokenExtractor.fromHeaders({
   *   authorization: "Bearer eyJhbG..."
   * });
   * // Returns: "eyJhbG..."
   *
   * const missing = TokenExtractor.fromHeaders({});
   * // Returns: null
   * ```
   */
  static fromHeaders(headers: { authorization?: string }): string | null {
    return this.extract(headers.authorization);
  }
}
