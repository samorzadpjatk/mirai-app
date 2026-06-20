import { describe, expect, it, vi } from "vitest";
import { getEnv, isTestEnv, requireEnv } from "../env";

describe("env utilities", () => {
  describe("getEnv", () => {
    it("returns the value of an existing environment variable", () => {
      vi.stubEnv("TEST_VAR", "hello");
      expect(getEnv("TEST_VAR")).toBe("hello");
      vi.unstubAllEnvs();
    });

    it("returns undefined for a missing environment variable", () => {
      expect(getEnv("NONEXISTENT_VAR_12345")).toBeUndefined();
    });
  });

  describe("requireEnv", () => {
    it("returns the value of an existing environment variable", () => {
      vi.stubEnv("TEST_VAR", "hello");
      expect(requireEnv("TEST_VAR")).toBe("hello");
      vi.unstubAllEnvs();
    });

    it("throws for a missing environment variable", () => {
      expect(() => requireEnv("NONEXISTENT_VAR_12345")).toThrow(
        "Missing required environment variable: NONEXISTENT_VAR_12345",
      );
    });

    it("throws for an empty environment variable", () => {
      vi.stubEnv("EMPTY_VAR", "");
      expect(() => requireEnv("EMPTY_VAR")).toThrow(
        "Missing required environment variable: EMPTY_VAR",
      );
      vi.unstubAllEnvs();
    });
  });

  describe("isTestEnv", () => {
    it("returns true when VITEST is 'true'", () => {
      vi.stubEnv("VITEST", "true");
      expect(isTestEnv()).toBe(true);
      vi.unstubAllEnvs();
    });

    it("returns false when VITEST is explicitly removed", () => {
      vi.stubEnv("VITEST", undefined);
      expect(isTestEnv()).toBe(false);
      vi.unstubAllEnvs();
    });

    it("returns false when VITEST is 'false'", () => {
      vi.stubEnv("VITEST", "false");
      expect(isTestEnv()).toBe(false);
      vi.unstubAllEnvs();
    });
  });
});
