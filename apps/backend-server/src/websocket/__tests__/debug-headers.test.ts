/**
 * Debug Request Headers Test
 *
 * Verifies that the extractAuthToken function works correctly with Bun's Request.
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

    const token = extractAuthToken(request);
    expect(token).toBe("test-value-123");
  });
});
