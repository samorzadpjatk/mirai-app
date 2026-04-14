/**
 * Cookie Header Variations Test
 *
 * Verifies different ways of setting cookie headers work in Bun.
 */

import { describe, it, expect } from "bun:test";

describe("[UNIT] [DEBUG] Cookie Header Variations", () => {
  it("should access cookie headers set in various ways", () => {
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

    // All should work in Bun
    expect(req1.headers.get("cookie")).toBe("value1");
    expect(req2.headers.get("cookie")).toBe("value2");
    expect(req3.headers.get("cookie")).toBe("value3");
  });
});
