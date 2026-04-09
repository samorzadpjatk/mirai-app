import { describe, it, expect } from "bun:test";
import { PushSubscription } from "./PushSubscription";

describe("[UNIT] PushSubscription Entity", () => {
  describe("PushSubscription.create", () => {
    it("should create with valid data", () => {
      const result = PushSubscription.create({
        userId: "user-123",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.userId).toBe("user-123");
        expect(result.value.token).toBe(
          "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
        );
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should reject empty userId", () => {
      const result = PushSubscription.create({
        userId: "",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty token", () => {
      const result = PushSubscription.create({
        userId: "user-123",
        token: "",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject short token", () => {
      const result = PushSubscription.create({
        userId: "user-123",
        token: "short",
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("PushSubscription.belongsToUser / hasToken / matches", () => {
    it("should check if belongs to user", () => {
      const result = PushSubscription.create({
        userId: "user-123",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.belongsToUser("user-123")).toBe(true);
        expect(result.value.belongsToUser("other-user")).toBe(false);
      }
    });

    it("should check if has specific token", () => {
      const result = PushSubscription.create({
        userId: "user-123",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(
          result.value.hasToken("ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"),
        ).toBe(true);
        expect(result.value.hasToken("other-token")).toBe(false);
      }
    });

    it("should match user and token", () => {
      const result = PushSubscription.create({
        userId: "user-123",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(
          result.value.matches(
            "user-123",
            "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
          ),
        ).toBe(true);
        expect(
          result.value.matches(
            "other-user",
            "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
          ),
        ).toBe(false);
        expect(result.value.matches("user-123", "other-token")).toBe(false);
      }
    });
  });

  describe("PushSubscription.getCompositeId", () => {
    it("should return composite ID", () => {
      const result = PushSubscription.create({
        userId: "user-123",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getCompositeId()).toBe(
          "user-123:ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
        );
      }
    });
  });

  describe("PushSubscription.getMaskedToken", () => {
    it("should mask token for display", () => {
      const result = PushSubscription.create({
        userId: "user-123",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const masked = result.value.getMaskedToken();
        expect(masked).toContain("****");
        expect(masked.length).toBeLessThan(result.value.token.length);
      }
    });

    it("should handle short tokens", () => {
      const result = PushSubscription.create({
        userId: "user-123",
        token: "short-token-12",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const masked = result.value.getMaskedToken();
        expect(masked).toContain("****");
        // Short tokens (<= 8 chars) should show just "****"
        expect(masked.length).toBeLessThanOrEqual(12);
      }
    });
  });
});
