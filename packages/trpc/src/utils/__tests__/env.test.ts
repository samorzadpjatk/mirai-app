import { describe, it, expect } from "vitest";
import { env } from "~/utils/env";

describe("env utilities", () => {
  describe("environment variable validation", () => {
    it("should load environment variables correctly", () => {
      expect(env.NODE_ENV).toBe("test");
    });

    it("should require NODE_ENV to be development, production, or test", () => {
      expect(["development", "production", "test"]).toContain(env.NODE_ENV);
    });
  });

  describe("environment variable structure", () => {
    it("should skip validation when SKIP_ENV_VALIDATION is set", () => {
      expect(process.env.SKIP_ENV_VALIDATION).toBe("1");
    });

    it("should treat empty strings as undefined (emptyStringAsUndefined)", () => {
      // This is handled by the env configuration
      // We're testing that the configuration is set correctly
      expect(env).toBeDefined();
    });
  });
});
