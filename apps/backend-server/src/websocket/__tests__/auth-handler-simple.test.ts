/**
 * WebSocket Auth Handler Simple Test
 *
 * Simple inline test to verify the auth handler works correctly.
 */

import { describe, it, expect } from "bun:test";
import { extractAuthToken, AUTH_TOKEN_COOKIE } from "../auth-handler";

describe("[UNIT] WebSocket Auth Handler Simple", () => {
  it("should extract token from cookie header", () => {
    const request = new Request("http://localhost:4000/graphql/ws", {
      headers: {
        cookie: `auth-token=test-value-123`,
      },
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
