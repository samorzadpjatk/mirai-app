import { IntervalScheduler } from "@mirai-app/common/utils";
import type { SchedulerTask } from "@mirai-app/common/utils";
import { logger } from "@mirai-app/orpc";

export type { SchedulerTask };

/**
 * Interval scheduler wired to the shared Pino logger.
 *
 * The mechanics live in `@mirai-app/common` so the backend server's
 * notification-schedule executor can reuse them without importing across apps.
 */
export class Scheduler extends IntervalScheduler {
  constructor(task: SchedulerTask, intervalMinutes: number) {
    super(task, intervalMinutes, logger);
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
