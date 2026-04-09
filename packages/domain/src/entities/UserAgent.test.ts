import { describe, it, expect } from "bun:test";
import { UserAgent, UserAgentPlatform } from "./UserAgent";

describe("[UNIT] UserAgent Entity", () => {
  describe("UserAgent.create", () => {
    it("should create with valid data", () => {
      const result = UserAgent.create({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
        platform: UserAgentPlatform.IOS,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.userAgentString).toContain("Mozilla");
        expect(result.value.platform).toBe(UserAgentPlatform.IOS);
        expect(result.value.isIOS()).toBe(true);
        expect(result.value.isAnonymous()).toBe(true);
      }
    });

    it("should create with user and endpoint", () => {
      const result = UserAgent.create({
        userAgent: "Mozilla/5.0 (Linux; Android 10)",
        platform: UserAgentPlatform.ANDROID,
        userId: "user-123",
        endpoint: "/api/users/profile",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.userId).toBe("user-123");
        expect(result.value.endpoint).toBe("/api/users/profile");
        expect(result.value.isAuthenticated()).toBe(true);
        expect(result.value.hasEndpoint()).toBe(true);
      }
    });

    it("should reject empty user agent", () => {
      const result = UserAgent.create({
        userAgent: "",
        platform: UserAgentPlatform.IOS,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject short user agent", () => {
      const result = UserAgent.create({
        userAgent: "short",
        platform: UserAgentPlatform.IOS,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject invalid platform", () => {
      const result = UserAgent.create({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
        platform: "invalid-platform" as UserAgentPlatform,
      });

      expect(result.kind).toBe("err");
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
      const result = UserAgent.createWithDetectedPlatform({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.platform).toBe(UserAgentPlatform.IOS);
      }
    });

    it("should auto-detect Android platform", () => {
      const result = UserAgent.createWithDetectedPlatform({
        userAgent: "Mozilla/5.0 (Linux; Android 10)",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.platform).toBe(UserAgentPlatform.ANDROID);
      }
    });
  });

  describe("UserAgent.platform checks", () => {
    it("should identify iOS", () => {
      const result = UserAgent.create({
        userAgent: "Mozilla/5.0 (iPhone)",
        platform: UserAgentPlatform.IOS,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isIOS()).toBe(true);
        expect(result.value.isAndroid()).toBe(false);
        expect(result.value.isWeb()).toBe(false);
      }
    });

    it("should identify Android", () => {
      const result = UserAgent.create({
        userAgent: "Mozilla/5.0 (Linux; Android)",
        platform: UserAgentPlatform.ANDROID,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isAndroid()).toBe(true);
        expect(result.value.isIOS()).toBe(false);
      }
    });

    it("should identify Web", () => {
      const result = UserAgent.create({
        userAgent: "Mozilla/5.0 (Windows NT)",
        platform: UserAgentPlatform.WEB,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isWeb()).toBe(true);
      }
    });
  });

  describe("UserAgent.belongsToUser", () => {
    it("should check if belongs to specific user", () => {
      const result = UserAgent.create({
        userAgent: "Mozilla/5.0",
        platform: UserAgentPlatform.IOS,
        userId: "user-123",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.belongsToUser("user-123")).toBe(true);
        expect(result.value.belongsToUser("other-user")).toBe(false);
      }
    });
  });

  describe("UserAgent.isOlderThan", () => {
    it("should calculate age correctly", () => {
      const timestamp = new Date(Date.now() - 60000); // 1 minute ago
      const result = UserAgent.create({
        userAgent: "Mozilla/5.0 (iPhone)",
        platform: UserAgentPlatform.IOS,
        timestamp,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isOlderThan(30000)).toBe(true); // Older than 30 seconds
        expect(result.value.isOlderThan(120000)).toBe(false); // Not older than 2 minutes
      }
    });
  });
});
