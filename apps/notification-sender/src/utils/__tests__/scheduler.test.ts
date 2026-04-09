import {
  describe,
  test,
  expect,
  spyOn,
  mock,
  beforeEach,
  afterEach,
} from "bun:test";
import { Scheduler, createInactivityScheduler } from "../scheduler";

describe("[UNIT] Scheduler", () => {
  describe("start()", () => {
    test("runs task immediately via setTimeout", async () => {
      const task = mock(() => Promise.resolve());
      const scheduler = new Scheduler(task, 5);

      scheduler.start();

      // Wait for immediate setTimeout to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(task).toHaveBeenCalledTimes(1);
      scheduler.stop();
    });

    test("starts running task at regular intervals", async () => {
      const task = mock(() => Promise.resolve());
      const scheduler = new Scheduler(task, 0.01); // 0.01 minutes = 600ms

      scheduler.start();

      // Wait for first immediate run
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(task).toHaveBeenCalledTimes(1);

      // Wait for interval run (600ms = 0.01 minutes)
      await new Promise((resolve) => setTimeout(resolve, 700));
      expect(task).toHaveBeenCalledTimes(2);

      scheduler.stop();
    });

    test("logs start message with interval", () => {
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      const scheduler = new Scheduler(() => Promise.resolve(), 10);

      scheduler.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Scheduler started. Running task every 10 minutes.",
      );

      consoleSpy.mockRestore();
      scheduler.stop();
    });
  });

  describe("double-start prevention", () => {
    test("prevents double-start and logs warning", () => {
      const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});
      const scheduler = new Scheduler(() => Promise.resolve(), 5);

      scheduler.start();
      scheduler.start();

      expect(consoleSpy).toHaveBeenCalledWith("Scheduler is already running");
      expect(scheduler.isActive()).toBe(true);

      consoleSpy.mockRestore();
      scheduler.stop();
    });
  });

  describe("stop()", () => {
    test("clears interval and updates state", () => {
      const scheduler = new Scheduler(() => Promise.resolve(), 5);

      scheduler.start();
      expect(scheduler.isActive()).toBe(true);

      scheduler.stop();
      expect(scheduler.isActive()).toBe(false);
    });

    test("logs stop message", () => {
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      const scheduler = new Scheduler(() => Promise.resolve(), 5);

      scheduler.start();
      scheduler.stop();

      expect(consoleSpy).toHaveBeenCalledWith("Scheduler stopped.");

      consoleSpy.mockRestore();
    });
  });

  describe("stopping inactive scheduler", () => {
    test("stopping inactive scheduler throws no error", () => {
      const scheduler = new Scheduler(() => Promise.resolve(), 5);

      // Should not throw
      expect(() => scheduler.stop()).not.toThrow();
      expect(scheduler.isActive()).toBe(false);
    });
  });

  describe("error handling", () => {
    test("catches and logs task errors", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Task failed");
      const task = mock(() => Promise.reject(error));
      const scheduler = new Scheduler(task, 5);

      scheduler.start();

      // Wait for immediate setTimeout to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith("Scheduler task failed:", error);

      consoleSpy.mockRestore();
      scheduler.stop();
    });

    test("continues running after task error", async () => {
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
      let callCount = 0;
      const task = mock(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("First call fails"));
        }
        return Promise.resolve();
      });
      const scheduler = new Scheduler(task, 0.01); // 0.01 minutes = 600ms

      scheduler.start();

      // Wait for first (failing) run
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(task).toHaveBeenCalledTimes(1);

      // Wait for interval (second) run
      await new Promise((resolve) => setTimeout(resolve, 700));
      expect(task).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
      scheduler.stop();
    });
  });

  describe("isActive()", () => {
    test("returns false when not started", () => {
      const scheduler = new Scheduler(() => Promise.resolve(), 5);
      expect(scheduler.isActive()).toBe(false);
    });

    test("returns true when running", () => {
      const scheduler = new Scheduler(() => Promise.resolve(), 5);
      scheduler.start();
      expect(scheduler.isActive()).toBe(true);
      scheduler.stop();
    });

    test("returns false after stopped", () => {
      const scheduler = new Scheduler(() => Promise.resolve(), 5);
      scheduler.start();
      scheduler.stop();
      expect(scheduler.isActive()).toBe(false);
    });
  });
});

describe("[UNIT] createInactivityScheduler", () => {
  test("creates a Scheduler instance", () => {
    const checkFn = () => Promise.resolve("result");
    const scheduler = createInactivityScheduler(checkFn, 10);

    expect(scheduler).toBeInstanceOf(Scheduler);
    expect(scheduler.isActive()).toBe(false);
  });

  test("uses default interval of 5 minutes when not specified", async () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const checkFn = () => Promise.resolve("result");
    const scheduler = createInactivityScheduler(checkFn);

    scheduler.start();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Scheduler started. Running task every 5 minutes.",
    );

    consoleSpy.mockRestore();
    scheduler.stop();
  });

  test("runs check function and logs result", async () => {
    const logSpy = spyOn(console, "log").mockImplementation(() => {});
    const checkFn = () => Promise.resolve({ count: 5 });
    const scheduler = createInactivityScheduler(checkFn, 0.01);

    scheduler.start();

    // Wait for immediate run
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(logSpy).toHaveBeenCalledWith("Running inactivity check...");
    expect(logSpy).toHaveBeenCalledWith("Inactivity check completed:", {
      count: 5,
    });

    logSpy.mockRestore();
    scheduler.stop();
  });

  test("handles check function returning void", async () => {
    const logSpy = spyOn(console, "log").mockImplementation(() => {});
    const checkFn = () => Promise.resolve();
    const scheduler = createInactivityScheduler(checkFn, 0.01);

    scheduler.start();

    // Wait for immediate run
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(logSpy).toHaveBeenCalledWith(
      "Inactivity check completed:",
      undefined,
    );

    logSpy.mockRestore();
    scheduler.stop();
  });

  test("custom interval is respected", async () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    const checkFn = () => Promise.resolve("result");
    const scheduler = createInactivityScheduler(checkFn, 15);

    scheduler.start();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Scheduler started. Running task every 15 minutes.",
    );

    consoleSpy.mockRestore();
    scheduler.stop();
  });
});
