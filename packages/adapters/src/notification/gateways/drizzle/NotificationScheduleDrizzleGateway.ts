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
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import {
  notificationSchedules,
  notificationScheduleExecutions,
  type NotificationScheduleSelect,
} from "../../../infrastructure/drizzle";
import type { NotificationSchedule } from "@mirai-app/use-cases/notification/ports/NotificationPort";
import { DatabaseError, NotificationScheduleId, TripId } from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { notificationScheduleMapper } from "../../mappers/NotificationScheduleMapper";

/**
 * Notification Schedule Drizzle Gateway
 *
 * Implements NotificationSchedulePort using Drizzle ORM for database operations.
 * Extends BaseDrizzleGateway for consistent error handling.
 *
 * Auth verification uses AuthContextTag and AuthZPortTag from Effect context.
 * Notification schedules are trip-scoped - users need trip-level access.
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
  }) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

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

      // If tripId is specified, verify access
      if (authCtx.isAuthenticated && tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

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

      return yield* Effect.tryPromise({
        try: async () => {
          const [results, totalResult] = await Promise.all([
            self.db.query.notificationSchedules.findMany({
              where: whereClause,
              orderBy: desc(notificationSchedules.createdAt),
              limit,
              offset,
            }),
            self.db
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
        catch: (error) =>
          new DatabaseError({
            operation: "findAll",
            cause: error,
          }),
      });
    });
  }

  findActive() {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Note: findActive is typically used by schedulers
      // If authenticated, we skip detailed auth checks as this is a system operation
      // The results are filtered based on trip access later if needed

      return yield* Effect.tryPromise({
        try: async () => {
          const results = await self.db.query.notificationSchedules.findMany({
            where: and(
              eq(notificationSchedules.sendToAll, true),
              eq(notificationSchedules.isDraft, false),
              eq(notificationSchedules.isSent, false),
            ),
            orderBy: desc(notificationSchedules.scheduledFor),
          });

          return results;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findActive",
            cause: error,
          }),
      });
    }).pipe(
      Effect.map((records) =>
        records.map((r) => notificationScheduleMapper.toDTO(r)),
      ),
    );
  }

  findUpcoming(days: number) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Note: findUpcoming is typically used by schedulers
      // If authenticated, we skip detailed auth checks as this is a system operation

      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + days);

      return yield* Effect.tryPromise({
        try: async () => {
          const results = await self.db.query.notificationSchedules.findMany({
            where: and(
              gte(notificationSchedules.scheduledFor, now),
              lte(notificationSchedules.scheduledFor, futureDate),
              eq(notificationSchedules.isSent, false),
              eq(notificationSchedules.isDraft, false),
            ),
            orderBy: notificationSchedules.scheduledFor,
          });

          return results;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findUpcoming",
            cause: error,
          }),
      });
    }).pipe(
      Effect.map((records) =>
        records.map((r) => notificationScheduleMapper.toDTO(r)),
      ),
    );
  }

  findById(id: NotificationScheduleId) {
    const idStr = NotificationScheduleId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // First get the schedule
      const scheduleResult = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.notificationSchedules.findFirst({
            where: eq(notificationSchedules.id, idStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findById",
            id: idStr,
            cause: error,
          }),
      });

      // If authenticated and schedule exists, verify trip access
      if (authCtx.isAuthenticated && scheduleResult) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: scheduleResult.tripId,
          requiredPermission: "read",
        });
      }

      return scheduleResult;
    }).pipe(
      Effect.map((record) =>
        record ? notificationScheduleMapper.toDTO(record) : null,
      ),
    );
  }

  findByTripIdAndName(tripId: string, name: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify trip read access
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.notificationSchedules.findFirst({
            where: and(
              eq(notificationSchedules.tripId, tripId),
              eq(notificationSchedules.name, name),
            ),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findByTripIdAndName",
            id: `${tripId}/${name}`,
            cause: error,
          }),
      });
    }).pipe(
      Effect.map((record) =>
        record ? notificationScheduleMapper.toDTO(record) : null,
      ),
    );
  }

  create(schedule: NotificationSchedule) {
    const insertData = notificationScheduleMapper.toInsert(schedule);
    const idStr = NotificationScheduleId.toString(schedule.id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify trip write access for creating schedules
      if (authCtx.isAuthenticated && schedule.tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(schedule.tripId),
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          const [result] = await self.db
            .insert(notificationSchedules)
            .values(insertData)
            .returning();
          if (!result) throw new Error("Failed to create notification schedule");
          return result;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "create",
            id: idStr,
            cause: error,
          }),
      });
    }).pipe(Effect.map((record) => notificationScheduleMapper.toDTO(record)));
  }

  update(schedule: NotificationSchedule) {
    const updateData = notificationScheduleMapper.toUpdate(schedule);
    const idStr = NotificationScheduleId.toString(schedule.id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // First get existing schedule to check trip
      const existingSchedule = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.notificationSchedules.findFirst({
            where: eq(notificationSchedules.id, idStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "update",
            id: idStr,
            cause: error,
          }),
      });

      // Verify trip write access for updating schedules
      if (authCtx.isAuthenticated && existingSchedule) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: existingSchedule.tripId,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          const [result] = await self.db
            .update(notificationSchedules)
            .set(updateData)
            .where(eq(notificationSchedules.id, idStr))
            .returning();
          if (!result)
            throw new Error(`Notification schedule not found: ${idStr}`);
          return result;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "update",
            id: idStr,
            cause: error,
          }),
      });
    }).pipe(Effect.map((record) => notificationScheduleMapper.toDTO(record)));
  }

  delete(id: NotificationScheduleId) {
    const idStr = NotificationScheduleId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // First get existing schedule to check trip
      const existingSchedule = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.notificationSchedules.findFirst({
            where: eq(notificationSchedules.id, idStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "delete",
            id: idStr,
            cause: error,
          }),
      });

      // Verify trip write access for deleting schedules
      if (authCtx.isAuthenticated && existingSchedule) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: existingSchedule.tripId,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          await self.db
            .delete(notificationSchedules)
            .where(eq(notificationSchedules.id, idStr));
        },
        catch: (error) =>
          new DatabaseError({
            operation: "delete",
            id: idStr,
            cause: error,
          }),
      });
    });
  }

  deleteMany(ids: NotificationScheduleId[]) {
    const idStrs = ids.map((id) => NotificationScheduleId.toString(id));
    const self = this;

    if (idStrs.length === 0) {
      return Effect.succeed(0);
    }

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Get existing schedules to check trips
      const existingSchedules = yield* Effect.tryPromise({
        try: async () => {
          const results = await self.db.query.notificationSchedules.findMany({
            where: inArray(notificationSchedules.id, idStrs),
          });
          return results;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "deleteMany",
            id: idStrs.join(","),
            cause: error,
          }),
      });

      // Verify trip write access for each schedule
      if (authCtx.isAuthenticated && existingSchedules.length > 0) {
        const authZPort = yield* AuthZPortTag;

        // Check access for each unique trip
        const uniqueTripIds = Array.from(
          new Set(existingSchedules.map((s) => s.tripId)),
        );

        for (const tripId of uniqueTripIds) {
          yield* authZPort.verifyAccess({
            userId: authCtx.userId,
            role: authCtx.role,
            tripRoles: authCtx.tripRoles,
            resourceType: "trip",
            resourceId: tripId,
            requiredPermission: "write",
          });
        }
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .delete(notificationSchedules)
            .where(inArray(notificationSchedules.id, idStrs))
            .returning();

          return result.length;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "deleteMany",
            id: idStrs.join(","),
            cause: error,
          }),
      });
    });
  }

  toggleActive(id: NotificationScheduleId, isActive: boolean) {
    const idStr = NotificationScheduleId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // First get existing schedule to check trip
      const existingSchedule = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.notificationSchedules.findFirst({
            where: eq(notificationSchedules.id, idStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "toggleActive",
            id: idStr,
            cause: error,
          }),
      });

      // Verify trip write access for toggling schedules
      if (authCtx.isAuthenticated && existingSchedule) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: existingSchedule.tripId,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      // Map isActive to sendToAll and isDraft
      const sendToAll = isActive;
      const isDraft = false;

      return yield* Effect.tryPromise({
        try: async () => {
          const [result] = await self.db
            .update(notificationSchedules)
            .set({
              sendToAll,
              isDraft,
              updatedAt: new Date(),
            })
            .where(eq(notificationSchedules.id, idStr))
            .returning();

          if (!result) throw new Error(`Notification schedule not found: ${idStr}`);
          return result;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "toggleActive",
            id: idStr,
            cause: error,
          }),
      });
    }).pipe(Effect.map((record) => notificationScheduleMapper.toDTO(record)));
  }

  toggleMany(ids: NotificationScheduleId[], isActive: boolean) {
    const idStrs = ids.map((id) => NotificationScheduleId.toString(id));
    const self = this;

    if (idStrs.length === 0) {
      return Effect.succeed(0);
    }

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Get existing schedules to check trips
      const existingSchedules = yield* Effect.tryPromise({
        try: async () => {
          const results = await self.db.query.notificationSchedules.findMany({
            where: inArray(notificationSchedules.id, idStrs),
          });
          return results;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "toggleMany",
            id: idStrs.join(","),
            cause: error,
          }),
      });

      // Verify trip write access for each schedule
      if (authCtx.isAuthenticated && existingSchedules.length > 0) {
        const authZPort = yield* AuthZPortTag;

        // Check access for each unique trip
        const uniqueTripIds = Array.from(
          new Set(existingSchedules.map((s) => s.tripId)),
        );

        for (const tripId of uniqueTripIds) {
          yield* authZPort.verifyAccess({
            userId: authCtx.userId,
            role: authCtx.role,
            tripRoles: authCtx.tripRoles,
            resourceType: "trip",
            resourceId: tripId,
            requiredPermission: "write",
          });
        }
      }

      // Proceed with database operation
      const sendToAll = isActive;
      const isDraft = false;

      return yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .update(notificationSchedules)
            .set({
              sendToAll,
              isDraft,
              updatedAt: new Date(),
            })
            .where(inArray(notificationSchedules.id, idStrs))
            .returning();

          return result.length;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "toggleMany",
            id: idStrs.join(","),
            cause: error,
          }),
      });
    });
  }

  updateLastRun(id: NotificationScheduleId, lastRun: Date) {
    const idStr = NotificationScheduleId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // First get existing schedule to check trip
      const existingSchedule = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.notificationSchedules.findFirst({
            where: eq(notificationSchedules.id, idStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "updateLastRun",
            id: idStr,
            cause: error,
          }),
      });

      // Verify trip write access for updating last run
      if (authCtx.isAuthenticated && existingSchedule) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: existingSchedule.tripId,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      // Map lastRun to isSent flag in schema
      return yield* Effect.tryPromise({
        try: async () => {
          const [result] = await self.db
            .update(notificationSchedules)
            .set({
              isSent: true,
              updatedAt: new Date(),
            })
            .where(eq(notificationSchedules.id, idStr))
            .returning();

          if (!result) throw new Error(`Notification schedule not found: ${idStr}`);
          return result;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "updateLastRun",
            id: idStr,
            cause: error,
          }),
      });
    }).pipe(Effect.map((record) => notificationScheduleMapper.toDTO(record)));
  }

  countExecutions(id: NotificationScheduleId) {
    const idStr = NotificationScheduleId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // First get the schedule to check trip
      const existingSchedule = yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db.query.notificationSchedules.findFirst({
            where: eq(notificationSchedules.id, idStr),
          });
          return result ?? null;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "countExecutions",
            id: idStr,
            cause: error,
          }),
      });

      // Verify trip read access
      if (authCtx.isAuthenticated && existingSchedule) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: existingSchedule.tripId,
          requiredPermission: "read",
        });
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .select({ count: count() })
            .from(notificationScheduleExecutions)
            .where(eq(notificationScheduleExecutions.scheduleId, idStr));

          return result[0]?.count ?? 0;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "countExecutions",
            id: idStr,
            cause: error,
          }),
      });
    });
  }
}
