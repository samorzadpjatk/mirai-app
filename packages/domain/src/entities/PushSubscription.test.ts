import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { PushSubscription } from "./PushSubscription";
import { ValidationError } from "../errors/effect-errors";

describe("[UNIT] PushSubscription Entity", () => {
  describe("PushSubscription.create", () => {
    it("should create with valid data", () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      const subscription = Effect.runSync(effect);
      expect(subscription.id).toBeDefined();
      expect(subscription.userId).toBe("user-123");
      expect(subscription.token).toBe(
        "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      );
      expect(subscription.createdAt).toBeInstanceOf(Date);
    });

    it("should reject empty userId", () => {
      const effect = PushSubscription.create({
        userId: "",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("userId");
      }
    });

    it("should reject empty token", () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("token");
      }
    });

    it("should reject short token", () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "short",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("token");
      }
    });
  });

  describe("PushSubscription.belongsToUser / hasToken / matches", () => {
    it("should check if belongs to user", () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      const subscription = Effect.runSync(effect);
      expect(subscription.belongsToUser("user-123")).toBe(true);
      expect(subscription.belongsToUser("other-user")).toBe(false);
    });

    it("should check if has specific token", () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      const subscription = Effect.runSync(effect);
      expect(
        subscription.hasToken("ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"),
      ).toBe(true);
      expect(subscription.hasToken("other-token")).toBe(false);
    });

    it("should match user and token", () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      const subscription = Effect.runSync(effect);
      expect(
        subscription.matches(
          "user-123",
          "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
        ),
      ).toBe(true);
      expect(
        subscription.matches(
          "other-user",
          "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
        ),
      ).toBe(false);
      expect(subscription.matches("user-123", "other-token")).toBe(false);
    });
  });

  describe("PushSubscription.getCompositeId", () => {
    it("should return composite ID", () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      const subscription = Effect.runSync(effect);
      expect(subscription.getCompositeId()).toBe(
        "user-123:ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      );
    });
  });

  describe("PushSubscription.getMaskedToken", () => {
    it("should mask token for display", () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      });

      const subscription = Effect.runSync(effect);
      const masked = subscription.getMaskedToken();
      expect(masked).toContain("****");
      expect(masked.length).toBeLessThan(subscription.token.length);
    });

    it("should handle short tokens", () => {
      const effect = PushSubscription.create({
        userId: "user-123",
        token: "short-token-12",
      });

      const subscription = Effect.runSync(effect);
      const masked = subscription.getMaskedToken();
      expect(masked).toContain("****");
      // Short tokens (<= 8 chars) should show just "****"
      expect(masked.length).toBeLessThanOrEqual(12);
    });
  });
});
