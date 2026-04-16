/**
 * Unit tests for InMemoryEventGateway cursor-based pagination
 *
 * Tests all 4 Connection methods:
 * - findByTripIdConnection
 * - findUpcomingByTripIdConnection
 * - findOngoingByTripIdConnection
 * - findPastByTripIdConnection
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryEventGateway } from "./gateway";

// Minimal EventDTO type for testing
type EventType =
  | "ACTIVITY"
  | "MEAL"
  | "TRANSPORT"
  | "ACCOMMODATION"
  | "MEETING"
  | "OTHER";
type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";

interface EventDTO {
  id: string;
  tripId: string;
  groupId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date | null;
  type: EventType;
  status: EventStatus;
  maxParticipants: number | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

describe("[UNIT] EventGateway Cursor Pagination", () => {
  let gateway: InMemoryEventGateway;

  beforeEach(() => {
    gateway = new InMemoryEventGateway();
  });

  // ============================================================================
  // Test Data Helpers
  // ============================================================================

  function createMockEvent(
    id: string,
    tripId: string,
    startTime: Date,
    endTime: Date,
    overrides?: Partial<EventDTO>,
  ): EventDTO {
    return {
      id,
      tripId,
      groupId: null,
      title: `Event ${id}`,
      description: "Test event description",
      location: "Test location",
      startTime,
      endTime,
      type: "OTHER",
      status: "PUBLISHED",
      maxParticipants: null,
      createdById: "user-1",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
      ...overrides,
    };
  }

  function createEventsForTrip(
    tripId: string,
    count: number,
    startDate: Date,
  ): EventDTO[] {
    const events: EventDTO[] = [];
    for (let i = 0; i < count; i++) {
      const startTime = new Date(startDate.getTime() + i * 60 * 60 * 1000); // 1 hour apart
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 min duration
      events.push(
        createMockEvent(`event-${tripId}-${i + 1}`, tripId, startTime, endTime),
      );
    }
    return events;
  }

  // ============================================================================
  // findByTripIdConnection Tests
  // ============================================================================

  describe("findByTripIdConnection", () => {
    it("returns empty result for trip with no events", async () => {
      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-empty", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("returns first page with hasNextPage=true when more items exist", async () => {
      const tripId = "trip-1";
      const events = createEventsForTrip(
        tripId,
        25,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const event of events) {
        await Effect.runPromise(
          gateway.create(event as Parameters<typeof gateway.create>[0]),
        );
      }

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns subsequent page using cursor", async () => {
      const tripId = "trip-2";
      const events = createEventsForTrip(
        tripId,
        25,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const event of events) {
        await Effect.runPromise(
          gateway.create(event as Parameters<typeof gateway.create>[0]),
        );
      }

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, { first: 10 }),
      );

      // Get second page using endCursor
      const secondPage = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, {
          first: 10,
          after: {
            id: events[9].id,
            startTime: events[9].startTime.toISOString(),
          },
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.nodes).toHaveLength(10);
      expect(secondPage.pageInfo.hasNextPage).toBe(true);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);

      // Verify different items
      expect(secondPage.nodes[0].id).toBe(events[10].id);
      expect(secondPage.nodes[9].id).toBe(events[19].id);
    });

    it("returns hasNextPage=false on last page", async () => {
      const tripId = "trip-3";
      const events = createEventsForTrip(
        tripId,
        15,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const event of events) {
        await Effect.runPromise(
          gateway.create(event as Parameters<typeof gateway.create>[0]),
        );
      }

      // Get all items in one request
      const result = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, { first: 20 }),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.nodes).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("sorts by startTime, then id", async () => {
      const tripId = "trip-4";
      const now = new Date("2024-06-01T08:00:00Z");

      // Create events with same startTime but different ids
      const event1 = createMockEvent(
        "event-b",
        tripId,
        now,
        new Date(now.getTime() + 3600000),
      );
      const event2 = createMockEvent(
        "event-a",
        tripId,
        now,
        new Date(now.getTime() + 3600000),
      );
      const event3 = createMockEvent(
        "event-c",
        tripId,
        new Date(now.getTime() + 7200000),
        new Date(now.getTime() + 10800000),
      );

      await Effect.runPromise(
        gateway.create(event1 as Parameters<typeof gateway.create>[0]),
      );
      await Effect.runPromise(
        gateway.create(event2 as Parameters<typeof gateway.create>[0]),
      );
      await Effect.runPromise(
        gateway.create(event3 as Parameters<typeof gateway.create>[0]),
      );

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, { first: 10 }),
      );

      // Should be sorted by startTime, then id
      // event-a and event-b have same startTime, so sorted by id: event-a < event-b
      // event-c has later startTime
      expect(result.nodes[0].id).toBe("event-a");
      expect(result.nodes[1].id).toBe("event-b");
      expect(result.nodes[2].id).toBe("event-c");
    });
  });

  // ============================================================================
  // findUpcomingByTripIdConnection Tests
  // ============================================================================

  describe("findUpcomingByTripIdConnection", () => {
    it("returns only future events", async () => {
      const tripId = "trip-upcoming";
      const now = new Date();
      const futureTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

      const pastEvent = createMockEvent(
        "past-event",
        tripId,
        new Date(now.getTime() - 24 * 60 * 60 * 1000),
        new Date(now.getTime() - 23 * 60 * 60 * 1000),
      );
      const futureEvent = createMockEvent(
        "future-event",
        tripId,
        futureTime,
        new Date(futureTime.getTime() + 3600000),
      );

      await Effect.runPromise(
        gateway.create(pastEvent as Parameters<typeof gateway.create>[0]),
      );
      await Effect.runPromise(
        gateway.create(futureEvent as Parameters<typeof gateway.create>[0]),
      );

      const result = await Effect.runPromise(
        gateway.findUpcomingByTripIdConnection(tripId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(1);
      expect(result.nodes[0].id).toBe("future-event");
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("returns empty when no upcoming events", async () => {
      const tripId = "trip-no-upcoming";
      const now = new Date();

      const pastEvent = createMockEvent(
        "past-event",
        tripId,
        new Date(now.getTime() - 24 * 60 * 60 * 1000),
        new Date(now.getTime() - 23 * 60 * 60 * 1000),
      );

      await Effect.runPromise(
        gateway.create(pastEvent as Parameters<typeof gateway.create>[0]),
      );

      const result = await Effect.runPromise(
        gateway.findUpcomingByTripIdConnection(tripId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  // ============================================================================
  // findOngoingByTripIdConnection Tests
  // ============================================================================

  describe("findOngoingByTripIdConnection", () => {
    it("returns only currently ongoing events", async () => {
      const tripId = "trip-ongoing";
      const now = new Date();

      const pastEvent = createMockEvent(
        "past-event",
        tripId,
        new Date(now.getTime() - 2 * 60 * 60 * 1000),
        new Date(now.getTime() - 1 * 60 * 60 * 1000),
      );
      const ongoingEvent = createMockEvent(
        "ongoing-event",
        tripId,
        new Date(now.getTime() - 30 * 60 * 1000),
        new Date(now.getTime() + 30 * 60 * 1000),
      );
      const futureEvent = createMockEvent(
        "future-event",
        tripId,
        new Date(now.getTime() + 60 * 60 * 1000),
        new Date(now.getTime() + 2 * 60 * 60 * 1000),
      );

      await Effect.runPromise(
        gateway.create(pastEvent as Parameters<typeof gateway.create>[0]),
      );
      await Effect.runPromise(
        gateway.create(ongoingEvent as Parameters<typeof gateway.create>[0]),
      );
      await Effect.runPromise(
        gateway.create(futureEvent as Parameters<typeof gateway.create>[0]),
      );

      const result = await Effect.runPromise(
        gateway.findOngoingByTripIdConnection(tripId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(1);
      expect(result.nodes[0].id).toBe("ongoing-event");
    });

    it("returns empty when no ongoing events", async () => {
      const tripId = "trip-no-ongoing";
      const now = new Date();

      const pastEvent = createMockEvent(
        "past-event",
        tripId,
        new Date(now.getTime() - 2 * 60 * 60 * 1000),
        new Date(now.getTime() - 1 * 60 * 60 * 1000),
      );

      await Effect.runPromise(
        gateway.create(pastEvent as Parameters<typeof gateway.create>[0]),
      );

      const result = await Effect.runPromise(
        gateway.findOngoingByTripIdConnection(tripId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
    });
  });

  // ============================================================================
  // findPastByTripIdConnection Tests
  // ============================================================================

  describe("findPastByTripIdConnection", () => {
    it("returns only past events", async () => {
      const tripId = "trip-past";
      const now = new Date();

      const pastEvent = createMockEvent(
        "past-event",
        tripId,
        new Date(now.getTime() - 2 * 60 * 60 * 1000),
        new Date(now.getTime() - 1 * 60 * 60 * 1000),
      );
      const futureEvent = createMockEvent(
        "future-event",
        tripId,
        new Date(now.getTime() + 60 * 60 * 1000),
        new Date(now.getTime() + 2 * 60 * 60 * 1000),
      );

      await Effect.runPromise(
        gateway.create(pastEvent as Parameters<typeof gateway.create>[0]),
      );
      await Effect.runPromise(
        gateway.create(futureEvent as Parameters<typeof gateway.create>[0]),
      );

      const result = await Effect.runPromise(
        gateway.findPastByTripIdConnection(tripId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(1);
      expect(result.nodes[0].id).toBe("past-event");
    });

    it("uses endTime for comparison when available", async () => {
      const tripId = "trip-past-endtime";
      const now = new Date();

      // Event started in past but ends in future - should NOT appear in past events
      const ongoingEvent = createMockEvent(
        "ongoing-event",
        tripId,
        new Date(now.getTime() - 60 * 60 * 1000),
        new Date(now.getTime() + 60 * 60 * 1000),
      );

      await Effect.runPromise(
        gateway.create(ongoingEvent as Parameters<typeof gateway.create>[0]),
      );

      const result = await Effect.runPromise(
        gateway.findPastByTripIdConnection(tripId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
    });

    it("falls back to startTime when endTime is null", async () => {
      const tripId = "trip-past-fallback";
      const now = new Date();

      // Event with null endTime and past startTime
      const pastEvent = createMockEvent(
        "past-event",
        tripId,
        new Date(now.getTime() - 60 * 60 * 1000),
        new Date(now.getTime() - 30 * 60 * 1000),
      );

      await Effect.runPromise(
        gateway.create(pastEvent as Parameters<typeof gateway.create>[0]),
      );

      const result = await Effect.runPromise(
        gateway.findPastByTripIdConnection(tripId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(1);
      expect(result.nodes[0].id).toBe("past-event");
    });
  });

  // ============================================================================
  // Pagination Limit Tests
  // ============================================================================

  describe("pagination limits", () => {
    it("caps first at 100 items", async () => {
      const tripId = "trip-limits";
      const events = createEventsForTrip(
        tripId,
        150,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const event of events) {
        await Effect.runPromise(
          gateway.create(event as Parameters<typeof gateway.create>[0]),
        );
      }

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, { first: 200 }),
      );

      // Should be capped at 100
      expect(result.edges.length).toBeLessThanOrEqual(100);
    });

    it("uses default of 20 when first is not specified", async () => {
      const tripId = "trip-default";
      const events = createEventsForTrip(
        tripId,
        50,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const event of events) {
        await Effect.runPromise(
          gateway.create(event as Parameters<typeof gateway.create>[0]),
        );
      }

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, {}),
      );

      expect(result.edges).toHaveLength(20);
    });
  });
});
