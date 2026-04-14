/**
 * Minimal Debug Test
 *
 * Verifies cookie header behavior in Bun.
 */

import { describe, it, expect } from "bun:test";

describe("[UNIT] [DEBUG] Minimal", () => {
  it("should have cookie header", () => {
    const request = new Request("http://localhost:4000/graphql/ws", {
      headers: {
        cookie: `auth-token=test-value-123`,
      },
    });

    const cookieHeader = request.headers.get("cookie");
    expect(cookieHeader).toBe("auth-token=test-value-123");
  });
});
