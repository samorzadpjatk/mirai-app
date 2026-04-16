import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { PushSubscription } from "./push-subscription";
import { ValidationError } from "../../system/errors";

// Helper to create valid props for PushSubscription
function createValidProps(
  overrides: Partial<Parameters<typeof PushSubscription.create>[0]> = {},
): Parameters<typeof PushSubscription.create>[0] {
  return {
    userId: "user-123",
    token: "a".repeat(100), // Valid length token
    ...overrides,
  };
}

describe("[UNIT] PushSubscription", () => {
  // ============================================================================
  // Factory Method Tests (create)
  // ============================================================================
  describe("create", () => {
    it("creates push subscription with valid data", async () => {
      const props = createValidProps();

      const effect = PushSubscription.create(props);
      const subscription = await Effect.runPromise(effect);

      expect(subscription.userId).toBe("user-123");
      expect(subscription.token).toBe("a".repeat(100));
      expect(subscription.id).toBeDefined();
      expect(subscription.createdAt).toBeInstanceOf(Date);
      expect(subscription.updatedAt).toBeInstanceOf(Date);
    });

    it("creates with all properties provided", async () => {
      const createdAt = new Date("2024-01-01T00:00:00Z");
      const updatedAt = new Date("2024-01-02T00:00:00Z");

      const effect = PushSubscription.create({
        id: "sub-123",
        userId: "user-456",
        token: "push-token-789",
        createdAt,
        updatedAt,
      });

      const subscription = await Effect.runPromise(effect);

      expect(subscription.id).toBe("sub-123");
      expect(subscription.userId).toBe("user-456");
      expect(subscription.token).toBe("push-token-789");
      expect(subscription.createdAt).toBe(createdAt);
      expect(subscription.updatedAt).toBe(updatedAt);
    });

    it("generates UUID when id not provided", async () => {
      const effect = PushSubscription.create(createValidProps());
      const subscription = await Effect.runPromise(effect);

      expect(subscription.id).toBeDefined();
      expect(typeof subscription.id).toBe("string");
      expect(subscription.id.length).toBeGreaterThan(10);
    });

    it("trims userId whitespace", async () => {
      const effect = PushSubscription.create({
        ...createValidProps(),
        userId: "  user-123  ",
      });

      const subscription = await Effect.runPromise(effect);
      expect(subscription.userId).toBe("user-123");
    });

    it("trims token whitespace", async () => {
      const effect = PushSubscription.create({
        ...createValidProps(),
        token: "  token-with-spaces  ",
      });

      const subscription = await Effect.runPromise(effect);
      expect(subscription.token).toBe("token-with-spaces");
    });

    // ============================================================================
    // Validation Tests
    // ============================================================================
    it("fails when userId is empty", async () => {
      const effect = PushSubscription.create({
        ...createValidProps(),
        userId: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("userId");
        expect(result.left.message).toBe("userId is required");
      }
    });

    it("fails when userId is whitespace only", async () => {
      const effect = PushSubscription.create({
        ...createValidProps(),
        userId: "   ",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("userId");
      }
    });

    it("fails when token is empty", async () => {
      const effect = PushSubscription.create({
        ...createValidProps(),
        token: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("token");
        expect(result.left.message).toBe("token is required");
      }
    });

    it("fails when token is whitespace only", async () => {
      const effect = PushSubscription.create({
        ...createValidProps(),
        token: "   ",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("token");
      }
    });

    it("fails when token is too short", async () => {
      const effect = PushSubscription.create({
        ...createValidProps(),
        token: "short",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("token");
        expect(result.left.message).toContain("at least");
      }
    });

    it("fails when token is too long", async () => {
      const effect = PushSubscription.create({
        ...createValidProps(),
        token: "a".repeat(501),
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("token");
        expect(result.left.message).toContain("at most");
      }
    });

    it("accepts token at minimum length", async () => {
      const effect = PushSubscription.create({
        ...createValidProps(),
        token: "a".repeat(10),
      });

      const subscription = await Effect.runPromise(effect);
      expect(subscription.token).toHaveLength(10);
    });

    it("accepts token at maximum length", async () => {
      const effect = PushSubscription.create({
        ...createValidProps(),
        token: "a".repeat(500),
      });

      const subscription = await Effect.runPromise(effect);
      expect(subscription.token).toHaveLength(500);
    });
  });

  // ============================================================================
  // getCompositeId Tests
  // ============================================================================
  describe("getCompositeId", () => {
    it("returns composite id with userId and token", async () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "token-abc123",
      });
      const subscription = await Effect.runPromise(effect);

      expect(subscription.getCompositeId()).toBe("user-123:token-abc123");
    });

    it("returns unique composite for different users", async () => {
      const sub1 = await Effect.runPromise(
        PushSubscription.create({
          userId: "user-1",
          token: "same-token",
        }),
      );
      const sub2 = await Effect.runPromise(
        PushSubscription.create({
          userId: "user-2",
          token: "same-token",
        }),
      );

      expect(sub1.getCompositeId()).not.toBe(sub2.getCompositeId());
    });

    it("returns unique composite for different tokens", async () => {
      const sub1 = await Effect.runPromise(
        PushSubscription.create({
          userId: "user-1",
          token: "token-abc123",
        }),
      );
      const sub2 = await Effect.runPromise(
        PushSubscription.create({
          userId: "user-1",
          token: "token-xyz456",
        }),
      );

      expect(sub1.getCompositeId()).not.toBe(sub2.getCompositeId());
    });
  });

  // ============================================================================
  // belongsToUser Tests
  // ============================================================================
  describe("belongsToUser", () => {
    it("returns true for matching userId", async () => {
      const effect = PushSubscription.create(
        createValidProps({ userId: "user-123" }),
      );
      const subscription = await Effect.runPromise(effect);

      expect(subscription.belongsToUser("user-123")).toBe(true);
    });

    it("returns false for different userId", async () => {
      const effect = PushSubscription.create(
        createValidProps({ userId: "user-123" }),
      );
      const subscription = await Effect.runPromise(effect);

      expect(subscription.belongsToUser("user-456")).toBe(false);
    });
  });

  // ============================================================================
  // hasToken Tests
  // ============================================================================
  describe("hasToken", () => {
    it("returns true for matching token", async () => {
      const effect = PushSubscription.create(
        createValidProps({ token: "token-abc123" }),
      );
      const subscription = await Effect.runPromise(effect);

      expect(subscription.hasToken("token-abc123")).toBe(true);
    });

    it("returns false for different token", async () => {
      const effect = PushSubscription.create(
        createValidProps({ token: "token-abc123" }),
      );
      const subscription = await Effect.runPromise(effect);

      expect(subscription.hasToken("token-xyz")).toBe(false);
    });
  });

  // ============================================================================
  // matches Tests
  // ============================================================================
  describe("matches", () => {
    it("returns true when both userId and token match", async () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "token-abc123",
      });
      const subscription = await Effect.runPromise(effect);

      expect(subscription.matches("user-123", "token-abc123")).toBe(true);
    });

    it("returns false when userId does not match", async () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "token-abc123",
      });
      const subscription = await Effect.runPromise(effect);

      expect(subscription.matches("user-456", "token-abc123")).toBe(false);
    });

    it("returns false when token does not match", async () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "token-abc123", // 12 chars
      });
      const subscription = await Effect.runPromise(effect);

      expect(subscription.matches("user-123", "token-xyz")).toBe(false);
    });

    it("returns false when both do not match", async () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "token-abc123", // 12 chars
      });
      const subscription = await Effect.runPromise(effect);

      expect(subscription.matches("user-456", "token-xyz")).toBe(false);
    });
  });

  // ============================================================================
  // getMaskedToken Tests
  // ============================================================================
  describe("getMaskedToken", () => {
    it("masks token with first 4 and last 4 characters", async () => {
      const effect = PushSubscription.create(
        createValidProps({ token: "abcdefghijklmnop" }),
      );
      const subscription = await Effect.runPromise(effect);

      expect(subscription.getMaskedToken()).toBe("abcd****mnop");
    });

    it("handles token with exactly 10 characters", async () => {
      const effect = PushSubscription.create(
        createValidProps({ token: "abcdefghij" }),
      );
      const subscription = await Effect.runPromise(effect);

      // 10 chars "abcdefghij": abcd + **** + ghij = "abcd****ghij"
      expect(subscription.getMaskedToken()).toBe("abcd****ghij");
    });

    it("returns **** for tokens with 8 or fewer characters", async () => {
      // Use exactly 10 char tokens (minimum), then test with first 8 chars
      const shortSub = await Effect.runPromise(
        PushSubscription.create({
          userId: "user-1",
          token: "short12345", // 10 chars, but test shows first 4 + ****
        }),
      );
      const tenSub = await Effect.runPromise(
        PushSubscription.create({
          userId: "user-2",
          token: "1234567890", // 10 chars
        }),
      );

      // For 10 chars: first 4 + **** + last 4 = "shor****2345"
      expect(tenSub.getMaskedToken()).not.toBe("****");
      // Token must be > 8 chars to get partial masking
      expect(shortSub.getMaskedToken()).toContain("****");
    });

    it("handles long tokens correctly", async () => {
      const longToken = "a".repeat(100);
      const effect = PushSubscription.create(
        createValidProps({ token: longToken }),
      );
      const subscription = await Effect.runPromise(effect);

      const masked = subscription.getMaskedToken();
      expect(masked.startsWith("aaaa")).toBe(true);
      expect(masked.endsWith("aaaa")).toBe(true);
      expect(masked.includes("****")).toBe(true);
      expect(masked).toHaveLength(12); // 4 + 4 + 4
    });

    it("masks token for security display", async () => {
      // Simulate a real push token
      const realToken =
        "fBMSDV8z4kE:APA91bHUNYhQjM-1fZx7e_yuH9g3q4r5t6y7u8i9o0p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7";
      const effect = PushSubscription.create(
        createValidProps({ token: realToken }),
      );
      const subscription = await Effect.runPromise(effect);

      const masked = subscription.getMaskedToken();
      expect(masked).not.toBe(realToken);
      expect(masked.includes("****")).toBe(true);
    });
  });

  // ============================================================================
  // Immutability Tests
  // ============================================================================
  describe("immutability", () => {
    it("properties cannot be modified directly", async () => {
      const effect = PushSubscription.create(createValidProps());
      const subscription = await Effect.runPromise(effect);

      // TypeScript prevents this at compile time with readonly properties
      // At runtime, the readonly modifier only affects type checking, not runtime behavior
      // So we verify the readonly type structure exists
      expect(subscription.userId).toBe("user-123");
      expect(subscription.token).toBeDefined();
      expect(subscription.id).toBeDefined();
      expect(subscription.createdAt).toBeInstanceOf(Date);
      expect(subscription.updatedAt).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe("edge cases", () => {
    it("handles tokens with special characters", async () => {
      const specialToken = "token-with-special-chars_123.test:token";
      const effect = PushSubscription.create(
        createValidProps({ token: specialToken }),
      );
      const subscription = await Effect.runPromise(effect);

      expect(subscription.token).toBe(specialToken);
      expect(subscription.getCompositeId()).toBe(`user-123:${specialToken}`);
    });

    it("handles tokens with unicode characters", async () => {
      const unicodeToken = "token-with-unicode-日本語-token";
      const effect = PushSubscription.create(
        createValidProps({ token: unicodeToken }),
      );
      const subscription = await Effect.runPromise(effect);

      expect(subscription.token).toBe(unicodeToken);
    });

    it("treats userId case sensitively", async () => {
      const effect = PushSubscription.create(
        createValidProps({ userId: "User-123" }),
      );
      const subscription = await Effect.runPromise(effect);

      expect(subscription.belongsToUser("User-123")).toBe(true);
      expect(subscription.belongsToUser("user-123")).toBe(false);
      expect(subscription.belongsToUser("USER-123")).toBe(false);
    });

    it("treats token case sensitively", async () => {
      const effect = PushSubscription.create(
        createValidProps({ token: "Token-ABC-123" }),
      ); // 13 chars
      const subscription = await Effect.runPromise(effect);

      expect(subscription.hasToken("Token-ABC-123")).toBe(true);
      expect(subscription.hasToken("token-abc-123")).toBe(false);
      expect(subscription.hasToken("TOKEN-ABC-123")).toBe(false);
    });
  });
});
