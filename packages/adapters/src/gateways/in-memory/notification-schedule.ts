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
} from "@mirai-app/use-cases";
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
 * const tripSchedules = await repo.findByTripId("trip-123");
 *
 * // Find active schedules
 * const active = await repo.findActive();
 *
 * // Find upcoming schedules (next 7 days)
 * const upcoming = await repo.findUpcoming(7);
 *
 * // Toggle active status
 * const toggled = await repo.toggleActive("schedule-123");
 *
 * repo.reset();
 * ```
 */
export class InMemoryNotificationScheduleRepository
  extends InMemoryRepository<NotificationSchedule>
  implements NotificationScheduleRepository
{
  /** Storage for execution history records */
  private executionStorage = new Map<
    string,
    NotificationScheduleExecutionRecord[]
  >();

  /**
   * Reset the repository - clears all stored data including execution history.
   * Call this in beforeEach for test isolation.
   */
  override reset(): void {
    super.reset();
    this.executionStorage.clear();
  }

  /**
   * Seed the repository with initial data.
   * Useful for setting up test scenarios.
   */
  override seed(items: NotificationSchedule[]): void {
    super.seed(items);
  }

  /**
   * Create a new notification schedule
   * @param schedule - The schedule to create
   * @returns The created schedule
   */
  async create(schedule: NotificationSchedule): Promise<NotificationSchedule> {
    return this.createGeneric(schedule);
  }

  /**
   * Find notification schedule by ID
   * @param id - The schedule ID
   * @returns The schedule or null if not found
   */
  async findById(id: string): Promise<NotificationSchedule | null> {
    return this.findByIdGeneric(id);
  }

  /**
   * Find notification schedules by trip ID
   * @param tripId - The trip ID to search for
   * @returns Array of schedules for the trip, sorted by creation date descending
   */
  async findByTripId(tripId: string): Promise<NotificationSchedule[]> {
    return this.getAllItems()
      .filter((s) => s.tripId === tripId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Find notification schedule by name (exact match)
   * @param name - The schedule name to search for
   * @returns The first matching schedule or null if not found
   */
  async findByName(name: string): Promise<NotificationSchedule | null> {
    return (
      this.getAllItems().find(
        (s) => s.name.toLowerCase() === name.toLowerCase(),
      ) ?? null
    );
  }

  /**
   * Find notification schedule by trip ID and name
   * @param tripId - The trip ID to search for
   * @param name - The schedule name to search for
   * @returns The first matching schedule or null if not found
   */
  async findByTripIdAndName(
    tripId: string,
    name: string,
  ): Promise<NotificationSchedule | null> {
    return (
      this.getAllItems().find(
        (s) =>
          s.tripId === tripId && s.name.toLowerCase() === name.toLowerCase(),
      ) ?? null
    );
  }

  /**
   * Find notification schedules by type
   * @param type - The notification schedule type to filter by
   * @returns Array of schedules with the given type, sorted by creation date descending
   */
  async findByType(
    type: NotificationScheduleType,
  ): Promise<NotificationSchedule[]> {
    return this.getAllItems()
      .filter((s) => s.notificationType === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Find all notification schedules with filtering and pagination
   * @param options - Filter and pagination options
   * @returns Paginated result of schedules
   */
  async findAll(options?: {
    filter?: NotificationScheduleFilter;
    pagination?: PaginationOptions;
  }): Promise<PaginatedResult<NotificationSchedule>> {
    let items = this.getAllItems();

    // Apply filters
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

    // Sort by creation date descending
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Get total before pagination
    const total = items.length;

    // Apply pagination
    const limit = options?.pagination?.limit ?? 50;
    const offset = options?.pagination?.offset ?? 0;
    items = items.slice(offset, offset + limit);

    return {
      items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Find currently active schedules
   * Active means: isActive=true and current time is within the schedule window (startDate <= now <= endDate)
   * @param now - The reference time (defaults to current time)
   * @returns Array of active schedules, sorted by hour then minute ascending
   */
  async findActive(now?: Date): Promise<NotificationSchedule[]> {
    const currentTime = now ?? new Date();
    return this.getAllItems()
      .filter(
        (s) =>
          s.isActive && s.startDate <= currentTime && s.endDate >= currentTime,
      )
      .sort((a, b) => {
        const hourDiff = a.hour - b.hour;
        if (hourDiff !== 0) return hourDiff;
        return a.minute - b.minute;
      });
  }

  /**
   * Find upcoming schedules
   * Upcoming means: isActive=true, startDate is in the future or within the next N days
   * @param days - Number of days to look ahead (defaults to 7)
   * @param now - The reference time (defaults to current time)
   * @returns Array of upcoming schedules, sorted by startDate ascending
   */
  async findUpcoming(
    days?: number,
    now?: Date,
  ): Promise<NotificationSchedule[]> {
    const currentTime = now ?? new Date();
    const futureDate = new Date(currentTime);
    futureDate.setDate(futureDate.getDate() + (days ?? 7));

    return this.getAllItems()
      .filter(
        (s) =>
          s.isActive && s.startDate <= futureDate && s.endDate >= currentTime,
      )
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  /**
   * Update a notification schedule
   * @param schedule - The schedule to update
   * @returns The updated schedule
   * @throws Error if schedule not found
   */
  async update(schedule: NotificationSchedule): Promise<NotificationSchedule> {
    return this.updateGeneric(schedule);
  }

  /**
   * Delete a notification schedule by ID
   * @param id - The schedule ID to delete
   */
  async delete(id: string): Promise<void> {
    return this.deleteGeneric(id);
  }

  /**
   * Delete multiple notification schedules
   * @param ids - Array of schedule IDs to delete
   * @returns Count of deleted schedules
   */
  async deleteMany(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      if (this.storage.has(id)) {
        this.storage.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Check if a notification schedule exists
   * @param id - The schedule ID to check
   * @returns True if the schedule exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    return this.existsGeneric(id);
  }

  /**
   * Count notification schedules by filter
   * @param filter - Optional filter criteria
   * @returns Count of matching schedules
   */
  async count(filter?: NotificationScheduleFilter): Promise<number> {
    if (!filter) {
      return this.countGeneric();
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
  }

  /**
   * Update the lastRun timestamp for a schedule
   * @param id - The schedule ID to update
   * @param lastRun - The new last run timestamp
   * @returns The updated schedule
   * @throws Error if schedule not found
   */
  async updateLastRun(
    id: string,
    lastRun: Date,
  ): Promise<NotificationSchedule> {
    const schedule = await this.findById(id);
    if (!schedule) {
      throw new Error("Notification schedule not found");
    }
    const updated = schedule.updateLastRun(lastRun);
    return this.updateGeneric(updated);
  }

  /**
   * Toggle the isActive status for a schedule
   * @param id - The schedule ID to toggle
   * @returns The updated schedule with toggled status
   * @throws Error if schedule not found
   */
  async toggleActive(id: string): Promise<NotificationSchedule> {
    const schedule = await this.findById(id);
    if (!schedule) {
      throw new Error("Notification schedule not found");
    }
    const toggled = schedule.toggleActive();
    return this.updateGeneric(toggled);
  }

  /**
   * Bulk update isActive status for multiple schedules
   * @param ids - Array of schedule IDs to update
   * @param isActive - The new active status
   * @returns Count of updated schedules
   */
  async bulkToggleActive(ids: string[], isActive: boolean): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const schedule = this.storage.get(id);
      if (schedule) {
        const toggled = isActive
          ? schedule
          : schedule.toggleActive().toggleActive(); // Double toggle to ensure correct state
        // Actually, we need to create a new instance with the correct isActive value
        // Since there's no direct "setIsActive" method, we'll use update pattern
        // or the toggleActive() method intelligently
        const finalSchedule =
          schedule.isActive === isActive ? schedule : schedule.toggleActive();
        if (schedule.isActive !== finalSchedule.isActive) {
          this.storage.set(id, finalSchedule);
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Get execution history for a schedule
   * @param scheduleId - The schedule ID to get history for
   * @param limit - Maximum number of records to return
   * @returns Array of execution records, sorted by execution time descending
   */
  async getExecutionHistory(
    scheduleId: string,
    limit: number,
  ): Promise<NotificationScheduleExecutionRecord[]> {
    const executions = this.executionStorage.get(scheduleId) ?? [];
    return executions
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Count executions for a schedule
   * @param scheduleId - The schedule ID to count executions for
   * @returns The number of executions
   */
  async countExecutions(scheduleId: string): Promise<number> {
    return (this.executionStorage.get(scheduleId) ?? []).length;
  }

  /**
   * Add an execution record to the history (helper method for testing)
   * @param scheduleId - The schedule ID
   * @param record - The execution record to add
   */
  addExecutionRecord(
    scheduleId: string,
    record: NotificationScheduleExecutionRecord,
  ): void {
    const existing = this.executionStorage.get(scheduleId) ?? [];
    existing.push(record);
    this.executionStorage.set(scheduleId, existing);
  }

  /**
   * Seed execution history (helper method for testing)
   * @param scheduleId - The schedule ID
   * @param records - Array of execution records to seed
   */
  seedExecutionHistory(
    scheduleId: string,
    records: NotificationScheduleExecutionRecord[],
  ): void {
    this.executionStorage.set(scheduleId, records);
  }
}
