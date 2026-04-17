import { Effect } from "effect";
import { type NotificationSchedule } from "@mirai-app/use-cases/notification/ports/NotificationPort";
import { DatabaseError } from "@mirai-app/domain";

/**
 * In-Memory Notification Schedule Gateway
 *
 * Implements NotificationSchedulePort using in-memory Map storage for testing.
 *
 * Note: This implements all methods from NotificationSchedulePort interface
 * but does not formally implement it due to Context.Tag properties.
 */
export class InMemoryNotificationScheduleGateway {
  private schedules: Map<string, NotificationSchedule> = new Map();

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
    return Effect.sync(() => {
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

      let filteredSchedules = Array.from(this.schedules.values());

      // Apply filters
      if (tripId !== undefined && tripId !== null) {
        filteredSchedules = filteredSchedules.filter(
          (s) => s.tripId === tripId,
        );
      }

      if (notificationType) {
        filteredSchedules = filteredSchedules.filter(
          (s) => s.notificationType === notificationType,
        );
      }

      if (isActive !== undefined) {
        filteredSchedules = filteredSchedules.filter(
          (s) => s.isActive === isActive,
        );
      }

      if (startDateFrom) {
        filteredSchedules = filteredSchedules.filter(
          (s) => s.startDate >= startDateFrom,
        );
      }

      if (startDateTo) {
        filteredSchedules = filteredSchedules.filter(
          (s) => s.startDate <= startDateTo,
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredSchedules = filteredSchedules.filter(
          (s) =>
            s.name.toLowerCase().includes(searchLower) ||
            s.notificationTitle.toLowerCase().includes(searchLower) ||
            s.notificationBody.toLowerCase().includes(searchLower),
        );
      }

      // Sort by createdAt desc
      const sortedSchedules = filteredSchedules.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const total = sortedSchedules.length;
      const paginatedSchedules = sortedSchedules.slice(offset, offset + limit);
      const hasMore = offset + paginatedSchedules.length < total;

      return {
        schedules: paginatedSchedules,
        total,
        hasMore,
      };
    });
  }

  findActive(): Effect.Effect<NotificationSchedule[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.schedules.values())
        .filter((s) => s.isActive && s.lastRun === null)
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    });
  }

  findUpcoming(
    days: number,
  ): Effect.Effect<NotificationSchedule[], DatabaseError, never> {
    return Effect.sync(() => {
      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + days);

      return Array.from(this.schedules.values())
        .filter(
          (s) =>
            s.startDate >= now &&
            s.startDate <= futureDate &&
            s.lastRun === null &&
            s.isActive,
        )
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    });
  }

  findById(
    id: string,
  ): Effect.Effect<NotificationSchedule | null, DatabaseError, never> {
    return Effect.sync(() => {
      const schedule = this.schedules.get(id);
      return schedule ?? null;
    });
  }

  findByTripIdAndName(
    tripId: string,
    name: string,
  ): Effect.Effect<NotificationSchedule | null, DatabaseError, never> {
    return Effect.sync(() => {
      const schedule = Array.from(this.schedules.values()).find(
        (s) => s.tripId === tripId && s.name === name,
      );
      return schedule ?? null;
    });
  }

  create(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never> {
    return Effect.sync(() => {
      this.schedules.set(schedule.id, schedule);
      return schedule;
    });
  }

  update(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never> {
    return Effect.sync(() => {
      const existing = this.schedules.get(schedule.id);
      if (!existing) {
        throw new Error(`Notification schedule not found: ${schedule.id}`);
      }

      const updatedSchedule: NotificationSchedule = {
        ...schedule,
        updatedAt: new Date(),
      };

      this.schedules.set(schedule.id, updatedSchedule);
      return updatedSchedule;
    });
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.schedules.delete(id);
    });
  }

  deleteMany(ids: string[]): Effect.Effect<number, DatabaseError, never> {
    return Effect.sync(() => {
      let count = 0;
      for (const id of ids) {
        if (this.schedules.delete(id)) {
          count++;
        }
      }
      return count;
    });
  }

  toggleActive(
    id: string,
    isActive: boolean,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never> {
    return Effect.sync(() => {
      const schedule = this.schedules.get(id);
      if (!schedule) {
        throw new Error(`Notification schedule not found: ${id}`);
      }

      const updatedSchedule: NotificationSchedule = {
        ...schedule,
        isActive,
        updatedAt: new Date(),
      };

      this.schedules.set(id, updatedSchedule);
      return updatedSchedule;
    });
  }

  toggleMany(
    ids: string[],
    isActive: boolean,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.sync(() => {
      let count = 0;
      for (const id of ids) {
        const schedule = this.schedules.get(id);
        if (schedule) {
          this.schedules.set(id, {
            ...schedule,
            isActive,
            updatedAt: new Date(),
          });
          count++;
        }
      }
      return count;
    });
  }

  updateLastRun(
    id: string,
    lastRun: Date,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never> {
    return Effect.sync(() => {
      const schedule = this.schedules.get(id);
      if (!schedule) {
        throw new Error(`Notification schedule not found: ${id}`);
      }

      const updatedSchedule: NotificationSchedule = {
        ...schedule,
        lastRun,
        updatedAt: new Date(),
      };

      this.schedules.set(id, updatedSchedule);
      return updatedSchedule;
    });
  }

  countExecutions(id: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.sync(() => {
      // In-memory implementation tracks executions in a separate map
      // For simplicity, we check if the schedule has a lastRun set
      const schedule = this.schedules.get(id);
      if (!schedule) return 0;
      return schedule.lastRun ? 1 : 0;
    });
  }

  // Test helper methods
  clear(): void {
    this.schedules.clear();
  }

  seed(schedules: NotificationSchedule[]): void {
    for (const schedule of schedules) {
      this.schedules.set(schedule.id, schedule);
    }
  }
}
