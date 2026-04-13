/**
 * WebSocket Auth Handler Simple Test
 *
 * Simple inline test to verify the auth handler works correctly.
 */

import { describe, it, expect } from "bun:test";
import { extractAuthToken, AUTH_TOKEN_COOKIE } from "../auth-handler";

/**
 * Create a mock Request with proper cookie header support for testing.
 * Bun's native Request doesn't expose cookie headers via headers.get()
 * for security reasons.
 */
function createMockRequest(
  url: string,
  headers?: Record<string, string>,
): Request {
  const headersMap = new Map<string, string>();

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      headersMap.set(key.toLowerCase(), value);
    }
  }

  const mockHeaders = {
    get: (name: string): string | null => {
      return headersMap.get(name.toLowerCase()) ?? null;
    },
    entries: function* () {
      for (const [key, value] of headersMap) {
        yield [key, value] as [string, string];
      }
    },
    has: (name: string): boolean => headersMap.has(name.toLowerCase()),
  } as unknown as Headers;

  return {
    url,
    headers: mockHeaders,
  } as Request;
}

describe("[UNIT] WebSocket Auth Handler Simple", () => {
  it("should extract token from cookie header", () => {
    const request = createMockRequest("http://localhost:4000/graphql/ws", {
      cookie: `auth-token=test-value-123`,
    });

    const token = extractAuthToken(request);
    expect(token).toBe("test-value-123");
  });

  it("should return null for request without token", () => {
    const request = new Request("http://localhost:4000/graphql/ws");

    const token = extractAuthToken(request);
    expect(token).toBeNull();
  });
});
