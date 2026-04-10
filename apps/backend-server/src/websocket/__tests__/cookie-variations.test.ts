/**
 * Cookie Header Variations Test
 */

import { describe, it, expect } from "bun:test";

describe("[DEBUG] Cookie Header Variations", () => {
  it("should test different cookie header cases", () => {
    // Test 1: lowercase 'cookie'
    const req1 = new Request("http://localhost:4000/graphql/ws", {
      headers: { cookie: "value1" },
    });

    // Test 2: Capitalized 'Cookie'
    const req2 = new Request("http://localhost:4000/graphql/ws", {
      headers: { Cookie: "value2" },
    });

    // Test 3: Headers constructor
    const headers = new Headers();
    headers.set("cookie", "value3");
    const req3 = new Request("http://localhost:4000/graphql/ws", {
      headers: headers,
    });

    const results = {
      lowercase: req1.headers.get("cookie"),
      capitalized: req2.headers.get("cookie"),
      viaHeaders: req3.headers.get("cookie"),
    };

    // Log results
    console.error("Cookie header results:", JSON.stringify(results));

    // At least one should work
    const hasValue = Object.values(results).some((v) => v !== null);

    if (!hasValue) {
      throw new Error(
        `No cookie header worked. Results: ${JSON.stringify(results)}`,
      );
    }

    expect(true).toBe(true);
  });
});
