import { Effect } from "effect";
import type {
  INotificationSchedulePort,
  NotificationSchedule,
} from "@mirai-app/domain";
import { DatabaseError, NotificationScheduleId, TripId } from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";

/**
 * In-Memory Notification Schedule Gateway
 *
 * Implements INotificationSchedulePort for testing and development.
 * Stores notification schedules in memory.
 *
 * Auth verification uses AuthContextTag and AuthZPortTag from Effect context.
 * Notification schedules are trip-scoped - users need trip-level access.
 */
export class InMemoryNotificationScheduleGateway
  implements INotificationSchedulePort
{
  private schedules: Map<string, NotificationSchedule> = new Map();

  findById(id: NotificationScheduleId) {
    const self = this;
    const idStr = NotificationScheduleId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      const schedule = self.schedules.get(idStr);

      // If authenticated and schedule exists, verify trip access
      if (authCtx.isAuthenticated && schedule && schedule.tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(schedule.tripId),
          requiredPermission: "read",
        });
      }

      return schedule ?? null;
    });
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

      // If tripId is specified, verify access
      if (authCtx.isAuthenticated && params.tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: params.tripId,
          requiredPermission: "read",
        });
      }

      let results = Array.from(self.schedules.values());

      if (params.tripId !== undefined && params.tripId !== null) {
        results = results.filter((s) => s.tripId === params.tripId);
      }

      if (params.notificationType) {
        results = results.filter(
          (s) => s.notificationType === params.notificationType,
        );
      }

      if (params.isActive !== undefined) {
        results = results.filter((s) => s.isActive === params.isActive);
      }

      if (params.startDateFrom) {
        results = results.filter((s) => s.startDate >= params.startDateFrom!);
      }

      if (params.startDateTo) {
        results = results.filter((s) => s.startDate <= params.startDateTo!);
      }

      if (params.search) {
        const searchLower = params.search.toLowerCase();
        results = results.filter(
          (s) =>
            s.name.toLowerCase().includes(searchLower) ||
            s.notificationTitle.toLowerCase().includes(searchLower) ||
            s.notificationBody.toLowerCase().includes(searchLower),
        );
      }

      const total = results.length;
      const paginated = results.slice(
        params.offset,
        params.offset + params.limit,
      );
      const hasMore = params.offset + paginated.length < total;

      return {
        schedules: paginated,
        total,
        hasMore,
      };
    });
  }

  findActive() {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext (used for logging/auditing but not strict auth)
      yield* AuthContextTag;

      const results = Array.from(self.schedules.values()).filter(
        (s) => s.isActive,
      );

      return results;
    });
  }

  findUpcoming(days: number) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext (used for logging/auditing but not strict auth)
      yield* AuthContextTag;

      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + days);

      const results = Array.from(self.schedules.values()).filter(
        (s) => s.startDate >= now && s.startDate <= futureDate && s.isActive,
      );

      return results;
    });
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

      const results = Array.from(self.schedules.values()).find(
        (s) => s.tripId === tripId && s.name === name,
      );

      return results ?? null;
    });
  }

  create(schedule: NotificationSchedule) {
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

      const idStr = NotificationScheduleId.toString(schedule.id);
      self.schedules.set(idStr, schedule);
      return schedule;
    });
  }

  update(schedule: NotificationSchedule) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      const idStr = NotificationScheduleId.toString(schedule.id);
      const existing = self.schedules.get(idStr);

      // Verify trip write access
      if (authCtx.isAuthenticated && existing && existing.tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(existing.tripId),
          requiredPermission: "write",
        });
      }

      if (!existing) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "update",
            id: idStr,
            cause: new Error(`Notification schedule not found: ${idStr}`),
          }),
        );
      }

      self.schedules.set(idStr, schedule);
      return schedule;
    });
  }

  delete(id: NotificationScheduleId) {
    const self = this;
    const idStr = NotificationScheduleId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      const existing = self.schedules.get(idStr);

      // Verify trip write access
      if (authCtx.isAuthenticated && existing && existing.tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(existing.tripId),
          requiredPermission: "write",
        });
      }

      self.schedules.delete(idStr);
    });
  }

  deleteMany(ids: NotificationScheduleId[]) {
    const self = this;

    if (ids.length === 0) {
      return Effect.succeed(0);
    }

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      let count = 0;

      for (const id of ids) {
        const idStr = NotificationScheduleId.toString(id);
        const existing = self.schedules.get(idStr);

        // Verify trip write access for each schedule
        if (authCtx.isAuthenticated && existing && existing.tripId) {
          const authZPort = yield* AuthZPortTag;
          yield* authZPort.verifyAccess({
            userId: authCtx.userId,
            role: authCtx.role,
            tripRoles: authCtx.tripRoles,
            resourceType: "trip",
            resourceId: TripId.toString(existing.tripId),
            requiredPermission: "write",
          });
        }

        if (self.schedules.delete(idStr)) {
          count++;
        }
      }

      return count;
    });
  }

  toggleActive(id: NotificationScheduleId, isActive: boolean) {
    const self = this;
    const idStr = NotificationScheduleId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      const existing = self.schedules.get(idStr);

      // Verify trip write access
      if (authCtx.isAuthenticated && existing && existing.tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(existing.tripId),
          requiredPermission: "write",
        });
      }

      if (!existing) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "toggleActive",
            id: idStr,
            cause: new Error(`Notification schedule not found: ${idStr}`),
          }),
        );
      }

      const updated = { ...existing, isActive };
      self.schedules.set(idStr, updated);
      return updated;
    });
  }

  toggleMany(ids: NotificationScheduleId[], isActive: boolean) {
    const self = this;

    if (ids.length === 0) {
      return Effect.succeed(0);
    }

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      let count = 0;

      for (const id of ids) {
        const idStr = NotificationScheduleId.toString(id);
        const existing = self.schedules.get(idStr);

        // Verify trip write access for each schedule
        if (authCtx.isAuthenticated && existing && existing.tripId) {
          const authZPort = yield* AuthZPortTag;
          yield* authZPort.verifyAccess({
            userId: authCtx.userId,
            role: authCtx.role,
            tripRoles: authCtx.tripRoles,
            resourceType: "trip",
            resourceId: TripId.toString(existing.tripId),
            requiredPermission: "write",
          });
        }

        if (existing) {
          const updated = { ...existing, isActive };
          self.schedules.set(idStr, updated);
          count++;
        }
      }

      return count;
    });
  }

  updateLastRun(id: NotificationScheduleId, lastRun: Date) {
    const self = this;
    const idStr = NotificationScheduleId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      const existing = self.schedules.get(idStr);

      // Verify trip write access
      if (authCtx.isAuthenticated && existing && existing.tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(existing.tripId),
          requiredPermission: "write",
        });
      }

      if (!existing) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "updateLastRun",
            id: idStr,
            cause: new Error(`Notification schedule not found: ${idStr}`),
          }),
        );
      }

      const updated = { ...existing, lastRun };
      self.schedules.set(idStr, updated);
      return updated;
    });
  }

  countExecutions(id: NotificationScheduleId) {
    const self = this;
    const idStr = NotificationScheduleId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      const existing = self.schedules.get(idStr);

      // Verify trip read access
      if (authCtx.isAuthenticated && existing && existing.tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: TripId.toString(existing.tripId),
          requiredPermission: "read",
        });
      }

      // Mock execution count - in a real implementation this would query a separate table
      return 0;
    });
  }
}
