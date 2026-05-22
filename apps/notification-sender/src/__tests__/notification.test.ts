import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Scheduler, createInactivityScheduler } from "../utils/scheduler";

describe("Scheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("basic functionality", () => {
    it("should create a scheduler with task and interval", () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      expect(scheduler).toBeDefined();
      expect(scheduler.isActive()).toBe(false);
    });

    it("should start and become active", () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();

      expect(scheduler.isActive()).toBe(true);
    });

    it("should stop and become inactive", () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();
      expect(scheduler.isActive()).toBe(true);

      scheduler.stop();
      expect(scheduler.isActive()).toBe(false);
    });
  });

  describe("task execution", () => {
    it("should run task immediately when started", async () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();

      // Wait for the setTimeout to execute
      await vi.advanceTimersByTimeAsync(0);

      expect(task).toHaveBeenCalledTimes(1);
    });

    it("should run task at regular intervals", async () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();

      // Wait for immediate execution
      await vi.advanceTimersByTimeAsync(0);
      expect(task).toHaveBeenCalledTimes(1);

      // Advance 5 minutes (300000 ms)
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      expect(task).toHaveBeenCalledTimes(2);

      // Advance another 5 minutes
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      expect(task).toHaveBeenCalledTimes(3);
    });

    it("should handle task errors gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
        /* noop */
      });
      const error = new Error("Task failed");
      const task = vi.fn().mockRejectedValue(error);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();

      // Wait for the setTimeout to execute
      await vi.advanceTimersByTimeAsync(0);

      expect(task).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith("Scheduler task failed", expect.objectContaining({ message: "Task failed" }));

      consoleSpy.mockRestore();
    });
  });

  describe("edge cases", () => {
    it("should not start if already running", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        /* noop */
      });
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();
      scheduler.start(); // Try to start again

      expect(consoleSpy).toHaveBeenCalledWith("Scheduler is already running");
      expect(scheduler.isActive()).toBe(true);

      consoleSpy.mockRestore();
    });

    it("should handle stop when not running gracefully", () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      // Should not throw
      expect(() => scheduler.stop()).not.toThrow();
      expect(scheduler.isActive()).toBe(false);
    });
  });
});

describe("createInactivityScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should create a scheduler with default interval", () => {
    const checkFunction = vi.fn().mockResolvedValue({ count: 0 });
    const scheduler = createInactivityScheduler(checkFunction);

    expect(scheduler).toBeDefined();
    expect(scheduler.isActive()).toBe(false);
  });

  it("should create a scheduler with custom interval", () => {
    const checkFunction = vi.fn().mockResolvedValue({ count: 0 });
    const scheduler = createInactivityScheduler(checkFunction, 10);

    expect(scheduler).toBeDefined();
  });

  it("should run inactivity check and log results", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
      /* noop */
    });
    const checkFunction = vi.fn().mockResolvedValue({ inactiveUsers: 5 });
    const scheduler = createInactivityScheduler(checkFunction, 5);

    scheduler.start();

    // Wait for immediate execution
    await vi.advanceTimersByTimeAsync(0);

    expect(checkFunction).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith("Running inactivity check");
    expect(consoleSpy).toHaveBeenCalledWith("Inactivity check completed", { result: { inactiveUsers: 5 } });

    consoleSpy.mockRestore();
  });
});
