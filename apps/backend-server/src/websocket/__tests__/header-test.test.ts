/**
 * Header Test
 */

import { describe, it, expect } from "bun:test";

describe("[UNIT] [DEBUG] Header Test", () => {
  it("should have custom header", () => {
    const request = new Request("http://localhost:4000/graphql/ws", {
      headers: {
        "x-custom": "test-value",
        authorization: "Bearer token123",
      },
    });

    const customHeader = request.headers.get("x-custom");
    const authHeader = request.headers.get("authorization");
    const allHeaders = Array.from(request.headers.entries());

    if (customHeader === null) {
      throw new Error(
        `Custom header is null. All headers: ${JSON.stringify(allHeaders)}`,
      );
    }

    expect(customHeader).toBe("test-value");
    expect(authHeader).toBe("Bearer token123");
  });
});
