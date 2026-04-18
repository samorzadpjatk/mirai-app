import { Effect } from "effect";
import type {
  INotificationSchedulePort,
  NotificationSchedule,
  NotificationScheduleListResult,
} from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain";

/**
 * In-Memory Notification Schedule Gateway
 *
 * Implements INotificationSchedulePort for testing and development.
 * Stores notification schedules in memory.
 */
export class InMemoryNotificationScheduleGateway
  implements INotificationSchedulePort
{
  private schedules: Map<string, NotificationSchedule> = new Map();

  findById(id: string) {
    return Effect.gen(() => {
      const schedule = this.schedules.get(id);
      return schedule ?? null;
    });
  }

  findAll(params: {
    tripId?: string;
    isActive?: boolean;
    isTemplate?: boolean;
    scheduleType?: string;
    limit: number;
    offset: number;
  }) {
    return Effect.gen(() => {
      let results = Array.from(this.schedules.values());

      if (params.tripId) {
        results = results.filter((s) => s.tripId === params.tripId);
      }

      if (params.isActive !== undefined) {
        results = results.filter((s) => s.isActive === params.isActive);
      }

      if (params.isTemplate !== undefined) {
        results = results.filter((s) => s.isTemplate === params.isTemplate);
      }

      if (params.scheduleType) {
        results = results.filter((s) => s.scheduleType === params.scheduleType);
      }

      const total = results.length;
      const paginated = results.slice(
        params.offset,
        params.offset + params.limit,
      );

      return {
        schedules: paginated,
        total,
      };
    });
  }

  findActiveSchedules(now: Date) {
    return Effect.gen(() => {
      const results = Array.from(this.schedules.values()).filter(
        (s) => s.isActive && s.scheduledFor <= now,
      );
      return results;
    });
  }

  findTemplates() {
    return Effect.gen(() => {
      const results = Array.from(this.schedules.values()).filter(
        (s) => s.isTemplate,
      );
      return results;
    });
  }

  create(schedule: NotificationSchedule) {
    return Effect.gen(() => {
      this.schedules.set(schedule.id, schedule);
      return schedule;
    });
  }

  update(schedule: NotificationSchedule) {
    return Effect.gen(() => {
      if (!this.schedules.has(schedule.id)) {
        return null;
      }
      this.schedules.set(schedule.id, schedule);
      return schedule;
    });
  }

  delete(id: string) {
    return Effect.gen(() => {
      this.schedules.delete(id);
    });
  }

  updateLastRun(id: string, lastRunAt: Date, lastRunStatus: string) {
    return Effect.gen(() => {
      const schedule = this.schedules.get(id);
      if (!schedule) {
        return null;
      }
      const updated = {
        ...schedule,
        lastRunAt,
        lastRunStatus,
        runCount: (schedule.runCount ?? 0) + 1,
      };
      this.schedules.set(id, updated);
      return updated;
    });
  }

  duplicate(id: string, newId: string) {
    return Effect.gen(() => {
      const schedule = this.schedules.get(id);
      if (!schedule) {
        return null;
      }
      const duplicated = {
        ...schedule,
        id: newId,
        name: `${schedule.name} (Copy)`,
        isTemplate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.schedules.set(newId, duplicated);
      return duplicated;
    });
  }
}
