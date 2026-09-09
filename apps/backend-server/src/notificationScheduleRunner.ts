import {
  DEFAULT_SCHEDULE_GRACE_MINUTES,
  DEFAULT_SCHEDULE_INTERVAL_MINUTES,
} from "@mirai-app/common/notifications";
import { IntervalScheduler } from "@mirai-app/common/utils";
import type { DB } from "@mirai-app/db";
import { createDb } from "@mirai-app/db";
import { logger, runDueNotificationSchedules } from "@mirai-app/orpc";

export interface NotificationScheduleRunnerConfig {
  /** Minutes between ticks. Must stay below the grace window. */
  intervalMinutes: number;
  /** How late an occurrence may still fire, in minutes. */
  graceMinutes: number;
  enabled: boolean;
}

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Read the runner configuration from the environment.
 *
 * Called explicitly rather than evaluated at module load, so importing this
 * module has no side effects.
 */
export function readNotificationScheduleRunnerConfig(
  env: Record<string, string | undefined> = process.env,
): NotificationScheduleRunnerConfig {
  return {
    intervalMinutes: parsePositiveNumber(
      env.NOTIFICATION_SCHEDULER_INTERVAL_MINUTES,
      DEFAULT_SCHEDULE_INTERVAL_MINUTES,
    ),
    graceMinutes: parsePositiveNumber(
      env.NOTIFICATION_SCHEDULER_GRACE_MINUTES,
      DEFAULT_SCHEDULE_GRACE_MINUTES,
    ),
    enabled: env.NOTIFICATION_SCHEDULER_ENABLED !== "false",
  };
}

/**
 * Start the loop that executes `notification_schedules`.
 *
 * Nothing in the repository read that table before this: `getActiveSchedules`
 * had no callers, so every recurring notification — including the 07:30 and
 * 18:00 daily ranking ones — was created and then never sent.
 *
 * The loop is deliberately minimal: it ticks on an interval and asks
 * `runDueNotificationSchedules` which occurrences are due, which is driven by
 * each schedule's own hour/minute plus its `lastRun`, with a grace window so a
 * tick that arrives late (or a process that was restarted) still fires instead
 * of silently dropping the send.
 *
 * Returns `null` when the runner is disabled or has no database URL, so the
 * server can still start.
 */
export function initNotificationScheduleRunner(options?: {
  db?: DB;
  databaseUrl?: string;
  config?: NotificationScheduleRunnerConfig;
}): IntervalScheduler | null {
  const config = options?.config ?? readNotificationScheduleRunnerConfig();

  if (!config.enabled) {
    logger.info("Notification schedule runner disabled");
    return null;
  }

  const databaseUrl = options?.databaseUrl ?? process.env.DATABASE_URL;
  const db = options?.db ?? (databaseUrl ? createDb(databaseUrl) : null);

  if (!db) {
    logger.warn("Notification schedule runner not started — missing DATABASE_URL");
    return null;
  }

  const scheduler = new IntervalScheduler(
    async () => {
      const result = await runDueNotificationSchedules({
        db,
        graceMinutes: config.graceMinutes,
      });

      if (result.due > 0 || result.failed > 0) {
        logger.info({ result }, "Notification schedule tick completed");
      }
    },
    config.intervalMinutes,
    logger,
  );

  scheduler.start();

  return scheduler;
}
