import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { UserAgent, UserAgentPlatform } from "./UserAgent";
import { ValidationError } from "../errors/effect-errors";

describe("[UNIT] UserAgent Entity", () => {
  describe("UserAgent.create", () => {
    it("should create with valid data", () => {
      const effect = UserAgent.create({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
        platform: UserAgentPlatform.IOS,
      });

      const userAgent = Effect.runSync(effect);
      expect(userAgent.id).toBeDefined();
      expect(userAgent.userAgentString).toContain("Mozilla");
      expect(userAgent.platform).toBe(UserAgentPlatform.IOS);
      expect(userAgent.isIOS()).toBe(true);
      expect(userAgent.isAnonymous()).toBe(true);
    });

    it("should create with user and endpoint", () => {
      const effect = UserAgent.create({
        userAgent: "Mozilla/5.0 (Linux; Android 10)",
        platform: UserAgentPlatform.ANDROID,
        userId: "user-123",
        endpoint: "/api/users/profile",
      });

      const userAgent = Effect.runSync(effect);
      expect(userAgent.userId).toBe("user-123");
      expect(userAgent.endpoint).toBe("/api/users/profile");
      expect(userAgent.isAuthenticated()).toBe(true);
      expect(userAgent.hasEndpoint()).toBe(true);
    });

    it("should reject empty user agent", () => {
      const effect = UserAgent.create({
        userAgent: "",
        platform: UserAgentPlatform.IOS,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject short user agent", () => {
      const effect = UserAgent.create({
        userAgent: "short",
        platform: UserAgentPlatform.IOS,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject invalid platform", () => {
      const effect = UserAgent.create({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
        platform: "invalid-platform" as UserAgentPlatform,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("UserAgent.detectPlatform", () => {
    it("should detect iOS", () => {
      const platform = UserAgent.detectPlatform(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      );
      expect(platform).toBe(UserAgentPlatform.IOS);
    });

    it("should detect Android", () => {
      const platform = UserAgent.detectPlatform(
        "Mozilla/5.0 (Linux; Android 10; SM-G973F)",
      );
      expect(platform).toBe(UserAgentPlatform.ANDROID);
    });

    it("should detect Web", () => {
      const platform = UserAgent.detectPlatform(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0",
      );
      expect(platform).toBe(UserAgentPlatform.WEB);
    });

    it("should return unknown for unrecognized", () => {
      const platform = UserAgent.detectPlatform("SomeBot/1.0");
      expect(platform).toBe(UserAgentPlatform.UNKNOWN);
    });
  });

  describe("UserAgent.createWithDetectedPlatform", () => {
    it("should auto-detect iOS platform", () => {
      const effect = UserAgent.createWithDetectedPlatform({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      });

      const userAgent = Effect.runSync(effect);
      expect(userAgent.platform).toBe(UserAgentPlatform.IOS);
    });

    it("should auto-detect Android platform", () => {
      const effect = UserAgent.createWithDetectedPlatform({
        userAgent: "Mozilla/5.0 (Linux; Android 10)",
      });

      const userAgent = Effect.runSync(effect);
      expect(userAgent.platform).toBe(UserAgentPlatform.ANDROID);
    });
  });

  describe("UserAgent.platform checks", () => {
    it("should identify iOS", () => {
      const effect = UserAgent.create({
        userAgent: "Mozilla/5.0 (iPhone)",
        platform: UserAgentPlatform.IOS,
      });

      const userAgent = Effect.runSync(effect);
      expect(userAgent.isIOS()).toBe(true);
      expect(userAgent.isAndroid()).toBe(false);
      expect(userAgent.isWeb()).toBe(false);
    });

    it("should identify Android", () => {
      const effect = UserAgent.create({
        userAgent: "Mozilla/5.0 (Linux; Android)",
        platform: UserAgentPlatform.ANDROID,
      });

      const userAgent = Effect.runSync(effect);
      expect(userAgent.isAndroid()).toBe(true);
      expect(userAgent.isIOS()).toBe(false);
    });

    it("should identify Web", () => {
      const effect = UserAgent.create({
        userAgent: "Mozilla/5.0 (Windows NT)",
        platform: UserAgentPlatform.WEB,
      });

      const userAgent = Effect.runSync(effect);
      expect(userAgent.isWeb()).toBe(true);
    });
  });

  describe("UserAgent.belongsToUser", () => {
    it("should check if belongs to specific user", () => {
      const effect = UserAgent.create({
        userAgent: "Mozilla/5.0",
        platform: UserAgentPlatform.IOS,
        userId: "user-123",
      });

      const userAgent = Effect.runSync(effect);
      expect(userAgent.belongsToUser("user-123")).toBe(true);
      expect(userAgent.belongsToUser("other-user")).toBe(false);
    });
  });

  describe("UserAgent.isOlderThan", () => {
    it("should calculate age correctly", () => {
      const timestamp = new Date(Date.now() - 60000); // 1 minute ago
      const effect = UserAgent.create({
        userAgent: "Mozilla/5.0 (iPhone)",
        platform: UserAgentPlatform.IOS,
        timestamp,
      });

      const userAgent = Effect.runSync(effect);
      expect(userAgent.isOlderThan(30000)).toBe(true); // Older than 30 seconds
      expect(userAgent.isOlderThan(120000)).toBe(false); // Not older than 2 minutes
    });
  });
});
