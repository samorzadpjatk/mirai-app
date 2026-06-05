import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "../logger-factory";

const spies = vi.hoisted(() => ({
  info: vi.spyOn(console, "info").mockImplementation(() => undefined),
  warn: vi.spyOn(console, "warn").mockImplementation(() => undefined),
  error: vi.spyOn(console, "error").mockImplementation(() => undefined),
}));

describe("createLogger", () => {
  beforeEach(() => {
    spies.info.mockClear();
    spies.warn.mockClear();
    spies.error.mockClear();
  });

  describe("test environment (VITEST=true)", () => {
    it("logs info messages via console.info (level < 40)", () => {
      const logger = createLogger({ name: "test" });
      logger.info("hello info");
      expect(spies.info).toHaveBeenCalledWith("hello info");
    });

    it("logs warn messages via console.warn (level >= 40)", () => {
      const logger = createLogger({ name: "test" });
      logger.warn("hello warn");
      expect(spies.warn).toHaveBeenCalledWith("hello warn");
    });

    it("logs error messages via console.error (level >= 50)", () => {
      const logger = createLogger({ name: "test" });
      logger.error("hello error");
      expect(spies.error).toHaveBeenCalledWith("hello error");
    });

    it("includes error object in extras for error logs", () => {
      const logger = createLogger({ name: "test" });
      const err = new Error("boom");
      logger.error({ err, msg: "failed" });
      expect(spies.error).toHaveBeenCalledWith(
        "failed",
        expect.objectContaining({ message: "boom" }),
      );
    });

    it("includes extra fields in extras for warn logs", () => {
      const logger = createLogger({ name: "test" });
      logger.warn({ userId: "123", msg: "something" });
      expect(spies.warn).toHaveBeenCalledWith("something", { userId: "123" });
    });

    it("uses LOG_LEVEL from environment", () => {
      vi.stubEnv("LOG_LEVEL", "debug");
      const logger = createLogger({ name: "test" });
      expect(logger.level).toBe("debug");
      vi.unstubAllEnvs();
    });

    it("defaults to 'info' level when LOG_LEVEL is not set", () => {
      vi.unstubAllEnvs();
      const logger = createLogger({ name: "test" });
      expect(logger.level).toBe("info");
    });
  });

  describe("non-test environment", () => {
    it("creates logger with undefined destination when VITEST is not 'true'", () => {
      vi.stubEnv("VITEST", "false");
      const logger = createLogger({ name: "test" });
      expect(logger).toBeDefined();
      vi.unstubAllEnvs();
    });
  });
});
