import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { EventController } from "./controller";
import {
  EventGatewayTag,
  type EventGateway,
  type EventDTO,
  EventStatus,
  EventType,
  type ListEventsOutput,
  type CreateEventOutput,
  type GetEventOutput,
} from "@mirai-app/use-cases";
import type { Connection } from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Extended EventGateway interface with methods available in implementations
 */
interface ExtendedEventGateway extends EventGateway {
  findByTripId(tripId: string): Effect.Effect<EventDTO[], DatabaseError, never>;
  findUpcomingByTripId(
    tripId: string,
  ): Effect.Effect<EventDTO[], DatabaseError, never>;
  findOngoingByTripId(
    tripId: string,
  ): Effect.Effect<EventDTO[], DatabaseError, never>;
  findPastByTripId(
    tripId: string,
  ): Effect.Effect<EventDTO[], DatabaseError, never>;
}

/**
 * Helper to encode cursor to base64 string
 */
function encodeCursor(data: { id: string; startTime: string }): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

/**
 * Mock EventGateway for testing
 */
function createMockEventGateway(events: EventDTO[] = []): ExtendedEventGateway {
  const storage = new Map(events.map((e) => [e.id, e]));

  return {
    create: (event: EventDTO) => {
      storage.set(event.id, event);
      return Effect.succeed(event);
    },

    findById: (id: string) => {
      const event = storage.get(id);
      return Effect.succeed(event ?? null);
    },

    findByStatus: (status: string) => {
      const items = Array.from(storage.values()).filter(
        (e) => e.status === status,
      );
      return Effect.succeed(items);
    },

    findAll: () =>
      Effect.succeed({
        items: Array.from(storage.values()),
        total: storage.size,
        limit: 100,
        offset: 0,
        hasMore: false,
      }),

    findByTripId: (tripId: string) => {
      const items = Array.from(storage.values()).filter(
        (e) => e.tripId === tripId,
      );
      return Effect.succeed(items);
    },

    findUpcomingByTripId: (tripId: string) => {
      const now = new Date();
      const items = Array.from(storage.values()).filter(
        (e) => e.tripId === tripId && e.startTime > now,
      );
      return Effect.succeed(items);
    },

    findOngoingByTripId: (tripId: string) => {
      const now = new Date();
      const items = Array.from(storage.values()).filter(
        (e) =>
          e.tripId === tripId &&
          e.startTime <= now &&
          (e.endTime === null || e.endTime >= now),
      );
      return Effect.succeed(items);
    },

    findPastByTripId: (tripId: string) => {
      const now = new Date();
      const items = Array.from(storage.values()).filter(
        (e) => e.tripId === tripId && e.endTime !== null && e.endTime < now,
      );
      return Effect.succeed(items);
    },

    update: (event: EventDTO) => {
      storage.set(event.id, event);
      return Effect.succeed(event);
    },

    updateStatus: (id: string, status: string) => {
      const event = storage.get(id);
      if (!event) {
        return Effect.fail(
          new DatabaseError({
            operation: "updateStatus",
            message: "Event not found",
          }),
        );
      }
      const updated = { ...event, status: status as EventStatus };
      storage.set(id, updated);
      return Effect.succeed(updated);
    },

    delete: (id: string) => {
      storage.delete(id);
      return Effect.succeed(undefined);
    },

    exists: (id: string) => {
      return Effect.succeed(storage.has(id));
    },

    countByStatus: (status: string) => {
      const count = Array.from(storage.values()).filter(
        (e) => e.status === status,
      ).length;
      return Effect.succeed(count);
    },

    findByTripIdConnection: (tripId: string) => {
      const items = Array.from(storage.values()).filter(
        (e) => e.tripId === tripId,
      );
      const edges = items.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          startTime: item.startTime.toISOString(),
        }),
      }));
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const result: Connection<EventDTO> = {
        edges,
        nodes: items,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: firstItem
            ? encodeCursor({
                id: firstItem.id,
                startTime: firstItem.startTime.toISOString(),
              })
            : null,
          endCursor: lastItem
            ? encodeCursor({
                id: lastItem.id,
                startTime: lastItem.startTime.toISOString(),
              })
            : null,
        },
      };
      return Effect.succeed(result);
    },

    findUpcomingByTripIdConnection: (tripId: string) => {
      const now = new Date();
      const items = Array.from(storage.values()).filter(
        (e) => e.tripId === tripId && e.startTime > now,
      );
      const edges = items.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          startTime: item.startTime.toISOString(),
        }),
      }));
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const result: Connection<EventDTO> = {
        edges,
        nodes: items,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: firstItem
            ? encodeCursor({
                id: firstItem.id,
                startTime: firstItem.startTime.toISOString(),
              })
            : null,
          endCursor: lastItem
            ? encodeCursor({
                id: lastItem.id,
                startTime: lastItem.startTime.toISOString(),
              })
            : null,
        },
      };
      return Effect.succeed(result);
    },

    findOngoingByTripIdConnection: (tripId: string) => {
      const now = new Date();
      const items = Array.from(storage.values()).filter(
        (e) =>
          e.tripId === tripId &&
          e.startTime <= now &&
          (e.endTime === null || e.endTime >= now),
      );
      const edges = items.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          startTime: item.startTime.toISOString(),
        }),
      }));
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const result: Connection<EventDTO> = {
        edges,
        nodes: items,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: firstItem
            ? encodeCursor({
                id: firstItem.id,
                startTime: firstItem.startTime.toISOString(),
              })
            : null,
          endCursor: lastItem
            ? encodeCursor({
                id: lastItem.id,
                startTime: lastItem.startTime.toISOString(),
              })
            : null,
        },
      };
      return Effect.succeed(result);
    },

    findPastByTripIdConnection: (tripId: string) => {
      const now = new Date();
      const items = Array.from(storage.values()).filter(
        (e) => e.tripId === tripId && e.endTime !== null && e.endTime < now,
      );
      const edges = items.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          startTime: item.startTime.toISOString(),
        }),
      }));
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const result: Connection<EventDTO> = {
        edges,
        nodes: items,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: firstItem
            ? encodeCursor({
                id: firstItem.id,
                startTime: firstItem.startTime.toISOString(),
              })
            : null,
          endCursor: lastItem
            ? encodeCursor({
                id: lastItem.id,
                startTime: lastItem.startTime.toISOString(),
              })
            : null,
        },
      };
      return Effect.succeed(result);
    },
  };
}

