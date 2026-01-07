import type { Prisma } from "@integral-2025-app/db";

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
      console.warn("Scheduler is already running");
      return;
    }

    this.isRunning = true;
    console.log(
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
    console.log("Scheduler stopped.");
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
        console.error("Scheduler task failed:", error);
      }
    })();
  }
}

/**
 * Create a scheduler for checking inactive users.
 */
export function createInactivityScheduler(
  db: Prisma.TransactionClient,
  checkFunction: (db: Prisma.TransactionClient) => Promise<unknown>,
  intervalMinutes = 5,
): Scheduler {
  return new Scheduler(async () => {
    console.log("Running inactivity check...");
    const result = await checkFunction(db);
    console.log("Inactivity check completed:", result);
  }, intervalMinutes);
}
