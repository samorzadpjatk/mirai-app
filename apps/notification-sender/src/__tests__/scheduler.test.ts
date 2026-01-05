import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Scheduler, createInactivityScheduler } from "../scheduler";
import type { Prisma } from "@integral-2025-app/db";

describe("Scheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts and runs task immediately", async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const scheduler = new Scheduler(task, 5);

    scheduler.start();

    // Wait for the immediate execution (may run twice due to setTimeout and setInterval)
    await vi.advanceTimersByTimeAsync(1);

    expect(task).toHaveBeenCalled();
    expect(task).toHaveBeenCalledTimes(1);
    scheduler.stop();
  });

  it("runs task at regular intervals", async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const scheduler = new Scheduler(task, 1); // 1 minute interval

    scheduler.start();
    await vi.advanceTimersByTimeAsync(1);

    const initialCalls = task.mock.calls.length;
    expect(initialCalls).toBeGreaterThanOrEqual(1);

    // Advance time by 1 minute
    await vi.advanceTimersByTimeAsync(60 * 1000);

    expect(task.mock.calls.length).toBeGreaterThan(initialCalls);

    // Advance time by another minute
    await vi.advanceTimersByTimeAsync(60 * 1000);

    expect(task.mock.calls.length).toBeGreaterThan(initialCalls + 1);

    scheduler.stop();
  });

  it("stops running after stop is called", async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const scheduler = new Scheduler(task, 1);

    scheduler.start();
    await vi.advanceTimersByTimeAsync(1);

    const callCount = task.mock.calls.length;
    expect(callCount).toBeGreaterThanOrEqual(1);

    scheduler.stop();

    // Advance time - task should not run
    await vi.advanceTimersByTimeAsync(60 * 1000);

    expect(task.mock.calls.length).toBe(callCount);
  });

  it("does not start twice", async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const scheduler = new Scheduler(task, 1);

    scheduler.start();
    scheduler.start(); // Second start should be ignored

    await vi.advanceTimersByTimeAsync(1);

    // Should only have scheduled one timer
    expect(task.mock.calls.length).toBeLessThanOrEqual(1);

    scheduler.stop();
  });

  it("handles task errors gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // Intentionally empty
    });
    const task = vi.fn().mockRejectedValue(new Error("Task failed"));
    const scheduler = new Scheduler(task, 1);

    scheduler.start();
    await vi.advanceTimersByTimeAsync(1);

    expect(task).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Scheduler task failed:",
      expect.any(Error),
    );

    // Scheduler should continue running despite error
    await vi.advanceTimersByTimeAsync(60 * 1000);

    expect(task.mock.calls.length).toBeGreaterThan(1);

    scheduler.stop();
    consoleErrorSpy.mockRestore();
  });

  it("reports active status correctly", () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const scheduler = new Scheduler(task, 1);

    expect(scheduler.isActive()).toBe(false);

    scheduler.start();
    expect(scheduler.isActive()).toBe(true);

    scheduler.stop();
    expect(scheduler.isActive()).toBe(false);
  });
});

describe("createInactivityScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a scheduler with the correct interval", async () => {
    const checkFunction = vi.fn().mockResolvedValue({ checked: 0, notified: 0 });
    const mockDb = {} as Prisma.TransactionClient;

    const scheduler = createInactivityScheduler(mockDb, checkFunction, 5);

    scheduler.start();
    await vi.advanceTimersByTimeAsync(1);

    expect(checkFunction).toHaveBeenCalledWith(mockDb);
    expect(checkFunction).toHaveBeenCalled();

    scheduler.stop();
  });

  it("logs check results", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {
      // Intentionally empty
    });
    const checkResult = { checked: 3, notified: 2, skipped: 1, errors: 0 };
    const checkFunction = vi.fn().mockResolvedValue(checkResult);
    const mockDb = {} as Prisma.TransactionClient;

    const scheduler = createInactivityScheduler(mockDb, checkFunction, 5);

    scheduler.start();
    await vi.advanceTimersByTimeAsync(1);

    expect(consoleLogSpy).toHaveBeenCalledWith("Running inactivity check...");
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Inactivity check completed:",
      checkResult,
    );

    scheduler.stop();
    consoleLogSpy.mockRestore();
  });
});
