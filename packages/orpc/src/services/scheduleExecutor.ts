import {
  DEFAULT_SCHEDULE_GRACE_MINUTES,
  resolveDueOccurrence,
} from "@mirai-app/common/notifications";
import type { DB, NotificationSchedule } from "@mirai-app/db";
import {
  notificationScheduleExecutions,
  notificationSchedules,
  tripParticipants,
} from "@mirai-app/db";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { logger } from "../utils/logger";
import { sendNotification, sendRankingUpdate } from "../utils/notifications";
import { parseAudienceUrl, sendMobileNotifications } from "./notificationService";

export interface RunDueNotificationSchedulesOptions {
  db: DB;
  /** Injected in tests to pin the clock. */
  now?: Date;
  graceMinutes?: number;
}

export interface RunDueNotificationSchedulesResult {
  evaluated: number;
  due: number;
  fired: number;
  skipped: number;
  failed: number;
}

const DEFAULT_SCHEDULE_URL = "/alerts";

/**
 * Resolve who a schedule's notification is addressed to.
 *
 * The audience is encoded in the notification URL by the admin screen
 * (`__audience` / `__groupId`), the same convention `sendMobileNotifications`
 * uses. Resolving it here means the recipients also get `notification_pushes`
 * rows, which is what the in-app notification list reads.
 */
async function resolveScheduleAudience(db: DB, tripId: string, url: string): Promise<string[]> {
  const { audienceMode, audienceGroupId } = parseAudienceUrl(url);

  const conditions = [eq(tripParticipants.tripId, tripId)];
  if (audienceMode === "group" && audienceGroupId) {
    conditions.push(eq(tripParticipants.groupId, audienceGroupId));
  }

  const rows = await db
    .select({ userId: tripParticipants.userId })
    .from(tripParticipants)
    .where(and(...conditions));

  return rows.map((row) => row.userId);
}

async function executeSchedule(db: DB, schedule: NotificationSchedule): Promise<string[]> {
  const tripId = schedule.tripId;

  if (!tripId) {
    // Without a trip there is no bounded audience, and falling through to
    // "every push subscription in the database" is not something a schedule
    // should do implicitly. The admin UI always sets a trip.
    logger.warn(
      { scheduleId: schedule.id },
      "Skipping notification schedule without a trip — audience cannot be scoped",
    );
    return [];
  }

  if (schedule.notificationType === "ranking") {
    const result = await sendRankingUpdate({
      db,
      userId: schedule.createdById,
      tripId,
    });
    return result.notificationIds;
  }

  const url = schedule.notificationUrl?.trim() ? schedule.notificationUrl : DEFAULT_SCHEDULE_URL;
  const userIds = await resolveScheduleAudience(db, tripId, url);

  const { notificationId } = await sendNotification({
    db,
    userId: schedule.createdById,
    input: {
      userIds,
      title: schedule.notificationTitle,
      body: schedule.notificationBody,
      url,
      tripId,
    },
  });

  await sendMobileNotifications(db, notificationId);

  return [notificationId];
}

/**
 * Fire every notification schedule whose occurrence is currently due.
 *
 * This is the executor `notification_schedules` never had: `getActiveSchedules`
 * had no callers anywhere, so recurring notifications — the 07:30 and 18:00
 * daily ranking ones included — were stored and never sent.
 *
 * The occurrence is claimed with a conditional `lastRun` update before anything
 * is sent. That makes the claim atomic across replicas and biases the executor
 * towards at-most-once: a send that fails halfway is logged rather than
 * retried, because re-sending a push people already received is worse than
 * missing one.
 */
export async function runDueNotificationSchedules({
  db,
  now = new Date(),
  graceMinutes = DEFAULT_SCHEDULE_GRACE_MINUTES,
}: RunDueNotificationSchedulesOptions): Promise<RunDueNotificationSchedulesResult> {
  const schedules = await db.query.notificationSchedules.findMany({
    where: (ns, { eq }) => eq(ns.isActive, true),
  });

  const result: RunDueNotificationSchedulesResult = {
    evaluated: schedules.length,
    due: 0,
    fired: 0,
    skipped: 0,
    failed: 0,
  };

  for (const schedule of schedules) {
    const occurrence = resolveDueOccurrence(
      {
        id: schedule.id,
        hour: schedule.hour,
        minute: schedule.minute,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        isActive: schedule.isActive,
        lastRun: schedule.lastRun,
      },
      { now, graceMinutes },
    );

    if (!occurrence) {
      continue;
    }

    result.due += 1;

    const claimed = await db
      .update(notificationSchedules)
      .set({ lastRun: now })
      .where(
        and(
          eq(notificationSchedules.id, schedule.id),
          or(isNull(notificationSchedules.lastRun), lt(notificationSchedules.lastRun, occurrence)),
        ),
      )
      .returning({ id: notificationSchedules.id });

    if (claimed.length === 0) {
      result.skipped += 1;
      continue;
    }

    try {
      const notificationIds = await executeSchedule(db, schedule);

      if (notificationIds.length === 0) {
        result.skipped += 1;
        continue;
      }

      await db
        .insert(notificationScheduleExecutions)
        .values(
          notificationIds.map((notificationId) => ({
            notificationId,
            scheduleId: schedule.id,
            executedAt: now,
          })),
        )
        .onConflictDoNothing();

      result.fired += 1;
      logger.info(
        {
          scheduleId: schedule.id,
          occurrence: occurrence.toISOString(),
          notificationIds,
        },
        "Fired notification schedule",
      );
    } catch (error) {
      result.failed += 1;
      logger.error(
        { scheduleId: schedule.id, occurrence: occurrence.toISOString(), error },
        "Failed to fire notification schedule",
      );
    }
  }

  return result;
}