const createMockEventDTO = (
  id: string,
  overrides: Partial<EventDTO> = {},
): EventDTO => ({
  id,
  tripId: "trip-1",
  groupId: null,
  title: `Event ${id}`,
  description: "Test description",
  location: "Test location",
  startTime: new Date("2024-01-15T10:00:00Z"),
  endTime: new Date("2024-01-15T12:00:00Z"),
  type: EventType.ACTIVITY,
  status: EventStatus.PUBLISHED,
  maxParticipants: null,
  createdById: "user-1",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  ...overrides,
});

describe("[UNIT] EventController", () => {
  let controller: EventController;

  beforeEach(() => {
    const mockGateway = createMockEventGateway();
    const mockLayer = Layer.succeed(
      EventGatewayTag,
      mockGateway as unknown as EventGateway,
    );
    controller = new EventController(
      mockLayer as unknown as Layer.Layer<unknown>,
    );
  });

  describe("getById", () => {
    it("returns event on success", async () => {
      const event = createMockEventDTO("event-1");
      const mockGateway = createMockEventGateway([event]);
      const mockLayer = Layer.succeed(
        EventGatewayTag,
        mockGateway as unknown as EventGateway,
      );
      controller = new EventController(
        mockLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await controller.getById({ id: "event-1" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("event-1");
        expect(result.data.title).toBe("Event event-1");
        expect(result.data.creatorId).toBe("user-1");
      }
    });

    it("returns error when event not found", async () => {
      const mockGateway = createMockEventGateway();
      const mockLayer = Layer.succeed(
        EventGatewayTag,
        mockGateway as unknown as EventGateway,
      );
      controller = new EventController(
        mockLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await controller.getById({ id: "nonexistent" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("handles repository errors gracefully", async () => {
      const failingGateway: ExtendedEventGateway = {
        ...createMockEventGateway(),
        findById: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findById",
              message: "Database connection failed",
            }),
          ),
      };
      const failingLayer = Layer.succeed(
        EventGatewayTag,
        failingGateway as unknown as EventGateway,
      );
      const failingController = new EventController(
        failingLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await failingController.getById({ id: "event-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("listByTrip", () => {
    it("returns events for trip on success", async () => {
      const event1 = createMockEventDTO("event-1");
      const event2 = createMockEventDTO("event-2");
      const mockGateway = createMockEventGateway([event1, event2]);
      const mockLayer = Layer.succeed(
        EventGatewayTag,
        mockGateway as unknown as EventGateway,
      );
      controller = new EventController(
        mockLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await controller.listByTrip({
        tripId: "trip-1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toHaveLength(2);
        expect(result.data.total).toBe(2);
      }
    });

    it("returns empty array for empty tripId (no events match)", async () => {
      const mockGateway = createMockEventGateway();
      const mockLayer = Layer.succeed(
        EventGatewayTag,
        mockGateway as unknown as EventGateway,
      );
      controller = new EventController(
        mockLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await controller.listByTrip({
        tripId: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toHaveLength(0);
        expect(result.data.total).toBe(0);
      }
    });

    it("applies filter when specified", async () => {
      const futureDate = new Date("2025-01-15T10:00:00Z");
      const pastDate = new Date("2023-01-15T10:00:00Z");

      const upcomingEvent = createMockEventDTO("upcoming", {
        startTime: futureDate,
        endTime: new Date("2025-01-15T12:00:00Z"),
      });
      const pastEvent = createMockEventDTO("past", {
        startTime: pastDate,
        endTime: new Date("2023-01-15T12:00:00Z"),
      });

      const mockGateway = createMockEventGateway([upcomingEvent, pastEvent]);
      const mockLayer = Layer.succeed(
        EventGatewayTag,
        mockGateway as unknown as EventGateway,
      );
      controller = new EventController(
        mockLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await controller.listByTrip({
        tripId: "trip-1",
        filter: "upcoming",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toBeDefined();
        expect(result.data.total).toBeDefined();
      }
    });

    it("handles limit parameter", async () => {
      const events = Array.from({ length: 10 }, (_, i) =>
        createMockEventDTO(`event-${i}`, {
          tripId: "trip-1",
        }),
      );
      const mockGateway = createMockEventGateway(events);
      const mockLayer = Layer.succeed(
        EventGatewayTag,
        mockGateway as unknown as EventGateway,
      );
      controller = new EventController(
        mockLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await controller.listByTrip({
        tripId: "trip-1",
        limit: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events.length).toBeLessThanOrEqual(5);
      }
    });

    it("handles repository errors", async () => {
      const failingGateway: ExtendedEventGateway = {
        ...createMockEventGateway(),
        findByTripId: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findByTripId",
              message: "Database error",
            }),
          ),
        findUpcomingByTripId: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findUpcomingByTripId",
              message: "Database error",
            }),
          ),
        findOngoingByTripId: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findOngoingByTripId",
              message: "Database error",
            }),
          ),
        findPastByTripId: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findPastByTripId",
              message: "Database error",
            }),
          ),
      };
      const failingLayer = Layer.succeed(
        EventGatewayTag,
        failingGateway as unknown as EventGateway,
      );
      const failingController = new EventController(
        failingLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await failingController.listByTrip({
        tripId: "trip-1",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("creates event on success", async () => {
      const mockGateway = createMockEventGateway();
      const mockLayer = Layer.succeed(
        EventGatewayTag,
        mockGateway as unknown as EventGateway,
      );
      controller = new EventController(
        mockLayer as unknown as Layer.Layer<unknown>,
      );

      const startTime = new Date("2024-12-25T10:00:00Z");
      const endTime = new Date("2024-12-25T12:00:00Z");

      const result = await controller.create({
        creatorId: "user-1",
        title: "Christmas Party",
        startTime,
        endTime,
        location: "Community Center",
        description: "Annual Christmas celebration",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Christmas Party");
        expect(result.data.creatorId).toBe("user-1");
        expect(result.data.location).toBe("Community Center");
        expect(result.data.files).toEqual([]);
      }
    });

    it("creates event with optional group", async () => {
      const mockGateway = createMockEventGateway();
      const mockLayer = Layer.succeed(
        EventGatewayTag,
        mockGateway as unknown as EventGateway,
      );
      controller = new EventController(
        mockLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await controller.create({
        creatorId: "user-1",
        organizerGroupId: "group-1",
        title: "Group Event",
        startTime: new Date("2024-12-25T10:00:00Z"),
        endTime: new Date("2024-12-25T12:00:00Z"),
        location: "Group HQ",
        description: "Team building event",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.organizerGroupId).toBe("group-1");
      }
    });

    it("creates event with files", async () => {
      const mockGateway = createMockEventGateway();
      const mockLayer = Layer.succeed(
        EventGatewayTag,
        mockGateway as unknown as EventGateway,
      );
      controller = new EventController(
        mockLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await controller.create({
        creatorId: "user-1",
        title: "Photo Event",
        startTime: new Date("2024-12-25T10:00:00Z"),
        endTime: new Date("2024-12-25T12:00:00Z"),
        location: "Studio",
        description: "Photo session",
        files: ["file-1.jpg", "file-2.jpg"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.files).toEqual(["file-1.jpg", "file-2.jpg"]);
      }
    });

    it("returns error for invalid input", async () => {
      const mockGateway = createMockEventGateway();
      const mockLayer = Layer.succeed(
        EventGatewayTag,
        mockGateway as unknown as EventGateway,
      );
      controller = new EventController(
        mockLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await controller.create({
        creatorId: "",
        title: "",
        startTime: new Date("2024-12-25T10:00:00Z"),
        endTime: new Date("2024-12-25T12:00:00Z"),
        location: "",
        description: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("returns error when end time is before start time", async () => {
      const mockGateway = createMockEventGateway();
      const mockLayer = Layer.succeed(
        EventGatewayTag,
        mockGateway as unknown as EventGateway,
      );
      controller = new EventController(
        mockLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await controller.create({
        creatorId: "user-1",
        title: "Invalid Event",
        startTime: new Date("2024-12-25T12:00:00Z"),
        endTime: new Date("2024-12-25T10:00:00Z"),
        location: "Somewhere",
        description: "Invalid time range",
      });

      expect(result.success).toBe(false);
    });

    it("handles repository errors", async () => {
      const failingGateway: ExtendedEventGateway = {
        ...createMockEventGateway(),
        create: () =>
          Effect.fail(
            new DatabaseError({
              operation: "create",
              message: "Failed to save event",
            }),
          ),
      };
      const failingLayer = Layer.succeed(
        EventGatewayTag,
        failingGateway as unknown as EventGateway,
      );
      const failingController = new EventController(
        failingLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await failingController.create({
        creatorId: "user-1",
        title: "Test Event",
        startTime: new Date("2024-12-25T10:00:00Z"),
        endTime: new Date("2024-12-25T12:00:00Z"),
        location: "Test location",
        description: "Test description",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getRecent", () => {
    it("returns empty events array", async () => {
      const result = await controller.getRecent({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toEqual([]);
        expect(result.data.total).toBe(0);
      }
    });

    it("accepts limit parameter", async () => {
      const result = await controller.getRecent({ limit: 5 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toEqual([]);
        expect(result.data.total).toBe(0);
      }
    });
  });

  describe("error handling", () => {
    it("returns error when use case fails", async () => {
      const failingGateway: ExtendedEventGateway = {
        ...createMockEventGateway(),
        findById: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findById",
              message: "Database connection failed",
            }),
          ),
      };
      const failingLayer = Layer.succeed(
        EventGatewayTag,
        failingGateway as unknown as EventGateway,
      );
      const failingController = new EventController(
        failingLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await failingController.getById({ id: "event-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to fetch");
      }
    });

    it("handles errors with string messages", async () => {
      const stringErrorGateway: ExtendedEventGateway = {
        ...createMockEventGateway(),
        findById: () => Effect.fail("String error" as unknown as DatabaseError),
      };
      const stringErrorLayer = Layer.succeed(
        EventGatewayTag,
        stringErrorGateway as unknown as EventGateway,
      );
      const stringErrorController = new EventController(
        stringErrorLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await stringErrorController.getById({ id: "event-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to fetch");
      }
    });

    it("handles Error instances with messages", async () => {
      const errorInstanceGateway: ExtendedEventGateway = {
        ...createMockEventGateway(),
        findById: () =>
          Effect.fail(
            new Error("Custom error message") as unknown as DatabaseError,
          ),
      };
      const errorInstanceLayer = Layer.succeed(
        EventGatewayTag,
        errorInstanceGateway as unknown as EventGateway,
      );
      const errorInstanceController = new EventController(
        errorInstanceLayer as unknown as Layer.Layer<unknown>,
      );

      const result = await errorInstanceController.getById({ id: "event-1" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to fetch");
      }
    });
  });
});

// Summary of test coverage
// - getById: success, not found, repository errors
// - listByTrip: success with events, empty tripId, filters (upcoming), limit, repository errors
// - create: success, with group, with files, validation errors (empty fields, invalid time), repository errors
// - getRecent: returns empty array, accepts limit parameter
// - Error handling: repository errors, error messages converted properly
