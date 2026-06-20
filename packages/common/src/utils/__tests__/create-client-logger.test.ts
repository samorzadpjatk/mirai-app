import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClientLogger } from "../create-client-logger";

const spies = vi.hoisted(() => ({
  info: vi.spyOn(console, "info").mockImplementation(() => undefined),
  warn: vi.spyOn(console, "warn").mockImplementation(() => undefined),
  error: vi.spyOn(console, "error").mockImplementation(() => undefined),
}));

describe("createClientLogger", () => {
  beforeEach(() => {
    spies.info.mockClear();
    spies.warn.mockClear();
    spies.error.mockClear();
  });

  it("logs info messages with prefix", () => {
    const logger = createClientLogger({ prefix: "test" });
    logger.info("hello");
    expect(spies.info).toHaveBeenCalledWith("[test] hello");
  });

  it("logs warn messages with prefix", () => {
    const logger = createClientLogger({ prefix: "test" });
    logger.warn("warning");
    expect(spies.warn).toHaveBeenCalledWith("[test] warning");
  });

  it("logs error messages with prefix", () => {
    const logger = createClientLogger({ prefix: "test" });
    logger.error("error");
    expect(spies.error).toHaveBeenCalledWith("[test] error");
  });

  it("passes extra arguments through", () => {
    const logger = createClientLogger({ prefix: "test" });
    logger.info("message", { extra: "data" }, 42);
    expect(spies.info).toHaveBeenCalledWith("[test] message", { extra: "data" }, 42);
  });

  it("uses different prefixes for different loggers", () => {
    const loggerA = createClientLogger({ prefix: "A" });
    const loggerB = createClientLogger({ prefix: "B" });
    loggerA.info("from A");
    loggerB.info("from B");
    expect(spies.info).toHaveBeenCalledWith("[A] from A");
    expect(spies.info).toHaveBeenCalledWith("[B] from B");
  });
});
