import { logger } from "@mirai-app/orpc";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Scheduler, createInactivityScheduler } from "../scheduler";

vi.mock("@mirai-app/orpc", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Scheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
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

    it("should handle multiple start/stop cycles", () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      // First cycle
      scheduler.start();
      expect(scheduler.isActive()).toBe(true);
      scheduler.stop();
      expect(scheduler.isActive()).toBe(false);

      // Second cycle
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
      const error = new Error("Task failed");
      const task = vi.fn().mockRejectedValue(error);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();

      // Wait for the setTimeout to execute
      await vi.advanceTimersByTimeAsync(0);

      expect(task).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Task failed" }),
        "Scheduler task failed",
      );

      scheduler.stop();
    });

    it("should continue running after task errors", async () => {
      const task = vi
        .fn()
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();

      // First execution - fails
      await vi.advanceTimersByTimeAsync(0);
      expect(task).toHaveBeenCalledTimes(1);
      expect(scheduler.isActive()).toBe(true);

      // Second execution - succeeds
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      expect(task).toHaveBeenCalledTimes(2);
      expect(scheduler.isActive()).toBe(true);

      // Third execution - succeeds
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      expect(task).toHaveBeenCalledTimes(3);
      expect(scheduler.isActive()).toBe(true);
    });

    it("should handle async tasks correctly", async () => {
      let resolveTask: (value: void) => void;
      const taskPromise = new Promise<void>((resolve) => {
        resolveTask = resolve;
      });
      const task = vi.fn().mockReturnValue(taskPromise);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);

      expect(task).toHaveBeenCalledTimes(1);

      // Resolve the task
      resolveTask!();
      await vi.advanceTimersByTimeAsync(0);

      expect(scheduler.isActive()).toBe(true);
    });

    it("should handle tasks with different intervals", async () => {
      const task1 = vi.fn().mockResolvedValue(undefined);
      const scheduler1 = new Scheduler(task1, 1); // 1 minute

      const task2 = vi.fn().mockResolvedValue(undefined);
      const scheduler2 = new Scheduler(task2, 10); // 10 minutes

      scheduler1.start();
      scheduler2.start();

      await vi.advanceTimersByTimeAsync(0);
      expect(task1).toHaveBeenCalledTimes(1);
      expect(task2).toHaveBeenCalledTimes(1);

      // After 1 minute - only scheduler1 should run
      await vi.advanceTimersByTimeAsync(1 * 60 * 1000);
      expect(task1).toHaveBeenCalledTimes(2);
      expect(task2).toHaveBeenCalledTimes(1);

      // After 9 more minutes (10 total) - both should have run
      await vi.advanceTimersByTimeAsync(9 * 60 * 1000);
      expect(task1).toHaveBeenCalledTimes(11);
      expect(task2).toHaveBeenCalledTimes(2);
    });
  });

  describe("edge cases", () => {
    it("should not start if already running", () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();
      scheduler.start(); // Try to start again

      expect(logger.warn).toHaveBeenCalledWith("Scheduler is already running");
      expect(scheduler.isActive()).toBe(true);
    });

    it("should handle stop when not running gracefully", () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      // Should not throw
      expect(() => scheduler.stop()).not.toThrow();
      expect(scheduler.isActive()).toBe(false);
    });

    it("should handle stop called multiple times", () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();
      scheduler.stop();

      // Should not throw when stopped again
      expect(() => scheduler.stop()).not.toThrow();
      expect(scheduler.isActive()).toBe(false);
    });

    it("should handle zero interval", async () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 0);

      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);

      expect(task).toHaveBeenCalledTimes(1);
      expect(scheduler.isActive()).toBe(true);
    });

    it("should handle very long intervals", async () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 1440); // 24 hours

      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);

      expect(task).toHaveBeenCalledTimes(1);

      // Advance 24 hours
      await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
      expect(task).toHaveBeenCalledTimes(2);
    });

    it("should clear interval on stop", async () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);
      expect(task).toHaveBeenCalledTimes(1);

      scheduler.stop();

      // Advance time - task should not be called again
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
      expect(task).toHaveBeenCalledTimes(1);
    });

    it("should handle task that throws synchronously", async () => {
      const error = new Error("Sync error");
      const task = vi.fn().mockImplementation(() => {
        throw error;
      });
      const scheduler = new Scheduler(task, 5);

      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);

      expect(task).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Sync error" }),
        "Scheduler task failed",
      );

      scheduler.stop();
    });

    it("should handle task returning non-promise value", async () => {
      const task = vi.fn().mockReturnValue("not a promise");
      const scheduler = new Scheduler(task, 5);

      scheduler.start();
      await vi.advanceTimersByTimeAsync(0);

      expect(task).toHaveBeenCalledTimes(1);
      // Should not throw error since non-promise is awaitable
      expect(logger.error).not.toHaveBeenCalled();

      scheduler.stop();
    });
  });

  describe("logging", () => {
    it("should log when started", () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();

      expect(logger.info).toHaveBeenCalledWith({ intervalMinutes: 5 }, "Scheduler started");

      scheduler.stop();
    });

    it("should log when stopped", () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 5);

      scheduler.start();
      scheduler.stop();

      expect(logger.info).toHaveBeenCalledWith("Scheduler stopped");
    });

    it("should log with correct interval", () => {
      const task = vi.fn().mockResolvedValue(undefined);
      const scheduler = new Scheduler(task, 15);

      scheduler.start();

      expect(logger.info).toHaveBeenCalledWith({ intervalMinutes: 15 }, "Scheduler started");

      scheduler.stop();
    });
  });
});

