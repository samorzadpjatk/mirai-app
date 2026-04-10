/**
 * Debug Request Headers Test
 */

import { describe, it, expect } from "bun:test";
import { extractAuthToken } from "../auth-handler";

describe("[DEBUG] Request Headers", () => {
  it("should extract token using the actual function", () => {
    const request = new Request("http://localhost:4000/graphql/ws", {
      headers: {
        cookie: `auth-token=test-value-123`,
      },
    });

    const cookieHeader = request.headers.get("cookie");
    const token = extractAuthToken(request);

    // Fail with detailed info
    if (token !== "test-value-123") {
      throw new Error(
        `Token extraction failed: expected "test-value-123" but got "${token}". Cookie header: "${cookieHeader}"`,
      );
    }

    expect(token).toBe("test-value-123");
  });
});
