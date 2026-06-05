import { beforeEach, describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({
  info: vi.spyOn(console, "info").mockImplementation(() => undefined),
  warn: vi.spyOn(console, "warn").mockImplementation(() => undefined),
  error: vi.spyOn(console, "error").mockImplementation(() => undefined),
}));

describe("logger", () => {
  describe("test environment", () => {
    beforeEach(() => {
      spies.info.mockClear();
      spies.warn.mockClear();
      spies.error.mockClear();
    });

    it("logs info messages via console.info (level < 40 branch)", async () => {
      const { logger } = await import("../../utils/logger");
      logger.info("hello info");
      expect(spies.info).toHaveBeenCalledWith("hello info");
    });

    it("logs warn messages via console.warn (level >= 40 branch)", async () => {
      const { logger } = await import("../../utils/logger");
      logger.warn("hello warn");
      expect(spies.warn).toHaveBeenCalledWith("hello warn");
    });

    it("logs error messages via console.error (level >= 50 branch)", async () => {
      const { logger } = await import("../../utils/logger");
      logger.error("hello error");
      expect(spies.error).toHaveBeenCalledWith("hello error");
    });
  });

  describe("non-test environment", () => {
    it("creates logger with undefined destination when VITEST is not true", async () => {
      vi.stubEnv("VITEST", "false");
      vi.resetModules();

      try {
        const mod = await import("../../utils/logger");
        expect(mod.logger).toBeDefined();
      } finally {
        vi.unstubAllEnvs();
        vi.resetModules();
      }
    });
  });
});
