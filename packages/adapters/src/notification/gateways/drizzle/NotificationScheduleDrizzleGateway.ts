import { Effect } from "effect";
import {
  eq,
  and,
  or,
  like,
  gte,
  lte,
  desc,
  count,
  sql,
  inArray,
} from "drizzle-orm";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  notificationSchedules,
  notificationScheduleExecutions,
  type NotificationScheduleSelect,
} from "@mirai-app/frameworks/drizzle";
import type { NotificationSchedule } from "@mirai-app/use-cases/notification/ports/NotificationPort";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { notificationScheduleMapper } from "../../mappers/NotificationScheduleMapper";

/**
 * Notification Schedule Drizzle Gateway
 *
 * Implements NotificationSchedulePort using Drizzle ORM for database operations.
 * Extends BaseDrizzleGateway for consistent error handling.
 *
 * Note: The database schema has some differences from the port interface:
 * - Schema uses 'content' field, port uses 'notificationTitle' + 'notificationBody'
 * - Schema uses 'scheduledFor', port uses 'startDate'/'endDate' + 'hour'/'minute'
 * - Schema uses 'isSent' flag, port uses 'lastRun' date
 * - Schema uses 'sendToAll'/'isDraft', port uses 'isActive'
 */
export class NotificationScheduleDrizzleGateway extends BaseDrizzleGateway {
  constructor(db: DrizzleDb) {
    super(db);
  }

  findAll(params: {
    tripId?: string | null;
    notificationType?: string;
    isActive?: boolean;
    startDateFrom?: Date;
    startDateTo?: Date;
    search?: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    { schedules: NotificationSchedule[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  > {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.findAll",
      async () => {
        const {
          tripId,
          notificationType,
          isActive,
          startDateFrom,
          startDateTo,
          search,
          limit,
          offset,
        } = params;

        // Build where conditions dynamically
        const conditions: (
          | ReturnType<typeof eq>
          | ReturnType<typeof and>
          | ReturnType<typeof or>
          | ReturnType<typeof like>
          | ReturnType<typeof gte>
          | ReturnType<typeof lte>
        )[] = [];

        if (tripId !== undefined && tripId !== null) {
          conditions.push(eq(notificationSchedules.tripId, tripId));
        }

        if (notificationType) {
          conditions.push(
            eq(notificationSchedules.notificationType, notificationType),
          );
        }

        if (isActive !== undefined) {
          // isActive in port maps to sendToAll true and isDraft false in schema
          if (isActive) {
            conditions.push(
              and(
                eq(notificationSchedules.sendToAll, true),
                eq(notificationSchedules.isDraft, false),
              ) as ReturnType<typeof and>,
            );
          } else {
            conditions.push(
              or(
                eq(notificationSchedules.sendToAll, false),
                eq(notificationSchedules.isDraft, true),
              ) as ReturnType<typeof or>,
            );
          }
        }

        if (startDateFrom) {
          conditions.push(
            gte(notificationSchedules.scheduledFor, startDateFrom),
          );
        }

        if (startDateTo) {
          conditions.push(lte(notificationSchedules.scheduledFor, startDateTo));
        }

        if (search) {
          conditions.push(
            or(
              like(notificationSchedules.name, `%${search}%`),
              like(notificationSchedules.content, `%${search}%`),
            ) as ReturnType<typeof or>,
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : sql`true`;

        const [results, totalResult] = await Promise.all([
          this.db.query.notificationSchedules.findMany({
            where: whereClause,
            orderBy: desc(notificationSchedules.createdAt),
            limit,
            offset,
          }),
          this.db
            .select({ count: count() })
            .from(notificationSchedules)
            .where(whereClause),
        ]);

        const total = totalResult[0]?.count ?? 0;
        const hasMore = offset + results.length < total;

        return {
          schedules: results.map((r) => notificationScheduleMapper.toDTO(r)),
          total,
          hasMore,
        };
      },
    );
  }

  findActive(): Effect.Effect<NotificationSchedule[], DatabaseError, never> {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.findActive",
      async () => {
        const results = await this.db.query.notificationSchedules.findMany({
          where: and(
            eq(notificationSchedules.sendToAll, true),
            eq(notificationSchedules.isDraft, false),
            eq(notificationSchedules.isSent, false),
          ),
          orderBy: desc(notificationSchedules.scheduledFor),
        });

        return results.map((r) => notificationScheduleMapper.toDTO(r));
      },
    );
  }

  findUpcoming(
    days: number,
  ): Effect.Effect<NotificationSchedule[], DatabaseError, never> {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.findUpcoming",
      async () => {
        const now = new Date();
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + days);

        const results = await this.db.query.notificationSchedules.findMany({
          where: and(
            gte(notificationSchedules.scheduledFor, now),
            lte(notificationSchedules.scheduledFor, futureDate),
            eq(notificationSchedules.isSent, false),
            eq(notificationSchedules.isDraft, false),
          ),
          orderBy: notificationSchedules.scheduledFor,
        });

        return results.map((r) => notificationScheduleMapper.toDTO(r));
      },
    );
  }

  findById(
    id: string,
  ): Effect.Effect<NotificationSchedule | null, DatabaseError, never> {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.findById",
      async () => {
        const result = await this.db.query.notificationSchedules.findFirst({
          where: eq(notificationSchedules.id, id),
        });
        return result ? notificationScheduleMapper.toDTO(result) : null;
      },
      id,
    );
  }

  findByTripIdAndName(
    tripId: string,
    name: string,
  ): Effect.Effect<NotificationSchedule | null, DatabaseError, never> {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.findByTripIdAndName",
      async () => {
        const result = await this.db.query.notificationSchedules.findFirst({
          where: and(
            eq(notificationSchedules.tripId, tripId),
            eq(notificationSchedules.name, name),
          ),
        });
        return result ? notificationScheduleMapper.toDTO(result) : null;
      },
    );
  }

