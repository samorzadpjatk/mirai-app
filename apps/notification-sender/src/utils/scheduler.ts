import { logger } from "@mirai-app/orpc";

export type SchedulerTask = () => Promise<void>;

/**
 * Simple scheduler that runs tasks at regular intervals.
 */
export class Scheduler {
  private intervalId: NodeJS.Timeout | null = null;
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
      logger.warn("Scheduler is already running");
      return;
    }

    this.isRunning = true;
    logger.info({ intervalMinutes: this.intervalMinutes }, "Scheduler started");

    // Run immediately (wrap in setTimeout to avoid sync call during start)
    setTimeout(() => {
      this.runTask();
    }, 0);

    // Then run at regular intervals (only if interval > 0)
    if (this.intervalMinutes > 0) {
      this.intervalId = setInterval(
        () => {
          this.runTask();
        },
        this.intervalMinutes * 60 * 1000,
      );
    }
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
    logger.info("Scheduler stopped");
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
        logger.error(error, "Scheduler task failed");
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
    logger.info("Running inactivity check");
    const result = await checkFunction();
    logger.info({ result }, "Inactivity check completed");
  }, intervalMinutes);
}
