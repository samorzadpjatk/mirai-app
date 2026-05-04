import { vi } from "vitest";

/**
 * Builder pattern for creating test data objects.
 * Provides a fluent API for constructing complex test data.
 */
export class TestDataBuilder<T extends Record<string, unknown>> {
  private data: Partial<T> = {};

  constructor(private defaults: T) {}

  /**
   * Sets a field value in the test data.
   */
  with<K extends keyof T>(key: K, value: T[K]): this {
    this.data[key] = value;
    return this;
  }

  /**
   * Merges multiple fields into the test data.
   */
  withMany(fields: Partial<T>): this {
    this.data = { ...this.data, ...fields };
    return this;
  }

  /**
   * Builds the final test data object.
   */
  build(): T {
    return { ...this.defaults, ...this.data };
  }

  /**
   * Creates multiple instances of the test data.
   */
  buildMany(count: number): T[] {
    return Array.from({ length: count }, () => this.build());
  }

  /**
   * Resets the builder to defaults.
   */
  reset(): this {
    this.data = {};
    return this;
  }
}

/**
 * Creates a test data builder with the given defaults.
 */
export function createBuilder<T extends Record<string, unknown>>(
  defaults: T
): TestDataBuilder<T> {
  return new TestDataBuilder(defaults);
}

// ============================================
// Common Test Data Builders
// ============================================

/**
 * Builder for user test data.
 */
export const userBuilder = createBuilder({
  id: "user-1",
  email: "user@example.com",
  name: "Test User",
  role: "user" as const,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  isActive: true,
});

/**
 * Builder for trip test data.
 */
export const tripBuilder = createBuilder({
  id: "trip-1",
  name: "Test Trip",
  description: "A test trip for development",
  startDate: new Date("2024-06-01"),
  endDate: new Date("2024-06-07"),
  location: "Test Location",
  maxParticipants: 50,
  status: "active" as const,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
});

/**
 * Builder for event test data.
 */
export const eventBuilder = createBuilder({
  id: "event-1",
  tripId: "trip-1",
  name: "Test Event",
  description: "A test event",
  startTime: new Date("2024-06-01T10:00:00Z"),
  endTime: new Date("2024-06-01T12:00:00Z"),
  location: "Event Location",
  type: "activity" as const,
  status: "scheduled" as const,
});

/**
 * Builder for API response test data.
 */
export function createApiResponseBuilder<T>() {
  return createBuilder({
    data: null as T,
    error: null as Error | null,
    status: 200,
    statusText: "OK",
    headers: {} as Record<string, string>,
  });
}

/**
 * Builder for paginated response test data.
 */
export function createPaginatedBuilder<T>() {
  return createBuilder({
    data: [] as T[],
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
}
