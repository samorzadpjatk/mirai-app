import type {
  NotificationSchedule,
  NotificationScheduleType,
  NotificationScheduleFilter,
  PaginationOptions,
  PaginatedResult,
} from "@mirai-app/domain";
import type {
  NotificationScheduleRepository,
  NotificationScheduleExecutionRecord,
} from "@mirai-app/domain/ports";
import { Effect } from "effect";
import { InMemoryRepository } from "./base";

/**
 * In-Memory Notification Schedule Repository for Testing
 *
 * Implements NotificationScheduleRepository port with in-memory storage.
 * Provides methods for managing notification schedules including filtering,
 * pagination, execution history tracking, and bulk operations.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryNotificationScheduleRepository();
 * repo.seed([mockSchedule]);
 *
 * // Find by trip
 * const tripSchedules = await Effect.runPromise(repo.findByTripId("trip-123"));
 *
 * // Find active schedules
 * const active = await Effect.runPromise(repo.findActive());
 *
 * // Find upcoming schedules (next 7 days)
 * const upcoming = await Effect.runPromise(repo.findUpcoming(7));
 *
 * // Toggle active status
 * const toggled = await Effect.runPromise(repo.toggleActive("schedule-123"));
 *
 * repo.reset();
 * ```
 */
export class InMemoryNotificationScheduleRepository
  extends InMemoryRepository<NotificationSchedule>
  implements NotificationScheduleRepository
{
  private executionStorage = new Map<
    string,
    NotificationScheduleExecutionRecord[]
  >();

  override reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      super.reset();
      this.executionStorage.clear();
    });
  }

  override seed(
    items: NotificationSchedule[],
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      items.forEach((item) => this.storage.set(item.id, item));
    });
  }

  create(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, never, never> {
    return Effect.sync(() => {
      this.storage.set(schedule.id, schedule);
      return schedule;
    });
  }

  findById(
    id: string,
  ): Effect.Effect<NotificationSchedule | null, never, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<NotificationSchedule[], never, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((s) => s.tripId === tripId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByName(
    name: string,
  ): Effect.Effect<NotificationSchedule | null, never, never> {
    return Effect.succeed(
      this.getAllItems().find(
        (s) => s.name.toLowerCase() === name.toLowerCase(),
      ) ?? null,
    );
  }

  findByTripIdAndName(
    tripId: string,
    name: string,
  ): Effect.Effect<NotificationSchedule | null, never, never> {
    return Effect.succeed(
      this.getAllItems().find(
        (s) =>
          s.tripId === tripId && s.name.toLowerCase() === name.toLowerCase(),
      ) ?? null,
    );
  }

  findByType(
    type: NotificationScheduleType,
  ): Effect.Effect<NotificationSchedule[], never, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((s) => s.notificationType === type)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findAll(options?: {
    filter?: NotificationScheduleFilter;
    pagination?: PaginationOptions;
  }): Effect.Effect<NotificationSchedule[], never, never> {
    return Effect.gen(this, function* () {
      let items = this.getAllItems();

      if (options?.filter) {
        const filter = options.filter;

        if (filter.tripId !== undefined && filter.tripId !== null) {
          items = items.filter((s) => s.tripId === filter.tripId);
        }

        if (filter.notificationType !== undefined) {
          items = items.filter(
            (s) => s.notificationType === filter.notificationType,
          );
        }

        if (filter.isActive !== undefined) {
          items = items.filter((s) => s.isActive === filter.isActive);
        }

        if (filter.startDateFrom !== undefined) {
          items = items.filter((s) => s.startDate >= filter.startDateFrom!);
        }

        if (filter.startDateTo !== undefined) {
          items = items.filter((s) => s.startDate <= filter.startDateTo!);
        }

        if (filter.search !== undefined && filter.search.trim() !== "") {
          const searchLower = filter.search.toLowerCase();
          items = items.filter((s) =>
            s.name.toLowerCase().includes(searchLower),
          );
        }
      }

      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (options?.pagination?.offset) {
        items = items.slice(options.pagination.offset);
      }

      if (options?.pagination?.limit !== undefined) {
        items = items.slice(0, options.pagination.limit);
      }

      return items;
    });
  }

  findAllPaginated(options?: {
    filter?: NotificationScheduleFilter;
    pagination?: PaginationOptions;
  }): Effect.Effect<PaginatedResult<NotificationSchedule>, never, never> {
    let items = this.getAllItems();

    if (options?.filter) {
      const filter = options.filter;

      if (filter.tripId !== undefined && filter.tripId !== null) {
        items = items.filter((s) => s.tripId === filter.tripId);
      }

      if (filter.notificationType !== undefined) {
        items = items.filter(
          (s) => s.notificationType === filter.notificationType,
        );
      }

      if (filter.isActive !== undefined) {
        items = items.filter((s) => s.isActive === filter.isActive);
      }

      if (filter.startDateFrom !== undefined) {
        items = items.filter((s) => s.startDate >= filter.startDateFrom!);
      }

      if (filter.startDateTo !== undefined) {
        items = items.filter((s) => s.startDate <= filter.startDateTo!);
      }

      if (filter.search !== undefined && filter.search.trim() !== "") {
        const searchLower = filter.search.toLowerCase();
        items = items.filter((s) => s.name.toLowerCase().includes(searchLower));
      }
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;

    const limit = options?.pagination?.limit ?? 50;
    const offset = options?.pagination?.offset ?? 0;
    items = items.slice(offset, offset + limit);

    return Effect.succeed({
      items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  }

  findActive(now?: Date): Effect.Effect<NotificationSchedule[], never, never> {
    const currentTime = now ?? new Date();
    return Effect.succeed(
      this.getAllItems()
        .filter(
          (s) =>
            s.isActive &&
            s.startDate <= currentTime &&
            s.endDate >= currentTime,
        )
        .sort((a, b) => {
          const hourDiff = a.hour - b.hour;
          if (hourDiff !== 0) return hourDiff;
          return a.minute - b.minute;
        }),
    );
  }

  findUpcoming(
    days?: number,
    now?: Date,
  ): Effect.Effect<NotificationSchedule[], never, never> {
    const currentTime = now ?? new Date();
    const futureDate = new Date(currentTime);
    futureDate.setDate(futureDate.getDate() + (days ?? 7));

    return Effect.succeed(
      this.getAllItems()
        .filter(
          (s) =>
            s.isActive && s.startDate <= futureDate && s.endDate >= currentTime,
        )
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
    );
  }

  update(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, never, never> {
    return Effect.sync(() => {
      this.storage.set(schedule.id, schedule);
      return schedule;
    });
  }

  delete(id: string): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.storage.delete(id);
    });
  }

  exists(id: string): Effect.Effect<boolean, never, never> {
    return Effect.sync(() => this.storage.has(id));
  }

  deleteMany(ids: string[]): Effect.Effect<number, never, never> {
    let count = 0;
    for (const id of ids) {
      if (this.storage.has(id)) {
        this.storage.delete(id);
        count++;
      }
    }
    return Effect.succeed(count);
  }

  count(
    filter?: NotificationScheduleFilter,
  ): Effect.Effect<number, never, never> {
    return Effect.gen(this, function* () {
      if (!filter) {
        const count = yield* this.countGeneric().pipe(Effect.orDie);
        return count;
      }

      let items = this.getAllItems();

      if (filter.tripId !== undefined && filter.tripId !== null) {
        items = items.filter((s) => s.tripId === filter.tripId);
      }

      if (filter.notificationType !== undefined) {
        items = items.filter(
          (s) => s.notificationType === filter.notificationType,
        );
      }

      if (filter.isActive !== undefined) {
        items = items.filter((s) => s.isActive === filter.isActive);
      }

      if (filter.startDateFrom !== undefined) {
        items = items.filter((s) => s.startDate >= filter.startDateFrom!);
      }

      if (filter.startDateTo !== undefined) {
        items = items.filter((s) => s.startDate <= filter.startDateTo!);
      }

      if (filter.search !== undefined && filter.search.trim() !== "") {
        const searchLower = filter.search.toLowerCase();
        items = items.filter((s) => s.name.toLowerCase().includes(searchLower));
      }

      return items.length;
    });
  }

  updateLastRun(
    id: string,
    lastRun: Date,
  ): Effect.Effect<NotificationSchedule, never, never> {
    return Effect.gen(this, function* () {
      const schedule = this.storage.get(id);
      if (!schedule) {
        throw new Error("Notification schedule not found");
      }
      const updated = schedule.updateLastRun(lastRun);
      return yield* this.updateGeneric(updated).pipe(Effect.orDie);
    });
  }

  toggleActive(id: string): Effect.Effect<NotificationSchedule, never, never> {
    return Effect.gen(this, function* () {
      const schedule = this.storage.get(id);
      if (!schedule) {
        throw new Error("Notification schedule not found");
      }
      const toggled = schedule.toggleActive();
      return yield* this.updateGeneric(toggled).pipe(Effect.orDie);
    });
  }

  bulkToggleActive(
    ids: string[],
    isActive: boolean,
  ): Effect.Effect<number, never, never> {
    let count = 0;
    for (const id of ids) {
      const schedule = this.storage.get(id);
      if (schedule && schedule.isActive !== isActive) {
        const updatedSchedule = Object.create(Object.getPrototypeOf(schedule));
        Object.assign(updatedSchedule, schedule, { isActive });
        this.storage.set(id, updatedSchedule);
        count++;
      }
    }
    return Effect.succeed(count);
  }

  getExecutionHistory(
    scheduleId: string,
    limit: number,
  ): Effect.Effect<NotificationScheduleExecutionRecord[], never, never> {
    const executions = this.executionStorage.get(scheduleId) ?? [];
    return Effect.succeed(
      executions
        .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
        .slice(0, limit),
    );
  }

  countExecutions(scheduleId: string): Effect.Effect<number, never, never> {
    return Effect.succeed((this.executionStorage.get(scheduleId) ?? []).length);
  }

  addExecutionRecord(
    scheduleId: string,
    record: NotificationScheduleExecutionRecord,
  ): void {
    const existing = this.executionStorage.get(scheduleId) ?? [];
    existing.push(record);
    this.executionStorage.set(scheduleId, existing);
  }

  seedExecutionHistory(
    scheduleId: string,
    records: NotificationScheduleExecutionRecord[],
  ): void {
    this.executionStorage.set(scheduleId, records);
  }
}