describe("createInactivityScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
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

  it("should create a scheduler with custom interval", async () => {
    const checkFunction = vi.fn().mockResolvedValue({ count: 0 });
    const scheduler = createInactivityScheduler(checkFunction, 10);

    expect(scheduler.isActive()).toBe(false);
    scheduler.start();
    expect(logger.info).toHaveBeenCalledWith({ intervalMinutes: 10 }, "Scheduler started");

    // Runs immediately on start
    await vi.advanceTimersByTimeAsync(0);
    expect(checkFunction).toHaveBeenCalledTimes(1);

    // Should not fire again before interval
    await vi.advanceTimersByTimeAsync(9 * 60 * 1000);
    expect(checkFunction).toHaveBeenCalledTimes(1);

    // Should fire at interval boundary
    await vi.advanceTimersByTimeAsync(1 * 60 * 1000);
    expect(checkFunction).toHaveBeenCalledTimes(2);
    scheduler.stop();
  });

  it("should run inactivity check and log results", async () => {
    const checkFunction = vi.fn().mockResolvedValue({ inactiveUsers: 5 });
    const scheduler = createInactivityScheduler(checkFunction, 5);

    scheduler.start();

    // Wait for immediate execution
    await vi.advanceTimersByTimeAsync(0);

    expect(checkFunction).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledTimes(3);
    expect(logger.info).toHaveBeenNthCalledWith(1, { intervalMinutes: 5 }, "Scheduler started");
    expect(logger.info).toHaveBeenNthCalledWith(2, "Running inactivity check");
    expect(logger.info).toHaveBeenNthCalledWith(
      3,
      { result: { inactiveUsers: 5 } },
      "Inactivity check completed",
    );

    scheduler.stop();
  });

  it("should handle check function errors", async () => {
    const error = new Error("Check failed");
    const checkFunction = vi.fn().mockRejectedValue(error);
    const scheduler = createInactivityScheduler(checkFunction, 5);

    scheduler.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(checkFunction).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Check failed" }),
      "Scheduler task failed",
    );

    scheduler.stop();
  });

  it("should run check at regular intervals", async () => {
    const checkFunction = vi.fn().mockResolvedValue({ count: 0 });
    const scheduler = createInactivityScheduler(checkFunction, 5);

    scheduler.start();

    // First execution
    await vi.advanceTimersByTimeAsync(0);
    expect(checkFunction).toHaveBeenCalledTimes(1);

    // Second execution after 5 minutes
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(checkFunction).toHaveBeenCalledTimes(2);

    // Third execution after another 5 minutes
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(checkFunction).toHaveBeenCalledTimes(3);

    scheduler.stop();
  });

  it("should handle check function returning different types", async () => {
    // Test with array
    const checkFunction1 = vi.fn().mockResolvedValue([1, 2, 3]);
    const scheduler1 = createInactivityScheduler(checkFunction1, 5);
    scheduler1.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(logger.info).toHaveBeenCalledWith({ result: [1, 2, 3] }, "Inactivity check completed");
    scheduler1.stop();

    // Test with null
    const checkFunction2 = vi.fn().mockResolvedValue(null);
    const scheduler2 = createInactivityScheduler(checkFunction2, 5);
    scheduler2.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(logger.info).toHaveBeenCalledWith({ result: null }, "Inactivity check completed");
    scheduler2.stop();

    // Test with undefined
    const checkFunction3 = vi.fn().mockResolvedValue(undefined);
    const scheduler3 = createInactivityScheduler(checkFunction3, 5);
    scheduler3.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(logger.info).toHaveBeenCalledWith({ result: null }, "Inactivity check completed");
    scheduler3.stop();
  });

  it("should handle check function returning primitive values", async () => {
    // Test with number
    const checkFunction1 = vi.fn().mockResolvedValue(42);
    const scheduler1 = createInactivityScheduler(checkFunction1, 5);
    scheduler1.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(logger.info).toHaveBeenCalledWith({ result: 42 }, "Inactivity check completed");
    scheduler1.stop();

    // Test with string
    const checkFunction2 = vi.fn().mockResolvedValue("completed");
    const scheduler2 = createInactivityScheduler(checkFunction2, 5);
    scheduler2.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(logger.info).toHaveBeenCalledWith({ result: "completed" }, "Inactivity check completed");
    scheduler2.stop();

    // Test with boolean
    const checkFunction3 = vi.fn().mockResolvedValue(true);
    const scheduler3 = createInactivityScheduler(checkFunction3, 5);
    scheduler3.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(logger.info).toHaveBeenCalledWith({ result: true }, "Inactivity check completed");
    scheduler3.stop();
  });
});
