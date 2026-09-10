export type SchedulerTask = () => Promise<void>;

/**
 * Minimal structural subset of the Pino logger the scheduler needs. Kept as an
 * interface so `@mirai-app/common` does not have to depend on `@mirai-app/orpc`
 * for its logger.
 */
export interface SchedulerLogger {
  info: (objOrMsg: unknown, msg?: string) => void;
  warn: (objOrMsg: unknown, msg?: string) => void;
  error: (objOrMsg: unknown, msg?: string) => void;
}

const noopLogger: SchedulerLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

/**
 * Simple scheduler that runs a task immediately and then at regular intervals.
 *
 * Timers are only created by {@link IntervalScheduler.start}, never at module
 * load, so importing a module that builds one has no side effects.
 */
export class IntervalScheduler {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private readonly logger: SchedulerLogger;

  constructor(
    private readonly task: SchedulerTask,
    private readonly intervalMinutes: number,
    logger?: SchedulerLogger,
  ) {
    this.logger = logger ?? noopLogger;
  }

  /**
   * Start the scheduler. The task runs immediately and then at regular
   * intervals. An interval of 0 (or less) means "run once on start".
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn("Scheduler is already running");
      return;
    }

    this.isRunning = true;
    this.logger.info({ intervalMinutes: this.intervalMinutes }, "Scheduler started");

    // Run immediately (wrap in setTimeout to avoid sync call during start)
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      this.runTask();
    }, 0);

    if (this.intervalMinutes > 0) {
      this.intervalId = setInterval(
        () => {
          this.runTask();
        },
        this.intervalMinutes * 60 * 1000,
      );
    }
  }

  /** Stop the scheduler and clear any pending timers. */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.logger.info("Scheduler stopped");
  }

  /** Whether the scheduler is currently running. */
  isActive(): boolean {
    return this.isRunning;
  }

  private runTask(): void {
    void (async () => {
      try {
        await this.task();
      } catch (error) {
        this.logger.error(error, "Scheduler task failed");
      }
    })();
  }
}
