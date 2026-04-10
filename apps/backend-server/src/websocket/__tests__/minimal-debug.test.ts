/**
 * Minimal Debug Test
 */

import { describe, it, expect } from "bun:test";

describe("[DEBUG] Minimal", () => {
  it("should have cookie header", () => {
    const request = new Request("http://localhost:4000/graphql/ws", {
      headers: {
        cookie: `auth-token=test-value-123`,
      },
    });

    const cookieHeader = request.headers.get("cookie");

    if (cookieHeader === null) {
      throw new Error(
        `Cookie header is null. Headers: ${JSON.stringify(Array.from(request.headers.entries()))}`,
      );
    }

    expect(cookieHeader).toBe("auth-token=test-value-123");
  });
});
