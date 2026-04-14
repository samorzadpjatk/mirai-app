import { serverLogger } from "@mirai-app/shared";

export type SchedulerTask = () => Promise<void>;

/**
 * Simple scheduler that runs tasks at regular intervals.
 */
export class Scheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  constructor(
    private readonly task: SchedulerTask,
    private readonly intervalMinutes: number,
  ) {}

  /**
   * Start the scheduler. The task will run immediately and then at regular intervals.
   */
  start(): void {
    if (this.isRunning) {
      serverLogger.warn("Scheduler is already running");
      return;
    }

    this.isRunning = true;
    serverLogger.info(
      `Scheduler started. Running task every ${this.intervalMinutes} minutes.`,
    );

    // Run immediately (wrap in setTimeout to avoid sync call during start)
    setTimeout(() => {
      this.runTask();
    }, 0);

    // Then run at regular intervals
    this.intervalId = setInterval(
      () => {
        this.runTask();
      },
      this.intervalMinutes * 60 * 1000,
    );
  }

  /**
   * Stop the scheduler.
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    serverLogger.info("Scheduler stopped.");
  }

  /**
   * Check if the scheduler is currently running.
   */
  isActive(): boolean {
    return this.isRunning;
  }

  private runTask(): void {
    void (async () => {
      try {
        await this.task();
      } catch (error) {
        serverLogger.error(
          "Scheduler task failed:",
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    })();
  }
}

/**
 * Create a scheduler for checking inactive users.
 */
export function createInactivityScheduler(
  checkFunction: () => Promise<unknown>,
  intervalMinutes = 5,
): Scheduler {
  return new Scheduler(async () => {
    serverLogger.info("Running inactivity check...");
    const result = await checkFunction();
    serverLogger.info("Inactivity check completed", { result });
  }, intervalMinutes);
}
