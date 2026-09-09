import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SchedulerLogger } from "../scheduler";
import { IntervalScheduler } from "../scheduler";

type LogFn = (objOrMsg: unknown, msg?: string) => void;

function createLogger() {
  const logger = {
    info: vi.fn<LogFn>(),
    warn: vi.fn<LogFn>(),
    error: vi.fn<LogFn>(),
  };
  return logger satisfies SchedulerLogger;
}

describe("IntervalScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is inactive until started", () => {
    const scheduler = new IntervalScheduler(async () => undefined, 5);
    expect(scheduler.isActive()).toBe(false);
  });

  it("creates no timers at construction time", async () => {
    const task = vi.fn(async () => undefined);
    new IntervalScheduler(task, 5);

    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    expect(task).not.toHaveBeenCalled();
  });

  it("runs the task immediately and then on the interval", async () => {
    const task = vi.fn(async () => undefined);
    const scheduler = new IntervalScheduler(task, 5);

    scheduler.start();
    expect(scheduler.isActive()).toBe(true);

    await vi.advanceTimersByTimeAsync(0);
    expect(task).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(task).toHaveBeenCalledTimes(2);

    scheduler.stop();
  });

  it("runs once when the interval is zero", async () => {
    const task = vi.fn(async () => undefined);
    const scheduler = new IntervalScheduler(task, 0);

    scheduler.start();
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

    expect(task).toHaveBeenCalledTimes(1);
    scheduler.stop();
  });

  it("logs a failing task and keeps running", async () => {
    const logger = createLogger();
    const task = vi.fn(async () => {
      throw new Error("boom");
    });
    const scheduler = new IntervalScheduler(task, 5, logger);

    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(logger.error).toHaveBeenCalledWith(expect.any(Error), "Scheduler task failed");
    expect(scheduler.isActive()).toBe(true);

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(task).toHaveBeenCalledTimes(2);

    scheduler.stop();
  });

  it("warns instead of starting twice", () => {
    const logger = createLogger();
    const scheduler = new IntervalScheduler(async () => undefined, 5, logger);

    scheduler.start();
    scheduler.start();

    expect(logger.warn).toHaveBeenCalledWith("Scheduler is already running");
    scheduler.stop();
  });

  it("stops cleanly and clears pending timers", async () => {
    const task = vi.fn(async () => undefined);
    const logger = createLogger();
    const scheduler = new IntervalScheduler(task, 5, logger);

    scheduler.start();
    scheduler.stop();

    await vi.advanceTimersByTimeAsync(30 * 60 * 1000);

    expect(task).not.toHaveBeenCalled();
    expect(scheduler.isActive()).toBe(false);
    expect(logger.info).toHaveBeenCalledWith("Scheduler stopped");
  });

  it("tolerates stop before start and repeated stops", () => {
    const scheduler = new IntervalScheduler(async () => undefined, 5);

    expect(() => scheduler.stop()).not.toThrow();
    scheduler.start();
    scheduler.stop();
    expect(() => scheduler.stop()).not.toThrow();
  });

  it("works without a logger", async () => {
    const task = vi.fn(async () => {
      throw new Error("boom");
    });
    const scheduler = new IntervalScheduler(task, 5);

    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(task).toHaveBeenCalledTimes(1);
    scheduler.stop();
  });

  it("logs the configured interval on start", () => {
    const logger = createLogger();
    const scheduler = new IntervalScheduler(async () => undefined, 15, logger);

    scheduler.start();

    expect(logger.info).toHaveBeenCalledWith({ intervalMinutes: 15 }, "Scheduler started");
    scheduler.stop();
  });
});