  create(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never> {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.create",
      async () => {
        const insert = notificationScheduleMapper.toInsert(schedule);
        const [result] = await this.db
          .insert(notificationSchedules)
          .values(insert)
          .returning();
        if (!result) throw new Error("Failed to create notification schedule");
        return notificationScheduleMapper.toDTO(result);
      },
      schedule.id,
    );
  }

  update(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never> {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.update",
      async () => {
        const update = notificationScheduleMapper.toUpdate(schedule);
        const [result] = await this.db
          .update(notificationSchedules)
          .set(update)
          .where(eq(notificationSchedules.id, schedule.id))
          .returning();
        if (!result)
          throw new Error(`Notification schedule not found: ${schedule.id}`);
        return notificationScheduleMapper.toDTO(result);
      },
      schedule.id,
    );
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.delete",
      async () => {
        await this.db
          .delete(notificationSchedules)
          .where(eq(notificationSchedules.id, id));
      },
      id,
    );
  }

  deleteMany(ids: string[]): Effect.Effect<number, DatabaseError, never> {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.deleteMany",
      async () => {
        if (ids.length === 0) return 0;

        const result = await this.db
          .delete(notificationSchedules)
          .where(inArray(notificationSchedules.id, ids))
          .returning();

        return result.length;
      },
    );
  }

  toggleActive(
    id: string,
    isActive: boolean,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never> {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.toggleActive",
      async () => {
        // Map isActive to sendToAll and isDraft
        const sendToAll = isActive;
        const isDraft = false; // When toggling active, it's no longer a draft

        const [result] = await this.db
          .update(notificationSchedules)
          .set({
            sendToAll,
            isDraft,
            updatedAt: new Date(),
          })
          .where(eq(notificationSchedules.id, id))
          .returning();

        if (!result) throw new Error(`Notification schedule not found: ${id}`);

        return notificationScheduleMapper.toDTO(result);
      },
      id,
    );
  }

  toggleMany(
    ids: string[],
    isActive: boolean,
  ): Effect.Effect<number, DatabaseError, never> {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.toggleMany",
      async () => {
        if (ids.length === 0) return 0;

        const sendToAll = isActive;
        const isDraft = false;

        const result = await this.db
          .update(notificationSchedules)
          .set({
            sendToAll,
            isDraft,
            updatedAt: new Date(),
          })
          .where(inArray(notificationSchedules.id, ids))
          .returning();

        return result.length;
      },
    );
  }

  updateLastRun(
    id: string,
    lastRun: Date,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never> {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.updateLastRun",
      async () => {
        // Map lastRun to isSent flag in schema
        const [result] = await this.db
          .update(notificationSchedules)
          .set({
            isSent: true,
            updatedAt: new Date(),
          })
          .where(eq(notificationSchedules.id, id))
          .returning();

        if (!result) throw new Error(`Notification schedule not found: ${id}`);

        return notificationScheduleMapper.toDTO(result);
      },
      id,
    );
  }

  countExecutions(id: string): Effect.Effect<number, DatabaseError, never> {
    return this.tryPromise(
      "NotificationScheduleDrizzleGateway.countExecutions",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(notificationScheduleExecutions)
          .where(eq(notificationScheduleExecutions.scheduleId, id));

        return result[0]?.count ?? 0;
      },
      id,
    );
  }
}
